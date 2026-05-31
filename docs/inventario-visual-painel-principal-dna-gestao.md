# Inventário Visual do Painel Principal — DNA Gestão

## 1. Objetivo

Este documento inventaria os blocos atuais do Painel principal do DNA Gestão para decidir, com segurança, o que deve permanecer no Painel e o que deve migrar futuramente para Análise Financeira.

A diretriz do ciclo é:

**Consolidar antes de expandir.**

Este ciclo é apenas documentação e diagnóstico. Não há alteração de código, tela, rota, cálculo, permissão, banco, RLS, service, hook ou exportação.

## 2. Diagnóstico geral

O Painel atual ainda possui muitos blocos financeiros e analíticos. Ele reúne, no mesmo espaço, cards de totais, ranking de filiais, gráficos financeiros, centros de custo, próximos vencimentos, contas em aberto e notas.

A tela Análise Financeira, ainda implementada na rota `relatorios`, já absorve parte importante dos indicadores financeiros: KPIs, filtros por mês/status/centro/filial, ranking por centro, ranking por filial, saúde financeira, comparativos, projeções, gráficos e exportações.

A futura mudança deve evitar perda de informação. Antes de ocultar ou compactar qualquer widget do Painel, é necessário confirmar se o dado continua acessível em Análise Financeira, Contas, Agenda ou Notas.

O conceito final desejado é que o Painel seja a **Área de trabalho da empresa**, priorizando rotina, ação imediata, pendências, compromissos e atalhos.

Arquivos esperados mas não localizados nesta cópia:

- `src/pages/Dashboard.jsx`;
- `src/pages/DashboardHome.jsx`;
- `src/pages/AgendaPage.jsx`;
- `docs/auditoria-visual-ux-dna-gestao.md`;
- `docs/redesenho-dashboard-painel-principal-dna-gestao.md`;
- `docs/planejamento-dashboard-geral-topbar-dna-gestao.md`.

Arquivos localizados e usados como base:

- `docs/plano-consolidacao-pre-expansao-dna-gestao.md`;
- `docs/planejamento-migracao-widgets-painel-analise-financeira.md`;
- `src/pages/DashboardPage.jsx`;
- `src/components/dashboard/DashboardHome.jsx`;
- `src/pages/Relatorios.jsx`;
- `src/config/menuSections.js`;
- `src/pages/NotasPage.jsx`;
- `src/pages/ContasPage.jsx`;
- `src/pages/FuncionariosPage.jsx`;
- `src/pages/FeriasPage.jsx`;
- `src/pages/FechamentoFolhaPage.jsx`;
- `src/styles.css`;
- `src/styles/appStyles.js`.

## 3. Lista de blocos/widgets encontrados no Painel

### Filtro de filial do painel

- Nome/título atual: Visão por filial / Todas as filiais ou nome da filial selecionada.
- Objetivo aparente: filtrar indicadores, gráficos e contas em aberto por filial.
- Tipo de informação: filtro financeiro/operacional.
- Origem provável dos dados: `filiais`, `filtroFilial`, `setFiltroFilial`, `contasOperacionaisFiliais` e `contas`.
- Classificação: analítico com impacto operacional.
- Observações: o próprio texto do bloco informa que indicadores, gráficos e contas em aberto respeitam a filial selecionada.

### Resumo financeiro

- Nome/título atual: Resumo financeiro, via `aria-label`.
- Blocos visíveis: Total, Pago, Pendente e Vencido.
- Objetivo aparente: mostrar KPIs financeiros globais.
- Tipo de informação: KPI financeiro.
- Origem provável dos dados: props `total`, `pago`, `pendente` e `vencido`.
- Classificação: analítico.
- Observações: útil, mas pesado para o novo conceito de Painel. Pode virar resumo compacto de pendências/vencidos.

### Ranking de unidades

- Nome/título atual: Ranking de unidades.
- Objetivo aparente: destacar a filial com maior volume financeiro.
- Tipo de informação: ranking financeiro por filial.
- Origem provável dos dados: `resumoFiliais`, `filialMaiorVolume`, contas por filial.
- Classificação: analítico.
- Observações: melhor alinhado à Análise Financeira.

### Maior pendência

- Nome/título atual: Maior pendência.
- Objetivo aparente: destacar a filial com maior valor pendente.
- Tipo de informação: alerta financeiro por filial.
- Origem provável dos dados: `filialMaiorPendente`, contas pendentes por filial.
- Classificação: misto, analítico e operacional.
- Observações: pode permanecer no Painel apenas como alerta curto, sem ranking completo.

### Risco vencido

- Nome/título atual: Risco vencido.
- Objetivo aparente: destacar a filial com maior valor vencido.
- Tipo de informação: risco financeiro.
- Origem provável dos dados: `filialMaiorRisco`, contas vencidas por filial.
- Classificação: analítico com potencial ação.
- Observações: pode virar alerta compacto de vencidos críticos.

### Comparativo por filial / Top unidades

- Nome/título atual: Comparativo por filial / Top unidades.
- Objetivo aparente: exibir ranking de filiais por volume, pendência e quantidade de contas.
- Tipo de informação: ranking e comparativo financeiro.
- Origem provável dos dados: `resumoFiliais`.
- Classificação: analítico.
- Observações: deve migrar para Análise Financeira, que já possui Ranking por filial e Análise por filial.

### Saúde financeira / Distribuição das contas

- Nome/título atual: Saúde financeira / Distribuição das contas.
- Objetivo aparente: exibir distribuição de contas por status financeiro.
- Tipo de informação: gráfico financeiro.
- Origem provável dos dados: `statusChartData`, `pago`, `pendente`, `vencido`, `percentualPago`.
- Classificação: analítico.
- Observações: o formato com gráfico de rosca pertence melhor à Análise Financeira.

### Fluxo atual / Pago x Aberto x Vencido

- Nome/título atual: Fluxo atual / Pago x Aberto x Vencido.
- Objetivo aparente: comparar visualmente os valores pagos, abertos e vencidos.
- Tipo de informação: gráfico financeiro comparativo.
- Origem provável dos dados: `fluxoChartData`, `pago`, `pendente`, `vencido`.
- Classificação: analítico.
- Observações: deve ficar em Análise Financeira; no Painel, pode virar contador compacto.

### Centros de custo / Top 5 por volume financeiro

- Nome/título atual: Centros de custo / Top 5 por volume financeiro.
- Objetivo aparente: mostrar os centros de custo com maior volume financeiro.
- Tipo de informação: ranking financeiro por centro de custo.
- Origem provável dos dados: `centroChartData`, `contas`, `df_centros_custo`.
- Classificação: analítico.
- Observações: centro de custo é leitura gerencial e deve ficar em Análise Financeira.

### Agenda financeira / Próximos vencimentos

- Nome/título atual: Agenda financeira / Próximos vencimentos.
- Objetivo aparente: mostrar vencimentos próximos e abrir a agenda completa.
- Tipo de informação: operacional com base financeira.
- Origem provável dos dados: `contasAgenda`, `contasHoje`, `contasSemana`, `proximaConta`, `diferencaDias`.
- Classificação: operacional.
- Observações: deve permanecer no Painel, mas futuramente com nomenclatura mais ampla, como Próximos compromissos.

### Métricas Hoje e Semana

- Nome/título atual: Hoje e Semana dentro do bloco de próximos vencimentos.
- Objetivo aparente: resumir valor previsto para hoje e para a semana.
- Tipo de informação: resumo operacional financeiro.
- Origem provável dos dados: `totalHoje`, `totalSemana`.
- Classificação: operacional compacto.
- Observações: bom candidato para bloco "Operação do dia".

### Próximo compromisso

- Nome/título atual: Próximo compromisso.
- Objetivo aparente: destacar a próxima conta/vencimento.
- Tipo de informação: ação imediata.
- Origem provável dos dados: `proximaConta`.
- Classificação: operacional.
- Observações: deve evoluir para fonte mais ampla: contas, notas, férias, folha e compromissos manuais.

### Abrir agenda completa

- Nome/título atual: botão Abrir agenda completa.
- Objetivo aparente: atalho para a tela Agenda.
- Tipo de informação: ação de navegação.
- Origem provável dos dados: `navegarPara('agenda')`.
- Classificação: operacional.
- Observações: deve permanecer como atalho.

### Contas em aberto

- Nome/título atual: Contas em aberto.
- Objetivo aparente: listar contas abertas e vencimentos no Painel.
- Tipo de informação: lista operacional financeira.
- Origem provável dos dados: `contasAbertasDashboard`, `mostrarContasDashboard`, `setMostrarContasDashboard`, `busca`, `marcarComoPago`, permissões financeiras.
- Classificação: operacional, mas pode ocupar espaço demais.
- Observações: manter só itens prioritários no Painel; lista completa pertence a Contas.

### Notas

- Nome/título atual: Notas.
- Objetivo aparente: exibir lembretes, pendências e histórico ligados à empresa.
- Tipo de informação: operacional.
- Origem provável dos dados: `notasPendentes`, `notasCriticas`, `notasUrgentes`, `mostrarNotas`.
- Classificação: operacional.
- Observações: deve permanecer no Painel com foco em urgentes e pendentes, evitando lista longa.

### Alertas

- Nome/título atual: não há um bloco único de alertas gerais no Painel atual.
- Objetivo aparente: alertas aparecem de forma distribuída em vencidos, pendências e notas.
- Tipo de informação: operacional.
- Origem provável dos dados: contas vencidas, notas críticas/urgentes e futuros módulos.
- Classificação: avaliar depois.
- Observações: pode virar um bloco futuro de "Pendências da empresa".

### Atalhos

- Nome/título atual: não há uma linha dedicada de atalhos rápidos no Painel atual.
- Objetivo aparente: hoje existem atalhos embutidos, como Abrir agenda completa.
- Tipo de informação: navegação/ação.
- Origem provável dos dados: `navegarPara`.
- Classificação: operacional.
- Observações: criar linha dedicada em ciclo futuro.

## 4. Tabela de decisão

| Bloco/widget | Tipo | Decisão recomendada | Destino futuro | Justificativa | Risco ao mover/remover | Observações |
|---|---|---|---|---|---|---|
| Filtro de filial do painel | Filtro analítico | Avaliar depois | Painel ou Análise Financeira | Afeta gráficos e contas; depende do desenho final. | Médio | Se ficar no Painel, limitar aos blocos operacionais. |
| Total | KPI financeiro | Virar resumo compacto | Painel e Análise Financeira | Ajuda contexto, mas não deve dominar o Painel. | Baixo | Em Análise Financeira pode seguir como KPI. |
| Pago | KPI financeiro | Vai para Análise Financeira | Análise Financeira | É indicador de desempenho financeiro. | Baixo | No Painel, só se fizer parte de resumo compacto. |
| Pendente | KPI financeiro/operacional | Virar resumo compacto | Painel e Análise Financeira | Pendência gera ação, mas o KPI detalhado é analítico. | Baixo | Bom como alerta de pendências. |
| Vencido | KPI financeiro/operacional | Fica no Painel | Painel e Análise Financeira | Vencido exige ação imediata. | Baixo | Manter compacto; análise detalhada fica no financeiro. |
| Ranking de unidades | Ranking | Vai para Análise Financeira | Análise Financeira | Ranking é leitura gerencial. | Baixo | Análise Financeira já tem ranking por filial. |
| Maior pendência | Alerta financeiro | Virar resumo compacto | Painel | Ajuda ação, mas não precisa de bloco grande. | Médio | Validar com usuários antes de remover. |
| Risco vencido | Alerta financeiro | Virar resumo compacto | Painel | Pode apontar urgência real. | Médio | Se detalhado, vai para Análise Financeira. |
| Comparativo por filial / Top unidades | Ranking/comparativo | Vai para Análise Financeira | Análise Financeira | Comparativo por unidade é análise gerencial. | Baixo | Manter apenas alerta compacto no Painel, se necessário. |
| Saúde financeira / Distribuição das contas | Gráfico | Vai para Análise Financeira | Análise Financeira | Gráfico financeiro pesado. | Baixo | Não remover antes de validar cobertura na Análise Financeira. |
| Pago x Aberto x Vencido | Gráfico/comparativo | Vai para Análise Financeira | Análise Financeira | Comparativo visual financeiro. | Baixo | No Painel, substituir por contador simples se necessário. |
| Centros de custo / Top 5 | Ranking | Vai para Análise Financeira | Análise Financeira | Centro de custo é análise financeira. | Médio | Evitar duplicar lógica de centro de custo. |
| Agenda financeira / Próximos vencimentos | Operacional | Fica no Painel | Painel | Vencimentos próximos exigem ação. | Baixo | Renomear futuramente para Próximos compromissos. |
| Hoje e Semana | Resumo operacional | Fica no Painel | Painel | Ajuda rotina diária. | Baixo | Pode virar bloco compacto de Operação do dia. |
| Próximo compromisso | Operacional | Fica no Painel | Painel | Mostra o próximo item acionável. | Baixo | Ampliar fonte de dados em ciclo futuro. |
| Abrir agenda completa | Atalho | Fica no Painel | Painel | Facilita navegação. | Baixo | Deve permanecer como ação clara. |
| Contas em aberto | Lista operacional | Virar resumo compacto | Painel | Lista completa pesa o Painel, mas pendências são úteis. | Médio | Mostrar poucas contas prioritárias. |
| Ações de contas em aberto | Ação operacional | Avaliar depois | Painel ou Contas | Pode ser útil, mas duplica fluxo de Contas. | Médio | Preservar permissões financeiras. |
| Notas | Operacional | Fica no Painel | Painel | Pendências e histórico são parte da área de trabalho. | Baixo | Focar urgentes/pendentes. |
| Notas críticas/urgentes | Alerta operacional | Fica no Painel | Painel | Gera ação imediata. | Baixo | Deve ficar visível. |
| Alertas gerais | Operacional | Avaliar depois | Painel | Não há bloco consolidado; depende de novos módulos. | Médio | Pode receber dados de Pessoas, Férias e Folha futuramente. |
| Atalhos rápidos | Atalho | Fica no Painel | Painel | Ajuda rotina diária. | Baixo | Criar linha dedicada em ciclo futuro. |

## 5. Recomendações por prioridade

### Prioridade 1 — Baixo risco

- Ajustar textos e rótulos para reduzir linguagem exclusivamente financeira no Painel.
- Compactar KPIs financeiros sem mexer nos cálculos.
- Reordenar blocos para priorizar ação: vencimentos, notas e compromissos.
- Reduzir a presença visual de rankings e gráficos sem remover dados definitivamente.

### Prioridade 2 — Médio risco

- Mover ou ocultar widgets financeiros pesados do Painel quando a mesma informação já existir na Análise Financeira.
- Compactar Contas em aberto para uma lista curta de prioridades.
- Manter apenas alertas financeiros que exigem ação imediata.

### Prioridade 3 — Alto risco

- Alterar cálculo financeiro.
- Alterar origem dos dados.
- Criar componentes compartilhados que mexam em fluxo de dados.
- Alterar services, hooks, filtros ou permissões.

### Não mexer agora

Não mexer neste momento em:

- banco;
- RLS;
- cálculo financeiro sensível;
- permissões;
- exclusão definitiva de informação;
- services/hooks;
- exportações;
- integração entre Financeiro, Pessoas, Férias ou Folha.

## 6. Proposta de versão enxuta do Painel

### Atalhos rápidos

- Nova conta;
- Nova nota;
- Abrir agenda;
- Ver funcionários.

### Operação do dia

- Próximos vencimentos;
- Notas urgentes;
- Próximos compromissos.

### Apoio de gestão

- Pessoas;
- Resumo operacional;
- Dica/aviso.

### Compactos opcionais

- contas abertas;
- notas pendentes;
- compromissos hoje;
- alertas de pessoas.

O Painel enxuto deve evitar gráficos complexos, rankings extensos, tabelas longas e comparativos financeiros densos. Ele deve privilegiar ação rápida, leitura curta e fluxo diário.

## 7. Blocos recomendados para Análise Financeira

Devem ficar concentrados na Análise Financeira:

- KPIs financeiros principais;
- gráficos;
- rankings;
- comparativos;
- centros de custo;
- saúde financeira;
- pago x aberto x vencido;
- análise por filial;
- ranking por filial;
- ranking por centro;
- projeções financeiras;
- DRE gerencial;
- status financeiro;
- qualidade de dados;
- Top despesas;
- exportações, se existirem e estiverem autorizadas.

## 8. Ordem segura de implementação futura

### Ciclo 1 — Compactar Painel sem mover lógica

Ajustar apenas layout, ordem e visibilidade de blocos. Não alterar cálculo, service, hook ou origem dos dados.

### Ciclo 2 — Garantir Análise Financeira completa

Confirmar que os indicadores financeiros removidos ou reduzidos no Painel existem em Análise Financeira com leitura equivalente.

### Ciclo 3 — Reduzir widgets financeiros pesados do Painel

Mover, ocultar ou compactar gráficos, rankings e comparativos de forma controlada.

### Ciclo 4 — Criar blocos operacionais novos

Adicionar ou reorganizar próximos compromissos, pessoas, resumo operacional e atalhos rápidos.

### Ciclo 5 — Revisar mobile

Garantir que o Painel ficou mais leve no celular, com menos rolagem e menos carga visual.

### Ciclo 6 — Documentar estado final

Registrar a nova arquitetura do Painel e da Análise Financeira após validação manual.

## 9. Riscos e cuidados

- não remover dados sem destino claro;
- não alterar cálculos;
- não mexer em banco/RLS;
- não misturar simplificação do Painel com mudanças grandes na Análise Financeira;
- validar desktop e mobile;
- conferir se o usuário continua encontrando informações financeiras;
- preservar permissões;
- não alterar exportações;
- não criar dependência nova entre módulos sem planejamento;
- não exibir dados sensíveis de Pessoas no Painel sem ciclo específico.

## 10. Checklist para validação futura

Para cada implementação futura, validar:

- informação removida do Painel existe em Análise Financeira, Contas, Agenda ou Notas;
- nenhum cálculo foi alterado;
- nenhuma permissão foi alterada;
- Painel ficou mais leve;
- mobile melhorou;
- build passou;
- validação manual foi feita;
- Topbar continua exibindo Área de trabalho para Painel, Agenda e Notas;
- menu Financeiro continua exibindo Análise Financeira;
- não houve SQL, RLS ou migration fora de ciclo próprio.

## 11. Próximo passo recomendado

Próximo microciclo mais seguro:

**Revisar Análise Financeira para confirmar cobertura dos indicadores.**

Motivo:

- antes de compactar o Painel, é preciso garantir que KPIs, gráficos, rankings, centros de custo e comparativos já estejam acessíveis na Análise Financeira;
- reduz o risco de ocultar informação que o usuário ainda depende no Painel;
- permite definir com precisão quais blocos financeiros podem ser compactados ou removidos visualmente;
- mantém a diretriz de consolidar antes de expandir.

Depois dessa confirmação, o ciclo seguinte pode ser um ajuste leve no Painel para compactar blocos financeiros sem mover lógica.
