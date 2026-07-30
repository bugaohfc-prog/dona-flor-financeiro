begin;

alter table public.df_usuarios_empresas
  add column if not exists acesso_todas_filiais boolean;

comment on column public.df_usuarios_empresas.acesso_todas_filiais is
  'Autoriza explicitamente o vinculo empresarial a acessar registros de qualquer filial, inclusive registros sem filial.';

alter table public.df_usuarios_filiais
  add column if not exists usuario_empresa_id_migracao uuid;

update public.df_usuarios_filiais uf
set usuario_empresa_id_migracao = (
  select ue.id
  from public.df_usuarios_empresas ue
  left join public.df_usuarios legado
    on legado.id = uf.usuario_id
  where ue.empresa_id = uf.empresa_id
    and (
      ue.id = uf.usuario_id
      or (
        legado.email is not null
        and lower(btrim(ue.email)) = lower(btrim(legado.email))
      )
    )
  order by (ue.id = uf.usuario_id) desc, ue.created_at nulls last, ue.id
  limit 1
);

do $$
begin
  if exists (
    select 1
    from public.df_usuarios_filiais
    where usuario_empresa_id_migracao is null
  ) then
    raise exception 'Existem atribuicoes de filial sem vinculo empresarial correspondente.';
  end if;
end;
$$;

drop policy if exists "df_usuarios_filiais_select_scoped_saneado"
  on public.df_usuarios_filiais;
drop policy if exists "df_usuarios_filiais_insert_admin_saneado"
  on public.df_usuarios_filiais;
drop policy if exists "df_usuarios_filiais_update_admin_saneado"
  on public.df_usuarios_filiais;
drop policy if exists "df_usuarios_filiais_delete_admin_saneado"
  on public.df_usuarios_filiais;

alter table public.df_usuarios_filiais
  drop constraint if exists df_usuarios_filiais_usuario_fkey;
alter table public.df_usuarios_filiais
  drop column usuario_id;
alter table public.df_usuarios_filiais
  rename column usuario_empresa_id_migracao to usuario_id;
alter table public.df_usuarios_filiais
  alter column usuario_id set not null;
alter table public.df_usuarios_filiais
  add constraint df_usuarios_filiais_usuario_empresa_fkey
  foreign key (usuario_id)
  references public.df_usuarios_empresas(id)
  on delete cascade;

create unique index if not exists uq_df_usuarios_filiais_escopo
  on public.df_usuarios_filiais (empresa_id, usuario_id, filial_id);

update public.df_usuarios_empresas ue
set acesso_todas_filiais = not exists (
  select 1
  from public.df_usuarios_filiais uf
  join public.df_filiais f
    on f.id = uf.filial_id
   and f.empresa_id = uf.empresa_id
  where uf.empresa_id = ue.empresa_id
    and uf.usuario_id = ue.id
);

alter table public.df_usuarios_empresas
  alter column acesso_todas_filiais set default false,
  alter column acesso_todas_filiais set not null;

create or replace function public.df_usuario_pode_acessar_filial(
  p_empresa_id uuid,
  p_filial_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and p_empresa_id is not null
    and (
      public.is_master()
      or public.df_usuario_eh_admin(p_empresa_id)
      or exists (
        select 1
        from public.df_usuarios_empresas ue
        where ue.empresa_id = p_empresa_id
          and (
            ue.user_id = auth.uid()
            or ue.usuario_id = auth.uid()
            or lower(coalesce(ue.email, '')) =
              lower(coalesce(auth.jwt() ->> 'email', ''))
          )
          and (
            ue.acesso_todas_filiais = true
            or (
              p_filial_id is not null
              and exists (
                select 1
                from public.df_usuarios_filiais uf
                join public.df_filiais f
                  on f.id = uf.filial_id
                 and f.empresa_id = uf.empresa_id
                where uf.empresa_id = p_empresa_id
                  and uf.usuario_id = ue.id
                  and uf.filial_id = p_filial_id
              )
            )
          )
      )
    );
$$;

revoke all on function public.df_usuario_pode_acessar_filial(uuid, uuid)
  from public, anon;
grant execute on function public.df_usuario_pode_acessar_filial(uuid, uuid)
  to authenticated, service_role;

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
    and public.df_usuario_alvo_eh_master(
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

revoke all on function public.definir_escopo_filiais_usuario(uuid, uuid, boolean, uuid[])
  from public, anon;
grant execute on function public.definir_escopo_filiais_usuario(uuid, uuid, boolean, uuid[])
  to authenticated;

revoke insert, update, delete on table public.df_usuarios_filiais
  from public, anon, authenticated;

create policy "df_usuarios_filiais_select_scoped_saneado"
on public.df_usuarios_filiais
for select
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or usuario_id in (
      select ue.id
      from public.df_usuarios_empresas ue
      where ue.user_id = auth.uid()
        or ue.usuario_id = auth.uid()
        or lower(coalesce(ue.email, '')) =
          lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
);

drop policy if exists "df_contas_select_empresa" on public.df_contas;
drop policy if exists "df_contas_insert_empresa_operacional" on public.df_contas;
drop policy if exists "df_contas_update_empresa_operacional" on public.df_contas;

create policy "df_contas_select_empresa"
on public.df_contas
for select
to authenticated
using (
  auth.uid() is not null
  and empresa_id is not null
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or coalesce(excluido, false) = false
  )
);

create policy "df_contas_insert_empresa_operacional"
on public.df_contas
for insert
to authenticated
with check (
  auth.uid() is not null
  and empresa_id is not null
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(empresa_id, array['gerente'])
  )
);

create policy "df_contas_update_empresa_operacional"
on public.df_contas
for update
to authenticated
using (
  auth.uid() is not null
  and empresa_id is not null
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(empresa_id, array['gerente'])
  )
)
with check (
  auth.uid() is not null
  and empresa_id is not null
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(empresa_id, array['gerente'])
  )
);

drop policy if exists "df_notas_select_empresa" on public.df_notas;
drop policy if exists "df_notas_insert_empresa_operacional" on public.df_notas;
drop policy if exists "df_notas_update_empresa_operacional" on public.df_notas;

create policy "df_notas_select_empresa"
on public.df_notas
for select
to authenticated
using (
  auth.uid() is not null
  and empresa_id is not null
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or coalesce(excluido, false) = false
  )
);

create policy "df_notas_insert_empresa_operacional"
on public.df_notas
for insert
to authenticated
with check (
  auth.uid() is not null
  and empresa_id is not null
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(empresa_id, array['gerente'])
  )
);

create policy "df_notas_update_empresa_operacional"
on public.df_notas
for update
to authenticated
using (
  auth.uid() is not null
  and empresa_id is not null
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(empresa_id, array['gerente'])
  )
)
with check (
  auth.uid() is not null
  and empresa_id is not null
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
    or public.df_usuario_tem_perfil_empresa(empresa_id, array['gerente'])
  )
);

drop policy if exists "df_contas_pagamentos_select_empresa"
  on public.df_contas_pagamentos;
drop policy if exists "df_contas_pagamentos_update_empresa_operacional"
  on public.df_contas_pagamentos;

create policy "df_contas_pagamentos_select_empresa"
on public.df_contas_pagamentos
for select
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1
    from public.df_contas c
    where c.id = df_contas_pagamentos.conta_id
      and c.empresa_id = df_contas_pagamentos.empresa_id
      and public.df_usuario_pode_acessar_filial(c.empresa_id, c.filial_id)
      and (
        public.is_master()
        or public.df_usuario_eh_admin(c.empresa_id)
        or coalesce(c.excluido, false) = false
      )
  )
);

create policy "df_contas_pagamentos_update_empresa_operacional"
on public.df_contas_pagamentos
for update
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1
    from public.df_contas c
    where c.id = df_contas_pagamentos.conta_id
      and c.empresa_id = df_contas_pagamentos.empresa_id
      and public.df_usuario_pode_acessar_filial(c.empresa_id, c.filial_id)
      and (
        public.is_master()
        or public.df_usuario_eh_admin(c.empresa_id)
        or public.df_usuario_tem_perfil_empresa(c.empresa_id, array['gerente'])
      )
  )
)
with check (
  auth.uid() is not null
  and exists (
    select 1
    from public.df_contas c
    where c.id = df_contas_pagamentos.conta_id
      and c.empresa_id = df_contas_pagamentos.empresa_id
      and public.df_usuario_pode_acessar_filial(c.empresa_id, c.filial_id)
      and (
        public.is_master()
        or public.df_usuario_eh_admin(c.empresa_id)
        or public.df_usuario_tem_perfil_empresa(c.empresa_id, array['gerente'])
      )
  )
);

create or replace function public.df_contas_pagamentos_validar_escopo_filial()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_filial_id uuid;
begin
  select c.filial_id
  into v_filial_id
  from public.df_contas c
  where c.id = new.conta_id
    and c.empresa_id = new.empresa_id;

  if not found
    or not public.df_usuario_pode_acessar_filial(new.empresa_id, v_filial_id) then
    raise exception 'Usuario sem acesso a filial da conta.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.df_contas_pagamentos_validar_escopo_filial()
  from public, anon, authenticated;

drop trigger if exists trg_df_contas_pagamentos_validar_escopo_filial
  on public.df_contas_pagamentos;
create trigger trg_df_contas_pagamentos_validar_escopo_filial
before insert or update of empresa_id, conta_id
on public.df_contas_pagamentos
for each row
execute function public.df_contas_pagamentos_validar_escopo_filial();

drop policy if exists "contas_recorrentes_empresa"
  on public.df_contas_recorrentes;
create policy "contas_recorrentes_empresa"
on public.df_contas_recorrentes
for all
to authenticated
using (
  auth.uid() is not null
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
)
with check (
  auth.uid() is not null
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
);

drop policy if exists "df_receitas_select_empresa" on public.df_receitas;
drop policy if exists "df_receitas_insert_financeiro" on public.df_receitas;
drop policy if exists "df_receitas_update_financeiro" on public.df_receitas;

create policy "df_receitas_select_empresa"
on public.df_receitas
for select
to authenticated
using (
  auth.uid() is not null
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
  and (
    public.is_master()
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['admin', 'adm', 'administrador', 'gerente', 'master', 'owner', 'superadmin', 'super_admin']
    )
  )
);

create policy "df_receitas_insert_financeiro"
on public.df_receitas
for insert
to authenticated
with check (
  auth.uid() is not null
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
  and (
    public.is_master()
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['admin', 'adm', 'administrador', 'gerente', 'master', 'owner', 'superadmin', 'super_admin']
    )
  )
);

create policy "df_receitas_update_financeiro"
on public.df_receitas
for update
to authenticated
using (
  auth.uid() is not null
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
  and (
    public.is_master()
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['admin', 'adm', 'administrador', 'gerente', 'master', 'owner', 'superadmin', 'super_admin']
    )
  )
)
with check (
  auth.uid() is not null
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
  and (
    public.is_master()
    or public.df_usuario_tem_perfil_empresa(
      empresa_id,
      array['admin', 'adm', 'administrador', 'gerente', 'master', 'owner', 'superadmin', 'super_admin']
    )
  )
);

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'df_contas',
        'df_notas',
        'df_contas_pagamentos',
        'df_contas_recorrentes',
        'df_receitas'
      )
      and cmd in ('SELECT', 'INSERT', 'UPDATE', 'ALL')
      and coalesce(qual, '') || ' ' || coalesce(with_check, '')
        not like '%df_usuario_pode_acessar_filial%'
  ) then
    raise exception 'Existe policy financeira sem escopo canonico de filial.';
  end if;
end;
$$;

commit;
