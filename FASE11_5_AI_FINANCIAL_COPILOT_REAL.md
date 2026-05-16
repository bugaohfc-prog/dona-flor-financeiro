# Fase 11.5 — AI Financial Copilot REAL

## Entregas
- Copilot financeiro visível na tela de Relatórios.
- Botão flutuante para perguntas rápidas.
- Executive AI Summary baseado nos filtros atuais.
- Smart Priority Engine com ações ordenadas.
- Recomendações IA acionáveis.
- Nova visão no seletor: Copilot IA 11.5.
- Nova aba na exportação Excel: Copilot IA 11.5.

## Limpeza/refatoração aplicada
- Removido motor XLSX legado duplicado de Relatorios.jsx.
- Mantida exportação única via src/services/export/reportExportService.js.
- Corrigido ResponsiveContainer duplicado no gráfico de tendência.
- Componente do Copilot isolado em src/components/reports/AIFinancialCopilot.jsx.

## Observação
O Copilot é determinístico/local nesta fase: não chama API externa e usa somente os dados filtrados do relatório.
