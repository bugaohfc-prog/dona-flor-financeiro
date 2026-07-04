# Receitas / Entradas V1

Data: 2026-07-04
Branch: `main`

## Objetivo

Criar a frente de Receitas V1 para registrar entradas de dinheiro da loja e alimentar a linha `FATURAMENTO BRUTO` do Fluxo de Caixa V1.

## Local no app

- Menu `Financeiro > Receitas`.

## Tabela

Foi criada a tabela `public.df_receitas`.

Campos principais:

- `empresa_id`
- `filial_id`
- `data_receita`
- `ano`
- `mes`
- `valor`
- `origem`
- `descricao`
- `observacao`
- `status`
- `arquivado`

Regras:

- `data_receita` define ano e mes do faturamento bruto.
- Receitas ativas entram no Fluxo de Caixa.
- Receitas arquivadas ou canceladas ficam fora.
- `DELETE` fisico e bloqueado por trigger.
- `empresa_id` nao pode ser alterado depois da criacao.
- Duplicidade e bloqueada por empresa, filial, ano, mes e origem.

## RLS / grants

- RLS habilitada e forcada.
- `anon` sem grants.
- `authenticated` com `SELECT`, `INSERT` e `UPDATE`.
- Sem `DELETE`, `TRUNCATE`, `REFERENCES` ou `TRIGGER` para `authenticated`.
- Policies criadas apenas para `SELECT`, `INSERT` e `UPDATE`.
- Operador nao foi incluido nas policies.

## Dados do PDF 2025

Origem: `Resultados de vendas 2025.pdf`.

Foram inseridas 48 receitas mensais:

- 12 meses para Dona Flor Andradina.
- 12 meses para Dona Flor Tres Lagoas.
- 12 meses para Dona Flor Paranaiba.
- 12 meses para Brilho Dourado.

Origem usada: `Venda de Loja`.

Descricao usada: `Faturamento mensal 2025`.

Observacao usada: `Carga inicial baseada no PDF Resultados de vendas 2025.`

## Totais validados

Consulta `SELECT` agregada apos a migration confirmou:

- Andradina: R$ 2.365.617,00
- Tres Lagoas: R$ 1.708.082,00
- Paranaiba: R$ 371.723,00
- Brilho: R$ 406.353,00
- Total geral: R$ 4.851.775,00

## Tela

A tela `Receitas` possui:

- filtros por ano, mes, filial, origem e status;
- cards de total, quantidade, media e filiais com movimento;
- formulario de cadastro/edicao;
- listagem desktop;
- cards mobile;
- arquivamento e restauracao.

## Integracao com Fluxo de Caixa

O Fluxo de Caixa V1 passou a consultar `df_receitas`.

Regras:

- receitas ativas entram como `entrada`;
- `data_receita` define o mes;
- filtro de filial tambem filtra receitas;
- a linha `FATURAMENTO BRUTO` no Excel/CSV usa as receitas;
- `TOTAL GERAL = FATURAMENTO BRUTO - saidas`.

## Duplicidade

A carga inicial usa constraint unica:

`empresa_id + filial_id + ano + mes + lower(origem)`

Assim, se a migration for reaplicada, os registros do PDF nao sao duplicados.

## Pendencias

- Validar a tela com usuarios reais.
- Definir se futuras receitas serao digitadas manualmente ou importadas mensalmente.
- Criar fluxo de importacao mensal se os donos mantiverem PDF/planilha externa.

## Rollback

Rollback de codigo:

```bash
git revert <commit>
git push origin main
```

Rollback de banco deve ser feito em ciclo separado. Como a tabela contem dados reais de receita, nao executar `DROP` ou `DELETE` sem plano especifico.
