begin;

do $$
begin
  if to_regclass('public.df_empresas') is null
     or to_regclass('public.df_funcionarios') is null
     or to_regclass('public.df_funcionarios_desligamentos') is null
     or to_regclass('public.df_funcionarios_desligamentos_correcoes') is null
     or to_regclass('public.df_auditoria_eventos') is null
     or to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') is null
     or to_regprocedure('public.df_desligamento_bloquear_funcionario_interno(uuid,uuid)') is null then
    raise exception 'DEPENDENCIA_CHECKLIST_DESLIGAMENTO_2C6B_AUSENTE';
  end if;
end $$;

create table public.df_funcionarios_desligamentos_checklist_catalogo (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  codigo text not null,
  titulo text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint df_desligamentos_checklist_catalogo_empresa_fk
    foreign key (empresa_id) references public.df_empresas(id)
    on update restrict on delete restrict,
  constraint df_desligamentos_checklist_catalogo_codigo_check
    check (length(btrim(codigo)) between 1 and 80),
  constraint df_desligamentos_checklist_catalogo_titulo_check
    check (length(btrim(titulo)) between 3 and 160),
  constraint df_desligamentos_checklist_catalogo_empresa_id_id_unique
    unique (empresa_id, id),
  constraint df_desligamentos_checklist_catalogo_codigo_unique
    unique (empresa_id, codigo)
);

comment on table public.df_funcionarios_desligamentos_checklist_catalogo is
  'Catalogo administrativo tenant-local. Nao representa obrigacao legal e nao possui itens criados automaticamente.';
comment on column public.df_funcionarios_desligamentos_checklist_catalogo.codigo is
  'Codigo operacional configurado pela empresa, sem semantica legal embutida.';

create index idx_df_desligamentos_checklist_catalogo_ativos
  on public.df_funcionarios_desligamentos_checklist_catalogo (empresa_id, titulo, id)
  where ativo = true;

create table public.df_funcionarios_desligamentos_checklist (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  desligamento_id uuid not null,
  funcionario_id uuid not null,
  catalogo_item_id uuid null,
  item_codigo text not null,
  titulo_snapshot text not null,
  estado text not null default 'PENDENTE',
  data_prevista date null,
  concluido_em timestamptz null,
  concluido_por uuid null,
  observacao_administrativa text null,
  correlation_id text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint df_desligamentos_checklist_empresa_fk
    foreign key (empresa_id) references public.df_empresas(id)
    on update restrict on delete restrict,
  constraint df_desligamentos_checklist_workflow_tenant_fk
    foreign key (empresa_id, desligamento_id)
    references public.df_funcionarios_desligamentos(empresa_id, id)
    on update restrict on delete restrict,
  constraint df_desligamentos_checklist_funcionario_tenant_fk
    foreign key (empresa_id, funcionario_id)
    references public.df_funcionarios(empresa_id, id)
    on update restrict on delete restrict,
  constraint df_desligamentos_checklist_catalogo_tenant_fk
    foreign key (empresa_id, catalogo_item_id)
    references public.df_funcionarios_desligamentos_checklist_catalogo(empresa_id, id)
    on update restrict on delete restrict,
  constraint df_desligamentos_checklist_estado_check
    check (estado in ('PENDENTE', 'CONCLUIDO', 'NAO_APLICAVEL')),
  constraint df_desligamentos_checklist_item_codigo_check
    check (length(btrim(item_codigo)) between 1 and 80),
  constraint df_desligamentos_checklist_titulo_snapshot_check
    check (length(btrim(titulo_snapshot)) between 3 and 160),
  constraint df_desligamentos_checklist_observacao_check
    check (observacao_administrativa is null or length(observacao_administrativa) <= 500),
  constraint df_desligamentos_checklist_correlation_check
    check (length(btrim(correlation_id)) > 0),
  constraint df_desligamentos_checklist_conclusao_check
    check (
      (estado = 'CONCLUIDO' and concluido_em is not null and concluido_por is not null)
      or
      (estado in ('PENDENTE', 'NAO_APLICAVEL') and concluido_em is null and concluido_por is null)
    ),
  constraint df_desligamentos_checklist_item_unique
    unique (empresa_id, desligamento_id, item_codigo)
);

comment on table public.df_funcionarios_desligamentos_checklist is
  'Itens administrativos ligados ao desligamento e ao vinculo historico. Nao calcula rescisao, verbas ou prazos legais.';
comment on column public.df_funcionarios_desligamentos_checklist.titulo_snapshot is
  'Rotulo historico imutavel capturado do catalogo no momento da criacao.';
comment on column public.df_funcionarios_desligamentos_checklist.data_prevista is
  'Data administrativa opcional informada pelo usuario; nao representa prazo legal calculado.';

create index idx_df_desligamentos_checklist_workflow
  on public.df_funcionarios_desligamentos_checklist
  (empresa_id, desligamento_id, criado_em, id);
create index idx_df_desligamentos_checklist_funcionario
  on public.df_funcionarios_desligamentos_checklist
  (empresa_id, funcionario_id, criado_em desc, id desc);
create index idx_df_desligamentos_checklist_pendentes
  on public.df_funcionarios_desligamentos_checklist
  (empresa_id, data_prevista, desligamento_id)
  where estado = 'PENDENTE';

create or replace function public.df_checklist_desligamento_set_timestamps_2c6b()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.criado_em = coalesce(new.criado_em, now());
    new.atualizado_em = coalesce(new.atualizado_em, now());
  else
    new.atualizado_em = now();
  end if;
  return new;
end;
$$;

create or replace function public.df_checklist_catalogo_proteger_2c6b()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'CHECKLIST_CATALOGO_DELETE_BLOQUEADO';
  end if;
  if new.empresa_id is distinct from old.empresa_id
     or new.codigo is distinct from old.codigo
     or new.criado_em is distinct from old.criado_em then
    raise exception 'CHECKLIST_CATALOGO_PROVENIENCIA_IMUTAVEL';
  end if;
  return new;
end;
$$;

create or replace function public.df_checklist_item_proteger_2c6b()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'CHECKLIST_DESLIGAMENTO_DELETE_BLOQUEADO';
  end if;
  if new.empresa_id is distinct from old.empresa_id
     or new.desligamento_id is distinct from old.desligamento_id
     or new.funcionario_id is distinct from old.funcionario_id
     or new.catalogo_item_id is distinct from old.catalogo_item_id
     or new.item_codigo is distinct from old.item_codigo
     or new.titulo_snapshot is distinct from old.titulo_snapshot
     or new.correlation_id is distinct from old.correlation_id
     or new.criado_em is distinct from old.criado_em then
    raise exception 'CHECKLIST_DESLIGAMENTO_PROVENIENCIA_IMUTAVEL';
  end if;
  return new;
end;
$$;

create trigger trg_df_checklist_catalogo_timestamps_2c6b
before insert or update on public.df_funcionarios_desligamentos_checklist_catalogo
for each row execute function public.df_checklist_desligamento_set_timestamps_2c6b();

create trigger trg_df_checklist_catalogo_proteger_update_2c6b
before update on public.df_funcionarios_desligamentos_checklist_catalogo
for each row execute function public.df_checklist_catalogo_proteger_2c6b();

create trigger trg_df_checklist_catalogo_bloquear_delete_2c6b
before delete on public.df_funcionarios_desligamentos_checklist_catalogo
for each row execute function public.df_checklist_catalogo_proteger_2c6b();

create trigger trg_df_checklist_item_timestamps_2c6b
before insert or update on public.df_funcionarios_desligamentos_checklist
for each row execute function public.df_checklist_desligamento_set_timestamps_2c6b();

create trigger trg_df_checklist_item_proteger_update_2c6b
before update on public.df_funcionarios_desligamentos_checklist
for each row execute function public.df_checklist_item_proteger_2c6b();

create trigger trg_df_checklist_item_bloquear_delete_2c6b
before delete on public.df_funcionarios_desligamentos_checklist
for each row execute function public.df_checklist_item_proteger_2c6b();

alter table public.df_funcionarios_desligamentos_checklist_catalogo enable row level security;
alter table public.df_funcionarios_desligamentos_checklist_catalogo force row level security;
alter table public.df_funcionarios_desligamentos_checklist enable row level security;
alter table public.df_funcionarios_desligamentos_checklist force row level security;

revoke all on table public.df_funcionarios_desligamentos_checklist_catalogo from public, anon, authenticated;
revoke all on table public.df_funcionarios_desligamentos_checklist from public, anon, authenticated;
grant select on table public.df_funcionarios_desligamentos_checklist_catalogo to authenticated;
grant select on table public.df_funcionarios_desligamentos_checklist to authenticated;

create policy "df_checklist_catalogo_select_rh"
on public.df_funcionarios_desligamentos_checklist_catalogo
for select to authenticated
using ((select auth.uid()) is not null and public.df_funcionarios_pode_escrever(empresa_id));

create policy "df_checklist_desligamento_select_rh"
on public.df_funcionarios_desligamentos_checklist
for select to authenticated
using ((select auth.uid()) is not null and public.df_funcionarios_pode_escrever(empresa_id));

create or replace function public.df_checklist_validar_desligamento_efetivo_2c6b(
  p_empresa_id uuid,
  p_desligamento_id uuid,
  p_funcionario_id uuid
)
returns public.df_funcionarios_desligamentos
language plpgsql
set search_path = ''
as $$
declare
  v_desligamento public.df_funcionarios_desligamentos%rowtype;
begin
  select * into v_desligamento
  from public.df_funcionarios_desligamentos
  where empresa_id = p_empresa_id
    and id = p_desligamento_id
    and funcionario_id = p_funcionario_id
  for update;

  if not found then
    raise exception 'DESLIGAMENTO_NAO_ENCONTRADO';
  end if;
  if v_desligamento.estado <> 'CONCLUIDO' then
    raise exception 'CHECKLIST_EXIGE_DESLIGAMENTO_CONCLUIDO';
  end if;
  if exists (
    select 1
    from public.df_funcionarios_desligamentos_correcoes c
    where c.empresa_id = p_empresa_id
      and c.desligamento_id = p_desligamento_id
      and c.tipo = 'REVERSAO_ERRO'
  ) then
    raise exception 'CHECKLIST_DESLIGAMENTO_REVERTIDO';
  end if;
  return v_desligamento;
end;
$$;

create or replace function public.criar_item_checklist_desligamento_controlado(
  p_empresa_id uuid,
  p_desligamento_id uuid,
  p_catalogo_item_id uuid,
  p_data_prevista date default null,
  p_observacao_administrativa text default null,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_referencia public.df_funcionarios_desligamentos%rowtype;
  v_desligamento public.df_funcionarios_desligamentos%rowtype;
  v_catalogo public.df_funcionarios_desligamentos_checklist_catalogo%rowtype;
  v_item public.df_funcionarios_desligamentos_checklist%rowtype;
  v_observacao text := nullif(btrim(p_observacao_administrativa), '');
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if p_catalogo_item_id is null then
    raise exception 'ITEM_CATALOGO_OBRIGATORIO';
  end if;
  if v_observacao is not null and length(v_observacao) > 500 then
    raise exception 'OBSERVACAO_CHECKLIST_MUITO_LONGA';
  end if;

  select * into v_referencia
  from public.df_funcionarios_desligamentos
  where empresa_id = p_empresa_id and id = p_desligamento_id;
  if not found then raise exception 'DESLIGAMENTO_NAO_ENCONTRADO'; end if;

  perform public.df_desligamento_bloquear_funcionario_interno(p_empresa_id, v_referencia.funcionario_id);
  v_desligamento := public.df_checklist_validar_desligamento_efetivo_2c6b(
    p_empresa_id, p_desligamento_id, v_referencia.funcionario_id
  );

  select * into v_catalogo
  from public.df_funcionarios_desligamentos_checklist_catalogo
  where empresa_id = p_empresa_id and id = p_catalogo_item_id
  for key share;
  if not found then raise exception 'ITEM_CATALOGO_NAO_ENCONTRADO'; end if;
  if not v_catalogo.ativo then raise exception 'ITEM_CATALOGO_INATIVO'; end if;

  begin
    insert into public.df_funcionarios_desligamentos_checklist (
      empresa_id, desligamento_id, funcionario_id, catalogo_item_id,
      item_codigo, titulo_snapshot, estado, data_prevista,
      observacao_administrativa, correlation_id
    ) values (
      p_empresa_id, v_desligamento.id, v_desligamento.funcionario_id, v_catalogo.id,
      v_catalogo.codigo, v_catalogo.titulo, 'PENDENTE', p_data_prevista,
      v_observacao, v_correlation_id
    ) returning * into v_item;
  exception when unique_violation then
    raise exception 'ITEM_CHECKLIST_JA_EXISTE';
  end;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'desligamento_checklist_item', v_item.id,
    'rh.desligamento.checklist_item.criado', 'info', 'app', 'sucesso', null,
    jsonb_build_object(
      'item_id', v_item.id,
      'desligamento_id', v_item.desligamento_id,
      'funcionario_id', v_item.funcionario_id,
      'item_codigo', v_item.item_codigo,
      'titulo_snapshot', v_item.titulo_snapshot,
      'estado', v_item.estado,
      'data_prevista', v_item.data_prevista,
      'observacao_administrativa', v_item.observacao_administrativa
    ),
    jsonb_build_object(
      'regra', 'checklist_desligamento_2c6b',
      'workflow_id', v_item.desligamento_id,
      'funcionario_id', v_item.funcionario_id,
      'catalogo_item_id', v_item.catalogo_item_id
    ),
    v_correlation_id
  );

  return to_jsonb(v_item);
end;
$$;

create or replace function public.atualizar_item_checklist_desligamento_controlado(
  p_empresa_id uuid,
  p_item_id uuid,
  p_data_prevista date default null,
  p_observacao_administrativa text default null,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_referencia public.df_funcionarios_desligamentos_checklist%rowtype;
  v_antes public.df_funcionarios_desligamentos_checklist%rowtype;
  v_depois public.df_funcionarios_desligamentos_checklist%rowtype;
  v_observacao text := nullif(btrim(p_observacao_administrativa), '');
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if v_observacao is not null and length(v_observacao) > 500 then
    raise exception 'OBSERVACAO_CHECKLIST_MUITO_LONGA';
  end if;

  select * into v_referencia
  from public.df_funcionarios_desligamentos_checklist
  where empresa_id = p_empresa_id and id = p_item_id;
  if not found then raise exception 'ITEM_CHECKLIST_NAO_ENCONTRADO'; end if;

  perform public.df_desligamento_bloquear_funcionario_interno(p_empresa_id, v_referencia.funcionario_id);
  perform public.df_checklist_validar_desligamento_efetivo_2c6b(
    p_empresa_id, v_referencia.desligamento_id, v_referencia.funcionario_id
  );
  select * into v_antes
  from public.df_funcionarios_desligamentos_checklist
  where empresa_id = p_empresa_id and id = p_item_id
  for update;

  update public.df_funcionarios_desligamentos_checklist
  set data_prevista = p_data_prevista,
      observacao_administrativa = v_observacao
  where empresa_id = p_empresa_id and id = p_item_id
  returning * into v_depois;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'desligamento_checklist_item', v_depois.id,
    'rh.desligamento.checklist_item.atualizado', 'info', 'app', 'sucesso',
    jsonb_build_object('data_prevista', v_antes.data_prevista, 'observacao_administrativa', v_antes.observacao_administrativa),
    jsonb_build_object('data_prevista', v_depois.data_prevista, 'observacao_administrativa', v_depois.observacao_administrativa),
    jsonb_build_object('regra', 'checklist_desligamento_2c6b', 'workflow_id', v_depois.desligamento_id, 'funcionario_id', v_depois.funcionario_id),
    v_correlation_id
  );

  return to_jsonb(v_depois);
end;
$$;

create or replace function public.alterar_estado_item_checklist_desligamento_controlado(
  p_empresa_id uuid,
  p_item_id uuid,
  p_estado text,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_referencia public.df_funcionarios_desligamentos_checklist%rowtype;
  v_antes public.df_funcionarios_desligamentos_checklist%rowtype;
  v_depois public.df_funcionarios_desligamentos_checklist%rowtype;
  v_estado text := upper(nullif(btrim(p_estado), ''));
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if v_estado is null or v_estado not in ('PENDENTE', 'CONCLUIDO', 'NAO_APLICAVEL') then
    raise exception 'ESTADO_CHECKLIST_INVALIDO';
  end if;

  select * into v_referencia
  from public.df_funcionarios_desligamentos_checklist
  where empresa_id = p_empresa_id and id = p_item_id;
  if not found then raise exception 'ITEM_CHECKLIST_NAO_ENCONTRADO'; end if;

  perform public.df_desligamento_bloquear_funcionario_interno(p_empresa_id, v_referencia.funcionario_id);
  perform public.df_checklist_validar_desligamento_efetivo_2c6b(
    p_empresa_id, v_referencia.desligamento_id, v_referencia.funcionario_id
  );
  select * into v_antes
  from public.df_funcionarios_desligamentos_checklist
  where empresa_id = p_empresa_id and id = p_item_id
  for update;

  if v_antes.estado = v_estado then
    return to_jsonb(v_antes) || jsonb_build_object('idempotente', true);
  end if;

  update public.df_funcionarios_desligamentos_checklist
  set estado = v_estado,
      concluido_em = case when v_estado = 'CONCLUIDO' then now() else null end,
      concluido_por = case when v_estado = 'CONCLUIDO' then auth.uid() else null end
  where empresa_id = p_empresa_id and id = p_item_id
  returning * into v_depois;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'desligamento_checklist_item', v_depois.id,
    'rh.desligamento.checklist_item.estado_alterado', 'info', 'app', 'sucesso',
    jsonb_build_object('estado', v_antes.estado, 'concluido_em', v_antes.concluido_em, 'concluido_por', v_antes.concluido_por),
    jsonb_build_object('estado', v_depois.estado, 'concluido_em', v_depois.concluido_em, 'concluido_por', v_depois.concluido_por),
    jsonb_build_object('regra', 'checklist_desligamento_2c6b', 'workflow_id', v_depois.desligamento_id, 'funcionario_id', v_depois.funcionario_id),
    v_correlation_id
  );

  return to_jsonb(v_depois) || jsonb_build_object('idempotente', false);
end;
$$;

revoke all on function public.df_checklist_desligamento_set_timestamps_2c6b() from public, anon, authenticated;
revoke all on function public.df_checklist_catalogo_proteger_2c6b() from public, anon, authenticated;
revoke all on function public.df_checklist_item_proteger_2c6b() from public, anon, authenticated;
revoke all on function public.df_checklist_validar_desligamento_efetivo_2c6b(uuid, uuid, uuid) from public, anon, authenticated;

revoke all on function public.criar_item_checklist_desligamento_controlado(uuid, uuid, uuid, date, text, text)
  from public, anon, authenticated;
grant execute on function public.criar_item_checklist_desligamento_controlado(uuid, uuid, uuid, date, text, text)
  to authenticated;

revoke all on function public.atualizar_item_checklist_desligamento_controlado(uuid, uuid, date, text, text)
  from public, anon, authenticated;
grant execute on function public.atualizar_item_checklist_desligamento_controlado(uuid, uuid, date, text, text)
  to authenticated;

revoke all on function public.alterar_estado_item_checklist_desligamento_controlado(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.alterar_estado_item_checklist_desligamento_controlado(uuid, uuid, text, text)
  to authenticated;

commit;
