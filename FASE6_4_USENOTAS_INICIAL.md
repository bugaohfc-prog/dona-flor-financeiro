# Fase 6.4 — useNotas inicial

## Objetivo
Reduzir o `App.jsx` com extração segura das responsabilidades de notas para `src/hooks/useNotas.js`.

## Alterações
- Criado `src/hooks/useNotas.js`.
- Movidos estados de notas para o hook.
- Movidas ações principais de notas para o hook:
  - buscar notas;
  - abrir nova nota;
  - abrir edição;
  - fechar modal;
  - salvar nota;
  - excluir/restaurar;
  - alternar concluída;
  - exclusão definitiva.
- `App.jsx` mantém wrappers finos para preservar compatibilidade com os componentes existentes.

## Não alterado
- UX;
- CSS;
- responsividade;
- Supabase/schema;
- auth;
- regras financeiras;
- fluxo de contas/recorrência validado na Fase 6.3.

## Validação
- Build local aprovado com `npm run build`.
