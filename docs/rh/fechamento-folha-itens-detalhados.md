# Fechamento de Folha - Itens detalhados

## Objetivo

A tabela `public.df_folha_lancamento_itens` detalha os lancamentos da competencia sem transformar o modulo em folha trabalhista completa. A fonte operacional passa a ser a soma dos itens ativos, com total materializado em `df_folha_lancamentos.valor` para compatibilidade e performance.

## Escopo funcional

- Compras/vales: varios itens por colaborador, valor obrigatorio maior que zero e data opcional.
- Faltas: data e quantidade obrigatorias, valor zero e sem calculo de desconto.
- Horas extras: quantidade e percentual 50, 60 ou 100 obrigatorios, valor zero e sem calculo trabalhista.
- Premiacao: `valor_base`, `percentual` e `valor` coerente com `valor_base * percentual / 100`.

## Seguranca e LGPD

- A tabela mantem `empresa_id`, `competencia_id`, `lancamento_id`, `funcionario_id` e `filial_id` para RLS, filtros e validacao.
- RLS espelha `df_folha_lancamentos`, usando `df_funcionarios_pode_escrever(empresa_id)`.
- `anon` nao recebe acesso; `authenticated` recebe apenas `SELECT`, `INSERT` e `UPDATE`.
- DELETE fisico e bloqueado; remocao operacional deve usar `arquivado = true`.
- Campos livres sao administrativos. Nao registrar CPF, documentos, anexos, laudos, CID, diagnosticos, dados medicos ou resultados de exames.

## Operacao

- Itens arquivados nao entram nos totais.
- Criacao, edicao, arquivamento e reativacao recalculam `df_folha_lancamentos.valor`.
- Reativar item limpa `arquivado_em`; conferir item preenche `conferido_em`.
- Fluxo visual de conferencia por item fica fora deste ciclo.
- Grants diretos ficam restritos: `authenticated` somente com `SELECT`, `INSERT` e `UPDATE`; funcoes internas de trigger nao ficam executaveis via RPC por `anon` ou `authenticated`.
- As funcoes internas de recalculo rodam como `SECURITY DEFINER` com `search_path=public`, mantendo `EXECUTE` direto revogado para `PUBLIC`, `anon` e `authenticated`. Isso permite o trigger recalcular o total sem expor RPC direto.

## Arquivos de apoio

- Migration: `supabase/migrations/20260605130000_create_df_folha_lancamento_itens.sql`
- Hardening de grants: `supabase/migrations/20260605131500_fix_df_folha_lancamento_itens_grants.sql`
- Hardening de funcoes: `supabase/migrations/20260605132000_harden_df_folha_lancamento_itens_functions.sql`
- Hotfix de recalculo: `supabase/migrations/20260605143000_fix_df_folha_lancamento_itens_recalculo_security.sql`
- Diagnostico: `docs/security/diagnostics/diagnostico_df_folha_lancamento_itens_20260605.sql`
- Diagnostico do hotfix: `docs/security/diagnostics/diagnostico_df_folha_lancamento_itens_recalculo_security_20260605.sql`
- Rollback: `docs/security/rollback/rollback_df_folha_lancamento_itens_20260605.sql`
- Rollback do hotfix: `docs/security/rollback/rollback_df_folha_lancamento_itens_recalculo_security_20260605.sql`
