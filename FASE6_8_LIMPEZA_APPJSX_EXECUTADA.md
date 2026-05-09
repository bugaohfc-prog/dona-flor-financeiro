# Fase 6.8 — Limpeza estrutural do App.jsx executada

## Objetivo

Reduzir responsabilidade do `App.jsx` de forma segura, sem alterar UX, CSS, Supabase, auth ou regras financeiras.

## Alterações realizadas

- Extraída a lógica de leitura/preparação de CSV para `src/utils/importacaoCsv.js`.
- Removidas funções internas de importação que estavam dentro do `App.jsx`.
- Reaproveitado helper global `primeiraLetraMaiuscula` no `useNotas.js`, evitando duplicação local.
- Mantido o comportamento atual de contas, notas, recorrência, dashboard, lixeira e importação.

## Arquivos alterados

- `src/App.jsx`
- `src/hooks/useNotas.js`
- `src/utils/importacaoCsv.js`

## Validação

Build local executado com sucesso via:

```bash
npm run build
```

## Observação

Esta fase não cria Pages novas e não altera layout. A próxima fase estrutural só deve avançar depois da validação funcional desta versão.
