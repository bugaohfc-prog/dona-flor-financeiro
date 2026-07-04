# Fluxo de Caixa V1

Data: 2026-07-03
Branch: `main`

## Objetivo

Entregar uma tela utilizável de Fluxo de Caixa V1 para os donos da Dona Flor, usando dados reais já existentes no Supabase e sem alterar banco, regras de baixa ou permissões.

## Local no app

- Menu financeiro: `Fluxo de Caixa`.
- Atalho dentro de `Relatórios de Contas`: botão `Fluxo de Caixa`.

## Fontes usadas

Leitura real, somente `select`, usando o cliente Supabase existente:

- `public.df_contas`
- `public.df_contas_pagamentos`
- `public.df_filiais`

Campos principais:

- `df_contas.id`
- `df_contas.empresa_id`
- `df_contas.descricao`
- `df_contas.valor`
- `df_contas.valor_pago`
- `df_contas.data_pagamento`
- `df_contas.status`
- `df_contas.filial_id`
- `df_contas.centro_custo_id`
- `df_contas.oculto`
- `df_contas.excluido`
- `df_contas.deletado`
- `df_contas_pagamentos.conta_id`
- `df_contas_pagamentos.valor_pago`
- `df_contas_pagamentos.data_pagamento`
- `df_contas_pagamentos.arquivado`
- `df_filiais.id`
- `df_filiais.nome`

## Regra de caixa

O relatório é de caixa realizado:

- usa `data_pagamento`;
- usa `valor_pago`;
- não usa `data_vencimento` como realizado;
- não usa competência como realizado;
- não projeta meses futuros.

## Pagamentos parciais

Regra anti-duplicidade:

1. Pagamentos parciais ativos em `df_contas_pagamentos` entram como movimentos.
2. Pagamentos parciais arquivados ficam fora.
3. Quando uma conta tem pagamento parcial ativo, a conta-pai não é somada integralmente junto.
4. Conta paga sem parcial ativo entra pelo `df_contas.valor_pago` e `df_contas.data_pagamento`.

## Filtros

- Ano.
- Filial.
- Todas as filiais.
- Botão atualizar.

## Tela

A tela apresenta:

- cards de entradas, saídas, saldo e movimentos;
- tabela mensal fixa de janeiro a dezembro;
- total anual;
- cards mensais no mobile;
- lista de movimentos considerados para validação manual;
- estado vazio;
- estado de erro com tentar novamente;
- aviso claro de limitação das entradas.

## Entradas / faturamento

A origem confiável de `FATURAMENTO BRUTO` ainda não está madura no módulo atual.

Por isso:

- entradas ficam zeradas;
- saídas mostram pagamentos realizados;
- saldo = entradas - saídas;
- a tela e a exportação exibem observação explícita sobre essa limitação.

## Exportação

Foram implementadas duas opções:

- CSV baixável no navegador.
- Excel XLSX usando `createXlsxBlob`, recurso já existente no projeto.

O Excel segue o modelo do cliente o máximo possível dentro do utilitário atual:

- 12 colunas fixas de janeiro a dezembro;
- total anual;
- rubrica `FATURAMENTO BRUTO`;
- rubrica `DESEMBOLSOS / PAGAMENTOS REALIZADOS`;
- linha `TOTAL GERAL`;
- aba `Consolidado Geral`;
- aba por filial quando houver movimentos por filial;
- data/hora de geração;
- observação sobre entradas/faturamento pendentes.

Referências usadas:

- `C:\Users\choco\Downloads\MODELO DE FLUXO DE CAIXA - CLIENTE.xlsx`
- `C:\Users\choco\Downloads\Especificacao_Fluxo_de_Caixa.md`
- `docs/contas/mapeamento-fluxo-caixa-12-meses.md`

## Arquivos criados

- `src/pages/FluxoCaixaPage.jsx`
- `src/modules/contas/services/fluxo-caixa/fluxoCaixaService.js`
- `src/modules/contas/hooks/fluxo-caixa/useFluxoCaixaV1.js`
- `src/modules/contas/utils/fluxo-caixa/fluxoCaixaUtils.js`

## Arquivos alterados

- `src/App.jsx`
- `src/routes/lazyRoutes.js`
- `src/config/menuSections.js`
- `src/pages/RelatoriosContasPage.jsx`
- `docs/projeto/status-frentes-ativas.md`

## Limitações

- Entradas/faturamento bruto dependem de origem financeira confiável futura.
- A classificação por rubricas detalhadas do modelo ainda depende de plano de contas/centros de custo confiáveis.
- O Excel é estruturalmente parecido com o modelo, mas não usa o arquivo `.xlsx` como template.

## Validação manual

1. Abrir o app em produção.
2. Entrar no menu financeiro.
3. Abrir `Fluxo de Caixa`.
4. Selecionar ano.
5. Selecionar `Todas as filiais`.
6. Conferir saídas mensais e total anual.
7. Selecionar uma filial específica.
8. Conferir se os movimentos mudam conforme filial.
9. Exportar CSV.
10. Exportar Excel.
11. Abrir o Excel e conferir aba `Consolidado Geral` e abas por filial.

## Rollback

```bash
git revert <commit>
git push origin main
```
