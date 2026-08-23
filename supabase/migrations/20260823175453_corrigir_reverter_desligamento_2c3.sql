begin;

do $$
begin
  if to_regclass('public.df_funcionarios_desligamentos') is null
     or to_regclass('public.df_funcionarios') is null
     or to_regclass('public.df_auditoria_eventos') is null
     or to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') is null
     or to_regprocedure('public.df_desligamento_bloquear_funcionario_interno(uuid,uuid)') is null then
    raise exception 'DEPENDENCIA_DESLIGAMENTO_2C3_AUSENTE';
  end if;
end $$;

alter table public.df_funcionarios_desligamentos
  add column status_anterior text null;

alter table public.df_funcionarios_desligamentos
  add constraint df_funcionarios_desligamentos_status_anterior_check
    check (status_anterior is null or status_anterior in ('ativo', 'afastado'));

comment on column public.df_funcionarios_desligamentos.status_anterior is
  'Estado funcional imediatamente anterior a conclusao. Autoridade estruturada para eventual reversao por erro; nunca presumir ativo.';

-- Backfill conservador: somente uma auditoria atomica e inequivoca da propria conclusao.
with comprovados as (
  select d.id, min(a.dados_antes ->> 'status') as status_anterior
  from public.df_funcionarios_desligamentos d
  join public.df_auditoria_eventos a
    on a.empresa_id = d.empresa_id
   and a.entidade_id = d.funcionario_id
   and a.acao = 'rh.funcionario.status_alterado'
   and a.correlation_id = d.correlation_id
  where d.estado = 'CONCLUIDO'
    and a.dados_depois ->> 'status' = 'desligado'
    and a.dados_antes ->> 'status' in ('ativo', 'afastado')
  group by d.id
  having count(*) = 1
)
update public.df_funcionarios_desligamentos d
set status_anterior = c.status_anterior
from comprovados c
where d.id = c.id;

create unique index if not exists uq_df_funcionarios_desligamentos_empresa_id_id
  on public.df_funcionarios_desligamentos (empresa_id, id);

create table public.df_funcionarios_desligamentos_correcoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  desligamento_id uuid not null,
  funcionario_id uuid not null,
  tipo text not null,
  motivo_correcao text not null,
  data_efetiva_antes date not null,
  data_efetiva_depois date not null,
  motivo_antes text not null,
  motivo_depois text not null,
  observacoes_antes text null,
  observacoes_depois text null,
  status_antes text not null,
  status_depois text not null,
  ator_id uuid not null,
  correlation_id text not null,
  criado_em timestamptz not null default now(),
  constraint df_desligamentos_correcoes_empresa_fk
    foreign key (empresa_id) references public.df_empresas(id) on delete restrict,
  constraint df_desligamentos_correcoes_workflow_empresa_fk
    foreign key (empresa_id, desligamento_id)
    references public.df_funcionarios_desligamentos(empresa_id, id) on delete restrict,
  constraint df_desligamentos_correcoes_funcionario_empresa_fk
    foreign key (empresa_id, funcionario_id)
    references public.df_funcionarios(empresa_id, id) on delete restrict,
  constraint df_desligamentos_correcoes_tipo_check
    check (tipo in ('RETIFICACAO', 'REVERSAO_ERRO')),
  constraint df_desligamentos_correcoes_motivo_check
    check (length(btrim(motivo_correcao)) >= 3),
  constraint df_desligamentos_correcoes_status_check
    check (
      (tipo = 'RETIFICACAO' and status_antes = 'desligado' and status_depois = 'desligado')
      or
      (tipo = 'REVERSAO_ERRO' and status_antes = 'desligado' and status_depois in ('ativo', 'afastado'))
    ),
  constraint df_desligamentos_correcoes_correlation_check
    check (length(btrim(correlation_id)) > 0)
);

comment on table public.df_funcionarios_desligamentos_correcoes is
  'Eventos append-only posteriores a um desligamento CONCLUIDO. O evento original permanece imutavel.';

create index idx_df_desligamentos_correcoes_historico
  on public.df_funcionarios_desligamentos_correcoes
  (empresa_id, desligamento_id, criado_em desc, id desc);
create unique index uq_df_desligamentos_correcoes_reversao
  on public.df_funcionarios_desligamentos_correcoes (empresa_id, desligamento_id)
  where tipo = 'REVERSAO_ERRO';
create unique index uq_df_desligamentos_correcoes_correlation
  on public.df_funcionarios_desligamentos_correcoes (empresa_id, correlation_id);

alter table public.df_funcionarios_desligamentos_correcoes enable row level security;
alter table public.df_funcionarios_desligamentos_correcoes force row level security;
revoke all on table public.df_funcionarios_desligamentos_correcoes from public, anon, authenticated;
grant select on table public.df_funcionarios_desligamentos_correcoes to authenticated;
create policy "df_desligamentos_correcoes_select_rh"
  on public.df_funcionarios_desligamentos_correcoes
  for select to authenticated
  using (auth.uid() is not null and public.df_funcionarios_pode_escrever(empresa_id));

create or replace function public.df_desligamentos_correcoes_append_only_2c3()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'CORRECAO_DESLIGAMENTO_APPEND_ONLY';
end;
$$;
create trigger trg_df_desligamentos_correcoes_append_only_2c3
before update or delete on public.df_funcionarios_desligamentos_correcoes
for each row execute function public.df_desligamentos_correcoes_append_only_2c3();
revoke all on function public.df_desligamentos_correcoes_append_only_2c3()
  from public, anon, authenticated;

create view public.df_funcionarios_desligamentos_efetivos
with (security_invoker = true)
as
select
  d.*,
  coalesce(c.data_efetiva_depois, d.data_efetiva) as data_efetiva_efetiva,
  coalesce(c.motivo_depois, d.motivo) as motivo_efetivo,
  case when c.id is null then d.observacoes else c.observacoes_depois end as observacoes_efetivas,
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
) c on true;
revoke all on table public.df_funcionarios_desligamentos_efetivos from public, anon, authenticated;
grant select on table public.df_funcionarios_desligamentos_efetivos to authenticated;

create or replace function public.concluir_desligamento_funcionario_controlado(
  p_empresa_id uuid,
  p_desligamento_id uuid,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_antes public.df_funcionarios_desligamentos%rowtype;
  v_depois public.df_funcionarios_desligamentos%rowtype;
  v_funcionario_antes public.df_funcionarios%rowtype;
  v_funcionario_depois public.df_funcionarios%rowtype;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  select * into v_antes from public.df_funcionarios_desligamentos where empresa_id=p_empresa_id and id=p_desligamento_id;
  if not found then raise exception 'DESLIGAMENTO_NAO_ENCONTRADO'; end if;
  v_funcionario_antes := public.df_desligamento_bloquear_funcionario_interno(p_empresa_id,v_antes.funcionario_id);
  select * into v_antes from public.df_funcionarios_desligamentos where empresa_id=p_empresa_id and id=p_desligamento_id for update;
  if v_antes.estado='CONCLUIDO' then raise exception 'DESLIGAMENTO_JA_CONCLUIDO'; end if;
  if v_antes.estado='CANCELADO' then raise exception 'DESLIGAMENTO_CANCELADO_NAO_PODE_CONCLUIR'; end if;
  if v_antes.estado<>'ABERTO' then raise exception 'DESLIGAMENTO_NAO_ESTA_ABERTO'; end if;
  if v_antes.data_efetiva is null then raise exception 'DATA_EFETIVA_DESLIGAMENTO_OBRIGATORIA'; end if;
  if v_funcionario_antes.arquivado then raise exception 'FUNCIONARIO_ARQUIVADO'; end if;
  if v_funcionario_antes.status not in ('ativo','afastado') then raise exception 'STATUS_ANTERIOR_DESLIGAMENTO_INVALIDO'; end if;

  update public.df_funcionarios_desligamentos
  set estado='CONCLUIDO', concluido_por=auth.uid(), concluido_em=now(), atualizado_em=now(),
      correlation_id=v_correlation_id, status_anterior=v_funcionario_antes.status
  where id=v_antes.id returning * into v_depois;
  update public.df_funcionarios set status='desligado'
  where empresa_id=p_empresa_id and id=v_antes.funcionario_id and status=v_funcionario_antes.status
  returning * into v_funcionario_depois;
  if not found then raise exception 'STATUS_FUNCIONARIO_ALTERADO_CONCORRENTEMENTE'; end if;

  insert into public.df_auditoria_eventos
    (empresa_id,user_id,ator_tipo,modulo,entidade_tipo,entidade_id,acao,severidade,origem,status,motivo,dados_antes,dados_depois,metadados,correlation_id)
  values
    (p_empresa_id,auth.uid(),'usuario','rh','funcionario_desligamento',v_depois.id,'rh.desligamento.concluido','info','app','sucesso',v_depois.motivo,
     jsonb_build_object('estado',v_antes.estado,'data_efetiva',v_antes.data_efetiva,'motivo',v_antes.motivo),
     jsonb_build_object('estado',v_depois.estado,'data_efetiva',v_depois.data_efetiva,'motivo',v_depois.motivo,'concluido_em',v_depois.concluido_em,'status_anterior',v_depois.status_anterior),
     jsonb_build_object('funcionario_id',v_depois.funcionario_id,'workflow_id',v_depois.id,'data_efetiva',v_depois.data_efetiva,'regra','desligamento_2c3','correlation_id',v_correlation_id),v_correlation_id),
    (p_empresa_id,auth.uid(),'usuario','rh','funcionario',v_funcionario_depois.id,'rh.funcionario.status_alterado','info','app','sucesso',v_depois.motivo,
     jsonb_build_object('status',v_funcionario_antes.status,'arquivado',v_funcionario_antes.arquivado),
     jsonb_build_object('status',v_funcionario_depois.status,'arquivado',v_funcionario_depois.arquivado),
     jsonb_build_object('funcionario_id',v_funcionario_depois.id,'workflow_id',v_depois.id,'data_efetiva',v_depois.data_efetiva,'regra','desligamento_2c3','correlation_id',v_correlation_id),v_correlation_id);
  return to_jsonb(v_depois)||jsonb_build_object('codigo','DESLIGAMENTO_CONCLUIDO','status_funcional',v_funcionario_depois.status,'funcionario_arquivado',v_funcionario_depois.arquivado);
end;
$$;

create or replace function public.retificar_desligamento_concluido_controlado(
  p_empresa_id uuid, p_desligamento_id uuid, p_data_efetiva date,
  p_motivo text, p_observacoes text, p_motivo_correcao text,
  p_correlation_id text default null
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
  if nullif(btrim(p_motivo),'') is null or length(btrim(p_motivo))<3 then raise exception 'MOTIVO_DESLIGAMENTO_OBRIGATORIO'; end if;
  if nullif(btrim(p_motivo_correcao),'') is null or length(btrim(p_motivo_correcao))<3 then raise exception 'MOTIVO_CORRECAO_OBRIGATORIO'; end if;
  if p_data_efetiva=v_efetivo.data_efetiva_efetiva and btrim(p_motivo)=v_efetivo.motivo_efetivo and nullif(btrim(p_observacoes),'') is not distinct from nullif(btrim(v_efetivo.observacoes_efetivas),'') then raise exception 'RETIFICACAO_SEM_ALTERACAO'; end if;
  if p_data_efetiva < v_efetivo.data_efetiva_efetiva then
    if exists(select 1 from public.df_folha_lancamentos l where l.empresa_id=p_empresa_id and l.funcionario_id=v_workflow.funcionario_id and l.data_referencia>p_data_efetiva)
       or exists(select 1 from public.df_folha_lancamento_itens i where i.empresa_id=p_empresa_id and i.funcionario_id=v_workflow.funcionario_id and i.data_referencia>p_data_efetiva) then raise exception 'RETIFICACAO_DATA_CONFLITO_FOLHA'; end if;
    if exists(select 1 from public.df_funcionarios_ferias_periodos p where p.empresa_id=p_empresa_id and p.funcionario_id=v_workflow.funcionario_id and not p.arquivado and p.data_inicio>p_data_efetiva) then raise exception 'RETIFICACAO_DATA_CONFLITO_FERIAS'; end if;
    if exists(select 1 from public.df_funcionarios_exames_periodicos e where e.empresa_id=p_empresa_id and e.funcionario_id=v_workflow.funcionario_id and not e.arquivado and e.data_exame>p_data_efetiva) then raise exception 'RETIFICACAO_DATA_CONFLITO_EXAMES'; end if;
  end if;
  insert into public.df_funcionarios_desligamentos_correcoes
    (empresa_id,desligamento_id,funcionario_id,tipo,motivo_correcao,data_efetiva_antes,data_efetiva_depois,motivo_antes,motivo_depois,observacoes_antes,observacoes_depois,status_antes,status_depois,ator_id,correlation_id)
  values (p_empresa_id,v_workflow.id,v_workflow.funcionario_id,'RETIFICACAO',btrim(p_motivo_correcao),v_efetivo.data_efetiva_efetiva,p_data_efetiva,v_efetivo.motivo_efetivo,btrim(p_motivo),v_efetivo.observacoes_efetivas,nullif(btrim(p_observacoes),''),'desligado','desligado',auth.uid(),v_correlation)
  returning * into v_correcao;
  insert into public.df_auditoria_eventos
    (empresa_id,user_id,ator_tipo,modulo,entidade_tipo,entidade_id,acao,severidade,origem,status,motivo,dados_antes,dados_depois,metadados,correlation_id)
  values (p_empresa_id,auth.uid(),'usuario','rh','funcionario_desligamento',v_workflow.id,'rh.desligamento.retificado','info','app','sucesso',v_correcao.motivo_correcao,
    jsonb_build_object('data_efetiva',v_correcao.data_efetiva_antes,'motivo',v_correcao.motivo_antes,'observacoes',v_correcao.observacoes_antes,'status','desligado'),
    jsonb_build_object('data_efetiva',v_correcao.data_efetiva_depois,'motivo',v_correcao.motivo_depois,'observacoes',v_correcao.observacoes_depois,'status','desligado'),
    jsonb_build_object('funcionario_id',v_workflow.funcionario_id,'workflow_id',v_workflow.id,'correcao_id',v_correcao.id,'tipo','RETIFICACAO','correlation_id',v_correlation),v_correlation);
  return to_jsonb(v_correcao)||jsonb_build_object('codigo','DESLIGAMENTO_RETIFICADO');
end; $$;

create or replace function public.reverter_desligamento_concluido_por_erro_controlado(
  p_empresa_id uuid, p_desligamento_id uuid, p_motivo_reversao text,
  p_correlation_id text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_workflow public.df_funcionarios_desligamentos%rowtype;
  v_funcionario_antes public.df_funcionarios%rowtype;
  v_funcionario_depois public.df_funcionarios%rowtype;
  v_efetivo record;
  v_correcao public.df_funcionarios_desligamentos_correcoes%rowtype;
  v_correlation text:=coalesce(nullif(btrim(p_correlation_id),''),gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  select * into v_workflow from public.df_funcionarios_desligamentos where empresa_id=p_empresa_id and id=p_desligamento_id;
  if not found then raise exception 'DESLIGAMENTO_NAO_ENCONTRADO'; end if;
  v_funcionario_antes:=public.df_desligamento_bloquear_funcionario_interno(p_empresa_id,v_workflow.funcionario_id);
  select * into v_workflow from public.df_funcionarios_desligamentos where empresa_id=p_empresa_id and id=p_desligamento_id for update;
  perform 1 from public.df_funcionarios_desligamentos_correcoes where empresa_id=p_empresa_id and desligamento_id=p_desligamento_id for update;
  select * into v_efetivo from public.df_funcionarios_desligamentos_efetivos where empresa_id=p_empresa_id and id=p_desligamento_id;
  if v_workflow.estado<>'CONCLUIDO' then raise exception 'SOMENTE_DESLIGAMENTO_CONCLUIDO_PODE_SER_REVERTIDO'; end if;
  if v_efetivo.efeito_revertido then raise exception 'DESLIGAMENTO_JA_REVERTIDO'; end if;
  if v_workflow.status_anterior not in ('ativo','afastado') then raise exception 'STATUS_ANTERIOR_NAO_COMPROVADO'; end if;
  if v_funcionario_antes.status<>'desligado' then raise exception 'STATUS_FUNCIONAL_INCOMPATIVEL_COM_REVERSAO'; end if;
  if v_funcionario_antes.arquivado then raise exception 'FUNCIONARIO_ARQUIVADO'; end if;
  if nullif(btrim(p_motivo_reversao),'') is null or length(btrim(p_motivo_reversao))<3 then raise exception 'MOTIVO_REVERSAO_OBRIGATORIO'; end if;
  if exists(select 1 from public.df_funcionarios_desligamentos d where d.empresa_id=p_empresa_id and d.funcionario_id=v_workflow.funcionario_id and d.id<>v_workflow.id and d.aberto_em>v_workflow.concluido_em) then raise exception 'REVERSAO_BLOQUEADA_POR_WORKFLOW_POSTERIOR'; end if;
  insert into public.df_funcionarios_desligamentos_correcoes
    (empresa_id,desligamento_id,funcionario_id,tipo,motivo_correcao,data_efetiva_antes,data_efetiva_depois,motivo_antes,motivo_depois,observacoes_antes,observacoes_depois,status_antes,status_depois,ator_id,correlation_id)
  values (p_empresa_id,v_workflow.id,v_workflow.funcionario_id,'REVERSAO_ERRO',btrim(p_motivo_reversao),v_efetivo.data_efetiva_efetiva,v_efetivo.data_efetiva_efetiva,v_efetivo.motivo_efetivo,v_efetivo.motivo_efetivo,v_efetivo.observacoes_efetivas,v_efetivo.observacoes_efetivas,'desligado',v_workflow.status_anterior,auth.uid(),v_correlation)
  returning * into v_correcao;
  perform set_config('app.desligamento_reversao_workflow',v_workflow.id::text,true);
  update public.df_funcionarios set status=v_workflow.status_anterior
  where empresa_id=p_empresa_id and id=v_workflow.funcionario_id and status='desligado'
  returning * into v_funcionario_depois;
  if not found then raise exception 'STATUS_FUNCIONARIO_ALTERADO_CONCORRENTEMENTE'; end if;
  insert into public.df_auditoria_eventos
    (empresa_id,user_id,ator_tipo,modulo,entidade_tipo,entidade_id,acao,severidade,origem,status,motivo,dados_antes,dados_depois,metadados,correlation_id)
  values
   (p_empresa_id,auth.uid(),'usuario','rh','funcionario_desligamento',v_workflow.id,'rh.desligamento.revertido','alerta','app','sucesso',v_correcao.motivo_correcao,
    jsonb_build_object('estado','CONCLUIDO','efeito_revertido',false,'status','desligado'),jsonb_build_object('estado','CONCLUIDO','efeito_revertido',true,'status',v_workflow.status_anterior),jsonb_build_object('funcionario_id',v_workflow.funcionario_id,'workflow_id',v_workflow.id,'correcao_id',v_correcao.id,'tipo','REVERSAO_ERRO','correlation_id',v_correlation),v_correlation),
   (p_empresa_id,auth.uid(),'usuario','rh','funcionario',v_workflow.funcionario_id,'rh.funcionario.status_alterado','alerta','app','sucesso',v_correcao.motivo_correcao,
    jsonb_build_object('status',v_funcionario_antes.status,'arquivado',v_funcionario_antes.arquivado),jsonb_build_object('status',v_funcionario_depois.status,'arquivado',v_funcionario_depois.arquivado),jsonb_build_object('funcionario_id',v_workflow.funcionario_id,'workflow_id',v_workflow.id,'correcao_id',v_correcao.id,'regra','reversao_erro_2c3','correlation_id',v_correlation),v_correlation);
  return to_jsonb(v_correcao)||jsonb_build_object('codigo','DESLIGAMENTO_REVERTIDO','status_funcional',v_funcionario_depois.status,'funcionario_arquivado',v_funcionario_depois.arquivado);
end; $$;

create or replace function public.df_funcionarios_bloquear_desligamento_direto_2a()
returns trigger language plpgsql set search_path = '' as $$
declare v_workflow_reversao uuid;
begin
  if tg_op='INSERT' and new.status='desligado' then raise exception 'DESLIGAMENTO_REQUER_WORKFLOW_CONCLUIDO'; end if;
  if tg_op='UPDATE' and old.status is distinct from new.status and new.status='desligado'
     and not exists(select 1 from public.df_funcionarios_desligamentos_efetivos d where d.empresa_id=new.empresa_id and d.funcionario_id=new.id and d.estado='CONCLUIDO' and not d.efeito_revertido) then
    raise exception 'DESLIGAMENTO_REQUER_WORKFLOW_CONCLUIDO';
  end if;
  if tg_op='UPDATE' and old.status='desligado' and new.status is distinct from old.status then
    begin v_workflow_reversao:=nullif(current_setting('app.desligamento_reversao_workflow',true),'')::uuid; exception when others then v_workflow_reversao:=null; end;
    if v_workflow_reversao is null or not exists(
      select 1 from public.df_funcionarios_desligamentos_correcoes c
      where c.empresa_id=new.empresa_id and c.funcionario_id=new.id and c.desligamento_id=v_workflow_reversao
        and c.tipo='REVERSAO_ERRO' and c.status_antes=old.status and c.status_depois=new.status
    ) then raise exception 'READMISSAO_REQUER_FLUXO_CONTROLADO'; end if;
  end if;
  return new;
end; $$;

create or replace function public.df_folha_validar_data_efetiva_2c2(p_empresa_id uuid,p_funcionario_id uuid,p_data_referencia date)
returns void language plpgsql security invoker set search_path = '' as $$
declare v_status text; v_data_efetiva date;
begin
  if current_user not in ('postgres','service_role','supabase_admin') then
    if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'ACESSO_NEGADO_FOLHA_DATA_EFETIVA'; end if;
  end if;
  select f.status into v_status from public.df_funcionarios f where f.empresa_id=p_empresa_id and f.id=p_funcionario_id;
  if not found then raise exception 'FUNCIONARIO_FOLHA_NAO_ENCONTRADO'; end if;
  if v_status<>'desligado' then return; end if;
  select d.data_efetiva_efetiva into v_data_efetiva from public.df_funcionarios_desligamentos_efetivos d
  where d.empresa_id=p_empresa_id and d.funcionario_id=p_funcionario_id and d.estado='CONCLUIDO' and not d.efeito_revertido
  order by d.concluido_em desc nulls last,d.atualizado_em desc,d.id desc limit 1;
  if v_data_efetiva is null then raise exception 'FOLHA_DESLIGADO_SEM_DATA_EFETIVA'; end if;
  if p_data_referencia is null then raise exception 'FOLHA_DESLIGADO_EXIGE_DATA_REFERENCIA'; end if;
  if p_data_referencia>v_data_efetiva then raise exception 'FOLHA_APOS_DATA_EFETIVA'; end if;
end; $$;

revoke all on function public.retificar_desligamento_concluido_controlado(uuid,uuid,date,text,text,text,text) from public,anon,authenticated;
grant execute on function public.retificar_desligamento_concluido_controlado(uuid,uuid,date,text,text,text,text) to authenticated;
revoke all on function public.reverter_desligamento_concluido_por_erro_controlado(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.reverter_desligamento_concluido_por_erro_controlado(uuid,uuid,text,text) to authenticated;
revoke all on function public.concluir_desligamento_funcionario_controlado(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.concluir_desligamento_funcionario_controlado(uuid,uuid,text) to authenticated;
revoke all on function public.df_funcionarios_bloquear_desligamento_direto_2a() from public,anon,authenticated;
revoke all on function public.df_folha_validar_data_efetiva_2c2(uuid,uuid,date) from public,anon,authenticated,service_role;
grant execute on function public.df_folha_validar_data_efetiva_2c2(uuid,uuid,date) to authenticated,service_role;

commit;
