-- =========================================================
-- DNA Gestao - Gestao de Pessoas
-- Fechamento de Folha: itens detalhados dos lancamentos
--
-- Objetivo:
-- - Criar public.df_folha_lancamento_itens.
-- - Manter itens ativos como fonte operacional de verdade.
-- - Materializar a soma dos itens ativos em df_folha_lancamentos.valor.
-- - Preservar RLS, multiempresa, LGPD e arquivamento logico.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_folha_competencias') is null then
    raise exception 'public.df_folha_competencias must exist before creating folha item details';
  end if;

  if to_regclass('public.df_folha_lancamentos') is null then
    raise exception 'public.df_folha_lancamentos must exist before creating folha item details';
  end if;

  if to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') is null then
    raise exception 'public.df_funcionarios_pode_escrever(uuid) must exist before creating folha item details RLS';
  end if;
end $$;

create table if not exists public.df_folha_lancamento_itens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null
    references public.df_empresas(id)
    on delete restrict,
  competencia_id uuid not null
    references public.df_folha_competencias(id)
    on delete restrict,
  lancamento_id uuid not null
    references public.df_folha_lancamentos(id)
    on delete restrict,
  funcionario_id uuid not null
    references public.df_funcionarios(id)
    on delete restrict,
  filial_id uuid null
    references public.df_filiais(id)
    on delete restrict,
  categoria text not null,
  descricao text null,
  data_referencia date null,
  quantidade numeric(12,2) null,
  percentual numeric(7,2) null,
  valor_base numeric(12,2) null,
  valor numeric(12,2) not null default 0,
  observacao_administrativa text null,
  origem_item text null,
  conferido boolean not null default false,
  conferido_em timestamptz null,
  conferido_por uuid null,
  arquivado boolean not null default false,
  arquivado_em timestamptz null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint df_folha_lancamento_itens_categoria_check
    check (categoria in (
      'compras_vales',
      'falta_injustificada',
      'hora_extra_50',
      'hora_extra_60',
      'hora_extra_100',
      'premiacao'
    )),

  constraint df_folha_lancamento_itens_descricao_curta_check
    check (descricao is null or char_length(descricao) <= 180),

  constraint df_folha_lancamento_itens_origem_curta_check
    check (origem_item is null or char_length(origem_item) <= 80),

  constraint df_folha_lancamento_itens_numeros_nao_negativos_check
    check (
      (quantidade is null or quantidade >= 0)
      and (percentual is null or percentual >= 0)
      and (valor_base is null or valor_base >= 0)
      and valor >= 0
    ),

  constraint df_folha_lancamento_itens_conferido_em_check
    check (conferido = true or conferido_em is null),

  constraint df_folha_lancamento_itens_arquivado_em_check
    check (arquivado = true or arquivado_em is null),

  constraint df_folha_lancamento_itens_regras_categoria_check
    check (
      (
        categoria = 'compras_vales'
        and valor > 0
        and percentual is null
        and valor_base is null
      )
      or (
        categoria = 'falta_injustificada'
        and data_referencia is not null
        and quantidade > 0
        and percentual is null
        and valor_base is null
        and valor = 0
      )
      or (
        categoria = 'hora_extra_50'
        and quantidade > 0
        and percentual = 50
        and valor_base is null
        and valor = 0
      )
      or (
        categoria = 'hora_extra_60'
        and quantidade > 0
        and percentual = 60
        and valor_base is null
        and valor = 0
      )
      or (
        categoria = 'hora_extra_100'
        and quantidade > 0
        and percentual = 100
        and valor_base is null
        and valor = 0
      )
      or (
        categoria = 'premiacao'
        and valor_base > 0
        and percentual > 0
        and quantidade is null
        and valor = round((valor_base * percentual / 100)::numeric, 2)
      )
    )
);

comment on table public.df_folha_lancamento_itens is
  'Gestao de Pessoas: itens detalhados dos lancamentos do Fechamento de Folha. Uso administrativo; nao registrar dados medicos, documentos, CID, laudos, diagnosticos ou anexos.';

comment on column public.df_folha_lancamento_itens.valor_base is
  'Base administrativa de calculo do item, usada inicialmente para premiacao. Nao representa modulo de vendas.';

comment on column public.df_folha_lancamento_itens.valor is
  'Valor do item. Para faltas e horas extras informativas deve ser 0; para premiacao deve ser calculado por valor_base * percentual / 100.';

comment on column public.df_folha_lancamento_itens.observacao_administrativa is
  'Uso administrativo. Nao registrar dados medicos, CID, laudos, diagnosticos, documentos, anexos ou informacoes clinicas.';

comment on column public.df_folha_lancamento_itens.descricao is
  'Descricao administrativa curta do item. Nao usar para dados medicos, documentos, laudos, CID, diagnosticos ou informacoes clinicas.';

create index if not exists idx_df_folha_lancamento_itens_empresa_id
on public.df_folha_lancamento_itens (empresa_id);

create index if not exists idx_df_folha_lancamento_itens_competencia_id
on public.df_folha_lancamento_itens (competencia_id);

create index if not exists idx_df_folha_lancamento_itens_lancamento_id
on public.df_folha_lancamento_itens (lancamento_id);

create index if not exists idx_df_folha_lancamento_itens_funcionario_id
on public.df_folha_lancamento_itens (funcionario_id);

create index if not exists idx_df_folha_lancamento_itens_categoria
on public.df_folha_lancamento_itens (categoria);

create index if not exists idx_df_folha_lancamento_itens_arquivado
on public.df_folha_lancamento_itens (arquivado);

create index if not exists idx_df_folha_lancamento_itens_data_referencia
on public.df_folha_lancamento_itens (data_referencia);

create index if not exists idx_df_folha_lancamento_itens_empresa_comp_func
on public.df_folha_lancamento_itens (empresa_id, competencia_id, funcionario_id);

create or replace function public.df_folha_lancamento_itens_set_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.criado_em = coalesce(new.criado_em, now());
    new.atualizado_em = coalesce(new.atualizado_em, now());
  else
    new.atualizado_em = now();
  end if;

  if new.arquivado = true and new.arquivado_em is null then
    new.arquivado_em = now();
  elsif new.arquivado = false then
    new.arquivado_em = null;
  end if;

  if new.conferido = true and new.conferido_em is null then
    new.conferido_em = now();
  elsif new.conferido = false then
    new.conferido_em = null;
  end if;

  return new;
end;
$$;

create or replace function public.df_folha_lancamento_itens_bloquear_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Physical DELETE is blocked for df_folha_lancamento_itens. Use arquivado=true instead.'
    using errcode = '42501';
end;
$$;

create or replace function public.df_folha_lancamento_itens_bloquear_alteracao_empresa()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'empresa_id cannot be changed for df_folha_lancamento_itens after insert'
      using errcode = '23514';
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

  if not exists (
    select 1
    from public.df_folha_competencias c
    where c.id = new.competencia_id
      and c.empresa_id = new.empresa_id
  ) then
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

  return new;
end;
$$;

create or replace function public.df_folha_lancamento_itens_recalcular_lancamento(p_lancamento_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  update public.df_folha_lancamentos l
  set valor = coalesce((
    select sum(i.valor)
    from public.df_folha_lancamento_itens i
    where i.lancamento_id = p_lancamento_id
      and i.arquivado = false
  ), 0)
  where l.id = p_lancamento_id;
end;
$$;

create or replace function public.df_folha_lancamento_itens_recalcular_lancamento_trigger()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.df_folha_lancamento_itens_recalcular_lancamento(new.lancamento_id);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.lancamento_id is distinct from new.lancamento_id then
      perform public.df_folha_lancamento_itens_recalcular_lancamento(old.lancamento_id);
    end if;

    perform public.df_folha_lancamento_itens_recalcular_lancamento(new.lancamento_id);
    return new;
  end if;

  if tg_op = 'DELETE' then
    perform public.df_folha_lancamento_itens_recalcular_lancamento(old.lancamento_id);
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_df_folha_lancamento_itens_set_timestamps on public.df_folha_lancamento_itens;
create trigger trg_df_folha_lancamento_itens_set_timestamps
before insert or update
on public.df_folha_lancamento_itens
for each row
execute function public.df_folha_lancamento_itens_set_timestamps();

drop trigger if exists trg_df_folha_lancamento_itens_bloquear_delete on public.df_folha_lancamento_itens;
create trigger trg_df_folha_lancamento_itens_bloquear_delete
before delete
on public.df_folha_lancamento_itens
for each row
execute function public.df_folha_lancamento_itens_bloquear_delete();

drop trigger if exists trg_df_folha_lancamento_itens_bloquear_alteracao_empresa on public.df_folha_lancamento_itens;
create trigger trg_df_folha_lancamento_itens_bloquear_alteracao_empresa
before update
on public.df_folha_lancamento_itens
for each row
execute function public.df_folha_lancamento_itens_bloquear_alteracao_empresa();

drop trigger if exists trg_df_folha_lancamento_itens_validar_vinculos on public.df_folha_lancamento_itens;
create trigger trg_df_folha_lancamento_itens_validar_vinculos
before insert or update of empresa_id, competencia_id, lancamento_id, funcionario_id, filial_id, categoria
on public.df_folha_lancamento_itens
for each row
execute function public.df_folha_lancamento_itens_validar_vinculos();

drop trigger if exists trg_df_folha_lancamento_itens_recalcular_lancamento on public.df_folha_lancamento_itens;
create trigger trg_df_folha_lancamento_itens_recalcular_lancamento
after insert or update or delete
on public.df_folha_lancamento_itens
for each row
execute function public.df_folha_lancamento_itens_recalcular_lancamento_trigger();

revoke all on function public.df_folha_lancamento_itens_set_timestamps() from public, anon, authenticated;
revoke all on function public.df_folha_lancamento_itens_bloquear_delete() from public, anon, authenticated;
revoke all on function public.df_folha_lancamento_itens_bloquear_alteracao_empresa() from public, anon, authenticated;
revoke all on function public.df_folha_lancamento_itens_validar_vinculos() from public, anon, authenticated;
revoke all on function public.df_folha_lancamento_itens_recalcular_lancamento(uuid) from public, anon, authenticated;
revoke all on function public.df_folha_lancamento_itens_recalcular_lancamento_trigger() from public, anon, authenticated;

alter table public.df_folha_lancamento_itens enable row level security;
alter table public.df_folha_lancamento_itens force row level security;

revoke all on public.df_folha_lancamento_itens from public;
revoke all on public.df_folha_lancamento_itens from anon;
revoke all on public.df_folha_lancamento_itens from authenticated;
grant select, insert, update on public.df_folha_lancamento_itens to authenticated;
revoke delete on public.df_folha_lancamento_itens from authenticated;

drop policy if exists "df_folha_lancamento_itens_select_admin_master" on public.df_folha_lancamento_itens;
drop policy if exists "df_folha_lancamento_itens_insert_admin_master" on public.df_folha_lancamento_itens;
drop policy if exists "df_folha_lancamento_itens_update_admin_master" on public.df_folha_lancamento_itens;

create policy "df_folha_lancamento_itens_select_admin_master"
on public.df_folha_lancamento_itens
for select
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

create policy "df_folha_lancamento_itens_insert_admin_master"
on public.df_folha_lancamento_itens
for insert
to authenticated
with check (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

create policy "df_folha_lancamento_itens_update_admin_master"
on public.df_folha_lancamento_itens
for update
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
)
with check (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

do $$
declare
  unsafe_policies text;
  delete_grants integer;
  anon_grants integer;
begin
  select string_agg(policyname || ':' || cmd, ', ')
    into unsafe_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'df_folha_lancamento_itens'
    and cmd in ('ALL', 'DELETE');

  if unsafe_policies is not null then
    raise exception 'Unsafe policies found on df_folha_lancamento_itens: %', unsafe_policies;
  end if;

  select count(*)
    into delete_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'df_folha_lancamento_itens'
    and grantee = 'authenticated'
    and privilege_type = 'DELETE';

  if delete_grants > 0 then
    raise exception 'authenticated must not have DELETE on df_folha_lancamento_itens';
  end if;

  select count(*)
    into anon_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'df_folha_lancamento_itens'
    and grantee = 'anon';

  if anon_grants > 0 then
    raise exception 'anon must not have grants on df_folha_lancamento_itens';
  end if;
end $$;

commit;
