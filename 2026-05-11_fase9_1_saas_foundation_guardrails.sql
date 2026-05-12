-- FASE 9.1 — SaaS Foundation Guardrails
-- Objetivo: preparar isolamento multiempresa sem alterar telas.
-- Rode no Supabase SQL Editor somente depois do ZIP estar validado no app.

-- 1) Índices por tenant para manter consultas rápidas e previsíveis.
create index if not exists idx_df_contas_empresa_excluido_vencimento
  on public.df_contas (empresa_id, excluido, data_vencimento);

create index if not exists idx_df_notas_empresa_excluido_created
  on public.df_notas (empresa_id, excluido, created_at desc);

create index if not exists idx_df_centros_custo_empresa_nome
  on public.df_centros_custo (empresa_id, nome);

create index if not exists idx_df_usuarios_empresas_user_empresa
  on public.df_usuarios_empresas (user_id, empresa_id);

create index if not exists idx_df_usuarios_empresas_empresa_email
  on public.df_usuarios_empresas (empresa_id, email);

create index if not exists idx_df_contas_recorrentes_empresa_ativo
  on public.df_contas_recorrentes (empresa_id, ativo);

-- 2) Evita usuário duplicado na mesma empresa quando o e-mail está preenchido.
create unique index if not exists uq_df_usuarios_empresas_empresa_email_normalizado
  on public.df_usuarios_empresas (empresa_id, lower(email))
  where email is not null;

-- 3) Base de referência para RLS futuro.
-- A ativação de RLS/policies deve ser feita na próxima etapa, após conferir todos os fluxos de CRUD.
-- Não ativar RLS às cegas para não derrubar o app em produção.
