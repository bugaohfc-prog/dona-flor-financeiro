-- Dona Flor Financeiro
-- Negative conference: expected result is zero rows.

select
  'unsafe_write_policy' as check_name,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'df_usuarios_empresas'
  and cmd in ('INSERT', 'UPDATE', 'DELETE')
  and (
    'public' = any (roles)
    or lower(coalesce(qual, '')) ~ '(^|[^a-z_])is_admin\s*\('
    or lower(coalesce(with_check, '')) ~ '(^|[^a-z_])is_admin\s*\('
    or lower(coalesce(qual, '')) like '%get_empresa_usuario%'
    or lower(coalesce(with_check, '')) like '%get_empresa_usuario%'
    or trim(lower(coalesce(qual, ''))) = 'true'
    or trim(lower(coalesce(with_check, ''))) = 'true'
    or (
      cmd = 'INSERT'
      and lower(coalesce(with_check, '')) not like '%df_usuario_alvo_eh_master%'
    )
    or (
      cmd = 'UPDATE'
      and (
        lower(coalesce(qual, '')) not like '%df_usuario_alvo_eh_master%'
        or lower(coalesce(with_check, '')) not like '%df_usuario_alvo_eh_master%'
      )
    )
    or (
      cmd = 'DELETE'
      and lower(coalesce(qual, '')) not like '%df_usuario_alvo_eh_master%'
    )
  )
order by cmd, policyname;
