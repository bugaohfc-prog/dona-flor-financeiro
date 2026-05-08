# Dona Flor Financeiro — Fase 5 Hooks Core v2

## Conferência da fase anterior

Esta versão parte do diretório atual enviado após validação da Fase 4.

## Alteração desta fase

Foram adicionados hooks-base:

- `src/hooks/useAuthSession.js`
- `src/hooks/useEmpresa.js`

## Importante

Nesta v2 os hooks foram preparados sem substituir ainda o fluxo central do `App.jsx`.

Motivo:
- preservar 100% da UX/UI validada;
- evitar quebra de login/sessão;
- preparar extração real em etapa menor e segura.

## Validação

Validar:
- build;
- login;
- sessão;
- logout;
- carregamento da empresa;
- permissões;
- mobile/desktop sem mudança visual.

Se passar, a próxima etapa pode migrar gradualmente o código de auth para `useAuthSession.js`.
