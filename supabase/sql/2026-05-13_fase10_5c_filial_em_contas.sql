-- =========================================================
-- FASE 10.5C — FILIAL EM CONTAS
-- Dona Flor Financeiro
-- Objetivo: vincular contas e recorrências a filiais/unidades.
-- =========================================================

-- 1. Adicionar filial_id nas contas.
alter table public.df_contas
  add column if not exists filial_id uuid null;

-- 2. Adicionar filial_id nas recorrências para novas contas recorrentes herdarem a filial.
alter table public.df_contas_recorrentes
  add column if not exists filial_id uuid null;

-- 3. Criar FKs de forma idempotente.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'df_contas_filial_id_fkey'
  ) then
    alter table public.df_contas
      add constraint df_contas_filial_id_fkey
      foreign key (filial_id)
      references public.df_filiais(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'df_contas_recorrentes_filial_id_fkey'
  ) then
    alter table public.df_contas_recorrentes
      add constraint df_contas_recorrentes_filial_id_fkey
      foreign key (filial_id)
      references public.df_filiais(id)
      on delete set null;
  end if;
end $$;

-- 4. Índices para filtros e relatórios.
create index if not exists idx_df_contas_filial
on public.df_contas (filial_id);

create index if not exists idx_df_contas_empresa_filial
on public.df_contas (empresa_id, filial_id);

create index if not exists idx_df_contas_recorrentes_filial
on public.df_contas_recorrentes (filial_id);

create index if not exists idx_df_contas_recorrentes_empresa_filial
on public.df_contas_recorrentes (empresa_id, filial_id);

-- 5. Limpeza defensiva: remove filial_id inválido ou de outra empresa.
update public.df_contas c
set filial_id = null
where filial_id is not null
  and not exists (
    select 1
    from public.df_filiais f
    where f.id = c.filial_id
      and f.empresa_id = c.empresa_id
  );

update public.df_contas_recorrentes r
set filial_id = null
where filial_id is not null
  and not exists (
    select 1
    from public.df_filiais f
    where f.id = r.filial_id
      and f.empresa_id = r.empresa_id
  );

-- 6. Validação.
select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('df_contas', 'df_contas_recorrentes')
  and column_name = 'filial_id'
order by table_name;
