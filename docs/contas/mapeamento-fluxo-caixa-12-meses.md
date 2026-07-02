# Mapeamento - Fluxo de Caixa 12 meses por filial

Data: 2026-07-02

## Objetivo

Mapear como os dados atuais do DNA Gestão podem preencher o modelo de "Declaração de Fluxo de Caixa dos últimos 12 meses", por filial, antes de qualquer implementação de exportação.

Este ciclo é somente diagnóstico/documentação. Não houve alteração de código funcional, banco, RLS, policies, functions, grants, regras de pagamento/baixa ou dependências.

Nota V2: esta frente passa a fazer parte do plano de virada controlada V2 documentado em `docs/projeto/plano-macro-v2-dna-gestao.md`. A implementação futura deve acontecer dentro de `Contas > Relatórios de Contas > Fluxo de Caixa por filial`, preservando a V1 até validação.

## Modelo usado

Referências analisadas:

- `C:\Users\choco\Downloads\MODELO DE FLUXO DE CAIXA - CLIENTE.xlsx`
- `C:\Users\choco\Downloads\Especificacao_Fluxo_de_Caixa.md`

Estrutura esperada:

- cabeçalho com empresa, CNPJ e endereço, quando disponíveis;
- 12 colunas mensais fixas de janeiro a dezembro;
- entradas com `FATURAMENTO BRUTO`;
- saídas por rubrica operacional/financeira;
- `TOTAL GERAL` mensal;
- meses sem movimento preenchidos com `0`.

## Decisão de regime de caixa

O relatório deve ser de fluxo de caixa realizado. Portanto, a data principal deve ser a data de pagamento/recebimento efetivo, não vencimento nem competência.

Campos existentes para despesas/contas:

- `public.df_contas.data_pagamento`: data efetiva da baixa da conta.
- `public.df_contas.valor_pago`: valor efetivamente pago na baixa.
- `public.df_contas_pagamentos.data_pagamento`: data efetiva de pagamento parcial.
- `public.df_contas_pagamentos.valor_pago`: valor do pagamento parcial.
- `public.df_contas.data_vencimento`/`vencimento`: úteis apenas para conferência, não para regime de caixa.
- `public.df_contas.competencia`: útil para impostos e relatórios fiscais, mas não deve substituir `data_pagamento`.

Regra recomendada para evitar duplicidade:

1. Para contas pagas sem pagamentos parciais ativos, usar `df_contas.data_pagamento` e `df_contas.valor_pago`.
2. Para contas com pagamentos parciais ativos, usar os movimentos de `df_contas_pagamentos` por `data_pagamento`.
3. Não somar a conta-pai integral junto com seus pagamentos parciais.
4. Se houver conta paga com parciais e residual não representado claramente nos pagamentos parciais, tratar como lacuna de validação antes de liberar o relatório.
5. Excluir pagamentos parciais arquivados/estornados (`arquivado = true`).

## Origem dos dados encontrada

### Contas financeiras

Origem principal atual:

- `public.df_contas`
- `public.df_contas_pagamentos`
- `public.df_centros_custo`
- `public.df_filiais`

Evidências no código:

- `src/services/contasService.js`
  - lista contas com `df_centros_custo(nome)`, `df_filiais(nome)` e campos de baixa;
  - registra baixa em `df_contas` com `status = 'pago'`, `valor_pago`, `data_pagamento` e `observacao_pagamento`;
  - registra pagamentos parciais em `df_contas_pagamentos`;
  - arquiva pagamentos parciais no estorno.
- `src/pages/RelatoriosContasPage.jsx`
  - usa dados já carregados da lista de contas para relatórios atuais;
  - exportações PDF/CSV/Excel usam a mesma lista filtrada.
- `src/utils/relatoriosContasExport.js`
  - gera CSV, Excel HTML e impressão/PDF no frontend para relatórios de contas atuais.
- `src/services/export/reportExportService.js`
  - já existe utilitário para CSV, impressão HTML e criação de XLSX simples em memória.

### Receitas/faturamento

Não foi encontrada origem financeira madura e inequívoca de contas a receber/receitas recebidas equivalente a `df_contas` para despesas.

Possíveis fontes citadas ou existentes:

- `df_notas`: usada como notas/pendências, não como origem segura de faturamento recebido.
- contas importadas em `df_contas`: podem conter status `pago`, mas o módulo atual é operacionalmente centrado em contas/despesas.

Conclusão: `FATURAMENTO BRUTO` é a maior lacuna do relatório. A implementação não deve inferir faturamento a partir de notas ou textos livres sem uma regra validada.

## Localização no app

O relatório não deve virar página independente solta.

Localização inicial obrigatória:

`Contas > Relatórios de Contas > Fluxo de Caixa por filial`

Regra de navegação:

- adicionar como novo tipo/opção dentro de `Relatórios de Contas`;
- reaproveitar a tela/estrutura atual de Relatórios de Contas quando for tecnicamente seguro;
- não criar menu principal novo;
- não criar página solta fora do módulo Contas;
- não misturar com Gestão de Pessoas;
- não colocar na Central de Relatórios V2 neste momento.

Migração futura possível:

`Central de Relatórios V2 > Financeiro > Fluxo de Caixa`

Essa migração deve ficar para quando a Central V2 existir. Até lá, a navegação correta é dentro de Contas.

Filtros esperados nessa subárea:

- filial;
- ano;
- tipo de período: `Ano completo` ou `Parcial até o mês`;
- mês final, obrigatório apenas no parcial;
- formato de exportação.

## Regra de período — ano fechado e ano parcial acumulado

Entrada futura recomendada:

- filial obrigatória;
- ano obrigatório;
- tipo de período obrigatório;
- mês final obrigatório quando o tipo for `Parcial até o mês`.

O modelo original usa a ideia de "últimos 12 meses", mas a necessidade operacional atual do DNA Gestão é anual/calendário. Portanto, a regra principal não é período móvel de 12 meses.

### Ano completo

Uso: relatório fechado do ano inteiro.

Entrada:

- filial selecionada;
- ano, por exemplo `2025`;
- tipo `Ano completo`.

Resultado:

- janeiro a dezembro do ano selecionado;
- todos os meses preenchidos conforme regime de caixa realizado;
- meses sem movimento saem com `0`.

Exemplo prático:

- `2025 completo`: Jan/2025 a Dez/2025.

Cabeçalho futuro sugerido:

`Fluxo de Caixa — Ano 2025 — Ano completo`

### Ano parcial acumulado até o mês

Uso: acompanhamento mensal dos donos. Conforme os meses forem atualizados/fechados, o usuário gera um novo arquivo.

Entrada:

- filial selecionada;
- ano, por exemplo `2026`;
- tipo `Parcial até o mês`;
- mês final, por exemplo `Junho`.

Resultado:

- janeiro até o mês final preenchidos conforme regime de caixa realizado;
- meses posteriores até dezembro preenchidos com `0`;
- não projetar meses futuros;
- não usar vencimentos futuros como realizado;
- manter sempre 12 colunas de janeiro a dezembro no Excel.

Exemplos práticos:

- `2026 parcial até Junho`: Jan/2026 a Jun/2026 preenchidos; Jul/2026 a Dez/2026 zerados.
- `2026 parcial até Julho`: Jan/2026 a Jul/2026 preenchidos; Ago/2026 a Dez/2026 zerados.
- `2026 parcial até Agosto`: Jan/2026 a Ago/2026 preenchidos; Set/2026 a Dez/2026 zerados.

Cabeçalho futuro sugerido:

`Fluxo de Caixa — Ano 2026 — Parcial até Junho`

### Regra final

- o relatório deve ter sempre 12 colunas, de janeiro a dezembro;
- o ano selecionado define todas as colunas;
- `Ano completo` preenche janeiro a dezembro conforme dados realizados;
- `Parcial até o mês` preenche janeiro até o mês final e zera os meses seguintes;
- meses futuros não devem receber projeção;
- `data_pagamento`/data de baixa/recebimento efetivo continua sendo a base do regime de caixa;
- `data_vencimento` e `competencia` não devem ser usadas como realizado.

## Regra de filial

Fase inicial recomendada:

- gerar para uma filial selecionada;
- filtrar por `df_contas.filial_id`;
- quando o movimento vier de `df_contas_pagamentos`, obter a filial pela conta vinculada.

Futuro:

- permitir "todas as filiais";
- gerar uma aba por filial;
- gerar uma aba consolidada geral;
- manter a mesma regra de caixa e rubricas em todas as abas.
- manter o mesmo ano e o mesmo mês final em todas as abas.

Consolidado Geral futuro:

- somar todas as filiais por mês e rubrica;
- não duplicar pagamentos parciais;
- respeitar a mesma regra anti-duplicidade já documentada;
- manter meses futuros zerados quando o período for parcial.

## Estrutura do relatório

Linhas fixas do modelo:

| Grupo | Rubrica |
| --- | --- |
| Entrada | FATURAMENTO BRUTO |
| Saída | DESEMBOLSO COM FORNECEDORES/COMPRAS |
| Saída | FOLHA DE PAGAMENTO |
| Saída | IMPOSTOS RECOLHIDOS SOBRE FOLHA |
| Saída | IMPOSTOS RECOLHIDOS SOBRE VENDAS |
| Saída | ALUGUEL |
| Saída | ÁGUA + LUZ + TELEFONE |
| Saída | PRÓ-LABORE |
| Saída | IMPOSTOS PARCELADOS |
| Saída | OUTRAS DESPESAS OPERACIONAIS |
| Saída | OUTRAS DESPESAS NÃO OPERACIONAIS |
| Saída | DESPESAS FINANCEIRAS / JUROS |
| Saída | DESEMBOLSO MENSAL COM BANCOS |
| Total | TOTAL GERAL |

Regra de total:

- entradas entram positivas;
- saídas entram como desembolsos e devem ser subtraídas;
- `TOTAL GERAL` mensal = `FATURAMENTO BRUTO` menos todas as saídas;
- não inverter sinal no armazenamento, apenas na apresentação/cálculo do relatório.

## Mapeamento de categorias

O sistema possui centro de custo, filial, descrição, observação, imposto, competência fiscal e dados de baixa. Não foi encontrada uma taxonomia rígida de plano de contas suficiente para mapear todas as rubricas sem fallback textual.

| Rubrica | Origem recomendada | Campos usados | Situação |
| --- | --- | --- | --- |
| FATURAMENTO BRUTO | Receitas recebidas/contas a receber baixadas ou vendas/notas recebidas | data de recebimento, valor recebido, filial | Lacuna: origem segura não confirmada |
| DESEMBOLSO COM FORNECEDORES/COMPRAS | `df_contas`/`df_contas_pagamentos` pagas, categorias/centros de compras, fornecedores, mercadorias, insumos | `centro_custo_id`, `df_centros_custo.nome`, `descricao`, `valor_pago`, `data_pagamento`, filial | Precisa confirmar nomes reais dos centros/categorias |
| FOLHA DE PAGAMENTO | Contas financeiras pagas classificadas como folha/salários, ou futura integração Gestão de Pessoas -> Financeiro | `centro_custo_id`, `descricao`, `valor_pago`, `data_pagamento`, filial | Lacuna se folha ainda não gera conta financeira |
| IMPOSTOS RECOLHIDOS SOBRE FOLHA | Contas pagas com `imposto_tipo = 'inss'` ou `fgts`; descrições INSS, CP-SEGUR, FGTS, encargos de folha | `imposto_tipo`, `competencia`, `descricao`, `valor_pago`, `data_pagamento`, filial | Parcialmente pronto |
| IMPOSTOS RECOLHIDOS SOBRE VENDAS | Contas pagas com `imposto_tipo = 'simples_nacional'` ou descrições DAS, ICMS, ISS, imposto sobre vendas | `imposto_tipo`, `competencia`, `descricao`, `valor_pago`, `data_pagamento`, filial | Parcialmente pronto |
| ALUGUEL | Contas pagas com centro/categoria/descrição de aluguel | `centro_custo_id`, `descricao`, `valor_pago`, `data_pagamento`, filial | Precisa confirmar centro/categoria |
| ÁGUA + LUZ + TELEFONE | Contas pagas com descrição/centro água, energia, luz, telefone, internet | `centro_custo_id`, `descricao`, `valor_pago`, `data_pagamento`, filial | Precisa confirmar centro/categoria |
| PRÓ-LABORE | Contas pagas com descrição/centro pró-labore/pro labore | `centro_custo_id`, `descricao`, `valor_pago`, `data_pagamento`, filial | Precisa confirmar existência |
| IMPOSTOS PARCELADOS | Contas pagas de parcelamentos fiscais, se identificadas por `grupo_parcelamento_id` e classificação fiscal | `grupo_parcelamento_id`, `imposto_tipo`, `descricao`, `valor_pago`, `data_pagamento`, filial | Risco: nem todo parcelamento é imposto |
| OUTRAS DESPESAS OPERACIONAIS | Despesas pagas não classificadas nas rubricas anteriores e marcadas como operacionais | centro/categoria/descrição, valor e data de caixa | Lacuna: falta flag operacional explícita |
| OUTRAS DESPESAS NÃO OPERACIONAIS | Despesas pagas classificadas como não operacionais | centro/categoria/descrição, valor e data de caixa | Lacuna: falta flag não operacional explícita |
| DESPESAS FINANCEIRAS / JUROS | Contas pagas de juros, tarifas, encargos, despesas bancárias; `juros_multa` somente com regra anti-duplicidade | descrição/centro, `juros_multa`, `valor_pago`, `data_pagamento` | Precisa regra para não duplicar juros dentro de `valor_pago` |
| DESEMBOLSO MENSAL COM BANCOS | Contas pagas de empréstimos/financiamentos/principal de dívida | descrição/centro, valor pago, data de caixa | Lacuna: separar principal de juros depende de classificação |

## Campos existentes

Campos úteis já presentes ou usados no app:

- `df_contas.id`
- `df_contas.empresa_id`
- `df_contas.filial_id`
- `df_filiais.nome`
- `df_contas.centro_custo_id`
- `df_centros_custo.nome`
- `df_contas.descricao`
- `df_contas.valor`
- `df_contas.status`
- `df_contas.valor_pago`
- `df_contas.data_pagamento`
- `df_contas.data_vencimento`
- `df_contas.vencimento`
- `df_contas.competencia`
- `df_contas.imposto_tipo`
- `df_contas.grupo_parcelamento_id`
- `df_contas.juros_multa`
- `df_contas.desconto`
- `df_contas.oculto`
- `df_contas.excluido`
- `df_contas_pagamentos.conta_id`
- `df_contas_pagamentos.valor_pago`
- `df_contas_pagamentos.data_pagamento`
- `df_contas_pagamentos.arquivado`

## Lacunas

1. Origem de `FATURAMENTO BRUTO` não está segura.
2. Não há plano de contas rígido mapeando todas as rubricas do modelo.
3. Não há flag clara de despesa operacional versus não operacional.
4. Separação entre principal de banco e juros depende de classificação que não está garantida.
5. `juros_multa` pode já estar embutido em `valor_pago`; somar como rubrica separada pode duplicar saída.
6. Contas com pagamentos parciais exigem regra específica para não duplicar com a conta-pai.
7. Folha de pagamento pode existir no módulo Gestão de Pessoas, mas não deve entrar no fluxo de caixa sem vínculo financeiro ou conta paga correspondente.
8. Exportação usando exatamente o XLSX modelo pode exigir template/estilização adicional; há utilitário XLSX simples, mas não há uso atual de template XLSX externo.

## Riscos

- Duplicidade entre `df_contas.valor_pago` e `df_contas_pagamentos.valor_pago`.
- Usar vencimento ou competência no lugar de `data_pagamento`, descaracterizando regime de caixa.
- Classificar despesas por texto livre e mover valores para rubrica errada.
- Misturar impostos de folha e impostos sobre vendas quando `imposto_tipo = 'outro'` ou descrição estiver ambígua.
- Incluir contas ocultas, excluídas ou estornadas indevidamente.
- Tratar `df_notas` como faturamento sem evidência de recebimento.
- Gerar relatório por filial quando contas antigas estiverem sem `filial_id`.
- Gerar XLSX parecido visualmente, mas com fórmulas/linhas divergentes do modelo.
- Interpretar "últimos 12 meses" como período móvel, quando a necessidade operacional atual é anual/calendário.
- Criar uma página independente ou menu principal novo, quebrando a navegação simples dentro de Contas.

Proteções recomendadas:

- filtros de ano e mês final devem ficar explícitos na UI futura;
- o cabeçalho do Excel deve informar o período gerado;
- o relatório deve entrar em `Relatórios de Contas > Fluxo de Caixa por filial`;
- a Central de Relatórios V2 deve ser tratada apenas como destino futuro.

## Recomendação para implementação

Implementar em fases:

### Fase 1 - diagnóstico de dados reais

- Consultar centros de custo reais por empresa.
- Listar contas pagas do ano selecionado por filial.
- Listar pagamentos parciais ativos por conta.
- Identificar contas pagas com parciais para validar a regra anti-duplicidade.
- Confirmar se existe fonte confiável para faturamento bruto.

### Fase 2 - motor de totalização

- Criar função de montagem em memória ou endpoint backend.
- Usar `data_pagamento` como data de caixa.
- Montar 12 buckets mensais.
- Aplicar filial e empresa.
- Classificar rubricas por regras explícitas e auditáveis.
- Marcar itens sem rubrica segura como pendência, não como classificação silenciosa.

### Fase 3 - exportação

- Gerar CSV/XLSX com a estrutura do modelo.
- Usar o utilitário XLSX existente se a fidelidade visual simples for suficiente.
- Se exigir template idêntico ao arquivo do cliente, planejar ciclo próprio para biblioteca/template, sem instalar dependência sem aprovação.

### Fase 4 - validação operacional

- Comparar um mês manualmente com contas pagas reais.
- Validar filial única.
- Validar meses sem movimento.
- Validar impostos importados.
- Validar pagamentos parciais.
- Só depois avaliar todas as filiais e aba consolidada.

## Checklist de aceite

- O usuário escolhe filial.
- O usuário escolhe ano.
- O usuário escolhe tipo de período.
- O usuário escolhe mês final quando o período for parcial.
- O relatório gera sempre janeiro a dezembro do ano selecionado.
- Ano completo preenche janeiro a dezembro conforme dados realizados.
- Ano parcial preenche janeiro até o mês final.
- Meses futuros do ano parcial ficam com `0`.
- O relatório fica em `Contas > Relatórios de Contas > Fluxo de Caixa por filial`.
- O relatório não cria página independente, menu principal novo nem entrada na Central V2 neste momento.
- Meses sem movimento aparecem com `0`.
- Valores usam data de pagamento/recebimento efetivo.
- O relatório não usa vencimento como caixa realizado.
- O relatório não projeta valores.
- Contas pagas sem parcial entram uma vez.
- Pagamentos parciais ativos entram por data real e não duplicam com a conta-pai.
- Contas ocultas/excluídas/estornadas não entram indevidamente.
- `FATURAMENTO BRUTO` só é preenchido se houver origem segura.
- Total geral mensal subtrai todas as saídas do faturamento bruto.
- A exportação por filial respeita o ano e o mês selecionados.
- O consolidado geral futuro respeita a mesma regra, se implementado.
- A exportação não altera dados.
- Nenhuma regra de baixa/pagamento é alterada.

## Confirmações

- Código funcional: não alterado.
- Banco: não alterado.
- Dados: não alterados.
- Migration: não criada.
- SQL: não executado.
- RLS/policies/functions/grants: não alterados.
- Regras de pagamento/baixa: não alteradas.
- Gestão de Pessoas: não alterada.
- Logs/Auditoria: não alterados.
- Dependências: não instaladas.

## Rollback

Rollback documental:

```bash
git revert <commit>
```
