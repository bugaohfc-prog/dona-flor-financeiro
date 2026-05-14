# Fase 11.1D — Export Hardening + Skeleton Loading

## Objetivo
Corrigir a camada de exportação dos relatórios avançados sem alterar a regra de negócio dos filtros nem comprometer a estabilidade anti-flicker já validada.

## Entregas

- Exportação Excel em `.xlsx` real, com estrutura OpenXML válida.
- Remoção do falso `.xls` baseado em HTML.
- CSV em UTF-8 com BOM e separador `;`, adequado para Excel em pt-BR.
- PDF/impressão gerado em janela própria com HTML limpo, evitando página em branco.
- Skeleton loading no lugar de estado visual vazio durante a busca inicial.
- Manutenção da barra de filtros não-sticky e do anti-flicker.

## Arquivo principal alterado

- `src/pages/Relatorios.jsx`

## Validação recomendada

1. Acessar `Menu → Relatórios`.
2. Sair e voltar para a página.
3. Confirmar que aparece um skeleton/loading único antes dos dados.
4. Exportar Excel e abrir o `.xlsx` sem alerta de formato inválido.
5. Exportar CSV e confirmar acentuação, separador `;` e colunas corretas.
6. Gerar PDF/impressão e confirmar que não sai página branca.
7. Confirmar que as contas continuam aparecendo na tela e nos arquivos exportados.

## Observação técnica

A exportação `.xlsx` foi implementada sem adicionar dependências externas para manter o projeto enxuto e evitar acoplamento desnecessário. O arquivo é montado em OpenXML com ZIP store e CRC32 no navegador.
