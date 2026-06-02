# Auditoria de Cobertura da Análise Financeira — DNA Gestão

## 1. Objetivo

Este documento verifica se a tela Análise Financeira, implementada atualmente em `src/pages/Relatorios.jsx` e acessada pela rota `relatorios`, já cobre os principais indicadores financeiros que hoje aparecem no Painel.

O objetivo é reduzir risco antes de compactar ou remover widgets financeiros do Painel principal. A diretriz permanece:

**Consolidar antes de expandir.**

Este ciclo não altera código, tela, rota, cálculo, permissão, banco, RLS, service, hook, exportação ou integração.

## 2. Diagnóstico geral

O Painel ainda possui KPIs e gráficos financeiros relevantes: Total, Pago, Pendente, Vencido, rankings por filial, saúde financeira, distribuição por status, centros de custo e próximos vencimentos.

A Análise Financeira é o destino natural para indicadores, gráficos, rankings, comparativos, centros de custo, projeções e exportações. Antes de compactar o Painel, é preciso confirmar que as informações continuam acessíveis em Análise Financeira, Contas, Agenda ou Notas.

Diagnóstico resumido:

- a Análise Financeira já cobre a maior parte dos KPIs e blocos analíticos do Painel;
- os blocos operacionais, como próximos vencimentos, contas em aberto e notas, não precisam ser totalmente cobertos pela Análise Financeira;
- algumas informações do Painel estão cobertas na Análise Financeira, mas com filtros/períodos diferentes;
- há risco de duplicidade de lógica entre `DashboardHome.jsx` e `Relatorios.jsx`;
- o próximo ciclo de implementação deve evitar alteração de cálculo.

Arquivos esperados mas não localizados nesta cópia:

- `src/pages/Dashboard.jsx`;
- `src/pages/DashboardHome.jsx`;
- `src/components/Dashboard/`;
- `docs/archive/diagnosticos/auditoria-visual-ux-dna-gestao.md`;
- `docs/archive/painel/redesenho-dashboard-painel-principal-dna-gestao.md`.

## 3. Indicadores financeiros identificados no Painel

Com base em `docs/archive/painel/inventario-visual-painel-principal-dna-gestao.md` e `src/components/dashboard/DashboardHome.jsx`, os blocos financeiros do Painel são:

| Indicador/bloco | Nome atual | Origem provável | Uso no Painel | Natureza |
|---|---|---|---|---|
| Total | Total | prop `total` | KPI financeiro geral | Analítico |
| Pago | Pago | prop `pago` | KPI de valor quitado | Analítico |
| Pendente | Pendente | prop `pendente` | KPI de valor em aberto | Analítico/operacional |
| Vencido | Vencido | prop `vencido` | KPI de atraso e urgência | Operacional/analítico |
| Filtro de filial | Visão por filial | `filiais`, `filtroFilial`, `setFiltroFilial` | Filtra indicadores, gráficos e contas em aberto | Analítico |
| Ranking de unidades | Ranking de unidades | `resumoFiliais`, `filialMaiorVolume` | Destaca filial com maior volume financeiro | Analítico |
| Maior pendência | Maior pendência | `filialMaiorPendente` | Destaca filial com maior pendência | Operacional/analítico |
| Risco vencido | Risco vencido | `filialMaiorRisco` | Destaca maior vencido por filial | Operacional/analítico |
| Comparativo por filial | Comparativo por filial / Top unidades | `resumoFiliais` | Ranking de até 5 unidades | Analítico |
| Saúde financeira | Saúde financeira / Distribuição das contas | `statusChartData`, `percentualPago` | Gráfico de distribuição por status | Analítico |
| Fluxo atual | Pago x Aberto x Vencido | `fluxoChartData` | Gráfico de comparação por status financeiro | Analítico |
| Centros de custo | Centros de custo / Top 5 por volume financeiro | `centroChartData`, `df_centros_custo` | Ranking de centros por volume | Analítico |
| Próximos vencimentos | Agenda financeira / Próximos vencimentos | `contasAgenda`, `proximaConta` | Agenda de contas abertas | Operacional |
| Hoje/Semana | Hoje e Semana | `contasHoje`, `contasSemana`, `totalHoje`, `totalSemana` | Resumo de vencimentos próximos | Operacional |
| Contas em aberto | Contas em aberto | `contasAbertasDashboard`, ações de conta | Lista acionável de contas abertas | Operacional |
| Notas | Notas | `notasPendentes`, `notasCriticas`, `notasUrgentes` | Pendências e lembretes | Operacional |

## 4. Recursos existentes na Análise Financeira

Mapeamento de `src/pages/Relatorios.jsx`:

| Recurso/bloco | Objetivo | Dados utilizados | Relação com o Painel |
|---|---|---|---|
| Filtros por mês, status, centro e filial | Recortar a análise financeira | `filtroMes`, `filtroStatus`, `filtroCentro`, `filtroFilial` | Cobre o filtro de filial e amplia com mês/status/centro |
| KPIs principais | Exibir totais financeiros | `totalGeral`, `totalPago`, `totalPendente`, `totalVencido`, `taxaPago`, `taxaVencido` | Cobre Total, Pago, Pendente e Vencido |
| DRE gerencial | Organizar visão financeira gerencial | `dreGerencial` | Não existe no Painel; reforça Análise Financeira |
| Tendência 6 meses | Mostrar evolução por período | `contasPorMes` | Vai além do Painel |
| Centros por valor | Gráfico de centros de custo | `chartCentros`, `ranking` | Cobre Centros de custo / Top 5 |
| Status financeiro | Gráfico de distribuição por status | `chartStatus` | Cobre Distribuição das contas e Pago x Aberto x Vencido |
| Ranking por filial | Listar unidades por volume financeiro | `rankingFiliais` | Cobre Ranking de unidades e Top unidades |
| Análise por filial | Leitura gerencial da maior unidade | `rankingFiliais` | Cobre parcialmente maior unidade e comparativo por filial |
| Análise financeira / inteligência | Sinais financeiros, risco caixa, ticket médio e pendências | `inteligenciaFinanceira` | Cobre risco e leitura gerencial com mais profundidade |
| Previsões e maiores despesas | Projetar valores e destacar despesas | `camadaPreditiva`, `topDespesas` | Vai além do Painel |
| Ações recomendadas | Orientar decisões | `inteligenciaFinanceira.acoes` | Reforça leitura que no Painel aparece só como alerta |
| Pontos de atenção | Mostrar anomalias e riscos | `inteligenciaFinanceira.anomalias`, `copilotFinanceiro` | Cobre parcialmente riscos/vencidos |
| Qualidade de dados | Medir classificação por centro de custo | `percentualClassificacao`, `contasComCentro`, `contasSemCentro` | Não existe no Painel; reforça centros |
| Comparativo mensal | Comparar mês atual, anterior, variação e previsão | `totalGeral`, `totalMesAnterior`, `diferencaMes`, `previsaoProximoMes` | Vai além do Painel |
| Distribuição por centro | Ranking/lista de centros | `ranking` | Cobre centros de custo |
| Top despesas | Mostrar maiores despesas | `topDespesas` | Não existe como bloco equivalente no Painel |
| Resultado do filtro | Resumo de centros, contas e dominante | `ranking`, `contasFiltradas`, `principalCentro` | Cobre parcialmente resumo analítico |
| Ranking por Centro | Ranking detalhado com pago, pendente e vencido | `ranking` | Cobre e amplia Centros de custo |
| Resumo do Centro | Detalhe quando há centro filtrado | `centroSelecionado`, `totalGeral`, `totalPago`, `totalPendente`, `totalVencido` | Cobre análise por centro |
| Exportações | CSV, XLSX e relatório imprimível | `exportCsv`, `createXlsxBlob`, `printHtmlReport` | Reforça Análise Financeira como destino gerencial |

## 5. Matriz de cobertura

| Indicador/bloco do Painel | Existe na Análise Financeira? | Cobertura | Evidência no código/documento | Ação recomendada | Risco |
|---|---|---|---|---|---|
| Total | Sim | Cobertura completa | `totalGeral`, `KpiCard`, exportações | Pode sair do destaque grande do Painel ou virar resumo compacto | Baixo |
| Pago | Sim | Cobertura completa | `totalPago`, `taxaPago`, `KpiCard`, `chartStatus` | Pode sair do Painel com segurança, mantendo compacto se necessário | Baixo |
| Pendente | Sim | Cobertura completa | `totalPendente`, filtro status, KPIs, inteligência | Pode virar resumo compacto no Painel | Baixo |
| Vencido | Sim | Cobertura completa | `totalVencido`, `taxaVencido`, insights, pontos de atenção | Deve permanecer no Painel como alerta curto | Baixo |
| Filtro de filial | Sim | Cobertura completa | `filtroFilial`, `rankingFiliais`, Análise por filial | Pode ser removido do Painel analítico, se blocos filtrados forem compactados | Médio |
| Ranking de unidades | Sim | Cobertura completa | `rankingFiliais`, Ranking por filial | Pode sair do Painel com segurança após validação visual | Baixo |
| Maior pendência | Sim | Cobertura parcial | `rankingFiliais` tem pendente/vencido, mas o destaque específico é diferente | Manter como alerta compacto ou reforçar destaque na Análise Financeira | Médio |
| Risco vencido | Sim | Cobertura parcial | `totalVencido`, `taxaVencido`, `riscoCaixa`, pontos de atenção | Manter alerta compacto no Painel; análise detalhada fica em Análise Financeira | Médio |
| Comparativo por filial / Top unidades | Sim | Cobertura completa | `rankingFiliais`, Análise por filial | Pode sair do Painel com segurança | Baixo |
| Saúde financeira / Distribuição das contas | Sim | Cobertura completa | `scoreSaude`, `statusSaude`, `chartStatus`, `Resumo financeiro` | Pode sair do Painel com segurança | Baixo |
| Pago x Aberto x Vencido | Sim | Cobertura completa | `chartStatus`, KPIs de pago/pendente/vencido | Pode sair como gráfico; manter contadores se necessário | Baixo |
| Centros de custo / Top 5 | Sim | Cobertura completa | `ranking`, `chartCentros`, `Distribuição por centro`, `Ranking por Centro` | Pode sair do Painel com segurança | Baixo |
| Próximos vencimentos | Parcialmente | Não precisa cobrir totalmente | Análise possui vencidos/pontos de atenção, mas não agenda operacional | Deve permanecer no Painel/Agenda | Baixo |
| Hoje/Semana | Não como bloco igual | Não precisa cobrir | Análise foca mês/status; Painel calcula `totalHoje` e `totalSemana` | Manter no Painel como operação do dia | Baixo |
| Contas em aberto | Parcialmente | Não precisa cobrir totalmente | Análise lista/filtra contas no contexto analítico; Contas é tela operacional | Virar lista curta no Painel; lista completa fica em Contas | Médio |
| Notas | Não | Não precisa cobrir | Notas pertence a `NotasPage.jsx` e ao Painel operacional | Manter no Painel/Notas | Baixo |

## 6. Classificação final por indicador

### Pode sair do Painel com segurança

- Ranking de unidades;
- Comparativo por filial / Top unidades;
- Saúde financeira / Distribuição das contas;
- gráfico Pago x Aberto x Vencido;
- Centros de custo / Top 5 por volume financeiro;
- Pago como KPI grande isolado.

Condição: validar manualmente que a Análise Financeira continua acessível e clara para o usuário.

### Pode virar resumo compacto

- Total;
- Pendente;
- Vencido;
- Maior pendência;
- Risco vencido;
- Contas em aberto.

Esses itens têm utilidade operacional quando apresentados como alerta curto, contador ou lista reduzida.

### Deve permanecer no Painel

- Próximos vencimentos;
- Hoje/Semana;
- Próximo compromisso;
- Contas em aberto em formato curto;
- Notas urgentes e pendentes;
- atalho para Agenda.

São itens de ação imediata, não apenas análise gerencial.

### Precisa reforçar Análise Financeira antes

- Destaque específico de maior pendência por filial;
- destaque específico de risco vencido por filial, se o produto considerar esse alerta indispensável fora do Painel.

A Análise Financeira já tem os dados-base, mas o destaque visual não é idêntico ao do Painel.

### Avaliar depois

- Filtro de filial no Painel;
- ações diretas sobre contas em aberto no Painel;
- integração futura com alertas de Pessoas, Férias e Folha.

Esses pontos dependem de decisão de produto e de como o Painel será redesenhado.

## 7. Lacunas encontradas

Lacunas ou diferenças identificadas:

- a Análise Financeira cobre ranking por filial, mas não necessariamente replica o destaque exato de "Maior pendência" como card isolado;
- a Análise Financeira cobre risco financeiro e vencidos, mas não necessariamente replica o card "Risco vencido" por filial com a mesma apresentação do Painel;
- o Painel possui recorte operacional de vencimentos "Hoje" e "Semana", que não precisa ser coberto pela Análise Financeira;
- Contas em aberto aparecem no Painel como lista operacional, enquanto a Análise Financeira trabalha melhor como leitura analítica; a lista completa deve ficar em Contas;
- pode haver diferença de período: o Painel usa a base atual de contas recebida por props, enquanto a Análise Financeira filtra por mês, status, centro e filial;
- há duplicidade de lógica para totais, rankings e status entre `DashboardHome.jsx` e `Relatorios.jsx`, o que exige cuidado antes de qualquer refatoração.

Não corrigir essas lacunas neste ciclo.

## 8. Recomendações

### Baixo risco

- ajustar nomenclatura visual dos blocos do Painel;
- compactar KPIs sem mexer em cálculo;
- reduzir destaque visual de gráficos financeiros;
- mover destaque visual para Análise Financeira sem alterar rota;
- manter vencidos e próximos vencimentos como alertas curtos no Painel.

### Médio risco

- ocultar blocos do Painel quando a Análise Financeira cobre bem;
- reorganizar seções do Painel;
- reduzir listas extensas de contas;
- alterar o comportamento do filtro de filial do Painel;
- trocar gráficos por resumos compactos.

### Alto risco

- alterar cálculo financeiro;
- alterar origem de dados;
- criar componentes compartilhados para métricas;
- mexer em hooks/services;
- mexer em filtros financeiros;
- alterar exportações;
- alterar permissões.

## 9. Ordem segura de implementação futura

### Ciclo 1 — Reforçar Análise Financeira, se necessário

Antes de compactar o Painel, decidir se a Análise Financeira precisa destacar melhor "Maior pendência por filial" e "Risco vencido por filial". Se isso for considerado importante, fazer esse reforço primeiro.

### Ciclo 2 — Compactar KPIs financeiros do Painel

Reduzir Total, Pago, Pendente e Vencido para um resumo menor, sem alterar cálculo.

### Ciclo 3 — Remover/ocultar gráficos pesados do Painel

Ocultar ou reduzir Saúde financeira, Pago x Aberto x Vencido e Centros de custo, pois a Análise Financeira cobre esses itens.

### Ciclo 4 — Transformar Contas em aberto em lista curta de prioridades

Manter poucas contas relevantes no Painel, preservando a lista completa na tela Contas.

### Ciclo 5 — Criar blocos operacionais do Painel

Evoluir atalhos, próximos compromissos, notas urgentes e sinais de Pessoas em microciclos separados.

### Ciclo 6 — Revisar mobile

Validar leveza, rolagem e hierarquia visual no celular.

## 10. Checklist para compactação futura do Painel

Antes de remover ou compactar qualquer bloco:

- o dado existe na Análise Financeira, Contas, Agenda ou Notas;
- nenhum cálculo será alterado;
- nenhuma permissão será alterada;
- nenhuma rota será alterada;
- nenhum SQL/RLS/migration será criado;
- nenhum service/hook será alterado sem ciclo específico;
- o build passará quando houver alteração em `src/`;
- desktop e mobile serão validados;
- usuário conseguirá encontrar a informação depois.

## 11. Próximo passo recomendado

Próximo microciclo mais seguro:

**Compactar KPIs financeiros do Painel, sem alterar cálculo.**

Justificativa:

- a auditoria indica cobertura suficiente em Análise Financeira para Total, Pago, Pendente, Vencido, status financeiro, centros e rankings;
- a compactação visual é mais segura do que mover lógica;
- mantém no Painel apenas o que ajuda a rotina diária;
- preserva a Análise Financeira como destino dos detalhes gerenciais;
- permite validar impacto visual antes de ocultar gráficos inteiros.

Se o produto exigir paridade visual total antes da compactação, o passo anterior deve ser reforçar em Análise Financeira os destaques de maior pendência e risco vencido por filial.
