# FASE 10.5A — FILIAIS FOUNDATION

## Objetivo

Criar a primeira camada de filiais/unidades por empresa no Dona Flor Financeiro.

## Status

Foundation criada sem alterar ainda contas, notas, KPIs ou relatórios.

## O que entrou

- Nova tabela prevista: `df_filiais`
- Novo service: `src/services/filiaisService.js`
- Painel Master com abas:
  - Empresas
  - Filiais
- Menu Master com item `Filiais`
- CRUD inicial de filiais:
  - listar
  - criar
  - renomear
  - ativar/desativar
- RLS tenant-aware para `df_filiais`

## O que NÃO entrou ainda

- Campo `filial_id` em contas
- Campo `filial_id` em notas
- Filtro por filial no dashboard
- KPIs por filial
- Permissão de usuário por filial
- Billing por filial

## Próxima fase recomendada

FASE 10.5B — Vínculo de contas com filial.

Nessa próxima fase, `df_contas` receberá `filial_id` e o modal de contas permitirá escolher a filial da empresa ativa.
