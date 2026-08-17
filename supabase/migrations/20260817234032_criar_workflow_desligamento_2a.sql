begin;

do $$
begin
  if to_regclass('public.df_funcionarios') is null
     or to_regclass('public.df_auditoria_eventos') is null
     or to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') is null then
    raise exception 'DEPENDENCIA_DESLIGAMENTO_2A_AUSENTE';
  end if;
end $$;

create unique index if not exists uq_df_funcionarios_empresa_id_id
  on public.df_funcionarios (empresa_id, id);

create table if not exists public.df_funcionarios_desligamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  funcionario_id uuid not null,
  estado text not null default 'ABERTO',
  motivo text not null,
  data_efetiva date not null,
  observacoes text null,
  aberto_por uuid not null,
  aberto_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  cancelado_por uuid null,
  cancelado_em timestamptz null,
  motivo_cancelamento text null,
  correlation_id text not null,

  constraint df_funcionarios_desligamentos_empresa_fk
    foreign key (empresa_id) references public.df_empresas(id) on delete restrict,
  constraint df_funcionarios_desligamentos_funcionario_empresa_fk
    foreign key (empresa_id, funcionario_id)
    references public.df_funcionarios(empresa_id, id) on delete restrict,
  constraint df_funcionarios_desligamentos_estado_check
    check (estado in ('ABERTO', 'CANCELADO')),
  constraint df_funcionarios_desligamentos_motivo_check
    check (length(btrim(motivo)) >= 3),
  constraint df_funcionarios_desligamentos_correlation_check
    check (length(btrim(correlation_id)) > 0),
  constraint df_funcionarios_desligamentos_cancelamento_check
    check (
      (estado = 'ABERTO'
        and cancelado_por is null
        and cancelado_em is null
        and motivo_cancelamento is null)
      or
      (estado = 'CANCELADO'
        and cancelado_por is not null
        and cancelado_em is not null
        and length(btrim(motivo_cancelamento)) >= 3)
    )
);

comment on table public.df_funcionarios_desligamentos is
  'Historico do workflow de desligamento. No 2A, ABERTO e CANCELADO nao alteram o status funcional.';
comment on column public.df_funcionarios_desligamentos.data_efetiva is
  'Ultimo dia/data efetiva pretendida. A conclusao funcional permanece bloqueada ate o Desligamento 2B.';

create unique index if not exists uq_df_funcionarios_desligamentos_aberto
  on public.df_funcionarios_desligamentos (empresa_id, funcionario_id)
  where estado = 'ABERTO';

create index if not exists idx_df_funcionarios_desligamentos_historico
  on public.df_funcionarios_desligamentos (empresa_id, funcionario_id, aberto_em desc);

alter table public.df_funcionarios_desligamentos enable row level security;
alter table public.df_funcionarios_desligamentos force row level security;

revoke all on table public.df_funcionarios_desligamentos from public, anon, authenticated;
grant select on table public.df_funcionarios_desligamentos to authenticated;

drop policy if exists "df_funcionarios_desligamentos_select_rh" on public.df_funcionarios_desligamentos;
create policy "df_funcionarios_desligamentos_select_rh"
  on public.df_funcionarios_desligamentos
  for select
  to authenticated
  using (
    auth.uid() is not null
    and public.df_funcionarios_pode_escrever(empresa_id)
  );

create or replace function public.df_desligamento_bloquear_funcionario_interno(
  p_empresa_id uuid,
  p_funcionario_id uuid
)
returns public.df_funcionarios
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_funcionario public.df_funcionarios%rowtype;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(p_empresa_id::text || ':' || p_funcionario_id::text, 0)
  );

  select * into v_funcionario
  from public.df_funcionarios
  where empresa_id = p_empresa_id
    and id = p_funcionario_id
  for update;

  if not found then
    raise exception 'FUNCIONARIO_NAO_ENCONTRADO';
  end if;

  return v_funcionario;
end;
$$;

create or replace function public.abrir_desligamento_funcionario_controlado(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_motivo text,
  p_data_efetiva date,
  p_observacoes text default null,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_funcionario public.df_funcionarios%rowtype;
  v_workflow public.df_funcionarios_desligamentos%rowtype;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if length(btrim(coalesce(p_motivo, ''))) < 3 then
    raise exception 'MOTIVO_DESLIGAMENTO_OBRIGATORIO';
  end if;
  if p_data_efetiva is null then
    raise exception 'DATA_EFETIVA_DESLIGAMENTO_OBRIGATORIA';
  end if;

  v_funcionario := public.df_desligamento_bloquear_funcionario_interno(p_empresa_id, p_funcionario_id);

  if v_funcionario.arquivado then
    raise exception 'FUNCIONARIO_ARQUIVADO';
  end if;
  if v_funcionario.status = 'desligado' then
    raise exception 'FUNCIONARIO_JA_DESLIGADO';
  end if;

  perform 1
  from public.df_funcionarios_desligamentos
  where empresa_id = p_empresa_id
    and funcionario_id = p_funcionario_id
    and estado = 'ABERTO'
  for update;
  if found then
    raise exception 'DESLIGAMENTO_JA_ABERTO';
  end if;

  begin
    insert into public.df_funcionarios_desligamentos (
      empresa_id, funcionario_id, estado, motivo, data_efetiva, observacoes,
      aberto_por, correlation_id
    ) values (
      p_empresa_id, p_funcionario_id, 'ABERTO', btrim(p_motivo), p_data_efetiva,
      nullif(btrim(p_observacoes), ''), auth.uid(), v_correlation_id
    ) returning * into v_workflow;
  exception when unique_violation then
    raise exception 'DESLIGAMENTO_JA_ABERTO';
  end;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, motivo, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'funcionario_desligamento', v_workflow.id,
    'rh.desligamento.aberto', 'info', 'app', 'sucesso', v_workflow.motivo, null,
    jsonb_build_object(
      'estado', v_workflow.estado,
      'data_efetiva', v_workflow.data_efetiva,
      'observacoes_presentes', v_workflow.observacoes is not null
    ),
    jsonb_build_object(
      'funcionario_id', p_funcionario_id,
      'workflow_id', v_workflow.id,
      'regra', 'desligamento_2a',
      'status_funcional_preservado', v_funcionario.status,
      'correlation_id', v_correlation_id
    ),
    v_correlation_id
  );

  return to_jsonb(v_workflow) || jsonb_build_object('codigo', 'DESLIGAMENTO_ABERTO');
end;
$$;

create or replace function public.atualizar_desligamento_funcionario_controlado(
  p_empresa_id uuid,
  p_desligamento_id uuid,
  p_motivo text,
  p_data_efetiva date,
  p_observacoes text default null,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_antes public.df_funcionarios_desligamentos%rowtype;
  v_depois public.df_funcionarios_desligamentos%rowtype;
  v_funcionario public.df_funcionarios%rowtype;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if length(btrim(coalesce(p_motivo, ''))) < 3 then
    raise exception 'MOTIVO_DESLIGAMENTO_OBRIGATORIO';
  end if;
  if p_data_efetiva is null then
    raise exception 'DATA_EFETIVA_DESLIGAMENTO_OBRIGATORIA';
  end if;

  select * into v_antes
  from public.df_funcionarios_desligamentos
  where empresa_id = p_empresa_id and id = p_desligamento_id;
  if not found then
    raise exception 'DESLIGAMENTO_NAO_ENCONTRADO';
  end if;

  v_funcionario := public.df_desligamento_bloquear_funcionario_interno(p_empresa_id, v_antes.funcionario_id);

  select * into v_antes
  from public.df_funcionarios_desligamentos
  where empresa_id = p_empresa_id and id = p_desligamento_id
  for update;

  if v_antes.estado <> 'ABERTO' then
    raise exception 'DESLIGAMENTO_NAO_ESTA_ABERTO';
  end if;

  update public.df_funcionarios_desligamentos
  set motivo = btrim(p_motivo),
      data_efetiva = p_data_efetiva,
      observacoes = nullif(btrim(p_observacoes), ''),
      atualizado_em = now(),
      correlation_id = v_correlation_id
  where id = v_antes.id
  returning * into v_depois;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, motivo, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'funcionario_desligamento', v_depois.id,
    'rh.desligamento.atualizado', 'info', 'app', 'sucesso', v_depois.motivo,
    jsonb_build_object(
      'estado', v_antes.estado,
      'motivo', v_antes.motivo,
      'data_efetiva', v_antes.data_efetiva,
      'observacoes_presentes', v_antes.observacoes is not null
    ),
    jsonb_build_object(
      'estado', v_depois.estado,
      'motivo', v_depois.motivo,
      'data_efetiva', v_depois.data_efetiva,
      'observacoes_presentes', v_depois.observacoes is not null
    ),
    jsonb_build_object(
      'funcionario_id', v_depois.funcionario_id,
      'workflow_id', v_depois.id,
      'regra', 'desligamento_2a',
      'status_funcional_preservado', v_funcionario.status,
      'correlation_id', v_correlation_id
    ),
    v_correlation_id
  );

  return to_jsonb(v_depois) || jsonb_build_object('codigo', 'DESLIGAMENTO_ATUALIZADO');
end;
$$;

create or replace function public.cancelar_desligamento_funcionario_controlado(
  p_empresa_id uuid,
  p_desligamento_id uuid,
  p_motivo_cancelamento text,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_antes public.df_funcionarios_desligamentos%rowtype;
  v_depois public.df_funcionarios_desligamentos%rowtype;
  v_funcionario public.df_funcionarios%rowtype;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if length(btrim(coalesce(p_motivo_cancelamento, ''))) < 3 then
    raise exception 'MOTIVO_CANCELAMENTO_OBRIGATORIO';
  end if;

  select * into v_antes
  from public.df_funcionarios_desligamentos
  where empresa_id = p_empresa_id and id = p_desligamento_id;
  if not found then
    raise exception 'DESLIGAMENTO_NAO_ENCONTRADO';
  end if;

  v_funcionario := public.df_desligamento_bloquear_funcionario_interno(p_empresa_id, v_antes.funcionario_id);

  select * into v_antes
  from public.df_funcionarios_desligamentos
  where empresa_id = p_empresa_id and id = p_desligamento_id
  for update;

  if v_antes.estado <> 'ABERTO' then
    raise exception 'DESLIGAMENTO_NAO_ESTA_ABERTO';
  end if;

  update public.df_funcionarios_desligamentos
  set estado = 'CANCELADO',
      cancelado_por = auth.uid(),
      cancelado_em = now(),
      motivo_cancelamento = btrim(p_motivo_cancelamento),
      atualizado_em = now(),
      correlation_id = v_correlation_id
  where id = v_antes.id
  returning * into v_depois;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, motivo, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'funcionario_desligamento', v_depois.id,
    'rh.desligamento.cancelado', 'info', 'app', 'sucesso', v_depois.motivo_cancelamento,
    jsonb_build_object('estado', v_antes.estado, 'data_efetiva', v_antes.data_efetiva),
    jsonb_build_object(
      'estado', v_depois.estado,
      'data_efetiva', v_depois.data_efetiva,
      'motivo_cancelamento', v_depois.motivo_cancelamento
    ),
    jsonb_build_object(
      'funcionario_id', v_depois.funcionario_id,
      'workflow_id', v_depois.id,
      'regra', 'desligamento_2a',
      'status_funcional_preservado', v_funcionario.status,
      'correlation_id', v_correlation_id
    ),
    v_correlation_id
  );

  return to_jsonb(v_depois) || jsonb_build_object('codigo', 'DESLIGAMENTO_CANCELADO');
end;
$$;

create or replace function public.df_funcionarios_bloquear_desligamento_direto_2a()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.status is distinct from new.status and new.status = 'desligado' then
    raise exception 'DESLIGAMENTO_CONCLUSAO_BLOQUEADA_ATE_2B';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_df_funcionarios_bloquear_desligamento_direto_2a on public.df_funcionarios;
create trigger trg_df_funcionarios_bloquear_desligamento_direto_2a
before update of status on public.df_funcionarios
for each row
execute function public.df_funcionarios_bloquear_desligamento_direto_2a();

revoke all on function public.df_desligamento_bloquear_funcionario_interno(uuid, uuid)
  from public, anon, authenticated;

revoke all on function public.abrir_desligamento_funcionario_controlado(uuid, uuid, text, date, text, text)
  from public, anon, authenticated;
revoke all on function public.atualizar_desligamento_funcionario_controlado(uuid, uuid, text, date, text, text)
  from public, anon, authenticated;
revoke all on function public.cancelar_desligamento_funcionario_controlado(uuid, uuid, text, text)
  from public, anon, authenticated;

grant execute on function public.abrir_desligamento_funcionario_controlado(uuid, uuid, text, date, text, text)
  to authenticated;
grant execute on function public.atualizar_desligamento_funcionario_controlado(uuid, uuid, text, date, text, text)
  to authenticated;
grant execute on function public.cancelar_desligamento_funcionario_controlado(uuid, uuid, text, text)
  to authenticated;

revoke all on function public.df_funcionarios_bloquear_desligamento_direto_2a()
  from public, anon, authenticated;

commit;
