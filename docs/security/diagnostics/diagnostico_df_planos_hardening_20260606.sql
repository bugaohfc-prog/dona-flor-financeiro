-- Diagnostico read-only para hardening da tabela public.df_planos.
-- Uso: executar antes e depois da migration.
-- Este arquivo contem somente consultas SELECT.

select
  'df_planos_table_state' as diagnostico,
  n.nspname as schema_name,
  c.relname as table_name,
  c.relkind,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'df_planos';

select
  'df_planos_columns' as diagnostico,
  ordinal_position,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'df_planos'
order by ordinal_position;

select
  'df_planos_summary' as diagnostico,
  count(*) as total_registros,
  count(*) filter (where ativo = true) as ativos
from public.df_planos;

select
  'df_planos_read_sample' as diagnostico,
  id,
  nome,
  slug,
  limite_filiais,
  limite_usuarios,
  preco_mensal,
  ativo
from public.df_planos
where ativo = true
order by preco_mensal;

select
  'df_planos_policies' as diagnostico,
  schemaname as schema_name,
  tablename as table_name,
  policyname as policy_name,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname = 'public'
  and tablename = 'df_planos'
order by policyname;

select
  'df_planos_grants_anon_authenticated' as diagnostico,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'df_planos'
  and grantee in ('anon', 'authenticated', 'PUBLIC')
order by grantee, privilege_type;

select
  'df_planos_access_flags' as diagnostico,
  has_table_privilege('anon', 'public.df_planos', 'SELECT') as anon_select,
  has_table_privilege('anon', 'public.df_planos', 'INSERT') as anon_insert,
  has_table_privilege('anon', 'public.df_planos', 'UPDATE') as anon_update,
  has_table_privilege('anon', 'public.df_planos', 'DELETE') as anon_delete,
  has_table_privilege('anon', 'public.df_planos', 'TRUNCATE') as anon_truncate,
  has_table_privilege('anon', 'public.df_planos', 'REFERENCES') as anon_references,
  has_table_privilege('anon', 'public.df_planos', 'TRIGGER') as anon_trigger,
  has_table_privilege('authenticated', 'public.df_planos', 'SELECT') as authenticated_select,
  has_table_privilege('authenticated', 'public.df_planos', 'INSERT') as authenticated_insert,
  has_table_privilege('authenticated', 'public.df_planos', 'UPDATE') as authenticated_update,
  has_table_privilege('authenticated', 'public.df_planos', 'DELETE') as authenticated_delete,
  has_table_privilege('authenticated', 'public.df_planos', 'TRUNCATE') as authenticated_truncate,
  has_table_privilege('authenticated', 'public.df_planos', 'REFERENCES') as authenticated_references,
  has_table_privilege('authenticated', 'public.df_planos', 'TRIGGER') as authenticated_trigger;

select
  'df_planos_dangerous_flags' as diagnostico,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_planos'
      and cmd = 'ALL'
  ) as policies_all,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_planos'
      and cmd = 'DELETE'
  ) as policies_delete,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_planos'
      and roles && array['public', 'anon']::name[]
  ) as policies_public_or_anon,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_planos'
      and lower(coalesce(qual, '')) in ('true', '(true)')
  ) as policies_using_true,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_planos'
      and lower(coalesce(with_check, '')) in ('true', '(true)')
  ) as policies_with_check_true,
  (
    select count(*)
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'df_planos'
      and grantee in ('anon', 'authenticated')
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
  ) as dangerous_grants;
