# FASE 11.1 — Relatórios Avançados

## Objetivo
Evoluir os Relatórios Gerenciais para uma camada executiva com leitura avançada, exportação Excel, gráficos e visão multiunidade.

## Implementado

- Exportação Excel `.xls` profissional com resumo, DRE gerencial e contas do relatório.
- Filtro adicional por filial/unidade.
- Seletor de visão executiva:
  - Visão DRE
  - Visão Gráficos
  - Visão Filiais
- DRE gerencial com realizado, a realizar, risco vencido, previsão e eficiência.
- Gráfico de tendência dos últimos 6 meses.
- Gráfico por centro de custo.
- Gráfico de composição por status financeiro.
- Ranking multiunidade por filial.
- Insight executivo para unidade dominante.
- Manutenção do patch anti-flicker real da Fase 11.0D.

## Arquivo principal alterado

- `src/pages/Relatorios.jsx`

## Como validar

Acesse:

`Menu → Relatórios`

Validar:

1. A tela continua sem piscar ao entrar e sair.
2. Botão Excel baixa arquivo corretamente.
3. Filtro de filial aparece e filtra contas por unidade.
4. Seletor Visão DRE mostra DRE gerencial e tendência.
5. Seletor Visão Gráficos mostra gráficos de centro e status.
6. Seletor Visão Filiais mostra ranking multiunidade.
7. PDF e CSV continuam funcionando.
8. Filtros sticky continuam estáveis.
9. Dados continuam isolados por empresa via `empresa_id` e RLS existente.

## Observação técnica

A exportação Excel foi feita sem nova dependência externa, usando arquivo HTML compatível com Excel, evitando aumento de risco no build.
