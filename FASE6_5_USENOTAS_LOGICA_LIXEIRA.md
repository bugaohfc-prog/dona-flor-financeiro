# Fase 6.5 — useNotas lógica real incremental

## Objetivo
Continuar a redução segura do App.jsx sem alterar UX, CSS, Supabase, auth ou regras financeiras.

## Alterações
- `useNotas.js` passou a centralizar também a busca de notas na lixeira.
- `App.jsx` deixou de consultar diretamente `df_notas` dentro do fluxo geral da lixeira para essa parte.
- O fluxo de contas/lixeira de contas foi preservado.
- Nenhuma alteração visual foi realizada.

## Validação
- Build local executado com sucesso via `npm run build`.

## Pontos para validar no app
- Painel de notas.
- Criar/editar nota.
- Excluir nota.
- Lixeira de notas.
- Restaurar nota.
- Excluir definitivamente nota.
- Contas e recorrência permanecem intactas.
