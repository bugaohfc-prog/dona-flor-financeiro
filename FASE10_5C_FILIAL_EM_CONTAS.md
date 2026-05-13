# FASE 10.5C — Filial em Contas

## Objetivo

Integrar filiais/unidades ao fluxo operacional de contas, sem alterar o isolamento multiempresa já validado.

## Implementado

- `filial_id` em `df_contas`.
- `filial_id` em `df_contas_recorrentes`.
- Select de Filial no modal de Nova/Editar Conta.
- Filtro por Filial na tela de Contas.
- Exibição da filial nos cards de contas.
- Export CSV/PDF incluindo filial.
- Recorrências passam a preservar filial quando configurada.
- Validação defensiva: filial precisa pertencer à empresa ativa.
- Sync desktop/mobile inclui alterações em `df_filiais`.

## SQL

Arquivo:

```txt
supabase/sql/2026-05-13_fase10_5c_filial_em_contas.sql
```

## Validação recomendada

1. Executar SQL no Supabase.
2. Criar/editar conta selecionando filial.
3. Confirmar que a filial aparece no card.
4. Filtrar por filial na tela Contas.
5. Criar conta recorrente com filial.
6. Confirmar que Dona Flor e Choco Arte continuam isoladas.
