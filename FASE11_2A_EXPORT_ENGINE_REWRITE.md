# FASE 11.2A — Export Engine Rewrite

## Objetivo
Reestruturar a camada de exportação dos Relatórios para deixar Excel, CSV e PDF/impressão consistentes, sem depender de remount da UI ou de gambiarras visuais.

## Entregas
- Serviço central de exportação em `src/services/export/reportExportService.js`
- Excel `.xlsx` real com múltiplas abas
- CSV com UTF-8 BOM, separador `;` e dataset filtrado
- PDF/impressão por iframe dedicado, sem `about:blank`
- Exportações usando a mesma fonte de dados filtrada da tela
- Mantida a estabilidade global da fase 11.2

## Validação
1. Abrir Relatórios.
2. Aplicar filtros e confirmar que as contas aparecem na tela.
3. Exportar Excel e abrir no Microsoft Excel.
4. Exportar CSV e confirmar cabeçalhos + dados.
5. Gerar PDF/impressão e confirmar que o conteúdo aparece.
6. Testar com filtros sem dados para validar empty state da exportação.
