begin;

do $$
begin
  if to_regclass('public.df_folha_competencias') is null
     or to_regclass('public.df_folha_lancamentos') is null
     or to_regprocedure('public.df_funcionario_filial_na_data_lote3(uuid,uuid,date)') is null
     or to_regprocedure('public.df_folha_validar_data_efetiva_2c2(uuid,uuid,date)') is null then
    raise exception 'DEPENDENCIA_LOTACAO_FOLHA_COMPETENCIA_LOTE3A_AUSENTE';
  end if;
end $$;

create or replace function public.df_folha_lancamentos_snapshot_data_2c2()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_pessoa_id uuid;
  v_nome text;
  v_filial_id uuid;
  v_filial_nome text;
  v_cargo text;
  v_data_admissao date;
  v_competencia text;
  v_data_lotacao date;
begin
  select c.competencia
    into v_competencia
  from public.df_folha_competencias c
  where c.empresa_id = new.empresa_id
    and c.id = new.competencia_id;

  if not found then
    raise exception 'COMPETENCIA_FOLHA_NAO_ENCONTRADA';
  end if;

  v_data_lotacao := coalesce(
    new.data_referencia,
    (to_date(v_competencia || '-01', 'YYYY-MM-DD') + interval '1 month - 1 day')::date
  );

  if tg_op = 'UPDATE' then
    if new.funcionario_nome_snapshot is distinct from old.funcionario_nome_snapshot
      or new.pessoa_id_snapshot is distinct from old.pessoa_id_snapshot
      or new.filial_id_snapshot is distinct from old.filial_id_snapshot
      or new.filial_nome_snapshot is distinct from old.filial_nome_snapshot
      or new.cargo_snapshot is distinct from old.cargo_snapshot
      or new.data_admissao_snapshot is distinct from old.data_admissao_snapshot
      or new.snapshot_origem is distinct from old.snapshot_origem
      or new.snapshot_capturado_em is distinct from old.snapshot_capturado_em then
      raise exception 'SNAPSHOT_FOLHA_IMUTAVEL';
    end if;
    if new.funcionario_id is distinct from old.funcionario_id then
      raise exception 'FUNCIONARIO_LANCAMENTO_FOLHA_IMUTAVEL';
    end if;
    if new.empresa_id is distinct from old.empresa_id then
      raise exception 'EMPRESA_LANCAMENTO_FOLHA_IMUTAVEL';
    end if;
  else
    v_filial_id := public.df_funcionario_filial_na_data_lote3(
      new.empresa_id,
      new.funcionario_id,
      v_data_lotacao
    );

    select f.pessoa_id, p.nome, coalesce(fi.razao_social, fi.nome),
           nullif(btrim(f.cargo), ''), f.data_admissao
      into v_pessoa_id, v_nome, v_filial_nome, v_cargo, v_data_admissao
    from public.df_funcionarios f
    join public.df_pessoas p
      on p.empresa_id = f.empresa_id
     and p.id = f.pessoa_id
    left join public.df_filiais fi
      on fi.empresa_id = f.empresa_id
     and fi.id = v_filial_id
    where f.empresa_id = new.empresa_id
      and f.id = new.funcionario_id;

    if not found or v_pessoa_id is null or nullif(btrim(v_nome), '') is null then
      raise exception 'IDENTIDADE_FOLHA_NAO_ENCONTRADA';
    end if;

    new.filial_id := v_filial_id;
    new.funcionario_nome_snapshot := v_nome;
    new.pessoa_id_snapshot := v_pessoa_id;
    new.filial_id_snapshot := v_filial_id;
    new.filial_nome_snapshot := v_filial_nome;
    new.cargo_snapshot := v_cargo;
    new.data_admissao_snapshot := v_data_admissao;
    new.snapshot_origem := 'capturado_criacao_v1';
    new.snapshot_capturado_em := now();
  end if;

  if tg_op = 'INSERT'
    or new.data_referencia is distinct from old.data_referencia
    or new.funcionario_id is distinct from old.funcionario_id then
    perform public.df_folha_validar_data_efetiva_2c2(
      new.empresa_id,
      new.funcionario_id,
      v_data_lotacao
    );
  end if;

  return new;
end;
$$;

commit;
