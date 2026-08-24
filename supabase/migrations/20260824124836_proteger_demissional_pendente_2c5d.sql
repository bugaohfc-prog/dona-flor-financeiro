do $$
begin
  if exists (
    select 1
    from public.df_funcionarios_exames_ocupacionais
    where tipo = 'DEMISSIONAL'
      and estado = 'PENDENTE'
      and arquivado = false
    group by empresa_id, funcionario_id
    having count(*) > 1
  ) then
    raise exception 'EXAMES_DEMISSIONAIS_PENDENTES_DUPLICADOS_EXISTENTES';
  end if;
end;
$$;

create unique index uq_df_funcionarios_exames_demissional_pendente_ativo
  on public.df_funcionarios_exames_ocupacionais (empresa_id, funcionario_id)
  where tipo = 'DEMISSIONAL'
    and estado = 'PENDENTE'
    and arquivado = false;

create or replace function public.validar_exame_demissional_manual_2c5d()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_funcionario_arquivado boolean;
begin
  if new.tipo <> 'DEMISSIONAL' then
    return new;
  end if;

  if tg_op = 'INSERT' or old.tipo <> 'DEMISSIONAL' then
    select status, arquivado
      into v_status, v_funcionario_arquivado
    from public.df_funcionarios
    where empresa_id = new.empresa_id
      and id = new.funcionario_id;

    if not found then
      raise exception 'FUNCIONARIO_NAO_ENCONTRADO';
    end if;
    if v_status <> 'desligado' or v_funcionario_arquivado then
      raise exception 'EXAME_DEMISSIONAL_EXIGE_VINCULO_DESLIGADO';
    end if;
  end if;

  if new.estado = 'PENDENTE' and new.arquivado = false and exists (
    select 1
    from public.df_funcionarios_exames_ocupacionais existente
    where existente.empresa_id = new.empresa_id
      and existente.funcionario_id = new.funcionario_id
      and existente.tipo = 'DEMISSIONAL'
      and existente.estado = 'PENDENTE'
      and existente.arquivado = false
      and existente.id <> new.id
  ) then
    raise exception 'EXAME_DEMISSIONAL_PENDENTE_JA_EXISTE';
  end if;

  return new;
end;
$$;

revoke all on function public.validar_exame_demissional_manual_2c5d() from public, anon, authenticated;

create trigger trg_validar_exame_demissional_manual_2c5d
before insert or update of tipo, estado, arquivado
on public.df_funcionarios_exames_ocupacionais
for each row
execute function public.validar_exame_demissional_manual_2c5d();
