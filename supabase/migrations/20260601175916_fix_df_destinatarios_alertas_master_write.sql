-- =========================================================
-- DNA Gestao - E-mail/Notificacoes
-- Fix controlado de RLS para public.df_destinatarios_alertas
--
-- Objetivo:
-- - Corrigir reconhecimento de master nas policies de INSERT/UPDATE
--   de df_destinatarios_alertas sem alterar public.is_master().
-- - Manter operador sem acesso.
-- - Manter gerente somente leitura.
-- - Manter admin escrevendo na propria empresa.
-- - Manter DELETE fisico bloqueado.
-- - Manter empresa_id imutavel por trigger.
--
-- ATENCAO:
-- - SQL criado para revisao.
-- - Aplicar somente com rollback especifico pronto.
-- =========================================================

begin;

do $$
declare
  missing_policies text;
  unsafe_policies text;
begin
  if to_regclass('public.df_destinatarios_alertas') is null then
    raise exception 'Missing table public.df_destinatarios_alertas';
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
      ('df_destinatarios_alertas_select_empresa'),
      ('df_destinatarios_alertas_insert_admin_master'),
      ('df_destinatarios_alertas_update_admin_master')
  ) as expected(policy_name)
  where not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'df_destinatarios_alertas'
      and p.policyname = expected.policy_name
  );

  if missing_policies is not null then
    raise exception 'Missing expected df_destinatarios_alertas policies: %', missing_policies;
  end if;

  select string_agg(policyname || ':' || cmd, ', ' order by policyname)
  into unsafe_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'df_destinatarios_alertas'
    and cmd in ('DELETE', 'ALL');

  if unsafe_policies is not null then
    raise exception 'Unexpected DELETE/ALL policies on df_destinatarios_alertas: %', unsafe_policies;
  end if;
end $$;

drop policy if exists "df_destinatarios_alertas_insert_admin_master" on public.df_destinatarios_alertas;
drop policy if exists "df_destinatarios_alertas_update_admin_master" on public.df_destinatarios_alertas;

create policy "df_destinatarios_alertas_insert_admin_master"
on public.df_destinatarios_alertas
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

create policy "df_destinatarios_alertas_update_admin_master"
on public.df_destinatarios_alertas
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
  extra_grants text;
begin
  select string_agg(policyname || ':' || cmd, ', ' order by policyname)
  into unsafe_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'df_destinatarios_alertas'
    and cmd in ('DELETE', 'ALL');

  if unsafe_policies is not null then
    raise exception 'Unexpected DELETE/ALL policies on df_destinatarios_alertas after fix: %', unsafe_policies;
  end if;

  select string_agg(privilege_type, ', ' order by privilege_type)
  into extra_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'df_destinatarios_alertas'
    and grantee = 'authenticated'
    and privilege_type in ('DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER');

  if extra_grants is not null then
    raise exception 'Unexpected authenticated grants on df_destinatarios_alertas after fix: %', extra_grants;
  end if;
end $$;

-- Policies alteradas por este fix:
-- - df_destinatarios_alertas_insert_admin_master
-- - df_destinatarios_alertas_update_admin_master
--
-- Policy preservada:
-- - df_destinatarios_alertas_select_empresa
--
-- Matriz preservada:
-- - operador: sem acesso;
-- - gerente: SELECT apenas;
-- - admin: INSERT/UPDATE por public.df_usuario_eh_admin(empresa_id);
-- - master: INSERT/UPDATE por public.is_master() ou vinculo master/owner/superadmin na empresa;
-- - DELETE: sem policy, sem grant e bloqueado por trigger.

commit;;
