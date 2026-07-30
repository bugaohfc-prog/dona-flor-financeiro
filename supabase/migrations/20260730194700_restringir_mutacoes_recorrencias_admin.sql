begin;

alter table public.df_contas_recorrentes enable row level security;

drop policy if exists "contas_recorrentes_empresa"
  on public.df_contas_recorrentes;
drop policy if exists "df_contas_recorrentes_select_empresa"
  on public.df_contas_recorrentes;
drop policy if exists "df_contas_recorrentes_insert_admin"
  on public.df_contas_recorrentes;
drop policy if exists "df_contas_recorrentes_update_admin"
  on public.df_contas_recorrentes;
drop policy if exists "df_contas_recorrentes_delete_admin"
  on public.df_contas_recorrentes;

create policy "df_contas_recorrentes_select_empresa"
on public.df_contas_recorrentes
for select
to authenticated
using (
  auth.uid() is not null
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
);

create policy "df_contas_recorrentes_insert_admin"
on public.df_contas_recorrentes
for insert
to authenticated
with check (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
  )
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
);

create policy "df_contas_recorrentes_update_admin"
on public.df_contas_recorrentes
for update
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
  )
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
)
with check (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
  )
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
);

create policy "df_contas_recorrentes_delete_admin"
on public.df_contas_recorrentes
for delete
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
  )
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
);

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_contas_recorrentes'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      and (
        coalesce(qual, '') || ' ' || coalesce(with_check, '')
      ) not like '%df_usuario_eh_admin%'
      and (
        coalesce(qual, '') || ' ' || coalesce(with_check, '')
      ) not like '%is_master%'
  ) then
    raise exception 'Existe policy paralela que permite mutacao nao administrativa em recorrencias.';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_contas_recorrentes'
      and cmd = 'ALL'
  ) then
    raise exception 'Policy FOR ALL nao e permitida em recorrencias.';
  end if;
end;
$$;

commit;
