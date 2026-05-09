# Fase 6.7 — Utils/Helpers reais

## Objetivo

Reduzir responsabilidades do `App.jsx` e evitar duplicação de helpers entre componentes/hooks, sem alterar UX, CSS, Supabase, auth ou regras financeiras.

## Alterações

- `src/utils/format.js`
  - centraliza formatação de valor/data;
  - centraliza `formatarDataParaBanco`;
  - centraliza `limitarDataInput`;
  - centraliza `primeiraLetraMaiuscula`;
  - mantém compatibilidade com exports antigos (`money`, `dateBR`, `normalize`).

- `src/utils/dates.js`
  - centraliza `dataLocal`;
  - centraliza `diferencaDias`;
  - centraliza `mesmoMesAtual`.

- `src/utils/recorrencia.js`
  - centraliza regra de geração mensal;
  - centraliza montagem de data recorrente;
  - centraliza identificação e formatação do tipo de recorrência.

- `App.jsx`
  - passa a importar helpers compartilhados;
  - remove helpers locais duplicados.

- `useContas.js`
  - passa a importar helpers de datas/recorrência;
  - remove helpers locais duplicados.

- `OpenAccountsList.jsx`
  - passa a importar helpers de recorrência;
  - remove helpers locais duplicados.

## Validação

- Build aprovado com `npm run build`.

## Restrições preservadas

- Sem alteração visual.
- Sem alteração de CSS.
- Sem alteração de Supabase/auth.
- Sem alteração das regras financeiras.
- Sem alteração no fluxo de contas/notas.
