begin;

alter policy "df_usuarios_select_own_legacy"
on public.df_usuarios
using (
  (select auth.uid()) is not null
  and (
    id = (select auth.uid())
    or lower(coalesce(email, '')) = lower(coalesce(((select auth.jwt()) ->> 'email'), ''))
  )
);

alter policy "profiles_insert_own"
on public.profiles
with check ((select auth.uid()) = id);

alter policy "profiles_select_own"
on public.profiles
using ((select auth.uid()) = id);

alter policy "profiles_update_own"
on public.profiles
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

alter policy "df_contas_delete_admin_master"
on public.df_contas
using (
  (select auth.uid()) is not null
  and empresa_id is not null
  and (
    (select public.is_master())
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['master','owner','superadmin','super_admin']::text[]
    )
  )
);

alter policy "df_contas_insert_empresa_operacional"
on public.df_contas
with check (
  (select auth.uid()) is not null
  and empresa_id is not null
  and (
    (select public.is_master())
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['gerente','master','owner','superadmin','super_admin']::text[]
    )
  )
);

alter policy "df_contas_select_empresa"
on public.df_contas
using (
  (select auth.uid()) is not null
  and empresa_id is not null
  and (
    (select public.is_master())
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['master','owner','superadmin','super_admin']::text[]
    )
    or exists (
      select 1
      from public.df_usuarios_empresas ue
      where ue.empresa_id = df_contas.empresa_id
        and coalesce(df_contas.excluido, false) = false
        and (
          ue.user_id = (select auth.uid())
          or lower(coalesce(ue.email, '')) = lower(coalesce(((select auth.jwt()) ->> 'email'), ''))
        )
    )
  )
);

alter policy "df_contas_update_empresa_operacional"
on public.df_contas
using (
  (select auth.uid()) is not null
  and empresa_id is not null
  and (
    (select public.is_master())
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['gerente','master','owner','superadmin','super_admin']::text[]
    )
  )
)
with check (
  (select auth.uid()) is not null
  and empresa_id is not null
  and (
    (select public.is_master())
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['gerente','master','owner','superadmin','super_admin']::text[]
    )
  )
);

alter policy "df_contas_pagamentos_insert_empresa_operacional"
on public.df_contas_pagamentos
with check (
  (select auth.uid()) is not null
  and empresa_id is not null
  and (
    (select public.is_master())
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['gerente','master','owner','superadmin','super_admin']::text[]
    )
  )
);

alter policy "df_contas_pagamentos_select_empresa"
on public.df_contas_pagamentos
using (
  (select auth.uid()) is not null
  and empresa_id is not null
  and (
    (select public.is_master())
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['master','owner','superadmin','super_admin']::text[]
    )
    or exists (
      select 1
      from public.df_usuarios_empresas ue
      where ue.empresa_id = df_contas_pagamentos.empresa_id
        and (
          ue.user_id = (select auth.uid())
          or lower(coalesce(ue.email, '')) = lower(coalesce(((select auth.jwt()) ->> 'email'), ''))
        )
    )
  )
);

alter policy "df_contas_pagamentos_update_empresa_operacional"
on public.df_contas_pagamentos
using (
  (select auth.uid()) is not null
  and empresa_id is not null
  and (
    (select public.is_master())
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['gerente','master','owner','superadmin','super_admin']::text[]
    )
  )
)
with check (
  (select auth.uid()) is not null
  and empresa_id is not null
  and (
    (select public.is_master())
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['gerente','master','owner','superadmin','super_admin']::text[]
    )
  )
);

commit;
