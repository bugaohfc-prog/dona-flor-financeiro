# FASE 10.4A — Recorrência Hardening + Tenant Sync

## Objetivo

Corrigir a geração de contas recorrentes com centro de custo inválido e melhorar a sincronização entre desktop e mobile dentro da mesma empresa ativa.

## Ajustes aplicados

- Validação do `centro_custo_id` antes de salvar contas e recorrências.
- Geração automática de recorrências agora descarta centro de custo inexistente ou de outra empresa.
- Criação de centro de custo atualiza o estado local imediatamente e refaz o fetch do tenant.
- Proteção contra centro de custo duplicado na mesma empresa.
- Sincronização do tenant ao voltar para a aba/janela.
- Assinatura Supabase Realtime para `df_centros_custo`, `df_contas` e `df_contas_recorrentes` da empresa ativa.

## Resultado esperado

- Sem erro `df_contas_centro_custo_id_fkey` ao gerar recorrências.
- Centro criado no mobile aparece no desktop após realtime/foco/refresh.
- Desktop e mobile continuam usando a mesma base Supabase e o mesmo `empresa_id`.
- Multiempresa, RLS e isolamento permanecem intactos.
