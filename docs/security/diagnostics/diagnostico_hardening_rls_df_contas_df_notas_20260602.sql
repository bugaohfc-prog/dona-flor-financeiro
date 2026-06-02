-- =========================================================
-- DNA Gestao - Diagnostico pos-hardening RLS legado
-- Tabelas: public.df_contas e public.df_notas
--
-- Uso:
-- - Rodar manualmente no Supabase apos aplicar a migration.
-- - Este arquivo apenas consulta metadados; nao altera dados.
-- =========================================================

-- 1. Projeto/tabelas alvo.
select
  to_regclass('public.df_contas') as tabela_contas,
  to_regclass('public.df_notas') as tabela_notas,
  to_regclass('public.df_usuarios_empresas') as tabela_usuarios_empresas;

-- 2. RLS. Esperado: enabled=true; forced=false neste ciclo.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('df_contas', 'df_notas')
order by c.relname;

-- 3. Policies atuais.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('df_contas', 'df_notas')
order by tablename, policyname;

-- 4. Policies inseguras. Esperado: zero linhas.
select
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename in ('df_contas', 'df_notas')
  and cmd = 'ALL'
order by tablename, policyname;

-- 4.1. Policies DELETE. Esperado: apenas df_contas_delete_admin_master e df_notas_delete_admin_master.
select
  tablename,
  policyname,
  cmd,
  roles,
  qual
from pg_policies
where schemaname = 'public'
  and tablename in ('df_contas', 'df_notas')
  and cmd = 'DELETE'
order by tablename, policyname;

-- 5. Grants de anon/authenticated.
select
  table_schema,
  table_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('df_contas', 'df_notas')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- 6. Grants inseguros. Esperado: zero linhas.
select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('df_contas', 'df_notas')
  and grantee in ('anon', 'authenticated')
  and (
    grantee = 'anon'
    or privilege_type not in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
  )
order by table_name, grantee, privilege_type;

-- 7. Colunas de tenant e lixeira.
select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('df_contas', 'df_notas')
  and column_name in ('id', 'empresa_id', 'user_id', 'excluido', 'excluido_em')
order by table_name, ordinal_position;

-- 8. Linhas com empresa_id nulo. Esperado ideal: zero; se houver, avaliar antes de FORCE RLS/NOT NULL.
select 'df_contas' as table_name, count(*) as rows_empresa_id_null
from public.df_contas
where empresa_id is null
union all
select 'df_notas' as table_name, count(*) as rows_empresa_id_null
from public.df_notas
where empresa_id is null;

-- 9. Triggers de auditoria preservados.
select
  event_object_table,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('df_contas', 'df_notas')
  and trigger_name in (
    'trg_df_contas_auditoria_lixeira',
    'trg_df_notas_auditoria_lixeira'
  )
order by event_object_table, trigger_name, event_manipulation;

-- 10. Triggers esperados ausentes. Esperado: zero linhas.
select *
from (
  values
    ('df_contas', 'trg_df_contas_auditoria_lixeira'),
    ('df_notas', 'trg_df_notas_auditoria_lixeira')
) as expected(table_name, trigger_name)
where not exists (
  select 1
  from information_schema.triggers t
  where t.event_object_schema = 'public'
    and t.event_object_table = expected.table_name
    and t.trigger_name = expected.trigger_name
);

-- 11. Helpers exigidos pelas policies.
select
  to_regprocedure('public.is_master()') as helper_is_master,
  to_regprocedure('public.df_usuario_eh_admin(uuid)') as helper_admin,
  to_regprocedure('public.df_usuario_tem_perfil_empresa(uuid,text[])') as helper_perfil_empresa;

-- 12. Diagnostico de policies sem mencao textual a empresa_id.
-- Esperado: zero linhas para policies novas.
select
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('df_contas', 'df_notas')
  and coalesce(qual, '') !~ 'empresa_id'
  and coalesce(with_check, '') !~ 'empresa_id'
order by tablename, policyname;
