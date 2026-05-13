# FASE 10.7 — Usuários e Permissões

Implementação incremental para iniciar a camada enterprise de usuários por perfil e por filial.

## O que entrou

- Perfis ampliados: admin, gerente, financeiro, operacional, visualização e operador legado.
- Tela de usuários com escopo por filial.
- Tabela de vínculo usuário ↔ filial preparada por SQL.
- Regra operacional inicial: usuário sem filial marcada permanece com acesso a todas as filiais da empresa.
- Preparação para RLS granular por filial nas próximas etapas.

## SQL recomendado

```sql
-- =====================================================
-- FASE 10.7 — USUÁRIOS E PERMISSÕES POR FILIAL
-- Dona Flor Financeiro
-- =====================================================

-- 1. perfis aceitos no vínculo empresa/usuário
ALTER TABLE public.df_usuarios_empresas
DROP CONSTRAINT IF EXISTS df_usuarios_empresas_perfil_check;

ALTER TABLE public.df_usuarios_empresas
ADD CONSTRAINT df_usuarios_empresas_perfil_check
CHECK (perfil IN ('admin', 'gerente', 'financeiro', 'operacional', 'visualizacao', 'operador'));

-- 2. tabela de vínculo usuário x filial
CREATE TABLE IF NOT EXISTS public.df_usuarios_filiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.df_empresas(id) ON DELETE CASCADE,
  usuario_empresa_id uuid NOT NULL REFERENCES public.df_usuarios_empresas(id) ON DELETE CASCADE,
  filial_id uuid NOT NULL REFERENCES public.df_filiais(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_empresa_id, filial_id)
);

-- 3. índices
CREATE INDEX IF NOT EXISTS idx_df_usuarios_filiais_empresa_id
ON public.df_usuarios_filiais(empresa_id);

CREATE INDEX IF NOT EXISTS idx_df_usuarios_filiais_usuario_empresa_id
ON public.df_usuarios_filiais(usuario_empresa_id);

CREATE INDEX IF NOT EXISTS idx_df_usuarios_filiais_filial_id
ON public.df_usuarios_filiais(filial_id);

-- 4. RLS ligado na nova tabela
ALTER TABLE public.df_usuarios_filiais ENABLE ROW LEVEL SECURITY;

-- 5. políticas incrementais, alinhadas ao tenant atual
DROP POLICY IF EXISTS "df_usuarios_filiais_select_empresa" ON public.df_usuarios_filiais;
DROP POLICY IF EXISTS "df_usuarios_filiais_insert_admin" ON public.df_usuarios_filiais;
DROP POLICY IF EXISTS "df_usuarios_filiais_update_admin" ON public.df_usuarios_filiais;
DROP POLICY IF EXISTS "df_usuarios_filiais_delete_admin" ON public.df_usuarios_filiais;

CREATE POLICY "df_usuarios_filiais_select_empresa"
ON public.df_usuarios_filiais
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.df_usuarios_empresas ue
    WHERE ue.empresa_id = df_usuarios_filiais.empresa_id
      AND (
        ue.user_id = auth.uid()
        OR lower(ue.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.df_usuarios_master um
    WHERE (um.user_id = auth.uid() OR lower(um.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
      AND coalesce(um.ativo, true) = true
  )
);

CREATE POLICY "df_usuarios_filiais_insert_admin"
ON public.df_usuarios_filiais
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.df_usuarios_empresas ue
    WHERE ue.empresa_id = df_usuarios_filiais.empresa_id
      AND ue.perfil = 'admin'
      AND (
        ue.user_id = auth.uid()
        OR lower(ue.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.df_usuarios_master um
    WHERE (um.user_id = auth.uid() OR lower(um.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
      AND coalesce(um.ativo, true) = true
  )
);

CREATE POLICY "df_usuarios_filiais_update_admin"
ON public.df_usuarios_filiais
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.df_usuarios_empresas ue
    WHERE ue.empresa_id = df_usuarios_filiais.empresa_id
      AND ue.perfil = 'admin'
      AND (
        ue.user_id = auth.uid()
        OR lower(ue.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.df_usuarios_master um
    WHERE (um.user_id = auth.uid() OR lower(um.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
      AND coalesce(um.ativo, true) = true
  )
)
WITH CHECK (true);

CREATE POLICY "df_usuarios_filiais_delete_admin"
ON public.df_usuarios_filiais
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.df_usuarios_empresas ue
    WHERE ue.empresa_id = df_usuarios_filiais.empresa_id
      AND ue.perfil = 'admin'
      AND (
        ue.user_id = auth.uid()
        OR lower(ue.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.df_usuarios_master um
    WHERE (um.user_id = auth.uid() OR lower(um.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
      AND coalesce(um.ativo, true) = true
  )
);

-- 6. validação
SELECT
  ue.nome,
  ue.email,
  ue.perfil,
  f.nome AS filial
FROM public.df_usuarios_empresas ue
LEFT JOIN public.df_usuarios_filiais uf ON uf.usuario_empresa_id = ue.id
LEFT JOIN public.df_filiais f ON f.id = uf.filial_id
ORDER BY ue.created_at DESC
LIMIT 50;
```

## Observação

A aplicação já salva e exibe os vínculos por filial. A aplicação de RLS granular nas tabelas operacionais por filial fica preparada para uma subfase posterior, para evitar risco na base já validada.
