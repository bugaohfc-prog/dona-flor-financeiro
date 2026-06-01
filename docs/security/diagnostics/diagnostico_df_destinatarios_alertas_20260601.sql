-- =========================================================
-- DNA Gestao - E-mail/Notificacoes
-- Diagnostico estrutural pos-migration: df_destinatarios_alertas
--
-- Uso:
-- - Rodar manualmente no Supabase apos aplicar a migration.
-- - Este arquivo apenas consulta metadados; nao altera dados.
-- =========================================================

-- 1. Tabela existe.
select
  to_regclass('public.df_destinatarios_alertas') as tabela_destinatarios_alertas;

-- 2. Colunas esperadas.
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'df_destinatarios_alertas'
order by ordinal_position;

-- 3. RLS habilitada e forcada.
select
  relname,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
from pg_class
where oid = 'public.df_destinatarios_alertas'::regclass;

-- 4. Policies esperadas, sem policy ALL e sem DELETE.
select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'df_destinatarios_alertas'
order by policyname;

-- Resultado esperado: zero linhas.
select
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'df_destinatarios_alertas'
  and cmd in ('ALL', 'DELETE');

-- 5. Grants esperados.
select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'df_destinatarios_alertas'
order by grantee, privilege_type;

-- 6. Triggers de seguranca/operacao.
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'df_destinatarios_alertas'
order by trigger_name, event_manipulation;

-- 7. Indices esperados.
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'df_destinatarios_alertas'
order by indexname;
