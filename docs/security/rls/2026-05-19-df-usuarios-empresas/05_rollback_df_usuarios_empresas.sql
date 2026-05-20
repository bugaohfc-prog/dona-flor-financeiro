-- Dona Flor Financeiro
-- Emergency rollback for df_usuarios_empresas cleanup only.
-- WARNING: this restores the legacy write policies and reopens the audited risk.
-- Use only if the migration must be reverted immediately.

begin;

drop policy if exists "df usuarios admin insert" on public.df_usuarios_empresas;
drop policy if exists "df usuarios admin update" on public.df_usuarios_empresas;
drop policy if exists "df usuarios admin delete" on public.df_usuarios_empresas;

create policy "df usuarios admin insert"
on public.df_usuarios_empresas
for insert
to public
with check (public.df_usuario_eh_admin(empresa_id));

create policy "df usuarios admin update"
on public.df_usuarios_empresas
for update
to public
using (public.df_usuario_eh_admin(empresa_id))
with check (public.df_usuario_eh_admin(empresa_id));

create policy "df usuarios admin delete"
on public.df_usuarios_empresas
for delete
to public
using (public.df_usuario_eh_admin(empresa_id));

commit;
