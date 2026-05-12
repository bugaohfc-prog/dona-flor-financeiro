-- =========================================
-- FASE 10.1 — RLS READY PREPARATION
-- Dona Flor Financeiro
-- =========================================
-- Objetivo:
-- preparar funções, índices e guardrails para RLS futuro.
--
-- IMPORTANTE:
-- Este script NÃO ativa RLS e NÃO cria policies restritivas.
-- Ele é seguro para rodar antes da ativação real da segurança por linhas.
-- =========================================

-- =========================================
-- 1. FUNÇÕES BASE PARA POLICIES FUTURAS
-- =========================================

create or replace function public.df_usuario_is_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.df_usuarios_master m
    where coalesce(m.ativo, true) = true
      and (
        m.user_id = auth.uid()
        or lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

create or replace function public.df_usuario_tem_empresa(p_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.df_usuario_is_master()
    or exists (
      select 1
      from public.df_usuarios_empresas ue
      where ue.empresa_id = p_empresa_id
        and (
          ue.user_id = auth.uid()
          or lower(ue.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    );
$$;

grant execute on function public.df_usuario_is_master() to authenticated;
grant execute on function public.df_usuario_tem_empresa(uuid) to authenticated;

-- =========================================
-- 2. ÍNDICES PARA CONSULTAS TENANT-AWARE
-- =========================================

create index if not exists idx_df_empresas_id
  on public.df_empresas (id);

create index if not exists idx_df_usuarios_master_user_ativo
  on public.df_usuarios_master (user_id, ativo);

create index if not exists idx_df_usuarios_master_email_ativo
  on public.df_usuarios_master (lower(email), ativo);

create index if not exists idx_df_usuarios_empresas_user_empresa
  on public.df_usuarios_empresas (user_id, empresa_id);

create index if not exists idx_df_usuarios_empresas_email_empresa
  on public.df_usuarios_empresas (lower(email), empresa_id);

create index if not exists idx_df_contas_empresa_status_excluido
  on public.df_contas (empresa_id, status, excluido);

create index if not exists idx_df_contas_empresa_vencimento
  on public.df_contas (empresa_id, data_vencimento);

create index if not exists idx_df_notas_empresa_excluido
  on public.df_notas (empresa_id, excluido);

create index if not exists idx_df_centros_custo_empresa
  on public.df_centros_custo (empresa_id);

create index if not exists idx_df_contas_recorrentes_empresa
  on public.df_contas_recorrentes (empresa_id, ativo);

create index if not exists idx_df_configuracoes_empresa
  on public.df_configuracoes (empresa_id);

create index if not exists idx_df_configuracoes_alertas_empresa
  on public.df_configuracoes_alertas (empresa_id);

-- =========================================
-- 3. FOREIGN KEYS NÃO VALIDANTES
-- =========================================
-- NOT VALID evita travar por dados legados antigos.
-- A validação completa fica para a fase posterior, após auditoria.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_df_contas_empresa'
  ) THEN
    ALTER TABLE public.df_contas
      ADD CONSTRAINT fk_df_contas_empresa
      FOREIGN KEY (empresa_id) REFERENCES public.df_empresas(id) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_df_notas_empresa'
  ) THEN
    ALTER TABLE public.df_notas
      ADD CONSTRAINT fk_df_notas_empresa
      FOREIGN KEY (empresa_id) REFERENCES public.df_empresas(id) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_df_centros_custo_empresa'
  ) THEN
    ALTER TABLE public.df_centros_custo
      ADD CONSTRAINT fk_df_centros_custo_empresa
      FOREIGN KEY (empresa_id) REFERENCES public.df_empresas(id) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_df_contas_recorrentes_empresa'
  ) THEN
    ALTER TABLE public.df_contas_recorrentes
      ADD CONSTRAINT fk_df_contas_recorrentes_empresa
      FOREIGN KEY (empresa_id) REFERENCES public.df_empresas(id) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_df_configuracoes_empresa'
  ) THEN
    ALTER TABLE public.df_configuracoes
      ADD CONSTRAINT fk_df_configuracoes_empresa
      FOREIGN KEY (empresa_id) REFERENCES public.df_empresas(id) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_df_configuracoes_alertas_empresa'
  ) THEN
    ALTER TABLE public.df_configuracoes_alertas
      ADD CONSTRAINT fk_df_configuracoes_alertas_empresa
      FOREIGN KEY (empresa_id) REFERENCES public.df_empresas(id) NOT VALID;
  END IF;
END $$;

-- =========================================
-- 4. AUDITORIA RÁPIDA ANTES DA FASE 10.2/10.3
-- =========================================
-- Se algum total_sem_empresa vier maior que zero, corrigir antes de ativar RLS.

select 'df_contas' as tabela, count(*) as total_sem_empresa
from public.df_contas
where empresa_id is null
union all
select 'df_notas', count(*)
from public.df_notas
where empresa_id is null
union all
select 'df_centros_custo', count(*)
from public.df_centros_custo
where empresa_id is null
union all
select 'df_contas_recorrentes', count(*)
from public.df_contas_recorrentes
where empresa_id is null
union all
select 'df_configuracoes', count(*)
from public.df_configuracoes
where empresa_id is null
union all
select 'df_configuracoes_alertas', count(*)
from public.df_configuracoes_alertas
where empresa_id is null;

-- =========================================
-- FIM
-- =========================================
