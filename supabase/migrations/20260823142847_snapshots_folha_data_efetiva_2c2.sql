begin;

alter table public.df_folha_lancamentos
  add column funcionario_nome_snapshot text,
  add column pessoa_id_snapshot uuid,
  add column filial_id_snapshot uuid,
  add column filial_nome_snapshot text,
  add column cargo_snapshot text,
  add column data_admissao_snapshot date,
  add column snapshot_origem text,
  add column snapshot_capturado_em timestamp with time zone;

comment on column public.df_folha_lancamentos.funcionario_nome_snapshot is
  'Nome historico do colaborador no momento do lancamento; legado reconstruido e identificado por snapshot_origem.';
comment on column public.df_folha_lancamentos.pessoa_id_snapshot is
  'Identidade tenant-local associada ao vinculo no momento do snapshot; funcionario_id continua sendo a autoridade do vinculo.';
comment on column public.df_folha_lancamentos.snapshot_origem is
  'capturado_criacao_v1 para novos registros ou legacy_backfill_v1 para reconstrução conservadora do legado.';

update public.df_folha_lancamentos l
set funcionario_nome_snapshot = p.nome,
    pessoa_id_snapshot = f.pessoa_id,
    filial_id_snapshot = coalesce(l.filial_id, f.filial_id),
    filial_nome_snapshot = (
      select coalesce(fi.razao_social, fi.nome)
      from public.df_filiais fi
      where fi.empresa_id = f.empresa_id
        and fi.id = coalesce(l.filial_id, f.filial_id)
    ),
    cargo_snapshot = nullif(btrim(f.cargo), ''),
    data_admissao_snapshot = f.data_admissao,
    snapshot_origem = 'legacy_backfill_v1',
    snapshot_capturado_em = now()
from public.df_funcionarios f
join public.df_pessoas p
  on p.empresa_id = f.empresa_id
 and p.id = f.pessoa_id
where f.empresa_id = l.empresa_id
  and f.id = l.funcionario_id;

do $$
declare
  v_total bigint;
  v_sem_snapshot bigint;
begin
  select count(*) into v_total from public.df_folha_lancamentos;
  select count(*) into v_sem_snapshot
  from public.df_folha_lancamentos
  where pessoa_id_snapshot is null
     or nullif(btrim(funcionario_nome_snapshot), '') is null
     or snapshot_origem is null
     or snapshot_capturado_em is null;

  if v_sem_snapshot <> 0 then
    raise exception 'BACKFILL_SNAPSHOT_FOLHA_INCOMPLETO: % de % lancamentos sem identidade comprovavel.',
      v_sem_snapshot, v_total;
  end if;
end;
$$;

alter table public.df_folha_lancamentos
  alter column funcionario_nome_snapshot set not null,
  alter column pessoa_id_snapshot set not null,
  alter column snapshot_origem set not null,
  alter column snapshot_capturado_em set not null,
  add constraint df_folha_lancamentos_snapshot_nome_check
    check (nullif(btrim(funcionario_nome_snapshot), '') is not null),
  add constraint df_folha_lancamentos_snapshot_origem_check
    check (snapshot_origem in ('capturado_criacao_v1', 'legacy_backfill_v1'));

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
begin
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
    select f.pessoa_id,
           p.nome,
           coalesce(new.filial_id, f.filial_id),
           coalesce(fi.razao_social, fi.nome),
           nullif(btrim(f.cargo), ''),
           f.data_admissao
      into v_pessoa_id, v_nome, v_filial_id, v_filial_nome, v_cargo, v_data_admissao
    from public.df_funcionarios f
    join public.df_pessoas p
      on p.empresa_id = f.empresa_id
     and p.id = f.pessoa_id
    left join public.df_filiais fi
      on fi.empresa_id = f.empresa_id
     and fi.id = coalesce(new.filial_id, f.filial_id)
    where f.empresa_id = new.empresa_id
      and f.id = new.funcionario_id;

    if not found or v_pessoa_id is null or nullif(btrim(v_nome), '') is null then
      raise exception 'IDENTIDADE_FOLHA_NAO_ENCONTRADA';
    end if;

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
      new.data_referencia
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_df_folha_lancamentos_snapshot_data_2c2
  on public.df_folha_lancamentos;
create trigger trg_df_folha_lancamentos_snapshot_data_2c2
before insert or update
on public.df_folha_lancamentos
for each row
execute function public.df_folha_lancamentos_snapshot_data_2c2();

create or replace function public.df_folha_itens_data_efetiva_2c2()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_empresa_id uuid;
  v_funcionario_id uuid;
  v_data_lancamento date;
begin
  select l.empresa_id, l.funcionario_id, l.data_referencia
    into v_empresa_id, v_funcionario_id, v_data_lancamento
  from public.df_folha_lancamentos l
  where l.id = new.lancamento_id
    and l.empresa_id = new.empresa_id;

  if not found then
    raise exception 'LANCAMENTO_PAI_FOLHA_NAO_ENCONTRADO';
  end if;

  perform public.df_folha_validar_data_efetiva_2c2(
    v_empresa_id,
    v_funcionario_id,
    coalesce(new.data_referencia, v_data_lancamento)
  );

  return new;
end;
$$;

drop trigger if exists trg_df_folha_itens_data_efetiva_2c2
  on public.df_folha_lancamento_itens;
create trigger trg_df_folha_itens_data_efetiva_2c2
before insert or update of data_referencia, lancamento_id, funcionario_id
on public.df_folha_lancamento_itens
for each row
execute function public.df_folha_itens_data_efetiva_2c2();

revoke all on function public.df_folha_validar_data_efetiva_2c2(uuid, uuid, date)
  from public, anon, authenticated;
revoke all on function public.df_folha_lancamentos_snapshot_data_2c2()
  from public, anon, authenticated;
revoke all on function public.df_folha_itens_data_efetiva_2c2()
  from public, anon, authenticated;

do $$
declare
  v_total bigint;
  v_snapshot bigint;
begin
  select count(*) into v_total from public.df_folha_lancamentos;
  select count(*) into v_snapshot
  from public.df_folha_lancamentos
  where snapshot_origem = 'legacy_backfill_v1';

  if v_total <> v_snapshot then
    raise exception 'PROVENIENCIA_BACKFILL_FOLHA_DIVERGENTE: % de %.', v_snapshot, v_total;
  end if;
end;
$$;

commit;
