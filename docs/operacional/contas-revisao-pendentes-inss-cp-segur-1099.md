# Revisão de pendências INSS / CP-SEGUR - Receita 1099

Data do diagnóstico: 2026-07-01

## Resumo executivo

Este diagnóstico revisou exclusivamente os 4 grupos que ficaram pendentes após a consolidação de INSS / CP-SEGUR das receitas 1082 e 1099.

Nenhum dado foi alterado no Supabase. O ciclo executou apenas consultas `SELECT` em `public.df_contas`, `public.df_contas_pagamentos`, `public.df_empresas` e `public.df_filiais`.

Conclusão: os 4 grupos permanecem sem par 1099 seguro. Não foi encontrada receita 1099 na mesma empresa/filial, competência e vencimento. Também não foi encontrada conta 1099 com texto diferente dentro do mesmo contexto.

## Grupos revisados

| Classificação | Empresa | Filial | Competência | Vencimento | Conta 1082 | Valor 1082 | Status | Visível | Resultado da busca por 1099 | Recomendação |
| --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- |
| A - 1099 realmente ausente | Rede Dona Flor | Brilho Dourado | 01/2026 | 2026-02-20 | `659b2282-b0dc-4780-befe-2d850d0c93d9` | R$ 202,05 | pendente | sim | Nenhuma 1099 na mesma filial, competência ou vencimento. No mesmo contexto há FGTS e Simples, mas não INSS 1099. | Não consolidar. Manter pendente para conferência fiscal/manual. |
| A - 1099 realmente ausente | Rede Dona Flor | Brilho Dourado | 04/2026 | 2026-05-20 | `21c5ecb6-c5d2-4d1f-8947-9d50c9693efb` | R$ 333,54 | pendente | sim | Nenhuma 1099 na mesma filial, competência ou vencimento. No mesmo contexto há FGTS e Simples, mas não INSS 1099. | Não consolidar. Manter pendente para conferência fiscal/manual. |
| A - 1099 realmente ausente | Rede Dona Flor | Dona Flor Paranaíba | 04/2026 | 2026-05-20 | `4561fd5c-a962-4de9-b166-f1c22a489830` | R$ 338,30 | pendente | sim | Nenhuma 1099 na mesma filial, competência ou vencimento. No mesmo contexto há FGTS e Simples, mas não INSS 1099. | Não consolidar. Manter pendente para conferência fiscal/manual. |
| A - 1099 realmente ausente | Rede Dona Flor | Dona Flor Três Lagoas | 12/2025 | 2025-12-19 | `64fac795-c70c-4050-ab5a-16a1403c16c7` | R$ 469,26 | pendente | sim | Nenhuma 1099 na mesma competência e vencimento. Existem contas 1099 da mesma filial em outras competências, já consolidadas/ocultadas, mas nenhuma para 12/2025. | Não consolidar. Manter pendente para conferência fiscal/manual. |

## Estado das contas 1082

Todas as 4 contas 1082 revisadas estavam:

- com `status = 'pendente'`;
- com `valor_pago` nulo;
- com `data_pagamento` nula;
- sem pagamento parcial ativo em `df_contas_pagamentos`;
- com `excluido = false`;
- com `deletado = false`;
- com `oculto = false`;
- sem `recorrencia_id`;
- sem `grupo_parcelamento_id`;
- sem `parcela_numero`;
- sem `parcelas_total`.

## Resultado por hipótese

| Hipótese | Resultado |
| --- | --- |
| 1099 realmente ausente | Confirmado para os 4 grupos. |
| 1099 existe com texto diferente | Não encontrado no mesmo contexto de empresa/filial, competência e vencimento. |
| 1099 existe oculto/cancelado | Não encontrado no mesmo contexto. |
| 1099 existe em competência/vencimento divergente | Apenas Três Lagoas possui 1099 em outras competências, mas não corresponde a 12/2025. |
| Caso ambíguo | Não houve caso com par provável suficiente para sugerir consolidação. |

## SQL de diagnóstico usado

Consulta das contas 1082 pendentes:

```sql
with pendentes(id) as (
  values
    ('659b2282-b0dc-4780-befe-2d850d0c93d9'::uuid),
    ('21c5ecb6-c5d2-4d1f-8947-9d50c9693efb'::uuid),
    ('4561fd5c-a962-4de9-b166-f1c22a489830'::uuid),
    ('64fac795-c70c-4050-ab5a-16a1403c16c7'::uuid)
), pagamentos as (
  select conta_id,
         count(*) filter (where coalesce(arquivado,false) = false) as pagamentos_ativos,
         coalesce(sum(valor_pago) filter (where coalesce(arquivado,false) = false),0)::numeric(12,2) as total_pagamentos_ativos
  from public.df_contas_pagamentos
  group by conta_id
)
select c.id, e.nome as empresa, f.nome as filial, c.descricao,
       c.valor, c.vencimento, c.data_vencimento, c.competencia,
       c.status, c.valor_pago, c.data_pagamento,
       coalesce(p.pagamentos_ativos,0) as pagamentos_ativos,
       c.excluido, c.deletado, c.oculto,
       c.recorrencia_id, c.grupo_parcelamento_id,
       c.parcela_numero, c.parcelas_total, c.observacao
from public.df_contas c
join pendentes pids on pids.id = c.id
left join public.df_empresas e on e.id = c.empresa_id
left join public.df_filiais f on f.id = c.filial_id
left join pagamentos p on p.conta_id = c.id;
```

Busca por 1099 na mesma filial:

```sql
with pendentes as (
  select c.id pendente_id, c.empresa_id, c.filial_id,
         c.competencia,
         coalesce(c.data_vencimento,c.vencimento) vencimento_ref
  from public.df_contas c
  where c.id in (
    '659b2282-b0dc-4780-befe-2d850d0c93d9'::uuid,
    '21c5ecb6-c5d2-4d1f-8947-9d50c9693efb'::uuid,
    '4561fd5c-a962-4de9-b166-f1c22a489830'::uuid,
    '64fac795-c70c-4050-ab5a-16a1403c16c7'::uuid
  )
)
select p.pendente_id, c.id, c.descricao, c.valor, c.status,
       c.excluido, c.deletado, c.oculto,
       c.competencia, coalesce(c.data_vencimento,c.vencimento) as vencimento
from pendentes p
join public.df_contas c on c.empresa_id = p.empresa_id
where c.id <> p.pendente_id
  and c.filial_id is not distinct from p.filial_id
  and (coalesce(c.descricao,'') || ' ' || coalesce(c.observacao,'')) ~* '(^|[^0-9])1099([^0-9]|$)';
```

Busca de contas do mesmo contexto para detectar texto divergente:

```sql
with pendentes as (
  select c.id pendente_id, c.empresa_id, c.filial_id,
         c.competencia,
         coalesce(c.data_vencimento,c.vencimento) vencimento_ref
  from public.df_contas c
  where c.id in (
    '659b2282-b0dc-4780-befe-2d850d0c93d9'::uuid,
    '21c5ecb6-c5d2-4d1f-8947-9d50c9693efb'::uuid,
    '4561fd5c-a962-4de9-b166-f1c22a489830'::uuid,
    '64fac795-c70c-4050-ab5a-16a1403c16c7'::uuid
  )
)
select p.pendente_id, c.id, c.descricao, c.valor, c.status,
       c.excluido, c.deletado, c.oculto, c.observacao
from pendentes p
join public.df_contas c on c.empresa_id = p.empresa_id
  and c.filial_id is not distinct from p.filial_id
  and c.competencia = p.competencia
  and coalesce(c.data_vencimento,c.vencimento) = p.vencimento_ref;
```

## Confirmação de escopo

- Supabase: somente `SELECT`.
- `UPDATE`: não executado.
- `INSERT`: não executado.
- `DELETE`: não executado.
- Ocultação/consolidação: não executada.
- Pagamentos, baixas, parciais, recorrências e parcelamentos: não alterados.
- Schema, RLS, policies, functions, views, triggers e índices: não alterados.
- Frontend e services/hooks: não alterados.

## Próximo passo recomendado

Conferir no relatório fiscal original se as filiais/competências abaixo realmente não possuem receita 1099:

- Brilho Dourado 01/2026;
- Brilho Dourado 04/2026;
- Dona Flor Paranaíba 04/2026;
- Dona Flor Três Lagoas 12/2025.

Só abrir novo ciclo de correção se o relatório fiscal indicar uma 1099 ausente na importação ou se houver decisão explícita para ajustar manualmente uma conta de origem.
