# FASE 9.6D — Services Cleanup

## Objetivo

Reduzir repetição nas operações Supabase tenant-aware sem alterar visual, banco ou fluxos já validados.

## Alterações

- Criado `src/services/supabaseQueryService.js`.
- Centralizadas operações comuns:
  - select por empresa;
  - insert com `empresa_id` obrigatório;
  - insert em lote com `empresa_id` obrigatório;
  - update protegido por `empresa_id`;
  - delete protegido por `empresa_id`.
- `contasService.js` passou a usar os helpers centralizados.
- `notasService.js` passou a usar os helpers centralizados.

## Segurança

- Nenhuma classe CSS alterada.
- Nenhuma tela alterada.
- Nenhum SQL necessário.
- Guardrails de tenant foram preservados.

## Validação

Build passou com sucesso via `npm run build`.
