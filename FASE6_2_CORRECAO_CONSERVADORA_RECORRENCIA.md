# Fase 6.2 — Correção conservadora de recorrência

Correção focada no fluxo de edição de conta comum para conta recorrente.

## O que foi ajustado

- Mantido `App.jsx`, UX, CSS, auth e Supabase sem alterações estruturais.
- Ajustado somente `src/hooks/useContas.js`, função `salvarConta`.
- Ao transformar uma conta comum em recorrente, o app agora:
  1. gera previamente o ID da recorrência no client;
  2. cria o registro em `df_contas_recorrentes` com esse ID;
  3. salva a conta em `df_contas` já com `recorrencia_id` no mesmo payload de edição.

## Motivo

A versão anterior criava a recorrência e depois fazia uma segunda atualização separada para vincular `recorrencia_id` na conta. Em alguns cenários, esse vínculo não persistia, embora o build continuasse passando.

## Validação

- `npm run build` aprovado.
- Nenhuma alteração visual.
- Nenhuma alteração em CSS.
- Nenhuma alteração em layout/responsividade.
