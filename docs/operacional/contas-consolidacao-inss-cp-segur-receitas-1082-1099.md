# Consolidação INSS / CP-SEGUR - Receitas 1082 e 1099

Data da correção: 2026-07-01

## Resumo executivo

Foi aplicada a regra de negócio para contas importadas do Relatório de Situação Fiscal da Receita Federal: receitas 1082 e 1099 de INSS / CP-SEGUR devem ficar agrupadas em uma única conta quando pertencem à mesma empresa/filial e à mesma competência.

O ciclo alterou somente contas alvo seguras em `public.df_contas`. Não houve alteração de schema, RLS, policies, funções, frontend, services/hooks, pagamentos, baixas, recorrências ou parcelamentos.

Resultado:

- 12 grupos candidatos encontrados.
- 8 grupos consolidados com segurança.
- 4 grupos enviados para revisão manual por ausência da receita 1099.
- 8 contas principais mantidas visíveis e atualizadas com o valor consolidado.
- 8 contas secundárias, todas da receita 1099, ocultadas de forma reversível com `oculto = true`.

## Regra aplicada

Consolidar somente quando todas as condições forem verdadeiras:

- mesma empresa e filial;
- mesma competência/referência;
- mesmo vencimento;
- exatamente uma conta com receita 1082;
- exatamente uma conta com receita 1099;
- ambas pendentes ou vencidas;
- sem `valor_pago`;
- sem `data_pagamento`;
- sem pagamento parcial ativo em `df_contas_pagamentos`;
- sem `recorrencia_id`;
- sem campos de parcelamento preenchidos;
- sem `excluido`, `deletado` ou `oculto`;
- total consolidado igual à soma exata das duas contas.

Critério de conta principal: manter a conta da receita 1082.

Critério de conta secundária: ocultar a conta da receita 1099 com `oculto = true`, preservando o registro para rastreabilidade.

## Filtros usados

Filtro base:

- `df_contas.descricao` ou `df_contas.observacao` contendo `INSS / CP-SEGUR`;
- `df_contas.observacao` contendo `Receita Federal` ou `Relatorio/Relatório de Situacao/Situação Fiscal`;
- texto contendo receita `1082` ou `1099`;
- agrupamento por empresa, filial, competência e vencimento;
- conferência de pagamentos em `df_contas_pagamentos`.

## Grupos consolidados

| Empresa | Filial | Competência | Vencimento | Principal 1082 | Secundária 1099 | Valor 1082 | Valor 1099 | Total final |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: |
| Rede Dona Flor | Dona Flor Andradina | 02/2026 | 2026-03-20 | `d2304f9f-8f3c-481e-a838-16fc0797f753` | `85075170-5dd5-4a2a-96c3-527f6a61643b` | R$ 1.642,99 | R$ 338,69 | R$ 1.981,68 |
| Rede Dona Flor | Dona Flor Andradina | 04/2026 | 2026-05-20 | `3f316229-609d-4791-84ce-819108d8c44c` | `612319ec-7377-4091-b523-400bb4c80b9c` | R$ 1.430,36 | R$ 307,69 | R$ 1.738,05 |
| Rede Dona Flor | Dona Flor Andradina | 05/2026 | 2026-06-19 | `4db012c2-e305-4c79-87ab-ce31de49e0e9` | `1083ce62-3528-4d30-ba0c-2bf0bc8e8081` | R$ 1.278,76 | R$ 275,00 | R$ 1.553,76 |
| Rede Dona Flor | Dona Flor Três Lagoas | 02/2026 | 2026-03-20 | `6fcdea8c-7bfb-4faa-a0f1-c53867d8856d` | `1dc90246-213b-4ee7-944f-2afe12d0bc07` | R$ 458,33 | R$ 338,69 | R$ 797,02 |
| Rede Dona Flor | Dona Flor Três Lagoas | 04/2026 | 2026-05-20 | `a7576af0-d957-4be6-8302-fd43aa8bc2dc` | `a98b0df0-5660-4e9b-9550-0d2e145641ff` | R$ 625,44 | R$ 307,69 | R$ 933,13 |
| Rede Dona Flor | Dona Flor Três Lagoas | 05/2026 | 2026-06-19 | `09a4eec1-2818-44de-a393-7b9650bb644b` | `4f66189a-2311-4578-bbca-8b3935a9b002` | R$ 440,78 | R$ 275,00 | R$ 715,78 |
| Rede Dona Flor | Dona Flor Três Lagoas | 07/2025 | 2025-08-20 | `6dfb37bc-92c0-4d6e-a41c-d0c99506fcef` | `9611b3e2-2d66-42c2-a9c6-122f981407ff` | R$ 1.938,86 | R$ 361,07 | R$ 2.299,93 |
| Rede Dona Flor | Dona Flor Três Lagoas | 11/2025 | 2025-12-19 | `fe0149b7-dc98-4951-bc08-8e96fb98e1b9` | `e06234d4-8b33-4617-a49a-199d0e9bc098` | R$ 862,96 | R$ 347,95 | R$ 1.210,91 |

## Grupos para revisão manual

Estes grupos não foram alterados porque não havia par 1082 + 1099.

| Empresa | Filial | Competência | Vencimento | Motivo | Conta | Valor |
| --- | --- | --- | --- | --- | --- | ---: |
| Rede Dona Flor | Brilho Dourado | 01/2026 | 2026-02-20 | Apenas receita 1082 encontrada | `659b2282-b0dc-4780-befe-2d850d0c93d9` | R$ 202,05 |
| Rede Dona Flor | Brilho Dourado | 04/2026 | 2026-05-20 | Apenas receita 1082 encontrada | `21c5ecb6-c5d2-4d1f-8947-9d50c9693efb` | R$ 333,54 |
| Rede Dona Flor | Dona Flor Paranaíba | 04/2026 | 2026-05-20 | Apenas receita 1082 encontrada | `4561fd5c-a962-4de9-b166-f1c22a489830` | R$ 338,30 |
| Rede Dona Flor | Dona Flor Três Lagoas | 12/2025 | 2025-12-19 | Apenas receita 1082 encontrada | `64fac795-c70c-4050-ab5a-16a1403c16c7` | R$ 469,26 |

## SQL executado

O SQL executado foi um bloco controlado com validação antes do `UPDATE`. O bloco abortava se não encontrasse exatamente 8 grupos seguros.

Operação efetiva nas contas principais:

```sql
update public.df_contas
set valor = <valor_1082 + valor_1099>,
    descricao = 'INSS / CP-SEGUR - <MM/AAAA>',
    observacao = '<observacao consolidada com receitas 1082 e 1099>'
where id = <conta_principal_1082>;
```

Operação efetiva nas contas secundárias:

```sql
update public.df_contas
set oculto = true,
    oculto_em = now(),
    observacao = observacao || E'\n\n' || '<rastreabilidade da consolidacao>'
where id = <conta_secundaria_1099>;
```

Também foi executado ajuste posterior somente nas observações das 8 contas principais para padronizar a formatação monetária brasileira (`R$ 1.642,99` em vez de `R$ 1,642,99`). Esse ajuste não alterou valores, status, pagamentos, baixas, permissões ou flags.

## Validação depois

Validação em 2026-07-01:

- 8 grupos consolidados.
- Cada grupo consolidado ficou com exatamente 1 conta visível.
- As 8 contas secundárias ficaram com `oculto = true`.
- As 8 contas principais ficaram com `oculto = false`, `excluido = false` e `deletado = false`.
- O valor de cada conta principal bate com a soma exata das receitas 1082 e 1099.
- As observações das contas principais registram receita 1082, receita 1099, total consolidado e ID da conta secundária.
- As observações das contas secundárias registram o ID da conta principal.
- Nenhuma conta consolidada recebeu `valor_pago`.
- Nenhuma conta consolidada recebeu `data_pagamento`.
- Nenhum pagamento parcial ativo foi criado ou alterado.
- Nenhuma recorrência ou parcelamento foi alterado.

## Rollback Supabase

Executar somente se for necessário desfazer esta consolidação. O rollback restaura valores, descrições e observações originais das contas principais e reexibe as contas secundárias.

```sql
begin;

update public.df_contas
set valor = 1642.99,
    descricao = 'INSS / CP-SEGUR - PA 02/2026',
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1082-01; referencia 02/2026; situacao pendente; valor consolidado 1642.99.'
where id = 'd2304f9f-8f3c-481e-a838-16fc0797f753';
update public.df_contas
set oculto = false,
    oculto_em = null,
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1099-01; referencia 02/2026; situacao pendente; valor consolidado 338.69.'
where id = '85075170-5dd5-4a2a-96c3-527f6a61643b';

update public.df_contas
set valor = 1430.36,
    descricao = 'INSS / CP-SEGUR - PA 04/2026',
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1082-01; referencia 04/2026; situacao pendente; valor consolidado 1430.36.'
where id = '3f316229-609d-4791-84ce-819108d8c44c';
update public.df_contas
set oculto = false,
    oculto_em = null,
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1099-01; referencia 04/2026; situacao pendente; valor consolidado 307.69.'
where id = '612319ec-7377-4091-b523-400bb4c80b9c';

update public.df_contas
set valor = 1278.76,
    descricao = 'INSS / CP-SEGUR - PA 05/2026',
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1082-01; referencia 05/2026; situacao a_analisar; valor consolidado 1278.76.'
where id = '4db012c2-e305-4c79-87ab-ce31de49e0e9';
update public.df_contas
set oculto = false,
    oculto_em = null,
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1099-01; referencia 05/2026; situacao a_analisar; valor consolidado 275.'
where id = '1083ce62-3528-4d30-ba0c-2bf0bc8e8081';

update public.df_contas
set valor = 458.33,
    descricao = 'INSS / CP-SEGUR - 02/2026',
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1082; referencia 02/2026; situacao pendente; valor consolidado 458.33.'
where id = '6fcdea8c-7bfb-4faa-a0f1-c53867d8856d';
update public.df_contas
set oculto = false,
    oculto_em = null,
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1099; referencia 02/2026; situacao pendente; valor consolidado 338.69.'
where id = '1dc90246-213b-4ee7-944f-2afe12d0bc07';

update public.df_contas
set valor = 625.44,
    descricao = 'INSS / CP-SEGUR - 04/2026',
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1082; referencia 04/2026; situacao pendente; valor consolidado 625.44.'
where id = 'a7576af0-d957-4be6-8302-fd43aa8bc2dc';
update public.df_contas
set oculto = false,
    oculto_em = null,
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1099; referencia 04/2026; situacao pendente; valor consolidado 307.69.'
where id = 'a98b0df0-5660-4e9b-9550-0d2e145641ff';

update public.df_contas
set valor = 440.78,
    descricao = 'INSS / CP-SEGUR - 05/2026',
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1082; referencia 05/2026; situacao a_analisar; valor consolidado 440.78.'
where id = '09a4eec1-2818-44de-a393-7b9650bb644b';
update public.df_contas
set oculto = false,
    oculto_em = null,
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1099; referencia 05/2026; situacao a_analisar; valor consolidado 275.'
where id = '4f66189a-2311-4578-bbca-8b3935a9b002';

update public.df_contas
set valor = 1938.86,
    descricao = 'INSS / CP-SEGUR - 07/2025',
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1082; referencia 07/2025; situacao pendente; valor consolidado 1938.86.'
where id = '6dfb37bc-92c0-4d6e-a41c-d0c99506fcef';
update public.df_contas
set oculto = false,
    oculto_em = null,
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1099; referencia 07/2025; situacao pendente; valor consolidado 361.07.'
where id = '9611b3e2-2d66-42c2-a9c6-122f981407ff';

update public.df_contas
set valor = 862.96,
    descricao = 'INSS / CP-SEGUR - 11/2025',
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1082; referencia 11/2025; situacao pendente; valor consolidado 862.96.'
where id = 'fe0149b7-dc98-4951-bc08-8e96fb98e1b9';
update public.df_contas
set oculto = false,
    oculto_em = null,
    observacao = 'Origem: Relatorio de Situacao Fiscal Receita Federal; receita 1099; referencia 11/2025; situacao pendente; valor consolidado 347.95.'
where id = 'e06234d4-8b33-4617-a49a-199d0e9bc098';

commit;
```

## Confirmações de escopo

- Schema: não alterado.
- RLS/policies: não alteradas.
- Funções/triggers/views/índices: não alterados.
- Frontend: não alterado.
- Services/hooks: não alterados.
- Migrations: não criadas.
- Pagamentos, baixas e parciais: não alterados.
- Exclusão física: não executada.
