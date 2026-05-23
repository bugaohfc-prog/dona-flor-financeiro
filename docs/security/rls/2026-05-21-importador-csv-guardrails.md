# Guardrails do importador CSV

Data: 2026-05-21
Atualização de permissão frontend: 2026-05-22
Atualização de duplicidade: 2026-05-23

## Status

Correções mínimas aplicadas e validadas no fluxo de importação CSV.

Os ciclos não alteraram RLS, policies, SQL, CSS/layout, Pipedream, billing, menu lateral estrutural, configurações/topo, `convidar-usuario`, centro de custo, notas, relatórios/dashboard ou onboarding.

Arquivo funcional alterado nos ciclos da correção:

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

## Permissão frontend

O acesso ao importador CSV passou a ser permitido somente para perfis que podem acessar configurações:

- master;
- admin;
- gerente.

A regra frontend usa o helper `podeImportarContas()`, definido em `src/App.jsx`.

`podeImportarContas()` reutiliza `podeAcessarConfiguracoes()`, preservando a regra já validada para master, admin e gerente.

Guardrails de permissão aplicados:

- operador/usuário comum não vê o item de menu `Importar contas`;
- acesso direto à tela `importar` renderiza mensagem de `Acesso restrito`;
- `importarExcelParaContas` valida permissão no início da função;
- sem permissão, nenhuma criação ou inserção de centro, filial ou conta é executada;
- a correção não alterou `src/config/menuSections.js`;
- a correção não alterou o parser nem os guardrails de validação do CSV.

Este é um guardrail frontend. Ele não substitui RLS/policies no Supabase.

## Proteção contra duplicidade

A proteção contra duplicidade foi adicionada para reduzir o risco de reimportar a mesma planilha e criar lançamentos repetidos em massa em `df_contas`.

O critério de duplicidade exata usa a chave:

- `empresa_id`;
- descrição normalizada;
- valor em centavos;
- `data_vencimento` / vencimento final validado;
- `centro_custo_id` resolvido ou nulo;
- `filial_id` resolvido ou nulo.

A descrição é normalizada com trim, caixa baixa, remoção de acentos e redução de espaços repetidos. O valor usa o número já parseado e validado pelo importador, convertido para centavos. A data usa o valor final já validado antes da importação.

O `status` não entra na chave principal porque o mesmo lançamento pode aparecer como `pendente` em uma importação e como `pago` em outra. Nesse caso, a diferença de status não deve criar uma nova conta automaticamente.

Comportamento validado:

- duplicadas internas no próprio CSV são ignoradas, mantendo a primeira ocorrência;
- duplicadas já existentes em `df_contas` são ignoradas;
- a consulta ao banco sempre filtra por `empresa_id`;
- a consulta usa o intervalo de datas presente no CSV para reduzir o volume analisado;
- apenas contas novas são inseridas;
- se todas as linhas forem duplicadas, nenhuma conta é inserida e a mensagem exibida é amigável;
- a mensagem informa a quantidade importada e a quantidade ignorada por duplicidade quando houver mistura de linhas novas e duplicadas.

Esta proteção é feita no fluxo frontend do importador. Ela não cria constraint, índice único, trigger, RPC ou Edge Function.

## Fora do ciclo

- Não houve alteração de SQL/RLS/policies.
- Não houve alteração do parser/guardrails CSV no ciclo de permissão frontend.
- Não foi criada Edge Function.
- Não foi criada RPC.
- Não foi implementada transação.
- Não houve alteração de constraint ou FK.
- Não foi criado índice único no banco para impedir duplicidade em nível de banco.
- Duplicados prováveis ficaram fora deste ciclo; a proteção cobre somente duplicidade exata pela chave definida.

## Risco residual conhecido

Como a importação não é transacional neste ciclo, ainda pode haver criação parcial de centro ou filial se a falha ocorrer depois da validação prévia e antes do insert final das contas. O guardrail reduz importação parcial por erro evidente de planilha, mas não substitui uma operação transacional no banco.

Ainda não há índice único ou constraint SQL em `df_contas` para impedir duplicidade em nível de banco. Também não há análise de duplicados prováveis, como descrições parecidas, centros/filiais divergentes por erro de digitação ou variações manuais de texto.

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
- Master vê `Importar contas` e consegue importar.
- Admin vê `Importar contas` e consegue importar.
- Gerente vê `Importar contas` e consegue importar.
- Operador/usuário comum não vê `Importar contas`.
- Operador/usuário comum em acesso direto à tela `importar` recebe `Acesso restrito`.
- Operador/usuário comum não executa `importarExcelParaContas` sem permissão.
- CSV novo importa normalmente.
- Reimportar o mesmo CSV não duplica lançamentos e informa duplicadas ignoradas.
- CSV com duas linhas idênticas importa uma e ignora a duplicada interna.
- Mesma descrição, valor e data com filial diferente não é considerada duplicada.
- Mesma descrição, valor e data com centro diferente não é considerada duplicada.
- Mesma descrição, valor, data, centro e filial com status diferente é considerada duplicada.
- Conta sem centro e sem filial compara duplicidade por `null`/`null`.
- Todas as linhas duplicadas não geram insert e exibem mensagem amigável.
