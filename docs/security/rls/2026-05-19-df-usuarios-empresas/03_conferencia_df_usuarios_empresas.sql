-- Dona Flor Financeiro
-- Post-migration conference: df_usuarios_empresas RLS only
-- Expected for write policies: only the three *_saneado INSERT/UPDATE/DELETE policies.

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
  and tablename = 'df_usuarios_empresas'
order by cmd, policyname;

select
  cmd,
  count(*) as policies_count,
  string_agg(policyname, ', ' order by policyname) as policies
from pg_policies
where schemaname = 'public'
  and tablename = 'df_usuarios_empresas'
group by cmd
order by cmd;
