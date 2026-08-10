begin;

create or replace function public.df_folha_lancamentos_validar_vinculos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_competencia text;
  v_validar_data_falta boolean := false;
begin
  select c.competencia
    into v_competencia
  from public.df_folha_competencias c
  where c.id = new.competencia_id
    and c.empresa_id = new.empresa_id;

  if not found then
    raise exception 'competencia_id must belong to the same empresa_id'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.df_funcionarios f
    where f.id = new.funcionario_id
      and f.empresa_id = new.empresa_id
  ) then
    raise exception 'funcionario_id must belong to the same empresa_id'
      using errcode = '23514';
  end if;

  if new.filial_id is not null and not exists (
    select 1
    from public.df_filiais fl
    where fl.id = new.filial_id
      and fl.empresa_id = new.empresa_id
  ) then
    raise exception 'filial_id must belong to the same empresa_id'
      using errcode = '23514';
  end if;

  if new.categoria = 'falta_injustificada' and new.data_referencia is not null then
    if tg_op = 'INSERT' then
      v_validar_data_falta := true;
    elsif tg_op = 'UPDATE' then
      v_validar_data_falta := not coalesce(new.arquivado, false) and (
        coalesce(old.arquivado, false)
        or new.data_referencia is distinct from old.data_referencia
        or new.competencia_id is distinct from old.competencia_id
        or new.categoria is distinct from old.categoria
      );
    end if;
  end if;

  if v_validar_data_falta
     and to_char(new.data_referencia, 'YYYY-MM') <> v_competencia then
    raise exception 'DATA_FALTA_FORA_COMPETENCIA'
      using errcode = '23514',
            detail = format(
              'data_referencia %s nao pertence a competencia %s',
              new.data_referencia,
              v_competencia
            );
  end if;

  return new;
end;
$$;

create or replace function public.df_folha_lancamento_itens_validar_vinculos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_competencia text;
  v_validar_data_falta boolean := false;
begin
  if not exists (
    select 1
    from public.df_folha_lancamentos l
    where l.id = new.lancamento_id
      and l.empresa_id = new.empresa_id
      and l.competencia_id = new.competencia_id
      and l.funcionario_id = new.funcionario_id
      and l.categoria = new.categoria
  ) then
    raise exception 'lancamento_id must belong to the same empresa_id, competencia_id, funcionario_id and categoria'
      using errcode = '23514';
  end if;

  select c.competencia
    into v_competencia
  from public.df_folha_competencias c
  where c.id = new.competencia_id
    and c.empresa_id = new.empresa_id;

  if not found then
    raise exception 'competencia_id must belong to the same empresa_id'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.df_funcionarios f
    where f.id = new.funcionario_id
      and f.empresa_id = new.empresa_id
  ) then
    raise exception 'funcionario_id must belong to the same empresa_id'
      using errcode = '23514';
  end if;

  if new.filial_id is not null and not exists (
    select 1
    from public.df_filiais fl
    where fl.id = new.filial_id
      and fl.empresa_id = new.empresa_id
  ) then
    raise exception 'filial_id must belong to the same empresa_id'
      using errcode = '23514';
  end if;

  if new.categoria = 'falta_injustificada' and new.data_referencia is not null then
    if tg_op = 'INSERT' then
      v_validar_data_falta := true;
    elsif tg_op = 'UPDATE' then
      v_validar_data_falta := not coalesce(new.arquivado, false) and (
        coalesce(old.arquivado, false)
        or new.data_referencia is distinct from old.data_referencia
        or new.competencia_id is distinct from old.competencia_id
        or new.categoria is distinct from old.categoria
      );
    end if;
  end if;

  if v_validar_data_falta
     and to_char(new.data_referencia, 'YYYY-MM') <> v_competencia then
    raise exception 'DATA_FALTA_FORA_COMPETENCIA'
      using errcode = '23514',
            detail = format(
              'data_referencia %s nao pertence a competencia %s',
              new.data_referencia,
              v_competencia
            );
  end if;

  return new;
end;
$$;

commit;
