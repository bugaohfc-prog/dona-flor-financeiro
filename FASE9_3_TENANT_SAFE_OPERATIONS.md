# FASE 9.3 — Tenant Safe Operations

## Objetivo

Fechar a primeira camada real de isolamento por empresa sem alterar o visual e sem ativar RLS ainda.

## O que foi aplicado

- Relatórios agora respeitam `empresa_id`.
- Relatórios não buscam dados globais quando não há empresa ativa.
- Services de contas passaram a bloquear operações sem `empresa_id`.
- Services de notas passaram a bloquear operações sem `empresa_id`.
- Helpers de validação foram adicionados ao `tenantService`.

## Arquivos alterados

- `src/pages/Relatorios.jsx`
- `src/services/tenantService.js`
- `src/services/contasService.js`
- `src/services/notasService.js`

## Validação recomendada

- Login
- Dashboard
- Contas
- Notas
- Relatórios
- Criar, editar, excluir conta
- Criar, editar, concluir e excluir nota
- Centros de custo

## Observação

Sem SQL nesta fase. A FASE 9.1 já criou/backfillou `empresa_id`.
