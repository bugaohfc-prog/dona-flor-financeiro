select
  'public_tables_rls_disabled' as diagnostico,
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relrowsecurity = false
order by c.relname;

select
  'public_tables_rls_enabled_without_force' as diagnostico,
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relrowsecurity = true
  and c.relforcerowsecurity = false
order by c.relname;

select
  'policies_all' as diagnostico,
  schemaname as schema_name,
  tablename as table_name,
  policyname as policy_name,
  cmd as command,
  roles,
  permissive,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select
  'policies_potentially_dangerous' as diagnostico,
  schemaname as schema_name,
  tablename as table_name,
  policyname as policy_name,
  cmd as command,
  roles,
  permissive,
  qual as using_expression,
  with_check as with_check_expression,
  concat_ws(
    ', ',
    case when lower(coalesce(qual, '')) in ('true', '(true)') then 'using_true' end,
    case when lower(coalesce(with_check, '')) in ('true', '(true)') then 'with_check_true' end,
    case when cmd = 'ALL' then 'command_all' end,
    case when roles && array['public', 'anon']::name[] then 'public_or_anon_role' end,
    case
      when coalesce(qual, '') !~* 'auth\.uid|empresa_id|df_usuarios_empresas|df_usuarios|perfil|is_master|df_usuario|pode_escrever|tenant'
       and coalesce(with_check, '') !~* 'auth\.uid|empresa_id|df_usuarios_empresas|df_usuarios|perfil|is_master|df_usuario|pode_escrever|tenant'
      then 'sem_vinculo_tenant_aparente'
    end
  ) as flags
from pg_policies
where schemaname = 'public'
  and (
    lower(coalesce(qual, '')) in ('true', '(true)')
    or lower(coalesce(with_check, '')) in ('true', '(true)')
    or cmd = 'ALL'
    or roles && array['public', 'anon']::name[]
    or (
      coalesce(qual, '') !~* 'auth\.uid|empresa_id|df_usuarios_empresas|df_usuarios|perfil|is_master|df_usuario|pode_escrever|tenant'
      and coalesce(with_check, '') !~* 'auth\.uid|empresa_id|df_usuarios_empresas|df_usuarios|perfil|is_master|df_usuario|pode_escrever|tenant'
    )
  )
order by tablename, policyname;

select
  'table_grants_anon_authenticated' as diagnostico,
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
order by table_name, grantee, privilege_type;

select
  'security_definer_functions' as diagnostico,
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_userbyid(p.proowner) as owner_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  coalesce(array_to_string(p.proconfig, ', '), '') as function_config,
  left(pg_get_functiondef(p.oid), 1200) as definition_excerpt
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef = true
order by p.proname, arguments;

select
  'security_definer_execute_grants' as diagnostico,
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and grantee in ('PUBLIC', 'anon', 'authenticated')
order by routine_name, grantee, privilege_type;

select
  'critical_triggers' as diagnostico,
  event_object_schema as schema_name,
  event_object_table as table_name,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and (
    event_object_table ~* 'funcionario|folha|ferias|exame|auditoria|destinatario|contas|notas|usuario'
    or trigger_name ~* 'bloquear|auditoria|validar|recalcular|tenant|empresa'
  )
order by event_object_table, trigger_name, event_manipulation;

select
  'audit_log_tables_grants_risk' as diagnostico,
  t.table_schema,
  t.table_name,
  g.grantee,
  g.privilege_type
from information_schema.tables t
left join information_schema.role_table_grants g
  on g.table_schema = t.table_schema
 and g.table_name = t.table_name
 and g.grantee in ('anon', 'authenticated')
where t.table_schema = 'public'
  and t.table_name ~* 'audit|auditoria|log|logs'
order by t.table_name, g.grantee, g.privilege_type;

select
  'tenant_and_soft_delete_columns' as diagnostico,
  table_schema,
  table_name,
  string_agg(column_name, ', ' order by column_name) as matched_columns
from information_schema.columns
where table_schema = 'public'
  and column_name in (
    'empresa_id',
    'user_id',
    'excluido',
    'excluido_em',
    'arquivado',
    'arquivado_em',
    'deleted_at',
    'ativo'
  )
group by table_schema, table_name
order by table_name;

select
  'tables_without_tenant_hint' as diagnostico,
  t.table_schema,
  t.table_name
from information_schema.tables t
where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
  and not exists (
    select 1
    from information_schema.columns c
    where c.table_schema = t.table_schema
      and c.table_name = t.table_name
      and c.column_name in ('empresa_id', 'user_id')
  )
order by t.table_name;
