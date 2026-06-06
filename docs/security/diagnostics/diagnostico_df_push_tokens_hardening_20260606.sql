-- Diagnostico read-only para hardening da tabela public.df_push_tokens.
-- Uso: executar antes e depois da migration.
-- Este arquivo contem somente consultas SELECT.

select
  'df_push_tokens_table_state' as diagnostico,
  n.nspname as schema_name,
  c.relname as table_name,
  c.relkind,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'df_push_tokens';

select
  'df_push_tokens_columns' as diagnostico,
  ordinal_position,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'df_push_tokens'
order by ordinal_position;

select
  'df_push_tokens_summary' as diagnostico,
  count(*) as total_registros,
  count(*) filter (where token is null) as sem_token,
  count(distinct user_id) as usuarios_distintos,
  min(created_at) as menor_created_at,
  max(created_at) as maior_created_at
from public.df_push_tokens;

select
  'df_push_tokens_policies' as diagnostico,
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
  and tablename = 'df_push_tokens'
order by policyname;

select
  'df_push_tokens_grants_anon_authenticated' as diagnostico,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'df_push_tokens'
  and grantee in ('anon', 'authenticated', 'PUBLIC')
order by grantee, privilege_type;

select
  'df_push_tokens_access_flags' as diagnostico,
  has_table_privilege('anon', 'public.df_push_tokens', 'SELECT') as anon_select,
  has_table_privilege('anon', 'public.df_push_tokens', 'INSERT') as anon_insert,
  has_table_privilege('anon', 'public.df_push_tokens', 'UPDATE') as anon_update,
  has_table_privilege('anon', 'public.df_push_tokens', 'DELETE') as anon_delete,
  has_table_privilege('authenticated', 'public.df_push_tokens', 'SELECT') as authenticated_select,
  has_table_privilege('authenticated', 'public.df_push_tokens', 'INSERT') as authenticated_insert,
  has_table_privilege('authenticated', 'public.df_push_tokens', 'UPDATE') as authenticated_update,
  has_table_privilege('authenticated', 'public.df_push_tokens', 'DELETE') as authenticated_delete,
  has_table_privilege('authenticated', 'public.df_push_tokens', 'TRUNCATE') as authenticated_truncate,
  has_table_privilege('authenticated', 'public.df_push_tokens', 'TRIGGER') as authenticated_trigger;

select
  'df_push_tokens_dangerous_flags' as diagnostico,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_push_tokens'
      and cmd = 'ALL'
  ) as policies_all,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_push_tokens'
      and cmd = 'DELETE'
  ) as policies_delete,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_push_tokens'
      and roles && array['public', 'anon']::name[]
  ) as policies_public_or_anon,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_push_tokens'
      and lower(coalesce(qual, '')) in ('true', '(true)')
  ) as policies_using_true,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_push_tokens'
      and lower(coalesce(with_check, '')) in ('true', '(true)')
  ) as policies_with_check_true,
  (
    select count(*)
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'df_push_tokens'
      and grantee in ('anon', 'authenticated')
  ) as grants_anon_authenticated,
  (
    select count(*)
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'df_push_tokens'
      and grantee in ('anon', 'authenticated')
      and privilege_type in ('DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
  ) as dangerous_grants;
