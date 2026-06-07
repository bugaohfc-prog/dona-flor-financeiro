-- Diagnostico read-only do hardening controlado de public.df_notas.
-- Este arquivo contem somente SELECTs.

select 'df_notas_table_state' as diagnostico,
       n.nspname as schema_name,
       c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'df_notas';

select 'df_notas_counts' as diagnostico,
       count(*)::bigint as total_registros,
       count(*) filter (where empresa_id is null)::bigint as sem_empresa_id,
       count(*) filter (where coalesce(excluido, false))::bigint as excluidas,
       count(distinct empresa_id)::bigint as empresas_distintas
from public.df_notas;

select 'df_notas_columns' as diagnostico,
       ordinal_position,
       column_name,
       data_type,
       is_nullable,
       column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'df_notas'
order by ordinal_position;

select 'df_notas_policies' as diagnostico,
       policyname,
       cmd,
       roles,
       permissive,
       qual,
       with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'df_notas'
order by policyname;

select 'df_notas_grants' as diagnostico,
       grantee,
       privilege_type,
       is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'df_notas'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

select 'df_notas_triggers' as diagnostico,
       trigger_name,
       event_manipulation,
       action_timing,
       action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'df_notas'
order by trigger_name, event_manipulation;

select 'df_notas_access_flags' as diagnostico,
       has_table_privilege('anon', 'public.df_notas', 'SELECT') as anon_select,
       has_table_privilege('anon', 'public.df_notas', 'INSERT') as anon_insert,
       has_table_privilege('anon', 'public.df_notas', 'UPDATE') as anon_update,
       has_table_privilege('anon', 'public.df_notas', 'DELETE') as anon_delete,
       has_table_privilege('authenticated', 'public.df_notas', 'SELECT') as authenticated_select,
       has_table_privilege('authenticated', 'public.df_notas', 'INSERT') as authenticated_insert,
       has_table_privilege('authenticated', 'public.df_notas', 'UPDATE') as authenticated_update,
       has_table_privilege('authenticated', 'public.df_notas', 'DELETE') as authenticated_delete,
       has_table_privilege('authenticated', 'public.df_notas', 'TRUNCATE') as authenticated_truncate,
       has_table_privilege('authenticated', 'public.df_notas', 'REFERENCES') as authenticated_references,
       has_table_privilege('authenticated', 'public.df_notas', 'TRIGGER') as authenticated_trigger;

select 'df_notas_risk_flags' as diagnostico,
       count(*) filter (where cmd = 'ALL') as policies_all,
       count(*) filter (where 'public' = any(roles) or 'anon' = any(roles)) as policies_public_or_anon,
       count(*) filter (where cmd = 'DELETE') as policies_delete,
       count(*) filter (where qual = 'true') as policies_using_true,
       count(*) filter (where with_check = 'true') as policies_with_check_true
from pg_policies
where schemaname = 'public'
  and tablename = 'df_notas';
