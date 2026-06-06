-- Diagnostico read-only para hardening da tabela legada public.contas.
-- Uso: executar antes e depois da migration.
-- Este arquivo contem somente consultas SELECT.

select
  'contas_table_state' as diagnostico,
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'contas'
  and c.relkind in ('r', 'p');

select
  'contas_columns' as diagnostico,
  ordinal_position,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'contas'
order by ordinal_position;

select
  'contas_summary' as diagnostico,
  count(*) as total_registros,
  count(*) filter (where empresa_id is null) as sem_empresa_id,
  count(distinct empresa_id) as empresas_distintas,
  min(created_at) as menor_created_at,
  max(created_at) as maior_created_at
from public.contas;

select
  'contas_policies' as diagnostico,
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
  and tablename = 'contas'
order by policyname;

select
  'contas_grants_anon_authenticated' as diagnostico,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'contas'
  and grantee in ('anon', 'authenticated', 'PUBLIC')
order by grantee, privilege_type;

select
  'contas_dangerous_policy_flags' as diagnostico,
  count(*) filter (where cmd = 'ALL') as policies_all,
  count(*) filter (where lower(coalesce(qual, '')) in ('true', '(true)')) as policies_using_true,
  count(*) filter (where lower(coalesce(with_check, '')) in ('true', '(true)')) as policies_with_check_true,
  count(*) filter (where roles && array['public', 'anon']::name[]) as policies_public_or_anon
from pg_policies
where schemaname = 'public'
  and tablename = 'contas';

select
  'contas_grant_flags' as diagnostico,
  count(*) filter (where grantee = 'anon') as anon_grants,
  count(*) filter (where grantee = 'authenticated') as authenticated_grants,
  count(*) filter (where privilege_type in ('DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')) as dangerous_grants
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'contas'
  and grantee in ('anon', 'authenticated');
