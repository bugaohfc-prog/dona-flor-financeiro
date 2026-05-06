-- =========================================
-- DF Gestão Financeira
-- Marco zero real — recorrência, observação e alertas globais
-- Pode rodar tudo junto no Supabase SQL Editor.
-- =========================================

-- 1) Observação/comentário nas contas
alter table public.df_contas
add column if not exists observacao text;

-- 2) Vínculo da conta gerada com o modelo recorrente
alter table public.df_contas
add column if not exists recorrencia_id uuid;

-- 3) Tabela de modelos de contas recorrentes
create table if not exists public.df_contas_recorrentes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  descricao text not null,
  valor numeric(12,2) not null default 0,
  categoria text,
  forma_pagamento text,
  centro_custo_id uuid,
  observacao text,
  frequencia text not null default 'mensal',
  dia_vencimento integer not null,
  ativo boolean not null default true,
  data_inicio date default current_date,
  data_fim date,
  ultima_geracao date,
  created_at timestamp with time zone default now()
);

-- 4) Garantia de colunas caso a tabela já exista de versão anterior
alter table public.df_contas_recorrentes
add column if not exists categoria text;

alter table public.df_contas_recorrentes
add column if not exists forma_pagamento text;

alter table public.df_contas_recorrentes
add column if not exists centro_custo_id uuid;

alter table public.df_contas_recorrentes
add column if not exists observacao text;

alter table public.df_contas_recorrentes
add column if not exists frequencia text default 'mensal';

alter table public.df_contas_recorrentes
add column if not exists data_fim date;

alter table public.df_contas_recorrentes
add column if not exists ultima_geracao date;

-- 5) Foreign key recorrência -> contas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'df_contas'
      AND constraint_name = 'fk_conta_recorrencia'
  ) THEN
    ALTER TABLE public.df_contas
    ADD CONSTRAINT fk_conta_recorrencia
    FOREIGN KEY (recorrencia_id)
    REFERENCES public.df_contas_recorrentes(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- 6) Configurações globais de alertas por empresa
create table if not exists public.df_configuracoes_alertas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null unique,
  dias_alerta_contas integer default 1,
  alertar_contas_vencidas boolean default true,
  destacar_contas_criticas boolean default true,
  dias_alerta_notas integer default 3,
  destacar_notas_urgentes boolean default true,
  created_at timestamp with time zone default now()
);

-- 7) RLS — recorrência
alter table public.df_contas_recorrentes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'df_contas_recorrentes'
      and policyname = 'contas_recorrentes_empresa'
  ) then
    create policy "contas_recorrentes_empresa"
    on public.df_contas_recorrentes
    for all
    using (
      empresa_id in (
        select empresa_id
        from public.df_usuarios_empresas
        where user_id = auth.uid()
      )
    )
    with check (
      empresa_id in (
        select empresa_id
        from public.df_usuarios_empresas
        where user_id = auth.uid()
      )
    );
  end if;
end $$;

-- 8) RLS — alertas globais
alter table public.df_configuracoes_alertas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'df_configuracoes_alertas'
      and policyname = 'config_alertas_empresa_select'
  ) then
    create policy "config_alertas_empresa_select"
    on public.df_configuracoes_alertas
    for select
    using (
      empresa_id in (
        select empresa_id
        from public.df_usuarios_empresas
        where user_id = auth.uid()
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'df_configuracoes_alertas'
      and policyname = 'config_alertas_empresa_insert'
  ) then
    create policy "config_alertas_empresa_insert"
    on public.df_configuracoes_alertas
    for insert
    with check (
      empresa_id in (
        select empresa_id
        from public.df_usuarios_empresas
        where user_id = auth.uid()
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'df_configuracoes_alertas'
      and policyname = 'config_alertas_empresa_update'
  ) then
    create policy "config_alertas_empresa_update"
    on public.df_configuracoes_alertas
    for update
    using (
      empresa_id in (
        select empresa_id
        from public.df_usuarios_empresas
        where user_id = auth.uid()
      )
    )
    with check (
      empresa_id in (
        select empresa_id
        from public.df_usuarios_empresas
        where user_id = auth.uid()
      )
    );
  end if;
end $$;
