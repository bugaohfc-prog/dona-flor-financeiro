-- =========================================================
-- DNA Gestao - Rollback do hardening RLS legado
-- Tabelas: public.df_contas e public.df_notas
-- Migration:
-- supabase/migrations/20260602170000_hardening_rls_df_contas_df_notas.sql
--
-- ATENCAO:
-- - Restaura o estado legado diagnosticado em 2026-06-02.
-- - Reintroduz grants amplos, policies ALL/DELETE e policies por user_id.
-- - Usar somente se a migration de hardening quebrar fluxo critico.
-- - Nao remove triggers de auditoria da Lixeira.
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
end $$;

alter table public.df_contas enable row level security;
alter table public.df_notas enable row level security;
alter table public.df_contas no force row level security;
alter table public.df_notas no force row level security;

drop policy if exists "df_contas_select_empresa" on public.df_contas;
drop policy if exists "df_contas_insert_empresa_operacional" on public.df_contas;
drop policy if exists "df_contas_update_empresa_operacional" on public.df_contas;
drop policy if exists "df_contas_delete_admin_master" on public.df_contas;
drop policy if exists "Contas por empresa" on public.df_contas;
drop policy if exists "contas_insert_own" on public.df_contas;
drop policy if exists "contas_select_own" on public.df_contas;
drop policy if exists "contas_update_own" on public.df_contas;
drop policy if exists "df_contas_tenant_delete" on public.df_contas;
drop policy if exists "df_contas_tenant_insert" on public.df_contas;
drop policy if exists "df_contas_tenant_select" on public.df_contas;
drop policy if exists "df_contas_tenant_update" on public.df_contas;

drop policy if exists "df_notas_select_empresa" on public.df_notas;
drop policy if exists "df_notas_insert_empresa_operacional" on public.df_notas;
drop policy if exists "df_notas_update_empresa_operacional" on public.df_notas;
drop policy if exists "df_notas_delete_admin_master" on public.df_notas;
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

grant select, insert, update, delete, truncate, references, trigger on public.df_contas to anon;
grant select, insert, update, delete, truncate, references, trigger on public.df_contas to authenticated;
grant select, insert, update, delete, truncate, references, trigger on public.df_notas to anon;
grant select, insert, update, delete, truncate, references, trigger on public.df_notas to authenticated;

create policy "Contas por empresa"
on public.df_contas
for all
to public
using (
  empresa_id in (
    select df_usuarios_empresas.empresa_id
    from public.df_usuarios_empresas
    where df_usuarios_empresas.user_id = auth.uid()
  )
);

create policy "contas_select_own"
on public.df_contas
for select
to public
using (auth.uid() = user_id);

create policy "contas_insert_own"
on public.df_contas
for insert
to public
with check (auth.uid() = user_id);

create policy "contas_update_own"
on public.df_contas
for update
to public
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "df_contas_tenant_select"
on public.df_contas
for select
to public
using (
  exists (
    select 1
    from public.df_usuarios_empresas u
    where u.empresa_id = df_contas.empresa_id
      and u.user_id = auth.uid()
  )
);

create policy "df_contas_tenant_insert"
on public.df_contas
for insert
to public
with check (
  exists (
    select 1
    from public.df_usuarios_empresas u
    where u.empresa_id = df_contas.empresa_id
      and u.user_id = auth.uid()
  )
);

create policy "df_contas_tenant_update"
on public.df_contas
for update
to public
using (
  exists (
    select 1
    from public.df_usuarios_empresas u
    where u.empresa_id = df_contas.empresa_id
      and u.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.df_usuarios_empresas u
    where u.empresa_id = df_contas.empresa_id
      and u.user_id = auth.uid()
  )
);

create policy "df_contas_tenant_delete"
on public.df_contas
for delete
to public
using (
  exists (
    select 1
    from public.df_usuarios_empresas u
    where u.empresa_id = df_contas.empresa_id
      and u.user_id = auth.uid()
  )
);

create policy "Notas por empresa"
on public.df_notas
for all
to public
using (
  empresa_id in (
    select df_usuarios_empresas.empresa_id
    from public.df_usuarios_empresas
    where df_usuarios_empresas.user_id = auth.uid()
  )
);

create policy "notas_select_own"
on public.df_notas
for select
to public
using (auth.uid() = user_id);

create policy "notas_insert_own"
on public.df_notas
for insert
to public
with check (auth.uid() = user_id);

create policy "notas_update_own"
on public.df_notas
for update
to public
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "df_notas_tenant_select"
on public.df_notas
for select
to public
using (
  exists (
    select 1
    from public.df_usuarios_empresas u
    where u.empresa_id = df_notas.empresa_id
      and u.user_id = auth.uid()
  )
);

create policy "df_notas_tenant_insert"
on public.df_notas
for insert
to public
with check (
  exists (
    select 1
    from public.df_usuarios_empresas u
    where u.empresa_id = df_notas.empresa_id
      and u.user_id = auth.uid()
  )
);

create policy "df_notas_tenant_update"
on public.df_notas
for update
to public
using (
  exists (
    select 1
    from public.df_usuarios_empresas u
    where u.empresa_id = df_notas.empresa_id
      and u.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.df_usuarios_empresas u
    where u.empresa_id = df_notas.empresa_id
      and u.user_id = auth.uid()
  )
);

create policy "df_notas_tenant_delete"
on public.df_notas
for delete
to public
using (
  exists (
    select 1
    from public.df_usuarios_empresas u
    where u.empresa_id = df_notas.empresa_id
      and u.user_id = auth.uid()
  )
);

create policy "df_notas_select_tenant_saneado"
on public.df_notas
for select
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or empresa_id in (
      select ue.empresa_id
      from public.df_usuarios_empresas ue
      where ue.user_id = auth.uid()
        or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
);

create policy "df_notas_insert_tenant_saneado"
on public.df_notas
for insert
to authenticated
with check (
  auth.uid() is not null
  and (
    public.is_master()
    or empresa_id in (
      select ue.empresa_id
      from public.df_usuarios_empresas ue
      where ue.user_id = auth.uid()
        or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
);

create policy "df_notas_update_tenant_saneado"
on public.df_notas
for update
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or empresa_id in (
      select ue.empresa_id
      from public.df_usuarios_empresas ue
      where ue.user_id = auth.uid()
        or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
)
with check (
  auth.uid() is not null
  and (
    public.is_master()
    or empresa_id in (
      select ue.empresa_id
      from public.df_usuarios_empresas ue
      where ue.user_id = auth.uid()
        or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
);

create policy "df_notas_delete_tenant_saneado"
on public.df_notas
for delete
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or empresa_id in (
      select ue.empresa_id
      from public.df_usuarios_empresas ue
      where ue.user_id = auth.uid()
        or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
);

-- Conferencia pos-rollback esperada:
-- - policies ALL/DELETE voltam a existir;
-- - grants amplos voltam a existir;
-- - triggers de auditoria permanecem.

commit;
