begin;

create or replace function public.df_folha_validar_data_efetiva_2c2(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_data_referencia date
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status text;
  v_data_efetiva date;
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin') then
    if auth.uid() is null
      or not public.df_funcionarios_pode_escrever(p_empresa_id) then
      raise exception 'ACESSO_NEGADO_FOLHA_DATA_EFETIVA';
    end if;
  end if;

  select f.status
    into v_status
  from public.df_funcionarios f
  where f.empresa_id = p_empresa_id
    and f.id = p_funcionario_id;

  if not found then
    raise exception 'FUNCIONARIO_FOLHA_NAO_ENCONTRADO';
  end if;

  if v_status <> 'desligado' then
    return;
  end if;

  select d.data_efetiva
    into v_data_efetiva
  from public.df_funcionarios_desligamentos d
  where d.empresa_id = p_empresa_id
    and d.funcionario_id = p_funcionario_id
    and d.estado = 'CONCLUIDO'
  order by d.concluido_em desc nulls last, d.atualizado_em desc, d.id desc
  limit 1;

  if v_data_efetiva is null then
    raise exception 'FOLHA_DESLIGADO_SEM_DATA_EFETIVA';
  end if;

  if p_data_referencia is null then
    raise exception 'FOLHA_DESLIGADO_EXIGE_DATA_REFERENCIA';
  end if;

  if p_data_referencia > v_data_efetiva then
    raise exception 'FOLHA_APOS_DATA_EFETIVA';
  end if;
end;
$$;

revoke all on function public.df_folha_validar_data_efetiva_2c2(uuid, uuid, date)
  from public, anon, authenticated, service_role;
grant execute on function public.df_folha_validar_data_efetiva_2c2(uuid, uuid, date)
  to authenticated, service_role;

commit;
