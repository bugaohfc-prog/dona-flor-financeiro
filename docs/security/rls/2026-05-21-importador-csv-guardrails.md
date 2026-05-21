# Guardrails do importador CSV

Data: 2026-05-21

## Status

Correção mínima aplicada e validada no fluxo de importação CSV.

O ciclo não alterou RLS, policies, SQL, CSS/layout, Pipedream, billing, menu lateral, configurações/topo, `convidar-usuario`, centro de custo, notas, relatórios/dashboard ou onboarding.

Arquivo funcional alterado no ciclo da correção:

- `src/App.jsx`

## Objetivo da correção

Reduzir risco de importação errada e perda silenciosa de classificação no importador CSV, principalmente em planilhas brasileiras com vírgula decimal e em linhas com centro de custo ou filial informados.

## Guardrails aplicados

- O parser escolhe um único delimitador por arquivo.
- O delimitador `;` é preferido quando aparece no cabeçalho ou em linha útil.
- O delimitador `,` só é usado quando não há `;`.
- A vírgula decimal brasileira é preservada, incluindo valores como `1.234,56` e `123,45`.
- Valores inválidos, vazios ou zero bloqueiam a importação.
- Datas impossíveis são bloqueadas antes do envio ao banco.
- Todas as linhas são validadas antes de criar centro, filial ou conta.
- O status passou a usar mapeamento explícito.
- `não pago` e `nao pago` são tratados como `pendente`.
- `pago`, `paga`, `quitado`, `quitada`, `recebido` e `recebida` são tratados como `pago`.
- Status desconhecido bloqueia a linha para evitar classificação incorreta.
- Centro informado precisa resolver para um `id` existente ou criado com sucesso.
- Filial informada precisa resolver para um `id` existente ou criado com sucesso.
- Conta com centro informado não deve ser salva com `centro_custo_id` nulo.
- Conta com filial informada não deve ser salva com `filial_id` nulo.
- Conta sem centro continua permitida, mantendo o comportamento validado.

## Fora do ciclo

- Não foi implementado bloqueio de duplicidade de lançamentos.
- Não houve alteração de permissão para acessar ou executar importação.
- Não foi criada Edge Function.
- Não foi criada RPC.
- Não foi implementada transação.
- Não houve alteração de SQL, constraint ou FK.

## Risco residual conhecido

Como a importação não é transacional neste ciclo, ainda pode haver criação parcial de centro ou filial se a falha ocorrer depois da validação prévia e antes do insert final das contas. O guardrail reduz importação parcial por erro evidente de planilha, mas não substitui uma operação transacional no banco.

Duplicidade de contas também permanece fora deste ciclo: reimportar a mesma planilha ainda pode duplicar lançamentos.

## Testes esperados

- CSV com `;` e valor `1.234,56` importa o valor como `1234.56`.
- CSV com `;` e valor `123,45` importa o valor como `123.45`.
- CSV com `,` como delimitador e valor `1234.56` continua funcionando.
- Campo entre aspas contendo separador continua funcionando.
- Linha sem descrição bloqueia a importação.
- Linha com valor inválido bloqueia a importação.
- Linha com data impossível bloqueia a importação.
- Status `não pago` vira `pendente`.
- Status `pago` vira `pago`.
- Centro informado é criado ou reutilizado e vinculado.
- Se centro informado não resolver/criar, a conta não é salva com centro nulo.
- Conta sem centro continua permitida.
- Se houver erro de validação em uma linha, centros e filiais de outras linhas não são criados por causa desse erro evidente.
