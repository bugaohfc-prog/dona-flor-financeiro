# Fase 11.0A — Relatórios UX Harden

## Objetivo
Melhorar a visualização dos Relatórios Gerenciais da fase 11.0, reduzindo a sensação de relatório corrido e transformando a tela em painel executivo com widgets.

## Melhorias aplicadas

- Layout expandido para visão gerencial em desktop.
- Cards KPI no topo: Total, Pago, Pendente e Vencido.
- Filtros com posição fixa no topo da área do relatório.
- Widgets executivos para resumo, saúde financeira, qualidade dos dados e comparativo mensal.
- Distribuição por centro em widget separado.
- Top despesas em ranking visual com posição numerada.
- Resultado do filtro em widget resumido.
- Ranking por centro em grid, evitando lista longa em uma única coluna.
- Contas do relatório em grid responsivo.
- Impressão/PDF mantida com classes de print.
- CSV mantido.

## O que validar

1. A tela de Relatórios deve ficar menos comprida e mais organizada em blocos.
2. Os filtros devem permanecer visíveis enquanto rola a tela.
3. Os cards KPI devem mostrar Total, Pago, Pendente e Vencido corretamente.
4. Os widgets devem respeitar filtros de mês, status e centro.
5. PDF e CSV devem continuar funcionando.
6. Mobile deve manter leitura sem quebrar.
7. Multiempresa/RLS não foi alterado.

## Arquivo principal alterado

- `src/pages/Relatorios.jsx`
