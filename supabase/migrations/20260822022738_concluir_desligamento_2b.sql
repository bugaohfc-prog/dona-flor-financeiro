begin;

do $$
begin
  if to_regclass('public.df_funcionarios') is null
     or to_regclass('public.df_funcionarios_desligamentos') is null
     or to_regclass('public.df_auditoria_eventos') is null
     or to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') is null
     or to_regprocedure('public.df_desligamento_bloquear_funcionario_interno(uuid,uuid)') is null then
    raise exception 'DEPENDENCIA_DESLIGAMENTO_2B_AUSENTE';
  end if;
end $$;

alter table public.df_funcionarios_desligamentos
  add column concluido_por uuid null,
  add column concluido_em timestamptz null;

alter table public.df_funcionarios_desligamentos
  drop constraint df_funcionarios_desligamentos_estado_check,
  drop constraint df_funcionarios_desligamentos_cancelamento_check;

alter table public.df_funcionarios_desligamentos
  add constraint df_funcionarios_desligamentos_estado_check
    check (estado in ('ABERTO', 'CANCELADO', 'CONCLUIDO')),
  add constraint df_funcionarios_desligamentos_ciclo_vida_check
    check (
      (estado = 'ABERTO'
        and cancelado_por is null
        and cancelado_em is null
        and motivo_cancelamento is null
        and concluido_por is null
        and concluido_em is null)
      or
      (estado = 'CANCELADO'
        and cancelado_por is not null
        and cancelado_em is not null
        and length(btrim(motivo_cancelamento)) >= 3
        and concluido_por is null
        and concluido_em is null)
      or
      (estado = 'CONCLUIDO'
        and cancelado_por is null
        and cancelado_em is null
        and motivo_cancelamento is null
        and concluido_por is not null
        and concluido_em is not null)
    );

comment on table public.df_funcionarios_desligamentos is
  'Historico do workflow de desligamento. CONCLUIDO altera o status funcional sem arquivar o cadastro.';
comment on column public.df_funcionarios_desligamentos.data_efetiva is
  'Ultimo dia/data efetiva registrada e utilizada pela conclusao funcional.';
comment on column public.df_funcionarios_desligamentos.concluido_por is
  'Usuario que concluiu o desligamento pelo fluxo transacional controlado.';
comment on column public.df_funcionarios_desligamentos.concluido_em is
  'Instante em que o workflow e o status funcional foram concluídos atomicamente.';

create or replace function public.df_funcionarios_bloquear_desligamento_direto_2a()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.status = 'desligado' then
    raise exception 'DESLIGAMENTO_REQUER_WORKFLOW_CONCLUIDO';
  end if;

  if tg_op = 'UPDATE'
     and old.status is distinct from new.status
     and new.status = 'desligado'
     and not exists (
       select 1
       from public.df_funcionarios_desligamentos d
       where d.empresa_id = new.empresa_id
         and d.funcionario_id = new.id
         and d.estado = 'CONCLUIDO'
         and d.concluido_em is not null
     ) then
    raise exception 'DESLIGAMENTO_REQUER_WORKFLOW_CONCLUIDO';
  end if;

  if tg_op = 'UPDATE'
     and old.status = 'desligado'
     and new.status is distinct from old.status then
    raise exception 'READMISSAO_REQUER_FLUXO_CONTROLADO';
  end if;

  return new;
end;
$$;

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
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;

  select * into v_antes
  from public.df_funcionarios_desligamentos
  where empresa_id = p_empresa_id
    and id = p_desligamento_id;

  if not found then
    raise exception 'DESLIGAMENTO_NAO_ENCONTRADO';
  end if;

  v_funcionario_antes := public.df_desligamento_bloquear_funcionario_interno(
    p_empresa_id,
    v_antes.funcionario_id
  );

  select * into v_antes
  from public.df_funcionarios_desligamentos
  where empresa_id = p_empresa_id
    and id = p_desligamento_id
  for update;

  if v_antes.estado = 'CONCLUIDO' then
    raise exception 'DESLIGAMENTO_JA_CONCLUIDO';
  end if;
  if v_antes.estado = 'CANCELADO' then
    raise exception 'DESLIGAMENTO_CANCELADO_NAO_PODE_CONCLUIR';
  end if;
  if v_antes.estado <> 'ABERTO' then
    raise exception 'DESLIGAMENTO_NAO_ESTA_ABERTO';
  end if;
  if v_antes.data_efetiva is null then
    raise exception 'DATA_EFETIVA_DESLIGAMENTO_OBRIGATORIA';
  end if;
  if v_funcionario_antes.arquivado then
    raise exception 'FUNCIONARIO_ARQUIVADO';
  end if;
  if v_funcionario_antes.status = 'desligado' then
    raise exception 'FUNCIONARIO_JA_DESLIGADO';
  end if;

  update public.df_funcionarios_desligamentos
  set estado = 'CONCLUIDO',
      concluido_por = auth.uid(),
      concluido_em = now(),
      atualizado_em = now(),
      correlation_id = v_correlation_id
  where id = v_antes.id
  returning * into v_depois;

  update public.df_funcionarios
  set status = 'desligado'
  where empresa_id = p_empresa_id
    and id = v_antes.funcionario_id
    and status <> 'desligado'
  returning * into v_funcionario_depois;

  if not found then
    raise exception 'FUNCIONARIO_JA_DESLIGADO';
  end if;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, motivo, dados_antes, dados_depois,
    metadados, correlation_id
  ) values
  (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'funcionario_desligamento', v_depois.id,
    'rh.desligamento.concluido', 'info', 'app', 'sucesso', v_depois.motivo,
    jsonb_build_object(
      'estado', v_antes.estado,
      'data_efetiva', v_antes.data_efetiva,
      'motivo', v_antes.motivo
    ),
    jsonb_build_object(
      'estado', v_depois.estado,
      'data_efetiva', v_depois.data_efetiva,
      'motivo', v_depois.motivo,
      'concluido_em', v_depois.concluido_em
    ),
    jsonb_build_object(
      'funcionario_id', v_depois.funcionario_id,
      'workflow_id', v_depois.id,
      'data_efetiva', v_depois.data_efetiva,
      'regra', 'desligamento_2b',
      'correlation_id', v_correlation_id
    ),
    v_correlation_id
  ),
  (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'funcionario', v_funcionario_depois.id,
    'rh.funcionario.status_alterado', 'info', 'app', 'sucesso', v_depois.motivo,
    jsonb_build_object(
      'status', v_funcionario_antes.status,
      'arquivado', v_funcionario_antes.arquivado
    ),
    jsonb_build_object(
      'status', v_funcionario_depois.status,
      'arquivado', v_funcionario_depois.arquivado
    ),
    jsonb_build_object(
      'funcionario_id', v_funcionario_depois.id,
      'workflow_id', v_depois.id,
      'data_efetiva', v_depois.data_efetiva,
      'regra', 'desligamento_2b',
      'correlation_id', v_correlation_id
    ),
    v_correlation_id
  );

  return to_jsonb(v_depois) || jsonb_build_object(
    'codigo', 'DESLIGAMENTO_CONCLUIDO',
    'status_funcional', v_funcionario_depois.status,
    'funcionario_arquivado', v_funcionario_depois.arquivado
  );
end;
$$;

revoke all on function public.concluir_desligamento_funcionario_controlado(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.concluir_desligamento_funcionario_controlado(uuid, uuid, text)
  to authenticated;

revoke all on function public.df_funcionarios_bloquear_desligamento_direto_2a()
  from public, anon, authenticated;

commit;
