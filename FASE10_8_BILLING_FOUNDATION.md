# FASE 10.8 — Billing Foundation

Objetivo: criar a fundação comercial SaaS sem bloquear a operação atual.

## Incluído no app

- nova tela **Billing**;
- visualização do plano atual;
- indicadores de uso de filiais e usuários;
- status de assinatura/trial;
- seleção de plano e limites;
- fallback visual caso o SQL ainda não tenha sido aplicado;
- sem alterações em RLS antigo, dashboard, contas, notas ou recorrência.

## SQL recomendado

```sql
-- =====================================================
-- FASE 10.8 — BILLING FOUNDATION
-- Dona Flor Financeiro
-- =====================================================

CREATE TABLE IF NOT EXISTS public.df_planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text,
  limite_filiais integer,
  limite_usuarios integer,
  valor_mensal numeric(12,2),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.df_assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.df_empresas(id) ON DELETE CASCADE,
  plano_codigo text NOT NULL REFERENCES public.df_planos(codigo),
  status text NOT NULL DEFAULT 'trial',
  trial_inicio date,
  trial_fim date,
  assinatura_inicio date,
  assinatura_fim date,
  limite_filiais integer,
  limite_usuarios integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT df_assinaturas_status_check CHECK (status IN ('trial', 'ativa', 'pausada', 'cancelada'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_df_assinaturas_empresa_unica
ON public.df_assinaturas(empresa_id);

CREATE INDEX IF NOT EXISTS idx_df_assinaturas_empresa
ON public.df_assinaturas(empresa_id);

CREATE INDEX IF NOT EXISTS idx_df_assinaturas_plano
ON public.df_assinaturas(plano_codigo);

INSERT INTO public.df_planos (codigo, nome, descricao, limite_filiais, limite_usuarios, valor_mensal, ativo)
VALUES
  ('starter', 'Starter', 'Base para operação pequena com uma unidade.', 1, 3, 0, true),
  ('profissional', 'Profissional', 'Operação multiunidade com dashboard operacional.', 5, 15, 149, true),
  ('enterprise', 'Enterprise', 'Estrutura avançada para redes, permissões e expansão SaaS.', NULL, NULL, NULL, true)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  limite_filiais = EXCLUDED.limite_filiais,
  limite_usuarios = EXCLUDED.limite_usuarios,
  valor_mensal = EXCLUDED.valor_mensal,
  ativo = EXCLUDED.ativo,
  updated_at = now();

ALTER TABLE public.df_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.df_assinaturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planos_select" ON public.df_planos;
DROP POLICY IF EXISTS "planos_insert" ON public.df_planos;
DROP POLICY IF EXISTS "planos_update" ON public.df_planos;
DROP POLICY IF EXISTS "planos_delete" ON public.df_planos;

CREATE POLICY "planos_select" ON public.df_planos FOR SELECT USING (true);
CREATE POLICY "planos_insert" ON public.df_planos FOR INSERT WITH CHECK (true);
CREATE POLICY "planos_update" ON public.df_planos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "planos_delete" ON public.df_planos FOR DELETE USING (true);

DROP POLICY IF EXISTS "assinaturas_select" ON public.df_assinaturas;
DROP POLICY IF EXISTS "assinaturas_insert" ON public.df_assinaturas;
DROP POLICY IF EXISTS "assinaturas_update" ON public.df_assinaturas;
DROP POLICY IF EXISTS "assinaturas_delete" ON public.df_assinaturas;

CREATE POLICY "assinaturas_select" ON public.df_assinaturas FOR SELECT USING (true);
CREATE POLICY "assinaturas_insert" ON public.df_assinaturas FOR INSERT WITH CHECK (true);
CREATE POLICY "assinaturas_update" ON public.df_assinaturas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "assinaturas_delete" ON public.df_assinaturas FOR DELETE USING (true);

SELECT * FROM public.df_planos ORDER BY valor_mensal NULLS LAST;
```

## Validação

1. Rodar o SQL.
2. Abrir a tela Billing.
3. Confirmar plano, limites, usuários e filiais.
4. Alterar plano/status como admin.
5. Recarregar e confirmar persistência.
6. Validar que Contas, Notas, Dashboard e Usuários continuam funcionando.
