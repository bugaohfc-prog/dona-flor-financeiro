begin;

alter table public.df_funcionarios_desligamentos
  add column data_acerto date null;

alter table public.df_funcionarios_desligamentos_correcoes
  add column data_acerto_antes date null,
  add column data_acerto_depois date null;

comment on column public.df_funcionarios_desligamentos.data_acerto is
  'Data operacional prevista para o acerto. Históricos anteriores ao lote 2 permanecem nulos.';

drop view public.df_funcionarios_desligamentos_efetivos;
create view public.df_funcionarios_desligamentos_efetivos
with (security_invoker = true)
as
select
  d.*,
  coalesce(r.data_efetiva_depois, d.data_efetiva) as data_efetiva_efetiva,
  coalesce(r.data_acerto_depois, d.data_acerto) as data_acerto_efetiva,
  coalesce(r.motivo_depois, d.motivo) as motivo_efetivo,
  case when r.id is null then d.observacoes else r.observacoes_depois end as observacoes_efetivas,
  coalesce(c.tipo = 'REVERSAO_ERRO', false) as efeito_revertido,
  case when c.tipo = 'REVERSAO_ERRO' then c.status_depois else
    case when d.estado = 'CONCLUIDO' then 'desligado' else d.status_anterior end
  end as status_funcional_efetivo,
  c.id as ultima_correcao_id,
  c.tipo as ultima_correcao_tipo,
  c.motivo_correcao as ultima_correcao_motivo,
  c.criado_em as ultima_correcao_em
from public.df_funcionarios_desligamentos d
left join lateral (
  select x.*
  from public.df_funcionarios_desligamentos_correcoes x
  where x.empresa_id = d.empresa_id and x.desligamento_id = d.id
  order by x.criado_em desc, x.id desc
  limit 1
) c on true
left join lateral (
  select x.*
  from public.df_funcionarios_desligamentos_correcoes x
  where x.empresa_id = d.empresa_id
    and x.desligamento_id = d.id
    and x.tipo = 'RETIFICACAO'
  order by x.criado_em desc, x.id desc
  limit 1
) r on true;
revoke all on table public.df_funcionarios_desligamentos_efetivos from public, anon, authenticated;
grant select on table public.df_funcionarios_desligamentos_efetivos to authenticated;

drop function public.abrir_desligamento_funcionario_controlado(uuid,uuid,text,date,text,text);
create function public.abrir_desligamento_funcionario_controlado(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_motivo text,
  p_data_efetiva date,
  p_data_acerto date,
  p_observacoes text default null,
  p_correlation_id text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_funcionario public.df_funcionarios%rowtype;
  v_workflow public.df_funcionarios_desligamentos%rowtype;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  if length(btrim(coalesce(p_motivo, ''))) < 3 then raise exception 'MOTIVO_DESLIGAMENTO_OBRIGATORIO'; end if;
  if p_data_efetiva is null then raise exception 'DATA_EFETIVA_DESLIGAMENTO_OBRIGATORIA'; end if;
  if p_data_acerto is null then raise exception 'DATA_ACERTO_DESLIGAMENTO_OBRIGATORIA'; end if;

  v_funcionario := public.df_desligamento_bloquear_funcionario_interno(p_empresa_id, p_funcionario_id);
  if v_funcionario.arquivado then raise exception 'FUNCIONARIO_ARQUIVADO'; end if;
  if v_funcionario.status = 'desligado' then raise exception 'FUNCIONARIO_JA_DESLIGADO'; end if;

  perform 1 from public.df_funcionarios_desligamentos
  where empresa_id = p_empresa_id and funcionario_id = p_funcionario_id and estado = 'ABERTO'
  for update;
  if found then raise exception 'DESLIGAMENTO_JA_ABERTO'; end if;

  begin
    insert into public.df_funcionarios_desligamentos
      (empresa_id,funcionario_id,estado,motivo,data_efetiva,data_acerto,observacoes,aberto_por,correlation_id)
    values
      (p_empresa_id,p_funcionario_id,'ABERTO',btrim(p_motivo),p_data_efetiva,p_data_acerto,
       nullif(btrim(p_observacoes),''),auth.uid(),v_correlation_id)
    returning * into v_workflow;
  exception when unique_violation then
    raise exception 'DESLIGAMENTO_JA_ABERTO';
  end;

  insert into public.df_auditoria_eventos
    (empresa_id,user_id,ator_tipo,modulo,entidade_tipo,entidade_id,acao,severidade,origem,status,motivo,dados_antes,dados_depois,metadados,correlation_id)
  values
    (p_empresa_id,auth.uid(),'usuario','rh','funcionario_desligamento',v_workflow.id,
     'rh.desligamento.aberto','info','app','sucesso',v_workflow.motivo,null,
     jsonb_build_object('estado',v_workflow.estado,'data_efetiva',v_workflow.data_efetiva,
       'data_acerto',v_workflow.data_acerto,'observacoes_presentes',v_workflow.observacoes is not null),
     jsonb_build_object('funcionario_id',p_funcionario_id,'workflow_id',v_workflow.id,
       'regra','desligamento_funcional_lote2','status_funcional_preservado',v_funcionario.status,
       'correlation_id',v_correlation_id),v_correlation_id);
  return to_jsonb(v_workflow)||jsonb_build_object('codigo','DESLIGAMENTO_ABERTO');
end; $$;

drop function public.atualizar_desligamento_funcionario_controlado(uuid,uuid,text,date,text,text);
create function public.atualizar_desligamento_funcionario_controlado(
  p_empresa_id uuid,
  p_desligamento_id uuid,
  p_motivo text,
  p_data_efetiva date,
  p_data_acerto date,
  p_observacoes text default null,
  p_correlation_id text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_antes public.df_funcionarios_desligamentos%rowtype;
  v_depois public.df_funcionarios_desligamentos%rowtype;
  v_funcionario public.df_funcionarios%rowtype;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  if length(btrim(coalesce(p_motivo, ''))) < 3 then raise exception 'MOTIVO_DESLIGAMENTO_OBRIGATORIO'; end if;
  if p_data_efetiva is null then raise exception 'DATA_EFETIVA_DESLIGAMENTO_OBRIGATORIA'; end if;
  if p_data_acerto is null then raise exception 'DATA_ACERTO_DESLIGAMENTO_OBRIGATORIA'; end if;

  select * into v_antes from public.df_funcionarios_desligamentos
  where empresa_id=p_empresa_id and id=p_desligamento_id;
  if not found then raise exception 'DESLIGAMENTO_NAO_ENCONTRADO'; end if;
  v_funcionario := public.df_desligamento_bloquear_funcionario_interno(p_empresa_id,v_antes.funcionario_id);
  select * into v_antes from public.df_funcionarios_desligamentos
  where empresa_id=p_empresa_id and id=p_desligamento_id for update;
  if v_antes.estado <> 'ABERTO' then raise exception 'DESLIGAMENTO_NAO_ESTA_ABERTO'; end if;

  update public.df_funcionarios_desligamentos
  set motivo=btrim(p_motivo), data_efetiva=p_data_efetiva, data_acerto=p_data_acerto,
      observacoes=nullif(btrim(p_observacoes),''), atualizado_em=now(), correlation_id=v_correlation_id
  where id=v_antes.id returning * into v_depois;

  insert into public.df_auditoria_eventos
    (empresa_id,user_id,ator_tipo,modulo,entidade_tipo,entidade_id,acao,severidade,origem,status,motivo,dados_antes,dados_depois,metadados,correlation_id)
  values
    (p_empresa_id,auth.uid(),'usuario','rh','funcionario_desligamento',v_depois.id,
     'rh.desligamento.atualizado','info','app','sucesso',v_depois.motivo,
     jsonb_build_object('estado',v_antes.estado,'motivo',v_antes.motivo,'data_efetiva',v_antes.data_efetiva,
       'data_acerto',v_antes.data_acerto,'observacoes_presentes',v_antes.observacoes is not null),
     jsonb_build_object('estado',v_depois.estado,'motivo',v_depois.motivo,'data_efetiva',v_depois.data_efetiva,
       'data_acerto',v_depois.data_acerto,'observacoes_presentes',v_depois.observacoes is not null),
     jsonb_build_object('funcionario_id',v_depois.funcionario_id,'workflow_id',v_depois.id,
       'regra','desligamento_funcional_lote2','status_funcional_preservado',v_funcionario.status,
       'correlation_id',v_correlation_id),v_correlation_id);
  return to_jsonb(v_depois)||jsonb_build_object('codigo','DESLIGAMENTO_ATUALIZADO');
end; $$;

drop function public.retificar_desligamento_concluido_controlado(uuid,uuid,date,text,text,text,text);
create function public.retificar_desligamento_concluido_controlado(
  p_empresa_id uuid, p_desligamento_id uuid, p_data_efetiva date, p_data_acerto date,
  p_motivo text, p_observacoes text, p_motivo_correcao text, p_correlation_id text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_workflow public.df_funcionarios_desligamentos%rowtype;
  v_funcionario public.df_funcionarios%rowtype;
  v_efetivo record;
  v_correcao public.df_funcionarios_desligamentos_correcoes%rowtype;
  v_correlation text:=coalesce(nullif(btrim(p_correlation_id),''),gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  select * into v_workflow from public.df_funcionarios_desligamentos where empresa_id=p_empresa_id and id=p_desligamento_id;
  if not found then raise exception 'DESLIGAMENTO_NAO_ENCONTRADO'; end if;
  v_funcionario:=public.df_desligamento_bloquear_funcionario_interno(p_empresa_id,v_workflow.funcionario_id);
  select * into v_workflow from public.df_funcionarios_desligamentos where empresa_id=p_empresa_id and id=p_desligamento_id for update;
  perform 1 from public.df_funcionarios_desligamentos_correcoes where empresa_id=p_empresa_id and desligamento_id=p_desligamento_id for update;
  select * into v_efetivo from public.df_funcionarios_desligamentos_efetivos where empresa_id=p_empresa_id and id=p_desligamento_id;
  if v_workflow.estado<>'CONCLUIDO' then raise exception 'SOMENTE_DESLIGAMENTO_CONCLUIDO_PODE_SER_RETIFICADO'; end if;
  if v_efetivo.efeito_revertido then raise exception 'DESLIGAMENTO_REVERTIDO_NAO_PODE_SER_RETIFICADO'; end if;
  if v_funcionario.status<>'desligado' then raise exception 'STATUS_FUNCIONAL_INCOMPATIVEL_COM_RETIFICACAO'; end if;
  if p_data_efetiva is null then raise exception 'DATA_EFETIVA_OBRIGATORIA'; end if;
  if p_data_acerto is null then raise exception 'DATA_ACERTO_DESLIGAMENTO_OBRIGATORIA'; end if;
  if nullif(btrim(p_motivo),'') is null or length(btrim(p_motivo))<3 then raise exception 'MOTIVO_DESLIGAMENTO_OBRIGATORIO'; end if;
  if nullif(btrim(p_motivo_correcao),'') is null or length(btrim(p_motivo_correcao))<3 then raise exception 'MOTIVO_CORRECAO_OBRIGATORIO'; end if;
  if p_data_efetiva=v_efetivo.data_efetiva_efetiva
     and p_data_acerto is not distinct from v_efetivo.data_acerto_efetiva
     and btrim(p_motivo)=v_efetivo.motivo_efetivo
     and nullif(btrim(p_observacoes),'') is not distinct from nullif(btrim(v_efetivo.observacoes_efetivas),'')
  then raise exception 'RETIFICACAO_SEM_ALTERACAO'; end if;
  if p_data_efetiva < v_efetivo.data_efetiva_efetiva then
    if exists(select 1 from public.df_folha_lancamentos l where l.empresa_id=p_empresa_id and l.funcionario_id=v_workflow.funcionario_id and l.data_referencia>p_data_efetiva)
       or exists(select 1 from public.df_folha_lancamento_itens i where i.empresa_id=p_empresa_id and i.funcionario_id=v_workflow.funcionario_id and i.data_referencia>p_data_efetiva)
    then raise exception 'RETIFICACAO_DATA_CONFLITO_FOLHA'; end if;
    if exists(select 1 from public.df_funcionarios_ferias_periodos p where p.empresa_id=p_empresa_id and p.funcionario_id=v_workflow.funcionario_id and not p.arquivado and p.data_inicio>p_data_efetiva)
    then raise exception 'RETIFICACAO_DATA_CONFLITO_FERIAS'; end if;
    if exists(select 1 from public.df_funcionarios_exames_periodicos e where e.empresa_id=p_empresa_id and e.funcionario_id=v_workflow.funcionario_id and not e.arquivado and e.data_exame>p_data_efetiva)
    then raise exception 'RETIFICACAO_DATA_CONFLITO_EXAMES'; end if;
  end if;

  insert into public.df_funcionarios_desligamentos_correcoes
    (empresa_id,desligamento_id,funcionario_id,tipo,motivo_correcao,
     data_efetiva_antes,data_efetiva_depois,data_acerto_antes,data_acerto_depois,
     motivo_antes,motivo_depois,observacoes_antes,observacoes_depois,status_antes,status_depois,ator_id,correlation_id)
  values
    (p_empresa_id,v_workflow.id,v_workflow.funcionario_id,'RETIFICACAO',btrim(p_motivo_correcao),
     v_efetivo.data_efetiva_efetiva,p_data_efetiva,v_efetivo.data_acerto_efetiva,p_data_acerto,
     v_efetivo.motivo_efetivo,btrim(p_motivo),v_efetivo.observacoes_efetivas,nullif(btrim(p_observacoes),''),
     'desligado','desligado',auth.uid(),v_correlation)
  returning * into v_correcao;

  insert into public.df_auditoria_eventos
    (empresa_id,user_id,ator_tipo,modulo,entidade_tipo,entidade_id,acao,severidade,origem,status,motivo,dados_antes,dados_depois,metadados,correlation_id)
  values
    (p_empresa_id,auth.uid(),'usuario','rh','funcionario_desligamento',v_workflow.id,
     'rh.desligamento.retificado','info','app','sucesso',v_correcao.motivo_correcao,
     jsonb_build_object('data_efetiva',v_correcao.data_efetiva_antes,'data_acerto',v_correcao.data_acerto_antes,
       'motivo',v_correcao.motivo_antes,'observacoes',v_correcao.observacoes_antes,'status','desligado'),
     jsonb_build_object('data_efetiva',v_correcao.data_efetiva_depois,'data_acerto',v_correcao.data_acerto_depois,
       'motivo',v_correcao.motivo_depois,'observacoes',v_correcao.observacoes_depois,'status','desligado'),
     jsonb_build_object('funcionario_id',v_workflow.funcionario_id,'workflow_id',v_workflow.id,
       'correcao_id',v_correcao.id,'tipo','RETIFICACAO','correlation_id',v_correlation),v_correlation);
  return to_jsonb(v_correcao)||jsonb_build_object('codigo','DESLIGAMENTO_RETIFICADO');
end; $$;

revoke all on function public.abrir_desligamento_funcionario_controlado(uuid,uuid,text,date,date,text,text) from public,anon,authenticated;
grant execute on function public.abrir_desligamento_funcionario_controlado(uuid,uuid,text,date,date,text,text) to authenticated;
revoke all on function public.atualizar_desligamento_funcionario_controlado(uuid,uuid,text,date,date,text,text) from public,anon,authenticated;
grant execute on function public.atualizar_desligamento_funcionario_controlado(uuid,uuid,text,date,date,text,text) to authenticated;
revoke all on function public.retificar_desligamento_concluido_controlado(uuid,uuid,date,date,text,text,text,text) from public,anon,authenticated;
grant execute on function public.retificar_desligamento_concluido_controlado(uuid,uuid,date,date,text,text,text,text) to authenticated;

commit;
