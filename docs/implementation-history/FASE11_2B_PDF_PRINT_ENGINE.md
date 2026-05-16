# FASE 11.2B — PDF Print Engine

## Objetivo
Corrigir a impressão/PDF dos relatórios avançados sem afetar a estabilidade global conquistada na 11.2.

## Correção aplicada
- Substituição da impressão por iframe invisível de 0x0 por uma view de impressão isolada em iframe offscreen com tamanho A4.
- Escrita controlada do HTML com `document.open/write/close`.
- Espera por renderização, fontes e imagens antes de acionar `print()`.
- Validação de conteúdo para evitar impressão em branco.
- Limpeza controlada do iframe após a impressão.

## Validação
- Relatórios > PDF deve abrir a prévia de impressão com conteúdo do relatório.
- CSV e Excel permanecem com o comportamento da 11.2A.
- Formulários, Lixeira e sincronização da 11.2 permanecem preservados.
