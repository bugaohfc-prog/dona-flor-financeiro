begin;

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
   (p_empresa_id,auth.uid(),'usuario','rh','funcionario_desligamento',v_workflow.id,'rh.desligamento.revertido','warning','app','sucesso',v_correcao.motivo_correcao,
    jsonb_build_object('estado','CONCLUIDO','efeito_revertido',false,'status','desligado'),jsonb_build_object('estado','CONCLUIDO','efeito_revertido',true,'status',v_workflow.status_anterior),jsonb_build_object('funcionario_id',v_workflow.funcionario_id,'workflow_id',v_workflow.id,'correcao_id',v_correcao.id,'tipo','REVERSAO_ERRO','correlation_id',v_correlation),v_correlation),
   (p_empresa_id,auth.uid(),'usuario','rh','funcionario',v_workflow.funcionario_id,'rh.funcionario.status_alterado','warning','app','sucesso',v_correcao.motivo_correcao,
    jsonb_build_object('status',v_funcionario_antes.status,'arquivado',v_funcionario_antes.arquivado),jsonb_build_object('status',v_funcionario_depois.status,'arquivado',v_funcionario_depois.arquivado),jsonb_build_object('funcionario_id',v_workflow.funcionario_id,'workflow_id',v_workflow.id,'correcao_id',v_correcao.id,'regra','reversao_erro_2c3','correlation_id',v_correlation),v_correlation);
  return to_jsonb(v_correcao)||jsonb_build_object('codigo','DESLIGAMENTO_REVERTIDO','status_funcional',v_funcionario_depois.status,'funcionario_arquivado',v_funcionario_depois.arquivado);
end; $$;

revoke all on function public.reverter_desligamento_concluido_por_erro_controlado(uuid,uuid,text,text)
  from public,anon,authenticated;
grant execute on function public.reverter_desligamento_concluido_por_erro_controlado(uuid,uuid,text,text)
  to authenticated;

commit;
