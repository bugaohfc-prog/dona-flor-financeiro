-- =========================================================
-- DNA Gestao - Mini RH
-- Rollback especifico do fix:
-- docs/security/rls/fix_df_funcionarios_master_policy_20260524.sql
--
-- Objetivo:
-- - Restaurar somente as policies INSERT/UPDATE de df_funcionarios
--   para o estado anterior ao fix de reconhecimento de master.
--
-- ATENCAO:
-- - Este rollback NAO remove a tabela df_funcionarios.
-- - Este rollback NAO altera triggers.
-- - Este rollback NAO mexe em SELECT.
-- - Este rollback NAO executa rollback completo da migration.
-- =========================================================

begin;

do $$
declare
  unsafe_policies text;
begin
  if to_regclass('public.df_funcionarios') is null then
    raise exception 'Missing table public.df_funcionarios';
  end if;

  if to_regprocedure('public.is_master()') is null then
    raise exception 'Missing helper public.is_master()';
  end if;

  if to_regprocedure('public.df_usuario_eh_admin(uuid)') is null then
    raise exception 'Missing helper public.df_usuario_eh_admin(uuid)';
  end if;

  select string_agg(policyname || ':' || cmd, ', ' order by policyname)
  into unsafe_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'df_funcionarios'
    and cmd in ('DELETE', 'ALL');

  if unsafe_policies is not null then
    raise exception 'Unexpected DELETE/ALL policies on df_funcionarios before rollback: %', unsafe_policies;
  end if;
end $$;

drop policy if exists "df_funcionarios_insert_admin_master" on public.df_funcionarios;
drop policy if exists "df_funcionarios_update_admin_master" on public.df_funcionarios;

create policy "df_funcionarios_insert_admin_master"
on public.df_funcionarios
for insert
to authenticated
with check (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
  )
);

create policy "df_funcionarios_update_admin_master"
on public.df_funcionarios
for update
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
  )
)
with check (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
  )
);

do $$
declare
  unsafe_policies text;
begin
  select string_agg(policyname || ':' || cmd, ', ' order by policyname)
  into unsafe_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'df_funcionarios'
    and cmd in ('DELETE', 'ALL');

  if unsafe_policies is not null then
    raise exception 'Unexpected DELETE/ALL policies on df_funcionarios after rollback: %', unsafe_policies;
  end if;
end $$;

-- Policies restauradas por este rollback especifico:
-- - df_funcionarios_insert_admin_master
-- - df_funcionarios_update_admin_master
--
-- Objetos preservados:
-- - public.df_funcionarios;
-- - public.df_funcionarios_validar_filial_empresa();
-- - public.df_funcionarios_bloquear_alteracao_empresa();
-- - public.df_funcionarios_bloquear_delete();
-- - public.df_funcionarios_set_timestamps();
-- - df_funcionarios_select_rh_inicial.

commit;
