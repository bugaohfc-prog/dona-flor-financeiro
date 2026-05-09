# Fase 6.6 — Services reais

Objetivo: iniciar a separação das chamadas Supabase em services, mantendo hooks responsáveis por estado/orquestração e sem alterar UX/CSS.

## Alterações

- Criado `src/services/contasService.js`
- Criado `src/services/notasService.js`
- `useContas.js` passou a usar funções de service para CRUD/recorrência/status/lixeira
- `useNotas.js` passou a usar funções de service para CRUD/conclusão/lixeira

## Mantido sem alteração

- UX
- CSS
- Responsividade
- Auth
- Regras financeiras
- Fluxo validado de contas/recorrência
- Fluxo validado de notas/lixeira

## Validação

- Build local aprovado com `npm run build`
