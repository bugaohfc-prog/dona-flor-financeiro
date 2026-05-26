-- =========================================================
-- DNA Gestao - Gestao de Pessoas
-- Migration de revisao: cria estrutura de ferias de funcionarios.
--
-- ATENCAO:
-- - Arquivo gerado para aplicacao controlada.
-- - Nao aplicar automaticamente sem pre-flight e rollback revisados.
-- - A estrutura guarda ciclos e periodos/parcelas de ferias.
-- - Nao cria frontend, service, hook, menu, rota, exportacao ou integracao
--   real com financeiro.
-- - Nao armazenar documentos, anexos, uploads, base64, links publicos,
--   laudos, dados medicos ou informacoes clinicas.
--
-- Pre-flight sugerido antes de aplicar:
-- 1. Confirmar que public.df_funcionarios existe:
--    select to_regclass('public.df_funcionarios') as tabela_funcionarios;
-- 2. Confirmar que public.df_empresas existe:
--    select to_regclass('public.df_empresas') as tabela_empresas;
-- 3. Confirmar que as tabelas de ferias ainda nao existem:
--    select to_regclass('public.df_funcionarios_ferias_ciclos') as tabela_ciclos;
--    select to_regclass('public.df_funcionarios_ferias_periodos') as tabela_periodos;
-- 4. Confirmar que helper de permissao validado existe:
--    select to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') as helper;
-- 5. Confirmar RLS habilitada e forcada em df_funcionarios:
--    select c.relrowsecurity, c.relforcerowsecurity
--    from pg_class c
--    join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public'
--      and c.relname = 'df_funcionarios';
-- 6. Confirmar rollback disponivel:
--    docs/security/rollback/rollback_df_funcionarios_ferias_20260525.sql
-- 7. Confirmar que nenhum frontend/service/hook depende das tabelas antes da aplicacao.
-- =========================================================

begin;

do $$
declare
  v_funcionarios_rls boolean;
  v_funcionarios_force_rls boolean;
begin
  if to_regclass('public.df_empresas') is null then
    raise exception 'Missing table public.df_empresas';
  end if;

  if to_regclass('public.df_funcionarios') is null then
    raise exception 'Missing table public.df_funcionarios';
  end if;

  if to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') is null then
    raise exception 'Missing helper public.df_funcionarios_pode_escrever(uuid)';
  end if;

  select c.relrowsecurity, c.relforcerowsecurity
    into v_funcionarios_rls, v_funcionarios_force_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'df_funcionarios';

  if coalesce(v_funcionarios_rls, false) is distinct from true
     or coalesce(v_funcionarios_force_rls, false) is distinct from true then
    raise exception 'public.df_funcionarios must have RLS enabled and forced before creating vacations';
  end if;
end $$;

create table if not exists public.df_funcionarios_ferias_ciclos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null
    references public.df_empresas(id)
    on delete restrict,
  funcionario_id uuid not null
    references public.df_funcionarios(id)
    on delete restrict,
  periodo_aquisitivo_inicio date not null,
  periodo_aquisitivo_fim date not null,
  data_limite_gozo date not null,
  dias_direito integer not null default 30,
  status text not null default 'pendente',
  arquivado boolean not null default false,
  arquivado_em timestamptz null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint df_funcionarios_ferias_ciclos_periodo_check
    check (periodo_aquisitivo_fim >= periodo_aquisitivo_inicio),

  constraint df_funcionarios_ferias_ciclos_data_limite_check
    check (data_limite_gozo >= periodo_aquisitivo_fim),

  constraint df_funcionarios_ferias_ciclos_dias_direito_check
    check (dias_direito > 0),

  constraint df_funcionarios_ferias_ciclos_status_check
    check (status in ('pendente', 'parcial', 'agendada', 'concluida', 'vencida', 'cancelada')),

  constraint df_funcionarios_ferias_ciclos_arquivado_em_check
    check (arquivado = true or arquivado_em is null)
);

create table if not exists public.df_funcionarios_ferias_periodos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null
    references public.df_empresas(id)
    on delete restrict,
  ciclo_ferias_id uuid not null
    references public.df_funcionarios_ferias_ciclos(id)
    on delete restrict,
  funcionario_id uuid not null
    references public.df_funcionarios(id)
    on delete restrict,
  data_inicio date not null,
  quantidade_dias integer not null,
  data_fim_calculada date not null,
  data_retorno_trabalho date not null,
  numero_parcela integer not null,
  status text not null default 'agendada',
  arquivado boolean not null default false,
  arquivado_em timestamptz null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint df_funcionarios_ferias_periodos_quantidade_dias_check
    check (quantidade_dias > 0),

  constraint df_funcionarios_ferias_periodos_numero_parcela_check
    check (numero_parcela between 1 and 3),

  constraint df_funcionarios_ferias_periodos_datas_calculadas_check
    check (
      data_fim_calculada = data_inicio + (quantidade_dias - 1)
      and data_retorno_trabalho = data_fim_calculada + 1
    ),

  constraint df_funcionarios_ferias_periodos_status_check
    check (status in ('agendada', 'concluida', 'cancelada')),

  constraint df_funcionarios_ferias_periodos_arquivado_em_check
    check (arquivado = true or arquivado_em is null)
);

comment on table public.df_funcionarios_ferias_ciclos is
  'Gestao de Pessoas: ciclos de ferias de funcionarios. Dados trabalhistas sujeitos a RLS e LGPD.';

comment on table public.df_funcionarios_ferias_periodos is
  'Gestao de Pessoas: periodos ou parcelas de ferias. Nao armazenar documentos, anexos ou dados sensiveis livres.';

comment on column public.df_funcionarios_ferias_periodos.data_fim_calculada is
  'Data calculada pela aplicacao: data_inicio + quantidade_dias - 1 dia.';

comment on column public.df_funcionarios_ferias_periodos.data_retorno_trabalho is
  'Data calculada pela aplicacao: data_fim_calculada + 1 dia.';

create index if not exists idx_df_funcionarios_ferias_ciclos_empresa_id
on public.df_funcionarios_ferias_ciclos (empresa_id);

create index if not exists idx_df_funcionarios_ferias_ciclos_funcionario_id
on public.df_funcionarios_ferias_ciclos (funcionario_id);

create index if not exists idx_df_funcionarios_ferias_ciclos_empresa_funcionario
on public.df_funcionarios_ferias_ciclos (empresa_id, funcionario_id);

create index if not exists idx_df_funcionarios_ferias_ciclos_empresa_status
on public.df_funcionarios_ferias_ciclos (empresa_id, status);

create index if not exists idx_df_funcionarios_ferias_ciclos_empresa_arquivado
on public.df_funcionarios_ferias_ciclos (empresa_id, arquivado);

create index if not exists idx_df_funcionarios_ferias_ciclos_data_limite
on public.df_funcionarios_ferias_ciclos (data_limite_gozo);

create index if not exists idx_df_funcionarios_ferias_periodos_empresa_id
on public.df_funcionarios_ferias_periodos (empresa_id);

create index if not exists idx_df_funcionarios_ferias_periodos_funcionario_id
on public.df_funcionarios_ferias_periodos (funcionario_id);

create index if not exists idx_df_funcionarios_ferias_periodos_ciclo_id
on public.df_funcionarios_ferias_periodos (ciclo_ferias_id);

create index if not exists idx_df_funcionarios_ferias_periodos_empresa_ciclo
on public.df_funcionarios_ferias_periodos (empresa_id, ciclo_ferias_id);

create index if not exists idx_df_funcionarios_ferias_periodos_empresa_funcionario
on public.df_funcionarios_ferias_periodos (empresa_id, funcionario_id);

create index if not exists idx_df_funcionarios_ferias_periodos_empresa_arquivado
on public.df_funcionarios_ferias_periodos (empresa_id, arquivado);

create index if not exists idx_df_funcionarios_ferias_periodos_data_inicio
on public.df_funcionarios_ferias_periodos (data_inicio);

create index if not exists idx_df_funcionarios_ferias_periodos_data_retorno
on public.df_funcionarios_ferias_periodos (data_retorno_trabalho);

create or replace function public.df_funcionarios_ferias_ciclos_set_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.criado_em = coalesce(new.criado_em, now());
    new.atualizado_em = coalesce(new.atualizado_em, now());
  else
    new.atualizado_em = now();
  end if;

  if new.arquivado = true and new.arquivado_em is null then
    new.arquivado_em = now();
  elsif new.arquivado = false then
    new.arquivado_em = null;
  end if;

  return new;
end;
$$;

create or replace function public.df_funcionarios_ferias_periodos_set_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.criado_em = coalesce(new.criado_em, now());
    new.atualizado_em = coalesce(new.atualizado_em, now());
  else
    new.atualizado_em = now();
  end if;

  if new.arquivado = true and new.arquivado_em is null then
    new.arquivado_em = now();
  elsif new.arquivado = false then
    new.arquivado_em = null;
  end if;

  return new;
end;
$$;

create or replace function public.df_funcionarios_ferias_ciclos_bloquear_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Physical DELETE is blocked for df_funcionarios_ferias_ciclos. Use arquivado=true instead.'
    using errcode = '42501';
end;
$$;

create or replace function public.df_funcionarios_ferias_periodos_bloquear_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Physical DELETE is blocked for df_funcionarios_ferias_periodos. Use arquivado=true instead.'
    using errcode = '42501';
end;
$$;

create or replace function public.df_funcionarios_ferias_ciclos_bloquear_alteracao_empresa()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'empresa_id cannot be changed for df_funcionarios_ferias_ciclos after insert'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.df_funcionarios_ferias_periodos_bloquear_alteracao_empresa()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'empresa_id cannot be changed for df_funcionarios_ferias_periodos after insert'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.df_funcionarios_ferias_ciclos_validar_funcionario_empresa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.df_funcionarios f
    where f.id = new.funcionario_id
      and f.empresa_id = new.empresa_id
  ) then
    raise exception 'funcionario_id must belong to the same empresa_id'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.df_funcionarios_ferias_periodos_validar_vinculos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.df_funcionarios f
    where f.id = new.funcionario_id
      and f.empresa_id = new.empresa_id
  ) then
    raise exception 'funcionario_id must belong to the same empresa_id'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.df_funcionarios_ferias_ciclos c
    where c.id = new.ciclo_ferias_id
      and c.empresa_id = new.empresa_id
      and c.funcionario_id = new.funcionario_id
  ) then
    raise exception 'ciclo_ferias_id must belong to the same empresa_id and funcionario_id'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_df_funcionarios_ferias_ciclos_set_timestamps on public.df_funcionarios_ferias_ciclos;
create trigger trg_df_funcionarios_ferias_ciclos_set_timestamps
before insert or update
on public.df_funcionarios_ferias_ciclos
for each row
execute function public.df_funcionarios_ferias_ciclos_set_timestamps();

drop trigger if exists trg_df_funcionarios_ferias_ciclos_bloquear_delete on public.df_funcionarios_ferias_ciclos;
create trigger trg_df_funcionarios_ferias_ciclos_bloquear_delete
before delete
on public.df_funcionarios_ferias_ciclos
for each row
execute function public.df_funcionarios_ferias_ciclos_bloquear_delete();

drop trigger if exists trg_df_funcionarios_ferias_ciclos_bloquear_alteracao_empresa on public.df_funcionarios_ferias_ciclos;
create trigger trg_df_funcionarios_ferias_ciclos_bloquear_alteracao_empresa
before update
on public.df_funcionarios_ferias_ciclos
for each row
execute function public.df_funcionarios_ferias_ciclos_bloquear_alteracao_empresa();

drop trigger if exists trg_df_funcionarios_ferias_ciclos_validar_funcionario_empresa on public.df_funcionarios_ferias_ciclos;
create trigger trg_df_funcionarios_ferias_ciclos_validar_funcionario_empresa
before insert or update of empresa_id, funcionario_id
on public.df_funcionarios_ferias_ciclos
for each row
execute function public.df_funcionarios_ferias_ciclos_validar_funcionario_empresa();

drop trigger if exists trg_df_funcionarios_ferias_periodos_set_timestamps on public.df_funcionarios_ferias_periodos;
create trigger trg_df_funcionarios_ferias_periodos_set_timestamps
before insert or update
on public.df_funcionarios_ferias_periodos
for each row
execute function public.df_funcionarios_ferias_periodos_set_timestamps();

drop trigger if exists trg_df_funcionarios_ferias_periodos_bloquear_delete on public.df_funcionarios_ferias_periodos;
create trigger trg_df_funcionarios_ferias_periodos_bloquear_delete
before delete
on public.df_funcionarios_ferias_periodos
for each row
execute function public.df_funcionarios_ferias_periodos_bloquear_delete();

drop trigger if exists trg_df_funcionarios_ferias_periodos_bloquear_alteracao_empresa on public.df_funcionarios_ferias_periodos;
create trigger trg_df_funcionarios_ferias_periodos_bloquear_alteracao_empresa
before update
on public.df_funcionarios_ferias_periodos
for each row
execute function public.df_funcionarios_ferias_periodos_bloquear_alteracao_empresa();

drop trigger if exists trg_df_funcionarios_ferias_periodos_validar_vinculos on public.df_funcionarios_ferias_periodos;
create trigger trg_df_funcionarios_ferias_periodos_validar_vinculos
before insert or update of empresa_id, ciclo_ferias_id, funcionario_id
on public.df_funcionarios_ferias_periodos
for each row
execute function public.df_funcionarios_ferias_periodos_validar_vinculos();

alter table public.df_funcionarios_ferias_ciclos enable row level security;
alter table public.df_funcionarios_ferias_ciclos force row level security;

alter table public.df_funcionarios_ferias_periodos enable row level security;
alter table public.df_funcionarios_ferias_periodos force row level security;

revoke all on public.df_funcionarios_ferias_ciclos from public;
revoke all on public.df_funcionarios_ferias_ciclos from anon;
grant select, insert, update on public.df_funcionarios_ferias_ciclos to authenticated;
revoke delete on public.df_funcionarios_ferias_ciclos from authenticated;

revoke all on public.df_funcionarios_ferias_periodos from public;
revoke all on public.df_funcionarios_ferias_periodos from anon;
grant select, insert, update on public.df_funcionarios_ferias_periodos to authenticated;
revoke delete on public.df_funcionarios_ferias_periodos from authenticated;

drop policy if exists "df_funcionarios_ferias_ciclos_select_admin_master" on public.df_funcionarios_ferias_ciclos;
drop policy if exists "df_funcionarios_ferias_ciclos_insert_admin_master" on public.df_funcionarios_ferias_ciclos;
drop policy if exists "df_funcionarios_ferias_ciclos_update_admin_master" on public.df_funcionarios_ferias_ciclos;

create policy "df_funcionarios_ferias_ciclos_select_admin_master"
on public.df_funcionarios_ferias_ciclos
for select
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

create policy "df_funcionarios_ferias_ciclos_insert_admin_master"
on public.df_funcionarios_ferias_ciclos
for insert
to authenticated
with check (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

create policy "df_funcionarios_ferias_ciclos_update_admin_master"
on public.df_funcionarios_ferias_ciclos
for update
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
)
with check (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

drop policy if exists "df_funcionarios_ferias_periodos_select_admin_master" on public.df_funcionarios_ferias_periodos;
drop policy if exists "df_funcionarios_ferias_periodos_insert_admin_master" on public.df_funcionarios_ferias_periodos;
drop policy if exists "df_funcionarios_ferias_periodos_update_admin_master" on public.df_funcionarios_ferias_periodos;

create policy "df_funcionarios_ferias_periodos_select_admin_master"
on public.df_funcionarios_ferias_periodos
for select
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

create policy "df_funcionarios_ferias_periodos_insert_admin_master"
on public.df_funcionarios_ferias_periodos
for insert
to authenticated
with check (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

create policy "df_funcionarios_ferias_periodos_update_admin_master"
on public.df_funcionarios_ferias_periodos
for update
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
)
with check (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

do $$
declare
  unsafe_policies text;
  forbidden_columns text;
begin
  select string_agg(tablename || ':' || policyname || ':' || cmd, ', ' order by tablename, policyname)
  into unsafe_policies
  from pg_policies
  where schemaname = 'public'
    and tablename in ('df_funcionarios_ferias_ciclos', 'df_funcionarios_ferias_periodos')
    and cmd in ('DELETE', 'ALL');

  if unsafe_policies is not null then
    raise exception 'Unexpected DELETE/ALL policies on vacation tables: %', unsafe_policies;
  end if;

  select string_agg(table_name || '.' || column_name, ', ' order by table_name, column_name)
  into forbidden_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name in ('df_funcionarios_ferias_ciclos', 'df_funcionarios_ferias_periodos')
    and column_name = any (array[
      'documento',
      'documentos',
      'anexo',
      'upload',
      'base64',
      'link_publico',
      'laudo',
      'resultado',
      'observacao_medica',
      'informacao_clinica',
      'conta_financeira_id',
      'conta_pagar_id',
      'valor_pagamento',
      'data_pagamento'
    ]);

  if forbidden_columns is not null then
    raise exception 'Forbidden columns found on vacation tables: %', forbidden_columns;
  end if;
end $$;

-- Checklist pos-aplicacao:
-- 1. Confirmar tabelas criadas:
--    select to_regclass('public.df_funcionarios_ferias_ciclos') as tabela_ciclos;
--    select to_regclass('public.df_funcionarios_ferias_periodos') as tabela_periodos;
-- 2. Confirmar campos obrigatorios:
--    select table_name, column_name, data_type, is_nullable, column_default
--    from information_schema.columns
--    where table_schema = 'public'
--      and table_name in ('df_funcionarios_ferias_ciclos', 'df_funcionarios_ferias_periodos')
--    order by table_name, ordinal_position;
-- 3. Confirmar RLS habilitada e forcada:
--    select c.relname, c.relrowsecurity, c.relforcerowsecurity
--    from pg_class c
--    join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public'
--      and c.relname in ('df_funcionarios_ferias_ciclos', 'df_funcionarios_ferias_periodos');
-- 4. Confirmar policies SELECT/INSERT/UPDATE e ausencia de DELETE/ALL:
--    select tablename, policyname, cmd
--    from pg_policies
--    where schemaname = 'public'
--      and tablename in ('df_funcionarios_ferias_ciclos', 'df_funcionarios_ferias_periodos')
--    order by tablename, policyname;
-- 5. Confirmar triggers principais:
--    select tgrelid::regclass as tabela, tgname
--    from pg_trigger
--    where tgrelid in (
--      'public.df_funcionarios_ferias_ciclos'::regclass,
--      'public.df_funcionarios_ferias_periodos'::regclass
--    )
--      and not tgisinternal
--    order by tabela::text, tgname;
-- 6. Testar com dados fake que DELETE fisico falha.
-- 7. Testar com dados fake que empresa_id nao pode mudar apos INSERT.
-- 8. Testar com dados fake que funcionario_id de outra empresa e rejeitado em ciclos.
-- 9. Testar com dados fake que periodo/ciclo cross-tenant e rejeitado.
-- 10. Validar que nao existem campos de documento, anexo, upload ou financeiro.
-- 11. Validar com anon/auth que operador e gerente nao acessam.
-- 12. Validar com anon/auth que admin/master acessam somente empresas permitidas.

commit;
