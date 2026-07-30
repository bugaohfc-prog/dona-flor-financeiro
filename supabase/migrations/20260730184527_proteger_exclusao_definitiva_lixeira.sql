begin;

do $$
begin
  if to_regclass('public.df_contas') is null
    or to_regclass('public.df_notas') is null
    or to_regclass('public.df_auditoria_admin') is null then
    raise exception 'Tabelas obrigatorias da lixeira nao encontradas.';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.df_contas'::regclass
      and tgname = 'trg_df_contas_auditoria_lixeira'
      and not tgisinternal
      and tgenabled <> 'D'
  ) or not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.df_notas'::regclass
      and tgname = 'trg_df_notas_auditoria_lixeira'
      and not tgisinternal
      and tgenabled <> 'D'
  ) then
    raise exception 'Triggers obrigatorios de auditoria da lixeira nao encontrados.';
  end if;
end;
$$;

create or replace function public.excluir_conta_definitivamente(
  p_empresa_id uuid,
  p_conta_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conta public.df_contas%rowtype;
begin
  if auth.uid() is null or p_empresa_id is null or p_conta_id is null then
    raise exception 'Parametros invalidos para exclusao definitiva.' using errcode = '42501';
  end if;

  if not (
    public.is_master()
    or public.df_usuario_eh_admin(p_empresa_id)
  ) then
    raise exception 'Usuario sem permissao para exclusao definitiva.' using errcode = '42501';
  end if;

  select *
  into v_conta
  from public.df_contas c
  where c.id = p_conta_id
    and c.empresa_id = p_empresa_id
  for update;

  if not found then
    raise exception 'Conta nao encontrada.' using errcode = 'P0002';
  end if;

  if coalesce(v_conta.excluido, false) = false
    or v_conta.excluido_em is null
    or v_conta.excluido_em > now() - interval '60 days' then
    raise exception 'A conta ainda nao cumpriu a retencao minima de 60 dias.'
      using errcode = '55000';
  end if;

  delete from public.df_contas
  where id = v_conta.id
    and empresa_id = v_conta.empresa_id;

  return jsonb_build_object('id', v_conta.id, 'excluida', true);
end;
$$;

create or replace function public.excluir_nota_definitivamente(
  p_empresa_id uuid,
  p_nota_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nota public.df_notas%rowtype;
begin
  if auth.uid() is null or p_empresa_id is null or p_nota_id is null then
    raise exception 'Parametros invalidos para exclusao definitiva.' using errcode = '42501';
  end if;

  if not (
    public.is_master()
    or public.df_usuario_eh_admin(p_empresa_id)
  ) then
    raise exception 'Usuario sem permissao para exclusao definitiva.' using errcode = '42501';
  end if;

  select *
  into v_nota
  from public.df_notas n
  where n.id = p_nota_id
    and n.empresa_id = p_empresa_id
  for update;

  if not found then
    raise exception 'Nota nao encontrada.' using errcode = 'P0002';
  end if;

  if coalesce(v_nota.excluido, false) = false
    or v_nota.excluido_em is null
    or v_nota.excluido_em > now() - interval '60 days' then
    raise exception 'A nota ainda nao cumpriu a retencao minima de 60 dias.'
      using errcode = '55000';
  end if;

  delete from public.df_notas
  where id = v_nota.id
    and empresa_id = v_nota.empresa_id;

  return jsonb_build_object('id', v_nota.id, 'excluida', true);
end;
$$;

revoke all on function public.excluir_conta_definitivamente(uuid, uuid)
  from public, anon;
revoke all on function public.excluir_nota_definitivamente(uuid, uuid)
  from public, anon;
grant execute on function public.excluir_conta_definitivamente(uuid, uuid)
  to authenticated;
grant execute on function public.excluir_nota_definitivamente(uuid, uuid)
  to authenticated;

revoke delete on table public.df_contas from authenticated;
revoke delete on table public.df_notas from authenticated;

drop policy if exists "df_contas_delete_admin_master" on public.df_contas;
drop policy if exists "df_notas_delete_admin_master" on public.df_notas;

do $$
begin
  if has_table_privilege('authenticated', 'public.df_contas', 'DELETE')
    or has_table_privilege('authenticated', 'public.df_notas', 'DELETE') then
    raise exception 'authenticated ainda possui DELETE direto na lixeira financeira.';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename in ('df_contas', 'df_notas')
      and cmd in ('DELETE', 'ALL')
  ) then
    raise exception 'Policy paralela ainda permite DELETE direto na lixeira financeira.';
  end if;
end;
$$;

commit;
