begin;

drop policy if exists "df_receitas_insert_financeiro" on public.df_receitas;
drop policy if exists "df_receitas_update_financeiro" on public.df_receitas;

create policy "df_receitas_insert_financeiro"
on public.df_receitas
for insert
to authenticated
with check (
  auth.uid() is not null
  and (
    public.is_master()
    or exists (
      select 1
      from public.df_usuarios_empresas ue
      where ue.empresa_id = df_receitas.empresa_id
        and lower(coalesce(ue.perfil, '')) in ('admin', 'adm', 'administrador', 'gerente', 'master', 'owner', 'superadmin', 'super_admin')
        and (
          ue.user_id = auth.uid()
          or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  )
);

create policy "df_receitas_update_financeiro"
on public.df_receitas
for update
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or exists (
      select 1
      from public.df_usuarios_empresas ue
      where ue.empresa_id = df_receitas.empresa_id
        and lower(coalesce(ue.perfil, '')) in ('admin', 'adm', 'administrador', 'gerente', 'master', 'owner', 'superadmin', 'super_admin')
        and (
          ue.user_id = auth.uid()
          or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  )
)
with check (
  auth.uid() is not null
  and (
    public.is_master()
    or exists (
      select 1
      from public.df_usuarios_empresas ue
      where ue.empresa_id = df_receitas.empresa_id
        and lower(coalesce(ue.perfil, '')) in ('admin', 'adm', 'administrador', 'gerente', 'master', 'owner', 'superadmin', 'super_admin')
        and (
          ue.user_id = auth.uid()
          or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  )
);

commit;
