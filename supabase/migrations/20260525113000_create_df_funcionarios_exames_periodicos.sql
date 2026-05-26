-- =========================================================
-- DNA Gestao - Gestao de Pessoas
-- Migration de revisao: cria public.df_funcionarios_exames_periodicos.
--
-- ATENCAO:
-- - Arquivo gerado para aplicacao controlada no Supabase principal.
-- - Nao aplicar automaticamente sem pre-flight e rollback revisados.
-- - A tabela guarda somente datas de exames periodicos realizados.
-- - Nao armazenar laudos, resultados, documentos, anexos, uploads,
--   base64, links publicos, observacoes medicas, CID, apto/inapto,
--   restricoes medicas, condicoes de saude ou informacoes clinicas.
-- - Nao persiste data_proximo_periodico; esse calculo deve ser visual.
--
-- Pre-flight sugerido antes de aplicar:
-- 1. Confirmar que public.df_funcionarios existe:
--    select to_regclass('public.df_funcionarios') as tabela_funcionarios;
-- 2. Confirmar que public.df_empresas existe:
--    select to_regclass('public.df_empresas') as tabela_empresas;
-- 3. Confirmar que a tabela nova ainda nao existe:
--    select to_regclass('public.df_funcionarios_exames_periodicos') as tabela_exames;
-- 4. Confirmar que df_funcionarios tem empresa_id:
--    select column_name, data_type
--    from information_schema.columns
--    where table_schema = 'public'
--      and table_name = 'df_funcionarios'
--      and column_name = 'empresa_id';
-- 5. Confirmar RLS habilitada e forcada em df_funcionarios:
--    select c.relrowsecurity, c.relforcerowsecurity
--    from pg_class c
--    join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public'
--      and c.relname = 'df_funcionarios';
-- 6. Confirmar helper de permissao validado:
--    select to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') as helper;
-- 7. Confirmar rollback disponivel:
--    docs/security/rollback/rollback_df_funcionarios_exames_periodicos_20260525.sql
-- 8. Confirmar que nenhum frontend/service/hook depende da tabela antes da aplicacao.
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
    raise exception 'public.df_funcionarios must have RLS enabled and forced before creating periodical exams';
  end if;
end $$;

create table if not exists public.df_funcionarios_exames_periodicos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null
    references public.df_empresas(id)
    on delete restrict,
  funcionario_id uuid not null
    references public.df_funcionarios(id)
    on delete restrict,
  data_exame date not null,
  arquivado boolean not null default false,
  arquivado_em timestamptz null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint df_funcionarios_exames_periodicos_arquivado_em_check
    check (arquivado = true or arquivado_em is null)
);

comment on table public.df_funcionarios_exames_periodicos is
  'Gestao de Pessoas: historico de exames periodicos realizados. Guarda somente datas; nao armazenar dados clinicos ou documentos.';

comment on column public.df_funcionarios_exames_periodicos.data_exame is
  'Data do exame periodico realizado. Nao armazenar laudo, resultado, documento, anexo ou informacao clinica.';

comment on column public.df_funcionarios_exames_periodicos.arquivado is
  'Arquivamento logico do registro. DELETE fisico e bloqueado.';

create index if not exists idx_df_funcionarios_exames_periodicos_empresa_id
on public.df_funcionarios_exames_periodicos (empresa_id);

create index if not exists idx_df_funcionarios_exames_periodicos_funcionario_id
on public.df_funcionarios_exames_periodicos (funcionario_id);

create index if not exists idx_df_funcionarios_exames_periodicos_data_exame
on public.df_funcionarios_exames_periodicos (data_exame);

create index if not exists idx_df_funcionarios_exames_periodicos_empresa_funcionario
on public.df_funcionarios_exames_periodicos (empresa_id, funcionario_id);

create index if not exists idx_df_funcionarios_exames_periodicos_empresa_arquivado
on public.df_funcionarios_exames_periodicos (empresa_id, arquivado);

create or replace function public.df_funcionarios_exames_periodicos_set_timestamps()
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

create or replace function public.df_funcionarios_exames_periodicos_bloquear_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Physical DELETE is blocked for df_funcionarios_exames_periodicos. Use arquivado=true instead.'
    using errcode = '42501';
end;
$$;

create or replace function public.df_funcionarios_exames_periodicos_bloquear_alteracao_empresa()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'empresa_id cannot be changed for df_funcionarios_exames_periodicos after insert'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa()
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

drop trigger if exists trg_df_funcionarios_exames_periodicos_set_timestamps on public.df_funcionarios_exames_periodicos;
create trigger trg_df_funcionarios_exames_periodicos_set_timestamps
before insert or update
on public.df_funcionarios_exames_periodicos
for each row
execute function public.df_funcionarios_exames_periodicos_set_timestamps();

drop trigger if exists trg_df_funcionarios_exames_periodicos_bloquear_delete on public.df_funcionarios_exames_periodicos;
create trigger trg_df_funcionarios_exames_periodicos_bloquear_delete
before delete
on public.df_funcionarios_exames_periodicos
for each row
execute function public.df_funcionarios_exames_periodicos_bloquear_delete();

drop trigger if exists trg_df_funcionarios_exames_periodicos_bloquear_alteracao_empresa on public.df_funcionarios_exames_periodicos;
create trigger trg_df_funcionarios_exames_periodicos_bloquear_alteracao_empresa
before update
on public.df_funcionarios_exames_periodicos
for each row
execute function public.df_funcionarios_exames_periodicos_bloquear_alteracao_empresa();

drop trigger if exists trg_df_funcionarios_exames_periodicos_validar_funcionario_empresa on public.df_funcionarios_exames_periodicos;
create trigger trg_df_funcionarios_exames_periodicos_validar_funcionario_empresa
before insert or update of empresa_id, funcionario_id
on public.df_funcionarios_exames_periodicos
for each row
execute function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa();

alter table public.df_funcionarios_exames_periodicos enable row level security;
alter table public.df_funcionarios_exames_periodicos force row level security;

revoke all on public.df_funcionarios_exames_periodicos from public;
revoke all on public.df_funcionarios_exames_periodicos from anon;
grant select, insert, update on public.df_funcionarios_exames_periodicos to authenticated;
revoke delete on public.df_funcionarios_exames_periodicos from authenticated;

drop policy if exists "df_funcionarios_exames_periodicos_select_admin_master" on public.df_funcionarios_exames_periodicos;
drop policy if exists "df_funcionarios_exames_periodicos_insert_admin_master" on public.df_funcionarios_exames_periodicos;
drop policy if exists "df_funcionarios_exames_periodicos_update_admin_master" on public.df_funcionarios_exames_periodicos;

create policy "df_funcionarios_exames_periodicos_select_admin_master"
on public.df_funcionarios_exames_periodicos
for select
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

create policy "df_funcionarios_exames_periodicos_insert_admin_master"
on public.df_funcionarios_exames_periodicos
for insert
to authenticated
with check (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

create policy "df_funcionarios_exames_periodicos_update_admin_master"
on public.df_funcionarios_exames_periodicos
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
  select string_agg(policyname || ':' || cmd, ', ' order by policyname)
  into unsafe_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'df_funcionarios_exames_periodicos'
    and cmd in ('DELETE', 'ALL');

  if unsafe_policies is not null then
    raise exception 'Unexpected DELETE/ALL policies on df_funcionarios_exames_periodicos: %', unsafe_policies;
  end if;

  select string_agg(column_name, ', ' order by column_name)
  into forbidden_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'df_funcionarios_exames_periodicos'
    and column_name = any (array[
      'laudo',
      'resultado',
      'documento',
      'anexo',
      'upload',
      'base64',
      'link_publico',
      'observacao_medica',
      'cid',
      'apto_inapto',
      'restricao_medica',
      'condicao_saude',
      'informacao_clinica',
      'data_proximo_periodico',
      'observacoes'
    ]);

  if forbidden_columns is not null then
    raise exception 'Forbidden columns found on df_funcionarios_exames_periodicos: %', forbidden_columns;
  end if;
end $$;

-- Checklist pos-aplicacao:
-- 1. Confirmar que a tabela foi criada:
--    select to_regclass('public.df_funcionarios_exames_periodicos') as tabela;
-- 2. Confirmar campos esperados:
--    select column_name, data_type, is_nullable, column_default
--    from information_schema.columns
--    where table_schema = 'public'
--      and table_name = 'df_funcionarios_exames_periodicos'
--    order by ordinal_position;
-- 3. Confirmar que nenhum campo proibido existe:
--    select column_name
--    from information_schema.columns
--    where table_schema = 'public'
--      and table_name = 'df_funcionarios_exames_periodicos'
--      and column_name in (
--        'laudo', 'resultado', 'documento', 'anexo', 'upload', 'base64',
--        'link_publico', 'observacao_medica', 'cid', 'apto_inapto',
--        'restricao_medica', 'condicao_saude', 'informacao_clinica',
--        'data_proximo_periodico', 'observacoes'
--      );
-- 4. Confirmar RLS habilitada e forcada:
--    select c.relrowsecurity, c.relforcerowsecurity
--    from pg_class c
--    join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public'
--      and c.relname = 'df_funcionarios_exames_periodicos';
-- 5. Confirmar policies SELECT/INSERT/UPDATE e ausencia de DELETE/ALL:
--    select policyname, cmd
--    from pg_policies
--    where schemaname = 'public'
--      and tablename = 'df_funcionarios_exames_periodicos'
--    order by policyname;
-- 6. Confirmar triggers principais:
--    select tgname
--    from pg_trigger
--    where tgrelid = 'public.df_funcionarios_exames_periodicos'::regclass
--      and not tgisinternal
--    order by tgname;
-- 7. Testar com dados fake que DELETE fisico falha.
-- 8. Testar com dados fake que empresa_id nao pode mudar apos INSERT.
-- 9. Testar com dados fake que funcionario_id de outra empresa e rejeitado.
-- 10. Validar com anon/auth que operador e gerente nao acessam.
-- 11. Validar com anon/auth que admin/master acessam somente empresas permitidas.

commit;
