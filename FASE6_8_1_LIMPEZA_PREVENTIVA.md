# Fase 6.8.1 — Limpeza preventiva leve

## Objetivo

Consolidar a base validada da Fase 6.8 antes da criação de Pages reais.

## Alterações realizadas

- Arquivos legados antigos foram isolados em `src/legacy_removidos/` para evitar reaproveitamento acidental na Fase 6.9.
- Nenhuma regra visual, financeira, Supabase, autenticação ou responsividade foi alterada.
- `App.jsx` permanece como fonte ativa das telas atuais.
- `Login.jsx` e `Relatorios.jsx` continuam ativos em `src/pages/`.

## Arquivos legados isolados

- `src/pages/Contas.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/Notas.jsx`
- `src/components/Contas.jsx`
- `src/components/Dashboard.jsx`
- `src/components/Notas.jsx`

Esses arquivos usavam modelagens antigas de notas, como `texto` e `data_lembrete`, enquanto o fluxo atual validado usa `conteudo` e `data_evento`.

## Validação obrigatória

- Dashboard
- Contas
- Editar/salvar contas
- Recorrência visual
- Notas
- Lixeira
- Relatórios
- Login
- Mobile/desktop
