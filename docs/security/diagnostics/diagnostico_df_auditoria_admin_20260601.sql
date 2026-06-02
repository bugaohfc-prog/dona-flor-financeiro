-- =========================================================
-- DNA Gestao - Auditoria administrativa invisivel
-- Diagnostico estrutural: df_auditoria_admin
--
-- Uso:
-- - Rodar manualmente no Supabase apos aplicar a migration.
-- - Este arquivo apenas consulta metadados; nao altera dados.
-- =========================================================

-- 1. Tabela existe.
select
  to_regclass('public.df_auditoria_admin') as tabela_auditoria_admin;

-- 2. Colunas esperadas.
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'df_auditoria_admin'
order by ordinal_position;

-- 3. RLS habilitada e forcada.
select
  relname,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
from pg_class
where oid = 'public.df_auditoria_admin'::regclass;

-- 4. Policies existentes. Esperado: somente SELECT admin/master.
select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'df_auditoria_admin'
order by policyname;

-- Resultado esperado: zero linhas.
select
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'df_auditoria_admin'
  and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE');

-- 5. Grants. Esperado: authenticated apenas SELECT; anon sem acesso.
select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'df_auditoria_admin'
order by grantee, privilege_type;

-- 6. Triggers de imutabilidade na tabela de auditoria.
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'df_auditoria_admin'
order by trigger_name, event_manipulation;

-- 7. Trigger de auditoria em destinatarios de alertas.
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'df_destinatarios_alertas'
  and trigger_name = 'trg_df_destinatarios_alertas_auditoria_admin'
order by trigger_name, event_manipulation;

-- 8. Indices esperados.
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'df_auditoria_admin'
order by indexname;

-- 9. Conferencia de dados sensiveis em detalhes.
-- Resultado esperado em amostra real: detalhes com booleans e hashes,
-- sem e-mail em texto claro, CPF, salario, laudos, anexos ou conteudo completo.
select
  acao,
  recurso,
  registro_id,
  origem,
  detalhes
from public.df_auditoria_admin
order by criado_em desc
limit 20;
