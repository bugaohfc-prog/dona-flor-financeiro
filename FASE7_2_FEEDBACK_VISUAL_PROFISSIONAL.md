# Fase 7.2 — Feedback visual profissional

## Objetivo
Centralizar e padronizar os feedbacks visuais do Dona Flor sem alterar regras de negócio, UX principal, CSS estrutural, Supabase ou responsividade.

## Alterações realizadas

- `AppProvider` passou a centralizar:
  - toast global;
  - fechamento de toast;
  - loading global;
  - helper `runWithLoading` para próximas fases.
- `main.jsx` agora envolve o app com `AppProvider`.
- `App.jsx` passou a usar `useApp()` para feedback visual.
- Alertas antigos em `alert()` foram substituídos por `mostrarAviso()`.
- `GlobalToast` foi evoluído para:
  - título por tipo;
  - ícone visual;
  - botão de fechar;
  - acessibilidade básica com `role` e `aria-live`.
- `GlobalLoader` foi evoluído com card central e mensagem.
- CSS adicional criado apenas para feedback visual.

## Não alterado

- Regras financeiras.
- Supabase.
- Fluxo de contas.
- Fluxo de notas.
- Recorrência.
- UX principal.
- Responsividade.
- Pages/hooks/services já validados.

## Build

Build aprovado com `npm run build`.
