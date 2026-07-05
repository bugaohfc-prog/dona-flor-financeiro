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

## Atualizacao 2026-07-04 — rubricas do modelo

O Fluxo de Caixa V1 passou a abrir as saidas nas rubricas fixas do modelo do cliente:

1. `FATURAMENTO BRUTO`
2. `DESEMBOLSO COM FORNECEDORES/COMPRAS`
3. `FOLHA DE PAGAMENTO`
4. `IMPOSTOS RECOLHIDOS SOBRE FOLHA`
5. `IMPOSTOS RECOLHIDOS SOBRE VENDAS`
6. `ALUGUEL`
7. `AGUA + LUZ + TELEFONE`
8. `PRO-LABORE`
9. `IMPOSTOS PARCELADOS`
10. `OUTRAS DESPESAS OPERACIONAIS *`
11. `OUTRAS DESPESAS NAO OPERACIONAIS *`
12. `DESPESAS FINANCEIRAS ( JUROS )`
13. `DESEMBOLSO MENSAL COM BANCOS (PRINCIPAL)`
14. `TOTAL GERAL`

A linha unica antiga `DESEMBOLSOS / PAGAMENTOS REALIZADOS` nao e mais usada na exportacao. O Excel/CSV agora exporta `Consolidado Geral` e abas por filial com janeiro a dezembro e total anual.

### Classificacao automatica

A regra central fica em `src/modules/contas/utils/fluxo-caixa/classificarRubricaFluxoCaixa.js`.

Ela retorna rubrica, centro de custo sugerido, confianca e criterio. A mesma regra alimenta o Fluxo de Caixa e a sugestao de centro no cadastro de novas contas.

Mapeamento principal:

- `Mercadoria` -> `DESEMBOLSO COM FORNECEDORES/COMPRAS`
- `RH` -> `FOLHA DE PAGAMENTO`
- `Ocupacao` -> `ALUGUEL`
- `Utilidades` -> `AGUA + LUZ + TELEFONE`
- `Administrativo`, `Operacional`, `Marketing`, `Sistemas`, `Veiculos` -> `OUTRAS DESPESAS OPERACIONAIS *`
- `Pessoais` -> `OUTRAS DESPESAS NAO OPERACIONAIS *`, salvo texto claro de pro-labore
- `Impostos e Taxas` -> refinado por descricao, observacao, imposto e fornecedor quando existirem

Regras criticas:

- `FGTS`, `INSS`, `eSocial`, `DCTFWeb`, `DARF folha`, `guia folha`, `imposto folha` e encargos sobre folha entram em `IMPOSTOS RECOLHIDOS SOBRE FOLHA`, mesmo se o centro estiver como RH.
- Pagamentos diretos a colaboradores, salario, comissao, premiacao, diaria e ajuda de custo entram em `FOLHA DE PAGAMENTO`.
- Juros, multa, mora, encargos financeiros e `juros_multa` entram em `DESPESAS FINANCEIRAS ( JUROS )`, exceto quando o texto for claramente FGTS/INSS/encargo de folha.
- `Pessoais` e filial `Pessoal` entram em `OUTRAS DESPESAS NAO OPERACIONAIS *`, exceto quando o texto indicar pro-labore.
- Sem identificacao segura, o movimento cai em `OUTRAS DESPESAS OPERACIONAIS *`.

### Sugestao de centro em novos lancamentos

O modal de conta passou a usar a classificacao central para sugerir centro de custo em novas contas:

- preenche automaticamente apenas quando a conta e nova, o centro esta vazio e a confianca e alta;
- o usuario pode revisar e alterar antes de salvar;
- nao bloqueia salvamento;
- nao altera registros antigos;
- nao executa update em massa.

### Validacao operacional

A tela mostra diagnosticos de classificacao:

- movimentos classificados por centro de custo;
- movimentos classificados por descricao/juros;
- movimentos em fallback;
- movimentos em outras despesas operacionais;
- movimentos em outras despesas nao operacionais;
- movimentos perdidos na agregacao.

A soma das rubricas deve bater com o total de saidas do resumo mensal. A classificacao e feita em tempo de relatorio/exportacao, sem alterar dados historicos no Supabase.

### Limitacoes

- `FATURAMENTO BRUTO` continua zerado ate a frente de Receitas/Entradas.
- A classificacao automatica pode exigir revisao pontual quando descricoes antigas forem genericas.
- Quando juros/multa nao estiverem separados em campo proprio e aparecerem apenas na descricao, o movimento inteiro e classificado como juros.

### Consulta Supabase somente leitura

Em 2026-07-04 foi feita consulta `SELECT` somente leitura para validar metadados e centros cadastrados.

Campos confirmados:

- `df_contas`: `descricao`, `valor`, `valor_pago`, `juros_multa`, `desconto`, `observacao`, `observacao_pagamento`, `imposto_tipo`, `data_pagamento`, `status`, `filial_id`, `centro_custo_id`, `oculto`, `excluido`, `deletado`.
- `df_contas_pagamentos`: `conta_id`, `valor_pago`, `data_pagamento`, `observacao`, `arquivado`, `arquivado_em`.
- `df_centros_custo`: `id`, `nome`, `empresa_id`.
- `df_filiais`: `id`, `nome`, `empresa_id` e campos fiscais/cadastrais quando disponíveis (`razao_social`, `nome_fantasia`, `cnpj`, `cidade`, `uf`, `endereco`, `numero`, `bairro`, `complemento`, `cep`).

Centros confirmados:

- `Administrativo`
- `Impostos e Taxas`
- `Marketing`
- `Mercadoria`
- `Ocupacao`
- `Operacional`
- `Pessoais`
- `RH`
- `Sistemas`
- `Utilidades`
- `Veiculos`

Nenhum `INSERT`, `UPDATE`, `DELETE`, DDL, migration ou alteracao de RLS/policies/grants/functions/triggers foi executado.

## Atualizacao 2026-07-04 — receitas e FATURAMENTO BRUTO

Foi criada a frente `Receitas / Entradas V1` para preencher o `FATURAMENTO BRUTO`.

O Fluxo de Caixa V1 agora:

- consulta `public.df_receitas`;
- usa `data_receita` para ano/mes da entrada;
- soma somente receitas `status = ativo` e `arquivado = false`;
- respeita filtro de filial;
- preenche `FATURAMENTO BRUTO` na tela, CSV e Excel;
- mantem saidas por rubricas;
- calcula `TOTAL GERAL = FATURAMENTO BRUTO - saidas`.

### Identificação fiscal das filiais

A tela e a exportação do Fluxo de Caixa V1 usam os dados fiscais cadastrados em `df_filiais`.

Quando uma filial está selecionada, a tela e o cabeçalho exportado exibem nome operacional, razão social, nome fantasia, CNPJ, cidade/UF e endereço quando existirem.

No consolidado geral, o relatório identifica a empresa/grupo e indica que contém múltiplas filiais. O consolidado não exibe CNPJ único quando não há um CNPJ fiscal consolidado cadastrado.

No Excel, a aba `Consolidado Geral` usa identificação de relatório consolidado. As abas por filial recebem os dados fiscais da respectiva filial quando disponíveis.

Dados 2025 do PDF `Resultados de vendas 2025.pdf` foram carregados em `df_receitas` como `Venda de Loja`:

- Andradina: R$ 2.365.617,00
- Tres Lagoas: R$ 1.708.082,00
- Paranaiba: R$ 371.723,00
- Brilho: R$ 406.353,00
- Total geral: R$ 4.851.775,00

## Atualização 2026-07-04 — diagnóstico de rubricas zeradas

Foi feita auditoria somente leitura no Supabase para entender por que algumas rubricas do Excel 2025 saíram zeradas.

Resultado do diagnóstico para 2025:

- movimentos pagos analisados em `df_contas`: 159;
- total de saídas pagas analisadas: R$ 153.168,92;
- movimentos com `centro_custo_id`: 159;
- movimentos sem `centro_custo_id`: 0;
- pagamentos parciais em `df_contas_pagamentos` em 2025: 0;
- centros encontrados nos pagamentos de 2025: `Impostos e Taxas` e `RH`.

Distribuição por centro de custo em 2025:

- `Impostos e Taxas`: 99 movimentos, R$ 96.516,37;
- `RH`: 60 movimentos, R$ 56.652,55.

Achado principal:

- As rubricas `Mercadoria`, `Ocupação`, `Utilidades`, `Pessoais`, `Administrativo`, `Operacional`, `Marketing`, `Sistemas`, `Veículos` e bancos ficaram zeradas porque não existem pagamentos 2025 com esses centros de custo na base consultada.
- Os movimentos de `RH` encontrados são majoritariamente FGTS/INSS; pela regra obrigatória, continuam classificados como `IMPOSTOS RECOLHIDOS SOBRE FOLHA`, não como `FOLHA DE PAGAMENTO`.

Correções aplicadas:

- o service passou a trazer também o campo legado `centro`, além de `centro_custo_id` e `df_centros_custo(nome)`;
- a classificação central foi normalizada em UTF-8 e passou a usar `centro` como fallback quando necessário;
- a tela passou a exibir diagnóstico adicional: sem centro, sem rubrica e movimentos perdidos;
- a exportação mantém a soma por rubrica batendo com o total de saídas.

Nenhum dado real foi alterado. Não houve `INSERT`, `UPDATE`, `DELETE`, migration ou alteração de RLS/policies/functions/triggers.

## Atualização 2026-07-04 — critério histórico de data de caixa

Decisão de negócio: para corrigir o histórico anterior à baixa operacional mais consistente, contas pagas sem `data_pagamento` usam vencimento apenas até 31/05/2026, sem alterar dados antigos no banco.

Regra aplicada para saídas:

- se existir `data_pagamento`, usar `data_pagamento`;
- se não existir data de pagamento, usar `data_vencimento` ou `vencimento` como `vencimento_historico` somente quando a referência for até 31/05/2026;
- a partir de 01/06/2026, contas sem `data_pagamento` não entram como realizado;
- se existir `valor_pago` maior que zero, usar `valor_pago`;
- se `valor_pago` estiver vazio/nulo/zero, usar `valor` original da conta;
- considerar apenas contas pagas/quitadas;
- excluir contas `oculto`, `excluido` ou `deletado`;
- não duplicar conta-pai quando houver pagamento parcial ativo.

Auditoria somente leitura em 2025:

- regra antiga: 159 movimentos, R$ 153.168,92;
- regra nova: 426 movimentos, R$ 523.249,92;
- entraram por `data_pagamento`: 159 movimentos, R$ 153.168,92;
- entraram por vencimento histórico: 267 movimentos, R$ 370.081,00;
- usaram `valor_pago`: 159 movimentos;
- usaram `valor` original: 267 movimentos;
- pendentes com vencimento em 2025 foram mantidos fora do relatório.

O relatório e a exportação exibem a observação:

`Critério histórico: até 05/2026, contas pagas sem data de pagamento usam vencimento como referência. A partir de 06/2026, somente pagamentos baixados com data de pagamento entram no realizado.`

## Atualização 2026-07-04 — separação de juros reais

Auditoria de 2026 confirmou que a rubrica `DESPESAS FINANCEIRAS ( JUROS )` estava recebendo o `valor_pago` inteiro da conta quando `juros_multa > 0`.

Regra aplicada:

- a despesa principal permanece na rubrica original, sem `juros_multa`;
- `DESPESAS FINANCEIRAS ( JUROS )` recebe somente o valor de `juros_multa`;
- a precedência de `FGTS/INSS` como `IMPOSTOS RECOLHIDOS SOBRE FOLHA` foi preservada;
- descrições com termos como juros/multa não movem a conta inteira para juros quando `juros_multa` está zerado;
- pagamentos parciais não herdam `juros_multa` da conta-pai;
- o total geral de saídas é preservado por redistribuição entre principal e juros.

Impacto esperado no consolidado 2026:

- antes: `DESPESAS FINANCEIRAS ( JUROS )` em R$ 5.564,74;
- depois: `DESPESAS FINANCEIRAS ( JUROS )` em R$ 147,17;
- diferença redistribuída para as rubricas originais das despesas.
