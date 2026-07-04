begin;

do $$
begin
  if to_regclass('public.df_empresas') is null then
    raise exception 'Missing table public.df_empresas';
  end if;

  if to_regclass('public.df_filiais') is null then
    raise exception 'Missing table public.df_filiais';
  end if;

  if to_regclass('public.df_usuarios_empresas') is null then
    raise exception 'Missing table public.df_usuarios_empresas';
  end if;
end $$;

create table if not exists public.df_receitas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.df_empresas(id) on delete restrict,
  filial_id uuid not null references public.df_filiais(id) on delete restrict,
  data_receita date not null,
  ano integer generated always as (extract(year from data_receita)::integer) stored,
  mes integer generated always as (extract(month from data_receita)::integer) stored,
  valor numeric(14,2) not null,
  origem text not null default 'Venda de Loja',
  descricao text not null default 'Receita',
  observacao text null,
  status text not null default 'ativo',
  arquivado boolean not null default false,
  criado_por uuid null,
  atualizado_por uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint df_receitas_valor_positivo check (valor >= 0),
  constraint df_receitas_mes_valido check (mes between 1 and 12),
  constraint df_receitas_status_valido check (status in ('ativo', 'cancelado', 'arquivado')),
  constraint df_receitas_origem_not_blank check (length(btrim(origem)) > 0),
  constraint df_receitas_descricao_not_blank check (length(btrim(descricao)) > 0)
);

create index if not exists idx_df_receitas_empresa_data
on public.df_receitas (empresa_id, data_receita);

create index if not exists idx_df_receitas_empresa_filial_ano_mes
on public.df_receitas (empresa_id, filial_id, ano, mes);

create unique index if not exists uq_df_receitas_empresa_filial_mes_origem
on public.df_receitas (empresa_id, filial_id, ano, mes, lower(origem));

create or replace function public.df_receitas_set_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at = coalesce(new.created_at, now());
    new.updated_at = coalesce(new.updated_at, now());
    new.criado_por = coalesce(new.criado_por, auth.uid());
    new.atualizado_por = coalesce(new.atualizado_por, auth.uid());
  else
    new.updated_at = now();
    new.atualizado_por = coalesce(auth.uid(), new.atualizado_por);
  end if;

  new.origem = nullif(btrim(new.origem), '');
  new.descricao = nullif(btrim(new.descricao), '');
  new.observacao = nullif(btrim(new.observacao), '');

  return new;
end;
$$;

create or replace function public.df_receitas_bloquear_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Physical DELETE is blocked for df_receitas. Use arquivado=true/status=arquivado instead.'
    using errcode = '42501';
end;
$$;

create or replace function public.df_receitas_bloquear_alteracao_empresa()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'empresa_id cannot be changed for df_receitas after insert'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_df_receitas_set_timestamps on public.df_receitas;
create trigger trg_df_receitas_set_timestamps
before insert or update
on public.df_receitas
for each row
execute function public.df_receitas_set_timestamps();

drop trigger if exists trg_df_receitas_bloquear_delete on public.df_receitas;
create trigger trg_df_receitas_bloquear_delete
before delete
on public.df_receitas
for each row
execute function public.df_receitas_bloquear_delete();

drop trigger if exists trg_df_receitas_bloquear_alteracao_empresa on public.df_receitas;
create trigger trg_df_receitas_bloquear_alteracao_empresa
before update
on public.df_receitas
for each row
execute function public.df_receitas_bloquear_alteracao_empresa();

alter table public.df_receitas enable row level security;
alter table public.df_receitas force row level security;

revoke all on public.df_receitas from public;
revoke all on public.df_receitas from anon;
revoke all on public.df_receitas from authenticated;
grant select, insert, update on public.df_receitas to authenticated;

drop policy if exists "df_receitas_select_empresa" on public.df_receitas;
drop policy if exists "df_receitas_insert_financeiro" on public.df_receitas;
drop policy if exists "df_receitas_update_financeiro" on public.df_receitas;

create policy "df_receitas_select_empresa"
on public.df_receitas
for select
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or exists (
      select 1
      from public.df_usuarios_empresas ue
      where ue.empresa_id = df_receitas.empresa_id
        and lower(coalesce(ue.perfil, '')) in ('admin', 'adm', 'administrador', 'gerente', 'master', 'owner', 'superadmin', 'super_admin')
        and (
          ue.user_id = auth.uid()
          or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  )
);

create policy "df_receitas_insert_financeiro"
on public.df_receitas
for insert
to authenticated
with check (
  auth.uid() is not null
  and exists (
    select 1
    from public.df_usuarios_empresas ue
    where ue.empresa_id = df_receitas.empresa_id
      and lower(coalesce(ue.perfil, '')) in ('admin', 'adm', 'administrador', 'gerente', 'master', 'owner', 'superadmin', 'super_admin')
      and (
        ue.user_id = auth.uid()
        or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

create policy "df_receitas_update_financeiro"
on public.df_receitas
for update
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1
    from public.df_usuarios_empresas ue
    where ue.empresa_id = df_receitas.empresa_id
      and lower(coalesce(ue.perfil, '')) in ('admin', 'adm', 'administrador', 'gerente', 'master', 'owner', 'superadmin', 'super_admin')
      and (
        ue.user_id = auth.uid()
        or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
)
with check (
  auth.uid() is not null
  and exists (
    select 1
    from public.df_usuarios_empresas ue
    where ue.empresa_id = df_receitas.empresa_id
      and lower(coalesce(ue.perfil, '')) in ('admin', 'adm', 'administrador', 'gerente', 'master', 'owner', 'superadmin', 'super_admin')
      and (
        ue.user_id = auth.uid()
        or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

with base as (
  select
    '4f13dbfc-6da5-4130-b952-4723409a9e01'::uuid as empresa_id,
    'Venda de Loja'::text as origem,
    'Faturamento mensal 2025'::text as descricao
),
filiais as (
  select 'andradina' as chave, '11bcb631-98c4-4f8f-90d1-5d73d92dea99'::uuid as filial_id
  union all select 'tres_lagoas', '4e55f8a6-50f0-4bb2-a4f6-38d2f9a487d2'::uuid
  union all select 'paranaiba', 'd5b0a887-e425-4e5d-9edd-517a96eaa26d'::uuid
  union all select 'brilho', 'b043a198-411e-4fc8-9e75-92b5e47a4c01'::uuid
),
dados(chave_filial, mes, valor) as (
  values
    ('andradina', 1, 124512.00), ('tres_lagoas', 1, 68299.00), ('paranaiba', 1, 19710.00), ('brilho', 1, 15623.00),
    ('andradina', 2, 134637.00), ('tres_lagoas', 2, 101422.00), ('paranaiba', 2, 21917.00), ('brilho', 2, 21864.00),
    ('andradina', 3, 128960.00), ('tres_lagoas', 3, 103580.00), ('paranaiba', 3, 25666.00), ('brilho', 3, 36073.00),
    ('andradina', 4, 152520.00), ('tres_lagoas', 4, 89273.00), ('paranaiba', 4, 27254.00), ('brilho', 4, 16493.00),
    ('andradina', 5, 200126.00), ('tres_lagoas', 5, 122989.00), ('paranaiba', 5, 34157.00), ('brilho', 5, 32531.00),
    ('andradina', 6, 194744.00), ('tres_lagoas', 6, 143325.00), ('paranaiba', 6, 33032.00), ('brilho', 6, 36961.00),
    ('andradina', 7, 168817.00), ('tres_lagoas', 7, 117161.00), ('paranaiba', 7, 36186.00), ('brilho', 7, 40766.00),
    ('andradina', 8, 154842.00), ('tres_lagoas', 8, 114096.00), ('paranaiba', 8, 14847.00), ('brilho', 8, 32999.00),
    ('andradina', 9, 165997.00), ('tres_lagoas', 9, 126421.00), ('paranaiba', 9, 31582.00), ('brilho', 9, 49840.00),
    ('andradina', 10, 167326.00), ('tres_lagoas', 10, 158557.00), ('paranaiba', 10, 24196.00), ('brilho', 10, 33367.00),
    ('andradina', 11, 233539.00), ('tres_lagoas', 11, 162601.00), ('paranaiba', 11, 29196.00), ('brilho', 11, 37995.00),
    ('andradina', 12, 539597.00), ('tres_lagoas', 12, 400358.00), ('paranaiba', 12, 73980.00), ('brilho', 12, 51841.00)
)
insert into public.df_receitas (
  empresa_id,
  filial_id,
  data_receita,
  valor,
  origem,
  descricao,
  observacao,
  status,
  arquivado
)
select
  b.empresa_id,
  f.filial_id,
  make_date(2025, d.mes, 1),
  d.valor,
  b.origem,
  b.descricao,
  'Carga inicial baseada no PDF Resultados de vendas 2025.',
  'ativo',
  false
from dados d
join filiais f on f.chave = d.chave_filial
cross join base b
on conflict (empresa_id, filial_id, ano, mes, lower(origem)) do nothing;

commit;
