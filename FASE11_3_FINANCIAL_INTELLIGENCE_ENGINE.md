# Fase 11.3 — Financial Intelligence Engine

## Status
Implementado sobre a base validada da Fase 11.2, sem alterar os fluxos estabilizados de sincronização, lixeira, PDF, Excel e CSV.

## O que entrou
- Nova visão `Inteligência 11.3` dentro de Relatórios Gerenciais.
- Motor de leitura financeira automática com:
  - nível de risco financeiro;
  - risco de caixa;
  - ticket médio;
  - peso de contas recorrentes;
  - Pareto das 3 maiores despesas;
  - detecção de anomalias acima de 2,5x o ticket médio;
  - ações recomendadas por prioridade.
- Excel atualizado com aba `Inteligencia 11.3`.
- Resumo do relatório atualizado para `Relatório Avançado 11.3 - Financial Intelligence Engine`.

## Critérios de validação
1. Abrir Relatórios Gerenciais.
2. Confirmar que os filtros continuam funcionando sem F5.
3. Em Visão, selecionar `Inteligência 11.3`.
4. Validar os cards:
   - Inteligência financeira;
   - Previsões e Pareto;
   - Ações recomendadas;
   - Anomalias financeiras.
5. Exportar Excel e confirmar a nova aba `Inteligencia 11.3`.
6. Exportar PDF, CSV e Excel para confirmar que a Fase 11.2 segue estável.
