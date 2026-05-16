-- =========================================================
-- FASE 11.5.2 — HOTFIX SCHEMA FILIAL_ID
-- Dona Flor Financeiro
-- Objetivo: alinhar Supabase com o código pós-deploy.
-- Corrige erros de schema cache em:
--   - df_notas.filial_id
--   - df_contas_recorrentes.filial_id
-- Script idempotente: pode rodar mais de uma vez.
-- =========================================================

alter table public.df_notas
  add column if not exists filial_id uuid null;

alter table public.df_contas_recorrentes
  add column if not exists filial_id uuid null;

alter table public.df_contas
  add column if not exists filial_id uuid null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'df_notas_filial_id_fkey'
  ) then
    alter table public.df_notas
      add constraint df_notas_filial_id_fkey
      foreign key (filial_id)
      references public.df_filiais(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'df_contas_recorrentes_filial_id_fkey'
  ) then
    alter table public.df_contas_recorrentes
      add constraint df_contas_recorrentes_filial_id_fkey
      foreign key (filial_id)
      references public.df_filiais(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'df_contas_filial_id_fkey'
  ) then
    alter table public.df_contas
      add constraint df_contas_filial_id_fkey
      foreign key (filial_id)
      references public.df_filiais(id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_df_notas_filial
on public.df_notas (filial_id);

create index if not exists idx_df_notas_empresa_filial
on public.df_notas (empresa_id, filial_id);

create index if not exists idx_df_contas_recorrentes_filial
on public.df_contas_recorrentes (filial_id);

create index if not exists idx_df_contas_recorrentes_empresa_filial
on public.df_contas_recorrentes (empresa_id, filial_id);

create index if not exists idx_df_contas_filial
on public.df_contas (filial_id);

create index if not exists idx_df_contas_empresa_filial
on public.df_contas (empresa_id, filial_id);

-- Limpeza defensiva para não manter vínculo de outra empresa.
update public.df_notas n
set filial_id = null
where filial_id is not null
  and not exists (
    select 1
    from public.df_filiais f
    where f.id = n.filial_id
      and f.empresa_id = n.empresa_id
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

update public.df_contas c
set filial_id = null
where filial_id is not null
  and not exists (
    select 1
    from public.df_filiais f
    where f.id = c.filial_id
      and f.empresa_id = c.empresa_id
  );

select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('df_notas', 'df_contas', 'df_contas_recorrentes')
  and column_name = 'filial_id'
order by table_name;
