# Auditoria - evento pagamento parcial Fase 2A

Data: 2026-07-02

## Resumo executivo

A Fase 2A da auditoria operacional foi implementada para registrar somente o evento:

- `financeiro.pagamento_parcial.criado`

Foi criada a Edge Function `registrar-auditoria-evento`, com `verify_jwt = true`, e o fluxo de pagamento parcial passou a chama-la apos sucesso do `INSERT` em `public.df_contas_pagamentos`.

Nao foi criada tela de auditoria. Nao houve trigger em `df_contas_pagamentos` ou `df_contas`. Nao houve RPC `SECURITY DEFINER`. Nao houve ampliacao de grants, RLS ou policies de `public.df_auditoria_eventos`.

## Arquivos alterados

- `supabase/functions/registrar-auditoria-evento/index.ts`
- `supabase/config.toml`
- `src/services/contasService.js`
- `src/hooks/useContas.js`
- `docs/logs/auditoria-evento-pagamento-parcial-fase-2a.md`
- `docs/logs/auditoria-camada-escrita-evento-financeiro.md`

## Edge Function criada

Nome:

- `registrar-auditoria-evento`

Deploy:

- status: `ACTIVE`
- versao: `1`
- `verify_jwt`: `true`

Responsabilidades:

- aceitar somente `POST`;
- exigir `Authorization: Bearer ...`;
- validar usuario autenticado via JWT;
- aceitar somente `financeiro.pagamento_parcial.criado`;
- validar `empresa_id`, `conta_id` e `pagamento_id`;
- validar que a conta pertence a empresa;
- validar que o pagamento pertence a empresa;
- validar que o pagamento pertence a conta;
- validar que o usuario pertence a empresa por `user_id` ou e-mail do JWT;
- recusar payload com campos proibidos;
- montar evento sanitizado;
- aplicar idempotencia logica;
- inserir em `public.df_auditoria_eventos` com service role no servidor.

## Ponto de integracao no app

Ponto alterado:

- `src/hooks/useContas.js`

Fluxo:

1. `registrarPagamentoParcialService` cria o pagamento parcial.
2. O service retorna um payload de auditoria sanitizado.
3. O hook chama `registrarAuditoriaPagamentoParcialCriado`.
4. A chamada de auditoria e nao bloqueante.
5. Se a auditoria falhar, o pagamento parcial nao e revertido.
6. A falha e registrada no console com mensagem, codigo e status, sem payload sensivel.

Helper criado:

- `registrarAuditoriaPagamentoParcialCriado`

Arquivo:

- `src/services/contasService.js`

## Payload permitido

### Evento

| Campo | Valor |
| --- | --- |
| `acao` | `financeiro.pagamento_parcial.criado` |
| `modulo` | `financeiro` |
| `entidade_tipo` | `df_contas_pagamentos` |
| `entidade_id` | `pagamento_id` |
| `origem` | `edge_function` |
| `ator_tipo` | `usuario` |
| `status` | `sucesso` |
| `severidade` | `info` |

### `dados_antes`

Campos permitidos:

- `conta_status_anterior`
- `valor_pago_anterior`
- `saldo_anterior`
- `quantidade_parciais_anterior`

### `dados_depois`

Campos permitidos:

- `conta_status_posterior`
- `valor_pago_posterior`
- `saldo_posterior`
- `quantidade_parciais_posterior`

### `metadados`

Campos permitidos:

- `conta_id`
- `pagamento_id`
- `empresa_id`
- `filial_id`
- `valor_pagamento`
- `data_pagamento`
- `forma_pagamento`
- `origem_fluxo`
- `possui_observacao`
- `correlation_id`
- `competencia`
- `vencimento`

## Payload proibido

A Edge Function recusa payload contendo chaves proibidas, incluindo:

- `observacao`
- `observacao_pagamento`
- `comprovante`
- `anexo`
- `arquivo`
- `link`
- `base64`
- `cpf`
- `cnpj`
- `email`
- `token`
- `secret`
- `senha`
- `password`
- `request`
- `payload`
- `conta`
- `pagamento`

O app envia apenas o payload de auditoria sanitizado. A observacao do pagamento parcial nao e enviada para a auditoria; somente `possui_observacao`.

## Idempotencia aplicada

Regra:

- um evento `financeiro.pagamento_parcial.criado` por `pagamento_id`.

Consulta previa:

- `empresa_id = empresa_id`
- `acao = financeiro.pagamento_parcial.criado`
- `entidade_tipo = df_contas_pagamentos`
- `entidade_id = pagamento_id`

Se o evento ja existir, a Edge Function retorna:

- `ok: true`
- `idempotente: true`

Nenhum indice unico foi criado nesta fase.

## Validacoes de seguranca

Validações implementadas:

- metodo precisa ser `POST`;
- chamada sem `Authorization` retorna `401`;
- JWT invalido retorna `401`;
- evento diferente de `financeiro.pagamento_parcial.criado` retorna erro;
- IDs precisam estar em formato UUID;
- usuario precisa pertencer a empresa;
- conta precisa pertencer a empresa;
- pagamento precisa pertencer a empresa;
- pagamento precisa pertencer a conta;
- payload com campo proibido e recusado;
- erros inesperados retornam mensagem generica;
- token, payload completo e observacao nao sao logados.

## Diagnostico antes

Executado antes da implementacao/deploy:

- contagem em `public.df_auditoria_eventos`: `0`;
- RLS: habilitada;
- RLS forcada: sim;
- grants para `anon`: nenhum;
- grants para `authenticated`: somente `SELECT`;
- policies: apenas `df_auditoria_eventos_select_admin_master`, `SELECT`, `{authenticated}`;
- `public.df_auditoria_admin`: preservada.

## Diagnostico depois

Executado apos deploy:

- Edge Function `registrar-auditoria-evento`: `ACTIVE`;
- versao: `1`;
- `verify_jwt`: `true`;
- contagem em `public.df_auditoria_eventos`: `0`;
- RLS: habilitada;
- RLS forcada: sim;
- grants para `anon`: nenhum;
- grants para `authenticated`: somente `SELECT`;
- policies: apenas `df_auditoria_eventos_select_admin_master`, `SELECT`, `{authenticated}`;
- `public.df_auditoria_admin`: preservada.

## Teste real

Nao houve teste real criando pagamento parcial em producao neste ciclo.

Motivo:

- o prompt proibiu criar pagamento ficticio sem autorizacao;
- a validacao real depende de executar o fluxo normal do app com uma conta operacional escolhida manualmente.

Resultado:

- nenhum evento real foi inserido;
- a contagem da tabela permaneceu `0`.

## Confirmacoes

- Grants/RLS/policies de `public.df_auditoria_eventos`: nao ampliados.
- `public.df_auditoria_admin`: preservada.
- Regra financeira: nao alterada.
- Calculo de saldo: nao alterado.
- Quitacao: nao alterada.
- Estorno: nao alterado.
- Baixa: nao alterada.
- Trigger operacional: nao criado.
- Tela de auditoria: nao criada.

## Rollback Git

```bash
git revert <commit>
```

## Rollback operacional

Se for necessario interromper a captura:

1. Reverter a chamada da Edge Function no app via Git.
2. Manter eventos ja gravados como trilha de auditoria, salvo decisao administrativa especifica documentada.
3. Se um pagamento parcial de teste tiver sido criado em ciclo futuro, usar o fluxo operacional de estorno parcial por arquivamento logico.
4. Nao usar `DELETE` fisico em pagamentos ou eventos.
