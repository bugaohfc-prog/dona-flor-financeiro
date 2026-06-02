-- =========================================================
-- DNA Gestao - Hardening RLS legado
-- Tabelas: public.df_contas e public.df_notas
--
-- ATENCAO:
-- - SQL criado para revisao e aplicacao controlada futura.
-- - Nao aplicar sem validar em ciclo proprio.
-- - Nao altera frontend, services, hooks, GitHub Actions ou scripts.
-- - Nao torna empresa_id NOT NULL neste ciclo.
-- - Nao ativa FORCE RLS neste ciclo; impacto deve ser validado antes.
-- - Preserva triggers de auditoria da Lixeira.
-- - Preserva DELETE fisico apenas para Admin/Master, pois a UI atual ainda oferece exclusao definitiva.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_contas') is null then
    raise exception 'Missing table public.df_contas';
  end if;

  if to_regclass('public.df_notas') is null then
    raise exception 'Missing table public.df_notas';
  end if;

  if to_regclass('public.df_usuarios_empresas') is null then
    raise exception 'Missing table public.df_usuarios_empresas';
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

  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'df_contas'
      and t.tgname = 'trg_df_contas_auditoria_lixeira'
      and not t.tgisinternal
  ) then
    raise exception 'Missing trigger public.trg_df_contas_auditoria_lixeira';
  end if;

  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'df_notas'
      and t.tgname = 'trg_df_notas_auditoria_lixeira'
      and not t.tgisinternal
  ) then
    raise exception 'Missing trigger public.trg_df_notas_auditoria_lixeira';
  end if;
end $$;

alter table public.df_contas enable row level security;
alter table public.df_notas enable row level security;

-- FORCE RLS fica fora deste hardening inicial para reduzir risco de quebra
-- por owner/rotinas privilegiadas. Avaliar em ciclo proprio apos validacao real.
alter table public.df_contas no force row level security;
alter table public.df_notas no force row level security;

revoke all on public.df_contas from public;
revoke all on public.df_contas from anon;
revoke all on public.df_contas from authenticated;

revoke all on public.df_notas from public;
revoke all on public.df_notas from anon;
revoke all on public.df_notas from authenticated;

grant select, insert, update, delete on public.df_contas to authenticated;
grant select, insert, update, delete on public.df_notas to authenticated;

-- Remove policies legadas/amplas diagnosticadas.
drop policy if exists "Contas por empresa" on public.df_contas;
drop policy if exists "contas_insert_own" on public.df_contas;
drop policy if exists "contas_select_own" on public.df_contas;
drop policy if exists "contas_update_own" on public.df_contas;
drop policy if exists "df_contas_tenant_delete" on public.df_contas;
drop policy if exists "df_contas_tenant_insert" on public.df_contas;
drop policy if exists "df_contas_tenant_select" on public.df_contas;
drop policy if exists "df_contas_tenant_update" on public.df_contas;

drop policy if exists "Notas por empresa" on public.df_notas;
drop policy if exists "notas_insert_own" on public.df_notas;
drop policy if exists "notas_select_own" on public.df_notas;
drop policy if exists "notas_update_own" on public.df_notas;
drop policy if exists "df_notas_delete_tenant_saneado" on public.df_notas;
drop policy if exists "df_notas_insert_tenant_saneado" on public.df_notas;
drop policy if exists "df_notas_select_tenant_saneado" on public.df_notas;
drop policy if exists "df_notas_update_tenant_saneado" on public.df_notas;
drop policy if exists "df_notas_tenant_delete" on public.df_notas;
drop policy if exists "df_notas_tenant_insert" on public.df_notas;
drop policy if exists "df_notas_tenant_select" on public.df_notas;
drop policy if exists "df_notas_tenant_update" on public.df_notas;

create policy "df_contas_select_empresa"
on public.df_contas
for select
to authenticated
using (
  auth.uid() is not null
  and empresa_id is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['master', 'owner', 'superadmin', 'super_admin']::text[]
    )
    or exists (
      select 1
      from public.df_usuarios_empresas ue
      where ue.empresa_id = df_contas.empresa_id
        and coalesce(df_contas.excluido, false) = false
        and (
          ue.user_id = auth.uid()
          or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  )
);

create policy "df_contas_insert_empresa_operacional"
on public.df_contas
for insert
to authenticated
with check (
  auth.uid() is not null
  and empresa_id is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['gerente', 'master', 'owner', 'superadmin', 'super_admin']::text[]
    )
  )
);

create policy "df_contas_update_empresa_operacional"
on public.df_contas
for update
to authenticated
using (
  auth.uid() is not null
  and empresa_id is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['gerente', 'master', 'owner', 'superadmin', 'super_admin']::text[]
    )
  )
)
with check (
  auth.uid() is not null
  and empresa_id is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['gerente', 'master', 'owner', 'superadmin', 'super_admin']::text[]
    )
  )
);

create policy "df_contas_delete_admin_master"
on public.df_contas
for delete
to authenticated
using (
  auth.uid() is not null
  and empresa_id is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['master', 'owner', 'superadmin', 'super_admin']::text[]
    )
  )
);

create policy "df_notas_select_empresa"
on public.df_notas
for select
to authenticated
using (
  auth.uid() is not null
  and empresa_id is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['master', 'owner', 'superadmin', 'super_admin']::text[]
    )
    or exists (
      select 1
      from public.df_usuarios_empresas ue
      where ue.empresa_id = df_notas.empresa_id
        and coalesce(df_notas.excluido, false) = false
        and (
          ue.user_id = auth.uid()
          or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  )
);

create policy "df_notas_insert_empresa_operacional"
on public.df_notas
for insert
to authenticated
with check (
  auth.uid() is not null
  and empresa_id is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['gerente', 'master', 'owner', 'superadmin', 'super_admin']::text[]
    )
  )
);

create policy "df_notas_update_empresa_operacional"
on public.df_notas
for update
to authenticated
using (
  auth.uid() is not null
  and empresa_id is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['gerente', 'master', 'owner', 'superadmin', 'super_admin']::text[]
    )
  )
)
with check (
  auth.uid() is not null
  and empresa_id is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['gerente', 'master', 'owner', 'superadmin', 'super_admin']::text[]
    )
  )
);

create policy "df_notas_delete_admin_master"
on public.df_notas
for delete
to authenticated
using (
  auth.uid() is not null
  and empresa_id is not null
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
  unsafe_grants text;
  missing_triggers text;
begin
  select string_agg(tablename || ':' || policyname || ':' || cmd, ', ' order by tablename, policyname)
  into unsafe_policies
  from pg_policies
  where schemaname = 'public'
    and tablename in ('df_contas', 'df_notas')
    and cmd = 'ALL';

  if unsafe_policies is not null then
    raise exception 'Unexpected ALL/DELETE policies after hardening: %', unsafe_policies;
  end if;

  select string_agg(table_name || ':' || grantee || ':' || privilege_type, ', ' order by table_name, grantee, privilege_type)
  into unsafe_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in ('df_contas', 'df_notas')
    and grantee in ('anon', 'authenticated')
    and (
      grantee = 'anon'
      or privilege_type not in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    );

  if unsafe_grants is not null then
    raise exception 'Unexpected grants after hardening: %', unsafe_grants;
  end if;

  select string_agg(expected.trigger_name, ', ' order by expected.trigger_name)
  into missing_triggers
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

  if missing_triggers is not null then
    raise exception 'Missing audit triggers after hardening: %', missing_triggers;
  end if;
end $$;

-- Matriz proposta:
-- - anon: sem grants.
-- - operador: SELECT somente de registros ativos da propria empresa; INSERT/UPDATE/DELETE bloqueados por RLS.
-- - gerente: SELECT somente de registros ativos, INSERT/UPDATE na propria empresa, sem DELETE fisico.
-- - admin/master: SELECT incluindo Lixeira, INSERT/UPDATE/DELETE na propria empresa.
-- - DELETE fisico: restrito a Admin/Master e auditado por trigger AFTER DELETE.
-- - Lixeira logica: preservada via UPDATE de excluido/excluido_em.
-- - Auditoria: triggers de UPDATE/DELETE preservados.

commit;
