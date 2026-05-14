# FASE 11.2 — Global UI/Data Stability Harden

## Objetivo
Estabilizar a arquitetura visual e de dados do frontend antes de novas features.

## Correções aplicadas

- Removido uso de `AppFrame` como componente interno em telas secundárias críticas.
- Padronizado o uso de `renderAppFrame(...)` para evitar remount de subárvore em re-render global.
- Corrigida causa provável de inputs perdendo foco ao digitar em modais abertos a partir de páginas como Agenda, Relatórios e Lixeira.
- Reduzida tendência de flicker/remontagem em páginas secundárias.
- Salvamentos de contas agora aguardam recarregamento da lista antes de exibir sucesso.
- Alterações de status/lixeira agora aguardam sincronização de dados.
- Salvamentos e ações de notas agora aguardam atualização das listas antes do feedback.

## Regra técnica
Sem `setTimeout` para foco, sem forçar foco manual e sem remendo visual.
A correção atua na causa: evitar remount desnecessário e garantir refresh controlado após mutations.

## Validação

1. Abrir Agenda > botão `+` > criar conta e digitar normalmente.
2. Abrir Relatórios > botão `+` > criar conta e digitar normalmente.
3. Abrir Lixeira e navegar de volta sem piscar em cascata.
4. Criar conta/nota e confirmar que a lista atualiza sem F5.
5. Editar conta/nota e confirmar que o campo não perde foco a cada letra.

## Próximo passo recomendado
11.2A — Export Engine Rewrite para corrigir PDF/CSV com serviço único de exportação.
