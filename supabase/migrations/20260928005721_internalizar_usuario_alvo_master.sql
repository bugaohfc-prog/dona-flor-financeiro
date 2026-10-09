begin;

do $$
begin
  if to_regprocedure('public.df_usuario_alvo_eh_master(uuid,text,uuid)') is null then
    raise exception 'Helper public.df_usuario_alvo_eh_master ausente.';
  end if;

  if to_regprocedure('public.definir_escopo_filiais_usuario(uuid,uuid,boolean,uuid[])') is null then
    raise exception 'RPC public.definir_escopo_filiais_usuario ausente.';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_usuarios_empresas'
      and policyname in (
        'df_usuarios_empresas_insert_admin_saneado',
        'df_usuarios_empresas_update_admin_saneado',
        'df_usuarios_empresas_delete_admin_saneado'
      )
  ) <> 3 then
    raise exception 'Policies esperadas de df_usuarios_empresas ausentes.';
  end if;
end;
$$;

create schema if not exists private authorization postgres;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.df_usuario_alvo_eh_master(
  p_user_id uuid,
  p_email text,
  p_usuario_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.df_usuarios_master m
    where (
      p_user_id is not null
      and m.user_id = p_user_id
    )
    or (
      p_usuario_id is not null
      and m.user_id = p_usuario_id
    )
    or (
      nullif(pg_catalog.btrim(p_email), '') is not null
      and pg_catalog.lower(coalesce(m.email, '')) =
        pg_catalog.lower(pg_catalog.btrim(p_email))
    )
  );
$$;

revoke all on function private.df_usuario_alvo_eh_master(uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function private.df_usuario_alvo_eh_master(uuid, text, uuid)
  to authenticated;

drop policy "df_usuarios_empresas_insert_admin_saneado"
  on public.df_usuarios_empresas;
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
        or private.df_usuario_alvo_eh_master(user_id, email, usuario_id)
      )
    )
  )
);

drop policy "df_usuarios_empresas_update_admin_saneado"
  on public.df_usuarios_empresas;
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
        or private.df_usuario_alvo_eh_master(user_id, email, usuario_id)
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
        or private.df_usuario_alvo_eh_master(user_id, email, usuario_id)
      )
    )
  )
);

drop policy "df_usuarios_empresas_delete_admin_saneado"
  on public.df_usuarios_empresas;
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
        or private.df_usuario_alvo_eh_master(user_id, email, usuario_id)
      )
    )
  )
);

create or replace function public.definir_escopo_filiais_usuario(
  p_empresa_id uuid,
  p_usuario_empresa_id uuid,
  p_acesso_todas_filiais boolean,
  p_filial_ids uuid[] default array[]::uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vinculo public.df_usuarios_empresas%rowtype;
  v_filiais uuid[];
begin
  if auth.uid() is null
    or p_empresa_id is null
    or p_usuario_empresa_id is null
    or p_acesso_todas_filiais is null then
    raise exception 'Parametros invalidos para definir escopo de filiais.'
      using errcode = '22023';
  end if;

  if not (
    public.is_master()
    or public.df_usuario_eh_admin(p_empresa_id)
  ) then
    raise exception 'Usuario sem permissao para definir escopo de filiais.'
      using errcode = '42501';
  end if;

  select *
  into v_vinculo
  from public.df_usuarios_empresas ue
  where ue.id = p_usuario_empresa_id
    and ue.empresa_id = p_empresa_id
  for update;

  if not found then
    raise exception 'Vinculo empresarial nao encontrado.' using errcode = 'P0002';
  end if;

  if not public.is_master()
    and private.df_usuario_alvo_eh_master(
      v_vinculo.user_id,
      v_vinculo.email,
      v_vinculo.usuario_id
    ) then
    raise exception 'Somente Master pode alterar o escopo de outro Master.'
      using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct filial_id order by filial_id), array[]::uuid[])
  into v_filiais
  from unnest(coalesce(p_filial_ids, array[]::uuid[])) as item(filial_id);

  if p_acesso_todas_filiais and cardinality(v_filiais) > 0 then
    raise exception 'Acesso total nao pode manter filiais individuais.'
      using errcode = '22023';
  end if;

  if not p_acesso_todas_filiais and exists (
    select 1
    from unnest(v_filiais) as item(filial_id)
    where not exists (
      select 1
      from public.df_filiais f
      where f.id = filial_id
        and f.empresa_id = p_empresa_id
    )
  ) then
    raise exception 'Uma ou mais filiais nao pertencem a empresa.'
      using errcode = '23503';
  end if;

  delete from public.df_usuarios_filiais
  where empresa_id = p_empresa_id
    and usuario_id = p_usuario_empresa_id;

  if not p_acesso_todas_filiais and cardinality(v_filiais) > 0 then
    insert into public.df_usuarios_filiais (
      empresa_id,
      usuario_id,
      filial_id
    )
    select p_empresa_id, p_usuario_empresa_id, filial_id
    from unnest(v_filiais) as item(filial_id);
  end if;

  update public.df_usuarios_empresas
  set acesso_todas_filiais = p_acesso_todas_filiais
  where id = p_usuario_empresa_id
    and empresa_id = p_empresa_id;

  return jsonb_build_object(
    'acesso_todas_filiais', p_acesso_todas_filiais,
    'filial_ids', to_jsonb(v_filiais)
  );
end;
$$;

revoke execute on function public.df_usuario_alvo_eh_master(uuid, text, uuid)
  from public, anon, authenticated;

do $$
begin
  if has_function_privilege(
    'authenticated',
    'public.df_usuario_alvo_eh_master(uuid,text,uuid)',
    'EXECUTE'
  ) then
    raise exception 'authenticated ainda executa o helper publico.';
  end if;

  if not has_function_privilege(
    'authenticated',
    'private.df_usuario_alvo_eh_master(uuid,text,uuid)',
    'EXECUTE'
  ) then
    raise exception 'authenticated nao executa o helper interno exigido pelas policies.';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_usuarios_empresas'
      and policyname in (
        'df_usuarios_empresas_insert_admin_saneado',
        'df_usuarios_empresas_update_admin_saneado',
        'df_usuarios_empresas_delete_admin_saneado'
      )
      and (
        coalesce(qual, '') ilike '%private.df_usuario_alvo_eh_master%'
        or coalesce(with_check, '') ilike '%private.df_usuario_alvo_eh_master%'
      )
  ) <> 3 then
    raise exception 'Policies nao usam integralmente o helper interno.';
  end if;

  if pg_get_functiondef(
    'public.definir_escopo_filiais_usuario(uuid,uuid,boolean,uuid[])'::regprocedure
  ) not ilike '%private.df_usuario_alvo_eh_master%' then
    raise exception 'RPC de escopo de filiais nao usa o helper interno.';
  end if;
end;
$$;

commit;
