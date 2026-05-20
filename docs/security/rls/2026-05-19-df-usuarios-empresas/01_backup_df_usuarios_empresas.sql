-- Dona Flor Financeiro
-- Backup pre-migration: df_usuarios_empresas RLS only
-- Run before applying the cleanup migration and save/export the results.

select
  now() as captured_at,
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
  and tablename = 'df_usuarios_empresas'
order by cmd, policyname;

select
  now() as captured_at,
  p.oid::regprocedure as function_signature,
  p.prosecdef as security_definer,
  p.proconfig as config,
  pg_get_functiondef(p.oid) as function_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'is_master',
    'df_usuario_eh_admin',
    'df_usuario_alvo_eh_master'
  )
order by p.proname;
