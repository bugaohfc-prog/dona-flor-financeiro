# Redesenho do Dashboard/Painel Principal — DNA Gestão

## 1. Objetivo

Este documento define o redesenho conceitual do Painel principal do DNA Gestão, sem implementação neste ciclo.

O Painel atual nasceu como um dashboard financeiro e ainda concentra indicadores, rankings, gráficos e widgets analíticos. Com a evolução do produto para uma plataforma modular, o Painel precisa se tornar a área de trabalho geral da empresa.

Diretriz:

**Consolidar antes de expandir.**

## 2. Conceito oficial do Painel

O Painel principal deve responder:

**O que preciso olhar ou fazer agora?**

Ele não deve ser uma central de análise financeira pesada. Deve funcionar como uma mesa de trabalho operacional, reunindo alertas, próximos prazos, pendências, atalhos e sinais rápidos dos módulos ativos.

Conceito oficial:

- Painel: Área de trabalho da empresa.

Função:

- orientar o usuário sobre prioridades do dia;
- mostrar pendências e próximos compromissos;
- dar acesso rápido às ações recorrentes;
- destacar alertas operacionais;
- evitar sobrecarga analítica.

## 3. Estado atual diagnosticado

Arquivos consultados:

- `docs/plano-consolidacao-pre-expansao-dna-gestao.md`
- `docs/auditoria-visual-ux-dna-gestao.md`
- `docs/branding/dna-gestao-branding.md`
- `src/config/menuSections.js`
- `src/components/dashboard/DashboardHome.jsx`
- `src/pages/Relatorios.jsx`
- `src/App.jsx`
- `src/components/layout/Topbar.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/MobileMenu.jsx`
- `src/styles.css`
- `src/styles/appStyles.js`

Achados principais:

- O grupo do menu ainda se chama `Dashboard`.
- O item `Painel` ainda tem descrição `Resumo financeiro`.
- `Agenda` ainda tem descrição `Vencimentos e previsões`.
- `dashboard`, `agenda` e `notas` ainda resolvem como `Gestão Financeira` na Topbar.
- `DashboardHome.jsx` contém KPIs financeiros: Total, Pago, Pendente e Vencido.
- `DashboardHome.jsx` contém ranking de unidades, maior pendência, risco vencido e ranking por filial.
- `DashboardHome.jsx` contém gráficos de distribuição das contas, fluxo atual e centros de custo.
- O widget de agenda no Painel ainda aparece como `Agenda financeira`.
- A tela de Agenda em `App.jsx` ainda é `Agenda Financeira`, baseada em contas vencidas, hoje, próximos 7 dias e restante do mês.
- `Relatorios.jsx` já possui DRE, rankings, saúde financeira, centros de custo, comparativos, projeções, exportações e análises financeiras.

Conclusão:

- O Painel atual mistura área operacional com análise financeira.
- A tela de Relatórios já tem vocação clara para virar `Análise Financeira`.
- O redesenho deve separar trabalho diário de análise gerencial.

## 4. Nomenclaturas oficiais planejadas

### Dashboard/Geral

- Grupo do menu: Geral.
- Painel: Área de trabalho da empresa.
- Agenda: Compromissos e prazos.
- Notas: Pendências e histórico.

### Financeiro

- Contas: Contas a pagar e filtros.
- Relatórios Financeiros: Análise Financeira.
- Descrição de Análise Financeira: Indicadores e comparativos.

### Topbar

Planejamento:

- Painel, Agenda e Notas devem aparecer como contexto `Geral` ou `Dashboard/Geral`, não como `Gestão Financeira`.
- Financeiro deve ficar reservado para Contas, Análise Financeira e Importar contas.

Não implementar neste ciclo.

## 5. O que deve permanecer no Painel

O Painel deve manter somente informações úteis para ação imediata.

### 5.1 Resumo operacional curto

Manter visão compacta, sem virar relatório:

- contas prioritárias;
- vencimentos próximos;
- notas urgentes/críticas;
- compromissos próximos;
- alertas de pessoas quando disponíveis;
- status resumido da operação.

Critério:

- se o dado exige comparação, gráfico ou interpretação profunda, deve ir para Análise Financeira;
- se o dado ajuda a decidir a próxima ação, pode ficar no Painel.

### 5.2 Próximos vencimentos

Manter como lista curta e acionável:

- vencidas;
- vencem hoje;
- próximas em poucos dias;
- valor;
- ação rápida segura quando permitida.

Evitar:

- rankings;
- gráficos;
- percentuais de saúde financeira;
- análise de concentração.

### 5.3 Notas urgentes

Manter:

- notas pendentes;
- notas críticas;
- notas urgentes;
- prazo/data quando existir;
- ação de abrir/ver/editar conforme permissão.

Diretriz:

- Notas devem ser tratadas como pendências e histórico da operação, não como complemento financeiro.

### 5.4 Próximos compromissos

Planejar bloco geral de agenda:

- vencimentos financeiros;
- notas com prazo;
- férias futuras;
- retornos de férias;
- fechamento de folha;
- exames/periódicos se mantidos no escopo funcional já existente;
- compromissos manuais futuros.

Não implementar sem ciclo próprio de Agenda.

### 5.5 Alertas de Gestão de Pessoas

Futuro, quando consolidado:

- férias vencidas ou próximas;
- retorno de férias;
- pendências de folha;
- admissões/aniversários, se planejados;
- alertas sem CPF em listagens.

Cuidados:

- não exibir CPF;
- não incluir dados médicos, CID, laudos ou diagnósticos;
- respeitar `empresa_id`;
- respeitar permissões.

### 5.6 Atalhos rápidos

Manter atalhos simples:

- nova conta;
- nova nota;
- abrir Agenda;
- abrir Contas;
- abrir Funcionários, se usuário tiver permissão;
- abrir Férias, se usuário tiver permissão;
- abrir Fechamento de Folha, se usuário tiver permissão.

Critério:

- atalhos devem ser poucos, previsíveis e baseados nas permissões existentes.

## 6. O que deve sair do Painel

Deve migrar para Análise Financeira:

- gráfico de distribuição das contas;
- gráfico Pago x Aberto x Vencido;
- ranking de unidades;
- maior pendência por filial;
- risco vencido por filial;
- ranking por filial;
- centros de custo;
- top 5 por volume financeiro;
- saúde financeira;
- comparativo mensal;
- DRE;
- projeções;
- concentração por centro;
- análises narrativas;
- exportações PDF/CSV/XLSX;
- KPIs analíticos pesados.

Regra:

- Painel mostra o que fazer.
- Análise Financeira mostra o que interpretar.

## 7. Estrutura futura sugerida do Painel

### 7.1 Cabeçalho

Conteúdo:

- título: Painel;
- subtítulo: Área de trabalho da empresa;
- empresa ativa;
- contexto Topbar: Geral.

Ações:

- nova conta;
- nova nota;
- abrir agenda.

Em mobile:

- ações abaixo do título;
- sem centralização;
- sem cards decorativos desnecessários.

### 7.2 Faixa de prioridades

Blocos compactos:

- Vencidas ou urgentes.
- Para hoje.
- Próximos 7 dias.
- Notas críticas/urgentes.

Os cards devem ser operacionais, não analíticos.

### 7.3 Lista curta de trabalho

Uma lista única ou blocos curtos:

- contas prioritárias;
- notas urgentes;
- compromissos próximos.

Critério:

- mostrar poucas linhas;
- link para ver tudo na tela específica.

### 7.4 Bloco de agenda

Nome:

- Próximos compromissos.

Descrição:

- Compromissos e prazos da empresa.

Inicialmente pode usar dados financeiros e notas, mas o planejamento deve permitir entrada futura de Férias, Folha e compromissos manuais.

### 7.5 Bloco de Gestão de Pessoas

Exibir apenas quando o módulo estiver ativo e o perfil tiver acesso:

- férias em atenção;
- retornos próximos;
- pendências de folha;
- atalhos para Funcionários, Férias e Folha.

Não incluir CPF nem dados sensíveis.

### 7.6 Atalhos

Bloco discreto:

- Contas;
- Agenda;
- Notas;
- Funcionários;
- Férias;
- Fechamento de Folha;
- Análise Financeira.

Somente exibir atalhos permitidos para o perfil.

## 8. Estrutura futura sugerida de Análise Financeira

Análise Financeira deve receber a densidade analítica que hoje está no Painel.

Conteúdo recomendado:

- KPIs financeiros;
- gráficos;
- rankings;
- centros de custo;
- DRE;
- comparativos;
- saúde financeira;
- projeções;
- exportações;
- narrativas e recomendações.

Nome planejado:

- Relatórios → Análise Financeira.

Descrição:

- Indicadores e comparativos.

Cuidados:

- não quebrar exportações existentes;
- não remover rota antiga sem validação;
- planejar compatibilidade de menu e navegação;
- validar permissões de exportação.

## 9. Agenda como peça central do Geral

A Agenda deve deixar de ser apenas financeira.

Nome:

- Agenda.

Descrição:

- Compromissos e prazos.

Bloco no Painel:

- Próximos compromissos.

Fontes futuras possíveis:

- vencimentos financeiros;
- notas com prazo;
- férias;
- exames/periódicos já existentes, com cautela LGPD;
- fechamento de folha;
- aniversários/admissões, se planejado;
- compromissos manuais.

Não implementar neste ciclo.

## 10. Ordem segura de implementação por microciclos

### Microciclo 1 — Documento conceitual

Status:

- Este documento.

Risco:

- baixo.

Arquivos:

- `docs/redesenho-dashboard-painel-principal-dna-gestao.md`.

Build:

- não necessário.

### Microciclo 2 — Renomear contexto conceitual do Geral

Objetivo:

- planejar mudança de `Dashboard` para `Geral`;
- planejar Topbar para não classificar Painel/Agenda/Notas como Financeiro.

Arquivos prováveis:

- `src/config/menuSections.js`;
- `src/components/layout/Topbar.jsx`;
- componentes de layout, se necessário.

Risco:

- médio por envolver navegação e percepção do produto.

Build:

- sim.

Validação:

- desktop e mobile;
- perfis diferentes;
- confirmar que nenhuma rota foi removida.

### Microciclo 3 — Aliviar o Painel sem criar nova lógica

Objetivo:

- remover ou ocultar do Painel os blocos analíticos mais pesados;
- manter contas em aberto, notas e próximos vencimentos.

Arquivos prováveis:

- `src/components/dashboard/DashboardHome.jsx`;
- `src/App.jsx`, apenas se necessário para props já existentes.

Risco:

- médio.

Build:

- sim.

Validação:

- Painel abre;
- Contas e Notas continuam funcionando;
- sem alteração em filtros, pagamentos ou services.

### Microciclo 4 — Planejar Análise Financeira

Objetivo:

- definir como Relatórios Financeiros vira Análise Financeira;
- mapear o que receberá do Painel.

Arquivos:

- documentação em `docs/`.

Risco:

- baixo.

Build:

- não.

### Microciclo 5 — Renomear Relatórios para Análise Financeira

Objetivo:

- ajustar nome de menu, título e descrições;
- preservar rota e comportamento.

Arquivos prováveis:

- `src/config/menuSections.js`;
- `src/pages/Relatorios.jsx`;
- `src/App.jsx`, se houver textos relacionados.

Risco:

- médio.

Build:

- sim.

Validação:

- navegação;
- exportações;
- permissões de exportação.

### Microciclo 6 — Agenda geral

Objetivo:

- planejar e depois evoluir Agenda de financeira para compromissos e prazos.

Arquivos prováveis:

- `src/App.jsx`, porque Agenda ainda está renderizada ali;
- futuro componente/página somente se prompt autorizar.

Risco:

- médio a alto se envolver novas fontes de dados.

Build:

- sim quando houver código.

Validação:

- sem quebrar vencimentos financeiros;
- sem exibir dados sensíveis.

### Microciclo 7 — Bloco de Pessoas no Painel

Objetivo:

- incluir alertas de Pessoas somente se houver dados já disponíveis e permissão.

Arquivos prováveis:

- `src/components/dashboard/DashboardHome.jsx`;
- hooks/serviços apenas se prompt futuro autorizar explicitamente.

Risco:

- alto por envolver dados de pessoas.

Build:

- sim.

Validação:

- LGPD;
- perfis;
- sem CPF;
- sem dados médicos.

## 11. Critérios de aceite futuros

Para o Painel redesenhado:

- título e subtítulo claros;
- Topbar não classifica Painel como Gestão Financeira;
- Painel mostra prioridades e ações, não análise pesada;
- Agenda aparece como compromissos e prazos;
- Notas aparecem como pendências e histórico;
- gráficos financeiros pesados saem do Painel;
- Análise Financeira concentra os gráficos e comparativos;
- mobile continua legível;
- nenhum dado sensível aparece indevidamente;
- permissões preservadas;
- build passa quando houver alteração em `src/`.

## 12. Fora do escopo agora

Não fazer neste ciclo:

- alterar código;
- renomear menu;
- alterar Topbar;
- mover widgets;
- criar rota;
- criar tela;
- alterar Agenda;
- alterar Relatórios;
- criar services/hooks;
- mexer em banco/RLS;
- mexer em permissões;
- criar exportações;
- integrar Folha/Férias/Financeiro.

## 13. Próximo ciclo recomendado

Próximo ciclo recomendado:

- Planejamento técnico da mudança `Dashboard/Geral` e Topbar.

Alternativa:

- Microciclo visual para aliviar o Painel removendo blocos analíticos pesados, mantendo apenas informações operacionais já existentes.

Recomendação:

- Fazer primeiro a decisão de nomenclatura (`Dashboard` ou `Geral`) antes de alterar componentes, para evitar retrabalho em menu, Topbar e documentação.
