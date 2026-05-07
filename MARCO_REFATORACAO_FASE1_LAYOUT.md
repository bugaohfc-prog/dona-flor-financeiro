# Dona Flor Financeiro — Refatoração Fase 1 Layout

## Objetivo

Iniciar componentização gradual sem alterar o visual validado no mobile e desktop.

## Alterações realizadas

Foram extraídos componentes de layout para:

- `src/components/layout/Topbar.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/MobileMenu.jsx`

O `App.jsx` continua concentrando estados, regras de negócio, Supabase, contas, notas e modais.

## Regra seguida

Nesta versão foi feita apenas extração estrutural. Não houve alteração intencional de CSS, UX, responsividade ou fluxo funcional.

## Build

`npm run build` executado com sucesso.

Observação: o Vite exibiu apenas aviso de chunk grande, esperado porque o `App.jsx` ainda concentra muitas regras. Isso será tratado nas próximas fases de componentização.

## Próximo passo recomendado

Validar:

1. abertura/fechamento do menu mobile;
2. navegação do menu desktop;
3. botão recolher/expandir sidebar desktop;
4. botão sair;
5. visual mobile e desktop já aprovado.

Depois da validação, seguir para extração do Dashboard.
