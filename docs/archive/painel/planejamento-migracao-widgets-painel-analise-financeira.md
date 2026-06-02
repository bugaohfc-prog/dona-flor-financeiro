# Planejamento de Migração dos Widgets do Painel para Análise Financeira — DNA Gestão

## 1. Objetivo

Este documento prepara a transição futura do Painel principal do DNA Gestão para uma área de trabalho mais leve, operacional e útil para a rotina da empresa, mantendo as leituras financeiras densas na tela Análise Financeira.

A diretriz do ciclo é:

**Consolidar antes de expandir.**

Neste ciclo não há implementação, remoção de widgets, alteração de cálculo, alteração de rota, alteração de permissão ou mudança em banco de dados. O objetivo é diagnosticar o estado atual e definir uma ordem segura para microciclos futuros.

## 2. Diagnóstico atual do Painel

O Painel atual é renderizado por `src/pages/DashboardPage.jsx`, que delega a interface para `src/components/dashboard/DashboardHome.jsx`.

Na cópia analisada, foram localizados os seguintes blocos principais no Painel:

- filtro de filial do painel, com a mensagem de que indicadores, gráficos e contas em aberto respeitam a filial selecionada;
- cards financeiros de resumo: Total, Pago, Pendente e Vencido;
- bloco operacional por filial, com ranking de unidades, maior pendência e maior risco;
- ranking/lista de filiais por volume financeiro;
- gráfico de saúde financeira com distribuição das contas;
- gráfico Pago x Aberto x Vencido;
- ranking de Centros de custo, com Top 5 por volume financeiro;
- bloco de Agenda financeira / Próximos vencimentos;
- lista de Contas em aberto;
- bloco de Notas, com notas pendentes, críticas e urgentes.

Também foi observado que a tela `src/pages/Relatorios.jsx`, agora representada no menu como Análise Financeira, já concentra vários elementos gerenciais financeiros:

- filtros por mês, status, centro de custo e filial;
- totais de pago, pendente, vencido e total geral;
- ranking por centro de custo;
- ranking por filial;
- saúde financeira;
- qualidade de dados por centro de custo;
- comparativo mensal;
- projeções financeiras;
- distribuição por centro;
- Top despesas;
- resultado do filtro;
- exportações em CSV, XLSX e relatório imprimível, quando permitidas.

Arquivos esperados mas não localizados nesta cópia:

- `src/pages/Dashboard.jsx`;
- `src/pages/DashboardHome.jsx`;
- `src/pages/AgendaPage.jsx`;
- `docs/archive/diagnosticos/auditoria-visual-ux-dna-gestao.md`;
- `docs/archive/painel/redesenho-dashboard-painel-principal-dna-gestao.md`;
- `docs/planejamento-dashboard-geral-topbar-dna-gestao.md`;
- `docs/branding.md`.

Os documentos e arquivos não localizados devem ser considerados apenas ausência nesta cópia local analisada, não inexistência definitiva no repositório original.

## 3. Conceito final desejado

### Painel

O Painel deve ser a **Área de trabalho da empresa**.

Função:

- mostrar o que exige ação;
- facilitar a rotina diária;
- mostrar próximos vencimentos;
- destacar notas urgentes;
- indicar próximos compromissos;
- abrir espaço para alertas de pessoas;
- oferecer atalhos rápidos;
- apresentar resumo operacional enxuto.

O Painel deve responder: **o que preciso olhar ou fazer agora?**

### Análise Financeira

A Análise Financeira deve ser a área de **Indicadores e comparativos**.

Função:

- concentrar KPIs financeiros;
- exibir gráficos;
- reunir rankings;
- consolidar centros de custo;
- mostrar comparativos;
- calcular saúde financeira;
- exibir análises por filial;
- apoiar leituras gerenciais.

A Análise Financeira deve responder: **como está o desempenho financeiro e onde devo aprofundar a leitura?**

## 4. Classificação dos widgets atuais

| Widget/bloco atual | Tela atual | Decisão recomendada | Destino futuro | Justificativa | Risco | Observações |
|---|---|---|---|---|---|---|
| Filtro de filial do painel | Painel | Vai para Análise Financeira | Análise Financeira | Atua sobre indicadores, gráficos e contas em aberto, com caráter analítico financeiro. | Médio | Se permanecer no Painel, deve afetar apenas blocos operacionais curtos. |
| Cards Total, Pago, Pendente e Vencido | Painel | Virar resumo compacto | Painel e Análise Financeira | São úteis para orientação rápida, mas ocupam papel de KPI financeiro. | Baixo | No Painel, manter no máximo como alerta curto de pendências/vencidos. |
| Ranking de unidades | Painel | Vai para Análise Financeira | Análise Financeira | É ranking financeiro por filial/unidade, típico de leitura gerencial. | Baixo | A Análise Financeira já possui base para ranking por filial. |
| Maior pendência por filial | Painel | Virar resumo compacto | Painel | Pode gerar ação imediata quando houver pendência relevante. | Médio | Exibir só como alerta, sem ranking completo. |
| Maior risco por filial | Painel | Vai para Análise Financeira | Análise Financeira | É indicador gerencial e comparativo de risco financeiro. | Baixo | Pode virar alerta no Painel se houver vencido crítico. |
| Lista/ranking de filiais por volume financeiro | Painel | Vai para Análise Financeira | Análise Financeira | Ranking por volume não é rotina operacional diária. | Baixo | Preservar em tela analítica com filtros. |
| Saúde financeira / Distribuição das contas | Painel | Vai para Análise Financeira | Análise Financeira | Gráfico financeiro denso, já alinhado à função da Análise Financeira. | Baixo | Não remover sem garantir acesso equivalente. |
| Gráfico Pago x Aberto x Vencido | Painel | Vai para Análise Financeira | Análise Financeira | Comparativo visual financeiro. | Baixo | Pode virar contador compacto de vencidos no Painel. |
| Centros de custo / Top 5 por volume financeiro | Painel | Vai para Análise Financeira | Análise Financeira | Centro de custo é leitura gerencial financeira. | Médio | Evitar duplicar lógica de ranking em dois lugares. |
| Agenda financeira / Próximos vencimentos | Painel | Fica no Painel | Painel | Próximos vencimentos geram ação imediata. | Baixo | Renomear futuramente para Próximos compromissos/prazos, sem limitar a financeiro. |
| Métricas Hoje e Semana dos vencimentos | Painel | Virar resumo compacto | Painel | Úteis para rotina, mas devem ser simples. | Baixo | Bom candidato para bloco "Operação do dia". |
| Próximo compromisso baseado em conta | Painel | Fica no Painel | Painel | Ajuda o usuário a agir rapidamente. | Baixo | Deve evoluir para fonte mais ampla: contas, notas, férias, folha e compromissos manuais. |
| Botão Abrir agenda completa | Painel | Fica no Painel | Painel | Atalho operacional. | Baixo | Deve abrir Agenda como área de compromissos e prazos. |
| Contas em aberto | Painel | Virar resumo compacto | Painel | Gera ação, mas listagem extensa pode pesar o Painel. | Médio | Manter poucas contas prioritárias; lista completa fica em Contas. |
| Ações de pagar/editar em contas abertas | Painel | Avaliar depois | Painel ou Contas | Ações diretas são úteis, mas podem complexificar o Painel. | Médio | Preservar permissões e evitar duplicar fluxo de Contas. |
| Notas | Painel | Fica no Painel | Painel | Pendências e lembretes são parte da área de trabalho. | Baixo | Manter notas urgentes e pendentes, não necessariamente lista completa. |
| Notas críticas/urgentes | Painel | Fica no Painel | Painel | Geram ação imediata. | Baixo | Bom candidato para "Operação do dia". |
| Indicadores financeiros derivados no Painel | Painel | Vai para Análise Financeira | Análise Financeira | Reforçam leitura analítica e não rotina diária. | Médio | Mapear cálculo antes de mover para evitar divergência. |
| Alertas de pessoas | Não centralizado no Painel atual | Avaliar depois | Painel | Dependem de integração futura com Pessoas, Férias e Folha. | Médio | Não implementar sem microciclo próprio. |
| Atalhos rápidos | Parcialmente presentes | Fica no Painel | Painel | Facilitam rotina diária. | Baixo | Padronizar futuramente: Nova conta, Nova nota, Abrir agenda, Ver funcionários. |

## 5. Proposta de Painel futuro

Estrutura futura recomendada para um Painel leve:

### Linha 1 — Atalhos rápidos

- Nova conta;
- Nova nota;
- Abrir agenda;
- Ver funcionários.

### Linha 2 — Operação do dia

- Próximos vencimentos;
- Notas urgentes;
- Próximos compromissos.

### Linha 3 — Apoio de gestão

- Pessoas;
- Resumo operacional;
- Dica/aviso.

### Blocos opcionais

- aviso de segurança;
- status de dados;
- alertas automáticos;
- pendências da empresa.

O Painel não deve concentrar gráficos pesados, rankings extensos ou comparativos financeiros detalhados. Quando uma informação financeira for mantida no Painel, ela deve aparecer como alerta, contador ou resumo curto.

## 6. Proposta de Análise Financeira futura

A tela Análise Financeira deve concentrar:

- KPIs financeiros principais;
- gráfico de saúde financeira;
- pago x aberto x vencido;
- ranking de unidades;
- centros de custo;
- comparativos por período;
- filtros por empresa, filial, categoria, status e centro de custo, quando disponíveis;
- exportações, se já existirem e estiverem autorizadas;
- rankings e leituras gerenciais.

Importante:

**Não mover nada agora. Apenas planejar.**

A tela `src/pages/Relatorios.jsx` já possui boa parte da base necessária para essa concentração, incluindo filtros, rankings, gráficos, projeções, exportações e blocos de análise. O próximo trabalho deve ser confirmar equivalência visual e de cálculo antes de reduzir o Painel.

## 7. Dependências técnicas

Dependências identificadas:

- o Painel calcula dados financeiros em `src/components/dashboard/DashboardHome.jsx`, incluindo total, pago, pendente, vencido, rankings por filial, distribuição das contas, fluxo financeiro e centros de custo;
- a Análise Financeira calcula dados similares em `src/pages/Relatorios.jsx`, incluindo totais, ranking por centro, ranking por filial, saúde financeira, comparativos e projeções;
- há risco de duplicidade de lógica entre Painel e Análise Financeira;
- mover visualmente widgets sem consolidar cálculos pode gerar divergência entre telas;
- alguns blocos podem precisar virar componentes reaproveitáveis futuramente, mas isso não deve ser feito neste ciclo;
- o Painel depende de dados de contas, notas, filiais e permissões financeiras;
- blocos futuros de Pessoas, Férias e Folha dependeriam de dados de módulos de alto risco e exigem microciclos próprios;
- qualquer integração com pessoas deve preservar LGPD e não expor CPF em listagens.

Recomendação técnica futura:

- antes de mover ou ocultar widgets, comparar os cálculos equivalentes no Painel e na Análise Financeira;
- evitar criar dois cálculos para a mesma métrica;
- se houver reaproveitamento, planejar componentes compartilhados em ciclo específico;
- não mexer em services, hooks, Supabase, RLS ou permissões sem necessidade clara.

## 8. Ordem segura de implementação futura

### Ciclo 1 — Confirmar inventário visual do Painel

Validar manualmente com prints do Painel atual em desktop e mobile. Confirmar a lista real de blocos visíveis por perfil, empresa e volume de dados.

### Ciclo 2 — Reduzir Painel sem remover dados

Ocultar ou simplificar apenas widgets financeiros pesados, garantindo que eles continuam disponíveis na Análise Financeira. Priorizar gráficos, rankings e centros de custo.

### Ciclo 3 — Reforçar Análise Financeira

Conferir se todos os KPIs financeiros continuam acessíveis, coerentes e compreensíveis em Análise Financeira. Ajustar nomenclatura interna somente em microciclo próprio.

### Ciclo 4 — Implementar blocos operacionais do Painel

Evoluir o Painel com próximos vencimentos, notas urgentes, próximos compromissos, atalhos rápidos e sinais de Pessoas, sem misturar isso com leitura financeira pesada.

### Ciclo 5 — Revisar mobile

Garantir que o Painel ficou leve no celular, com prioridade para ação rápida e leitura curta.

### Ciclo 6 — Documentar estado final

Registrar o novo padrão do Painel e da Análise Financeira após a validação manual.

## 9. Riscos e cuidados

- não remover informações importantes sem destino claro;
- não alterar cálculos financeiros durante a migração visual;
- não quebrar filtros por filial, centro de custo, status ou período;
- não mexer em RLS;
- não mexer em services/hooks sem necessidade;
- não mover muitos blocos em um único ciclo;
- validar desktop e mobile;
- preservar performance;
- manter Análise Financeira como destino dos gráficos e rankings;
- preservar permissões atuais;
- não alterar exportações sem ciclo próprio;
- evitar que o Painel volte a virar um dashboard financeiro pesado;
- não introduzir dados sensíveis de Pessoas no Painel sem planejamento e validação.

## 10. Checklist de aceite futuro

Para a implementação futura, validar:

- Painel ficou mais leve;
- usuário ainda encontra análises financeiras;
- widgets movidos têm destino claro;
- Topbar permanece correto;
- menu permanece coerente;
- mobile melhora;
- build passa;
- validação manual feita;
- nenhuma regra de negócio financeira foi alterada sem autorização;
- nenhuma permissão foi alterada;
- nenhuma alteração de banco/RLS/migration foi feita fora de ciclo próprio.

## 11. Próximo passo recomendado

Próximo microciclo mais seguro:

**Inventário visual detalhado do Painel com print/manual.**

Motivo:

- confirma exatamente o que o usuário vê hoje;
- reduz risco de remover bloco útil;
- permite comparar desktop e mobile;
- evita mover widgets antes de provar que a Análise Financeira já cobre o conteúdo;
- mantém a diretriz de consolidar antes de expandir.

Depois desse inventário, o segundo passo recomendado é um ajuste leve no Painel para reduzir excesso financeiro, começando por ocultar ou compactar gráficos e rankings que já estejam cobertos na Análise Financeira.
