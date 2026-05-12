# FASE 10.3 — RLS GRADUAL ACTIVATION

## Objetivo

Ativar RLS de forma gradual nas tabelas operacionais do Dona Flor Financeiro, mantendo a troca real de empresa validada na Fase 10.2B.

## Escopo desta fase

RLS tenant-aware em tabelas com `empresa_id`:

- `df_contas`
- `df_notas`
- `df_centros_custo`
- `df_configuracoes`
- `df_configuracoes_alertas`
- `df_contas_recorrentes`
- `df_usuarios_empresas`

## Fora do escopo

Nesta fase NÃO ativamos RLS em `df_empresas`.

Motivo: o Company Switch ainda precisa listar empresas disponíveis sem quebrar a experiência validada. O endurecimento de `df_empresas` deve entrar numa fase posterior, junto com Painel Master e policies específicas para master/admin.

## Arquivo SQL

Execute no Supabase SQL Editor:

```txt
supabase/sql/2026-05-12_fase10_3_rls_gradual_activation.sql
```

## Validação obrigatória

Após executar o SQL:

1. Fazer login com `donafloradm@outlook.com`.
2. Confirmar que o selector de empresa aparece.
3. Entrar em Dona Flor Financeiro.
4. Confirmar KPIs e dados existentes.
5. Trocar para Choco Arte.
6. Confirmar dashboard zerado.
7. Criar uma conta teste em Choco Arte.
8. Voltar para Dona Flor e confirmar que a conta teste não aparece.
9. Voltar para Choco Arte e confirmar que a conta teste aparece.
10. Dar F5 e confirmar que a empresa ativa persiste.

## Regra de ouro

Se qualquer tela ficar vazia indevidamente ou bloquear CRUD, não seguir para novas features. Primeiro ajustar a policy ou query responsável.
