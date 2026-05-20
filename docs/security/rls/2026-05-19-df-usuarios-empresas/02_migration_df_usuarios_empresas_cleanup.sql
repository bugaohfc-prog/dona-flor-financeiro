-- Dona Flor Financeiro
-- Incremental RLS cleanup: public.df_usuarios_empresas only
-- Goal: remove legacy write policies that bypass master-target protection.
-- Do not run without saving the backup query output first.

begin;

do $$
begin
  if to_regclass('public.df_usuarios_empresas') is null then
    raise exception 'Missing table public.df_usuarios_empresas';
  end if;

  if to_regprocedure('public.is_master()') is null then
    raise exception 'Missing helper public.is_master()';
  end if;

  if to_regprocedure('public.df_usuario_eh_admin(uuid)') is null then
    raise exception 'Missing helper public.df_usuario_eh_admin(uuid)';
  end if;

  if to_regprocedure('public.df_usuario_alvo_eh_master(uuid,text,uuid)') is null then
    raise exception 'Missing helper public.df_usuario_alvo_eh_master(uuid,text,uuid)';
  end if;
end $$;

alter table public.df_usuarios_empresas enable row level security;

-- Known dangerous legacy write policies from the post-RLS CSV.
drop policy if exists "df usuarios admin insert" on public.df_usuarios_empresas;
drop policy if exists "df usuarios admin update" on public.df_usuarios_empresas;
drop policy if exists "df usuarios admin delete" on public.df_usuarios_empresas;

-- Defensive cleanup for older legacy names seen in prior rollback exports.
drop policy if exists "usuarios_insert" on public.df_usuarios_empresas;
drop policy if exists "usuarios_update" on public.df_usuarios_empresas;
drop policy if exists "usuarios_delete" on public.df_usuarios_empresas;

-- Recreate the safe scoped policies deterministically.
drop policy if exists "df_usuarios_empresas_select_scoped_saneado" on public.df_usuarios_empresas;
drop policy if exists "df_usuarios_empresas_insert_admin_saneado" on public.df_usuarios_empresas;
drop policy if exists "df_usuarios_empresas_update_admin_saneado" on public.df_usuarios_empresas;
drop policy if exists "df_usuarios_empresas_delete_admin_saneado" on public.df_usuarios_empresas;

create policy "df_usuarios_empresas_select_scoped_saneado"
on public.df_usuarios_empresas
for select
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or user_id = auth.uid()
    or usuario_id = auth.uid()
    or lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

create policy "df_usuarios_empresas_insert_admin_saneado"
on public.df_usuarios_empresas
for insert
to authenticated
with check (
  auth.uid() is not null
  and (
    public.is_master()
    or (
      public.df_usuario_eh_admin(empresa_id)
      and not (
        lower(coalesce(perfil, '')) = any (array['master', 'owner', 'superadmin', 'super_admin'])
        or public.df_usuario_alvo_eh_master(user_id, email, usuario_id)
      )
    )
  )
);

create policy "df_usuarios_empresas_update_admin_saneado"
on public.df_usuarios_empresas
for update
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or (
      public.df_usuario_eh_admin(empresa_id)
      and not (
        lower(coalesce(perfil, '')) = any (array['master', 'owner', 'superadmin', 'super_admin'])
        or public.df_usuario_alvo_eh_master(user_id, email, usuario_id)
      )
    )
  )
)
with check (
  auth.uid() is not null
  and (
    public.is_master()
    or (
      public.df_usuario_eh_admin(empresa_id)
      and not (
        lower(coalesce(perfil, '')) = any (array['master', 'owner', 'superadmin', 'super_admin'])
        or public.df_usuario_alvo_eh_master(user_id, email, usuario_id)
      )
    )
  )
);

create policy "df_usuarios_empresas_delete_admin_saneado"
on public.df_usuarios_empresas
for delete
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or (
      public.df_usuario_eh_admin(empresa_id)
      and not (
        lower(coalesce(perfil, '')) = any (array['master', 'owner', 'superadmin', 'super_admin'])
        or public.df_usuario_alvo_eh_master(user_id, email, usuario_id)
      )
    )
  )
);

do $$
declare
  unexpected_write_policies text;
begin
  select string_agg(policyname, ', ' order by policyname)
  into unexpected_write_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'df_usuarios_empresas'
    and cmd in ('INSERT', 'UPDATE', 'DELETE')
    and policyname not in (
      'df_usuarios_empresas_insert_admin_saneado',
      'df_usuarios_empresas_update_admin_saneado',
      'df_usuarios_empresas_delete_admin_saneado'
    );

  if unexpected_write_policies is not null then
    raise exception 'Unexpected df_usuarios_empresas write policies remain: %', unexpected_write_policies;
  end if;
end $$;

commit;
