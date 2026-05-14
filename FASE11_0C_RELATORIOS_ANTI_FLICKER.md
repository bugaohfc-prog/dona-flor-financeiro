# Fase 11.0C — Relatórios Anti-Flicker Patch

## Objetivo
Corrigir o comportamento em que a tela de Relatórios piscava/reorganizava várias vezes ao sair e voltar para a página.

## Ajustes aplicados
- Carregamento controlado com skeleton estável antes de renderizar os widgets.
- Busca de contas e centros em paralelo com `Promise.all`.
- Proteção contra atualização de estado após desmontagem do componente.
- Consolidação dos cálculos gerenciais em um único `useMemo`.
- Remoção de cálculos pesados espalhados pelo render principal.
- Callbacks estáveis para exportação, impressão, atualização e limpeza de filtros.
- Grid executivo com widgets preservado.
- Filtros sticky mantidos, porém renderizados somente após os dados estarem prontos.

## Validação recomendada
1. Abrir Menu > Relatórios.
2. Sair para outra tela.
3. Voltar para Relatórios 5 vezes.
4. Esperado: exibir um skeleton único e depois o painel final, sem piscar/reorganizar em cascata.
5. Testar filtros, CSV e PDF.
