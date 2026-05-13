# FASE 10.5D — Dashboard + Filtros por Filial

## Objetivo
Aplicar o filtro por filial também no dashboard, mantendo a base multiempresa/RLS já validada e sem refatoração agressiva.

## Alterações realizadas
- O dashboard agora recebe `contasFiltradas` em vez da lista bruta de contas.
- KPIs do dashboard passam a respeitar a filial selecionada.
- Gráficos do dashboard passam a respeitar a filial selecionada.
- Lista de contas em aberto do dashboard passa a respeitar a filial selecionada.
- Adicionado seletor de filial no dashboard com opção "Todas as filiais".
- Mantido o filtro por filial já existente em Contas.

## Preservado
- RLS sem alteração.
- Multiempresa sem alteração.
- Recorrência sem alteração.
- Filial em criação/edição de contas sem alteração.
- Sincronização desktop/mobile sem alteração.
- Dashboard validado preservado, com mudança incremental apenas na origem filtrada dos dados.

## Validação técnica
- `npm run build` executado com sucesso.
- Aviso existente do Vite sobre tamanho de chunk mantido, sem bloquear build.
