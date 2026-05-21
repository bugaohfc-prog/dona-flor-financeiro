# Guardrails de centro de custo

Data: 2026-05-21

## Contexto

Após a auditoria do fluxo de centro de custo, foi aplicada uma correção mínima de segurança operacional no frontend/service, sem alteração de SQL, constraints, FK, RLS ou policies.

O objetivo foi reduzir risco de inconsistência funcional sem alterar arquitetura, layout, importador CSV, relatórios, dashboard, onboarding, Pipedream ou billing.

## Estrutura funcional

- `df_centros_custo` usa `id`, `empresa_id` e `nome`.
- `df_contas` usa `centro_custo_id`.
- `df_contas_recorrentes` usa `centro_custo_id`.
- `df_notas` não usa centro de custo no fluxo atual.

## Guardrail de exclusão

Antes de excluir um centro de custo, o app deve verificar se o centro está em uso na empresa ativa:

- em `df_contas`, filtrando por `empresa_id` e `centro_custo_id`;
- em `df_contas_recorrentes`, filtrando por `empresa_id` e `centro_custo_id`.

Se houver uso em contas ou recorrências, a exclusão deve ser bloqueada com mensagem amigável.

Se a verificação falhar, a exclusão também deve ser bloqueada por segurança. O sistema não deve apagar centro de custo quando não consegue confirmar se ele está livre.

Se não houver uso, a exclusão continua funcionando como antes.

## Guardrail de salvamento de conta

Quando o usuário seleciona um centro de custo no cadastro ou edição de conta, o app deve validar se o centro ainda pertence à empresa ativa antes de salvar.

Se o centro selecionado ficar inválido ou stale, a conta não deve ser salva com `centro_custo_id = null` silenciosamente. O salvamento deve ser bloqueado com mensagem amigável pedindo para atualizar a página ou selecionar outro centro.

Conta sem centro de custo continua permitida. O bloqueio só se aplica quando havia centro selecionado e ele não foi validado.

## Recorrências

O mesmo centro validado no salvamento da conta é usado no payload de `df_contas_recorrentes`, preservando a criação/edição de recorrências sem permitir centro inválido.

## Fora do escopo

Este ciclo não alterou:

- SQL, constraints, FK, RLS ou policies;
- importador CSV;
- notas;
- relatórios;
- dashboard;
- onboarding;
- CSS/layout;
- Pipedream;
- billing/plano comercial;
- menu lateral;
- configurações/topo fora do bloqueio de exclusão.

## Arquivos do ciclo

- `src/App.jsx`
- `src/hooks/useContas.js`
- `src/services/contasService.js`

## Checklist validado

- Centro novo sem uso pode ser excluído.
- Centro vinculado a `df_contas` não é excluído.
- Centro vinculado a `df_contas_recorrentes` não é excluído.
- Falha na verificação de uso bloqueia exclusão.
- Conta com centro válido salva normalmente.
- Conta sem centro continua permitida.
- Conta com centro inválido/stale não salva como `null` silenciosamente.
