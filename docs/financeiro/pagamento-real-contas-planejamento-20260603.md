# Pagamento real de contas - planejamento SQL

Data: 2026-06-03

## Objetivo

Planejar suporte de banco para baixa real de contas, preservando `valor` como valor previsto/original e adicionando campos de pagamento efetivo, encargos e descontos.

Este ciclo nao aplica SQL no Supabase e nao altera frontend, service ou hook.

## Diagnostico atual

- `public.df_contas.valor` e usado como valor previsto e tambem como base dos relatorios atuais.
- Marcar conta como paga hoje altera apenas `status` para `pago`.
- Nao existem campos dedicados para `valor_pago`, `data_pagamento`, `juros_multa`, `desconto` ou `observacao_pagamento`.
- A edicao de conta recorrente pode atualizar tambem `df_contas_recorrentes` quando ha `recorrenciaContaId`.
- Portanto, editar `valor` para registrar pagamento em atraso mistura valor previsto, valor realizado e base recorrente.

## Decisoes propostas

- `valor` continua sendo o valor previsto/original.
- `valor_pago` guarda o valor efetivamente pago.
- `data_pagamento` guarda a data da baixa.
- `juros_multa` e `desconto` ficam persistidos em `df_contas`, calculados por trigger.
- `df_contas_recorrentes` nao recebe campos de baixa.
- Nao ha backfill automatico neste primeiro SQL planejado.
- O botao atual de `Pago`, enquanto o frontend nao muda, continua compativel: se `status = 'pago'` e `valor_pago` vier nulo, a trigger assume `valor_pago = valor` e `data_pagamento = current_date`.
- Ao reabrir uma conta paga, isto e, quando `status` deixar de ser `pago`, a trigger limpa `valor_pago`, `data_pagamento`, `juros_multa`, `desconto` e `observacao_pagamento`.

## Calculo automatico

Trigger proposta: `trg_df_contas_calcular_baixa_pagamento`.

Regras:

- Se `valor_pago > valor`:
  - `juros_multa = valor_pago - valor`;
  - `desconto = 0`.
- Se `valor_pago < valor`:
  - `desconto = valor - valor_pago`;
  - `juros_multa = 0`.
- Se `valor_pago = valor`:
  - `juros_multa = 0`;
  - `desconto = 0`.
- Se `valor_pago` for nulo:
  - `juros_multa = 0`;
  - `desconto = 0`.
- Se `status` for diferente de `pago`:
  - `valor_pago = null`;
  - `data_pagamento = null`;
  - `juros_multa = 0`;
  - `desconto = 0`;
  - `observacao_pagamento = null`.

## Constraints propostas

- `valor_pago >= 0`, quando informado.
- `juros_multa >= 0`.
- `desconto >= 0`.
- `juros_multa` e `desconto` nao podem ser positivos ao mesmo tempo.

Nao foi proposta constraint obrigando `valor_pago` e `data_pagamento` quando `status = 'pago'`, para nao quebrar registros historicos nem fluxos atuais antes da mudanca de frontend.

## Impacto em relatorios

Relatorios atuais usam `valor`. Apos a aplicacao e um ciclo de frontend/relatorios, o criterio deve ser separado:

- Previsto: `valor`.
- Realizado/pago: `coalesce(valor_pago, valor)` para contas pagas.
- Encargos: soma de `juros_multa`.
- Descontos: soma de `desconto`.

Enquanto relatorios nao forem ajustados, eles continuam representando o previsto, nao necessariamente o realizado.

## Impacto em recorrencia

Pagamento em atraso nao altera `df_contas_recorrentes.valor`.

Isso preserva o valor base da recorrencia para proximos meses e evita que multa/juros de uma baixa contaminem a serie recorrente.

## Riscos

- O backfill historico de contas pagas fica pendente. Sem isso, relatorios realizados precisam tratar `valor_pago null`.
- O botao atual de `Pago` pode preencher `data_pagamento` como a data do dia da acao, nao uma data historica.
- Se o frontend reabrir uma conta paga apenas alterando `status`, os dados de pagamento serao limpos pela trigger.
- Rollback remove colunas e apaga dados de baixa, se ja existirem.

## Arquivos planejados

- `supabase/migrations/20260603110000_add_pagamento_real_df_contas.sql`
- `docs/security/rollback/rollback_pagamento_real_df_contas_20260603.sql`
- `docs/security/diagnostics/diagnostico_pagamento_real_df_contas_20260603.sql`

## Proximo ciclo recomendado

Executar pre-flight read-only no Supabase para:

- confirmar tipo real de `df_contas.valor`;
- confirmar triggers de auditoria;
- contar contas pagas historicas;
- decidir backfill;
- validar em ambiente controlado a limpeza de campos ao reabrir conta.
