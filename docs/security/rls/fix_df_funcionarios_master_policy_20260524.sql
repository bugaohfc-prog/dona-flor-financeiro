-- =========================================================
-- DNA Gestao - Mini RH
-- Fix controlado de RLS para public.df_funcionarios
--
-- Objetivo:
-- - Corrigir reconhecimento de master nas policies de INSERT/UPDATE
--   de df_funcionarios sem alterar public.is_master().
-- - Manter operador sem acesso.
-- - Manter gerente somente leitura.
-- - Manter DELETE fisico bloqueado.
-- - Manter triggers de empresa_id imutavel e filial cross-tenant.
--
-- ATENCAO:
-- - SQL criado para revisao.
-- - Nao aplicar automaticamente.
-- - Aplicar somente com rollback especifico pronto.
-- =========================================================

begin;

do $$
declare
  missing_policies text;
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

  if to_regprocedure('public.df_usuario_tem_perfil_empresa(uuid,text[])') is null then
    raise exception 'Missing helper public.df_usuario_tem_perfil_empresa(uuid,text[])';
  end if;

  select string_agg(policy_name, ', ' order by policy_name)
  into missing_policies
  from (
    values
      ('df_funcionarios_select_rh_inicial'),
      ('df_funcionarios_insert_admin_master'),
      ('df_funcionarios_update_admin_master')
  ) as expected(policy_name)
  where not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'df_funcionarios'
      and p.policyname = expected.policy_name
  );

  if missing_policies is not null then
    raise exception 'Missing expected df_funcionarios policies: %', missing_policies;
  end if;

  select string_agg(policyname || ':' || cmd, ', ' order by policyname)
  into unsafe_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'df_funcionarios'
    and cmd in ('DELETE', 'ALL');

  if unsafe_policies is not null then
    raise exception 'Unexpected DELETE/ALL policies on df_funcionarios: %', unsafe_policies;
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
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['master', 'owner', 'superadmin', 'super_admin']::text[]
    )
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
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['master', 'owner', 'superadmin', 'super_admin']::text[]
    )
  )
)
with check (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['master', 'owner', 'superadmin', 'super_admin']::text[]
    )
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
    raise exception 'Unexpected DELETE/ALL policies on df_funcionarios after fix: %', unsafe_policies;
  end if;
end $$;

-- Policies alteradas por este fix:
-- - df_funcionarios_insert_admin_master
-- - df_funcionarios_update_admin_master
--
-- Policy preservada:
-- - df_funcionarios_select_rh_inicial
--
-- Matriz preservada:
-- - operador: sem acesso;
-- - gerente: SELECT apenas;
-- - admin: INSERT/UPDATE por public.df_usuario_eh_admin(empresa_id);
-- - master: INSERT/UPDATE por public.is_master() ou vinculo master/owner/superadmin na empresa;
-- - DELETE: sem policy e bloqueado por trigger.

commit;
