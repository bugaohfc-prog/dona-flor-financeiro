# Auditoria - primeiro evento P1 financeiro

Data: 2026-07-02

## Resumo executivo

Este documento planeja o primeiro evento P1 financeiro a ser gravado futuramente em `public.df_auditoria_eventos`.

Evento escolhido:

- `financeiro.pagamento_parcial.criado`

Este ciclo foi somente diagnostico e documentacao. Nenhum evento foi inserido, nenhuma migration foi criada, nenhum SQL foi executado e nenhum arquivo de app, frontend, service ou hook foi alterado.

## Motivo da escolha

O pagamento parcial e um bom primeiro evento P1 porque:

- ja existe uma tabela propria: `public.df_contas_pagamentos`;
- o evento tem entidade clara: um registro de pagamento parcial;
- o fluxo ja possui validacoes de valor, data, empresa, conta e saldo;
- o payload pode ser minimo e sanitizado;
- o evento ajuda a cobrir uma lacuna real de historico financeiro sem iniciar por RH ou permissoes;
- rollback operacional do pagamento parcial ja existe por arquivamento logico.

O evento nao deve ser implementado junto com tela, trigger ampla, mudanca de RLS ou alteracao de regras financeiras.

## Fluxo atual de pagamento parcial

### Entrada no frontend

Arquivos envolvidos:

- `src/pages/ContasPage.jsx`
- `src/components/modals/AccountPartialPaymentModal.jsx`
- `src/hooks/useContas.js`
- `src/services/contasService.js`

Fluxo resumido:

1. A tela `ContasPage` abre `AccountPartialPaymentModal` para a conta selecionada.
2. O modal coleta `valor_pago`, `data_pagamento` e `observacao` opcional.
3. O modal valida valor maior que zero, data valida e valor ate o saldo pendente.
4. `ContasPage.confirmarPagamentoParcial` chama `registrarPagamentoParcial(contaEmPagamentoParcial.id, payload)`.
5. `useContas.registrarPagamentoParcial` chama `registrarPagamentoParcialService`.
6. `contasService.registrarPagamentoParcial` consulta novamente a conta e os pagamentos ativos antes de inserir.
7. O registro e inserido em `public.df_contas_pagamentos`.
8. A listagem de contas e recarregada por `buscarContas`.
9. O modal recarrega a lista de pagamentos parciais da conta.

### Criacao no banco

Funcao de service:

- `registrarPagamentoParcial(supabase, contaId, empresaId, pagamento)`

Tabela gravada:

- `public.df_contas_pagamentos`

Campos enviados no `INSERT` atual:

- `empresa_id`
- `conta_id`
- `valor_pago`
- `data_pagamento`
- `observacao`

Retorno atual:

- o helper `inserirComEmpresa(..., { select: true })` retorna o registro inserido.

### Validacoes atuais antes do INSERT

O service valida:

- `empresaId` obrigatorio;
- `valor_pago` maior que zero;
- `data_pagamento` no formato `YYYY-MM-DD`;
- existencia da conta na empresa;
- conta nao paga;
- conta nao oculta;
- conta nao excluida;
- conta nao deletada;
- pagamentos parciais ativos existentes;
- novo valor nao pode superar o saldo pendente.

O modal tambem evita duplo envio enquanto `salvando = true`.

### Relacao com `public.df_contas`

Registrar pagamento parcial nao atualiza automaticamente `public.df_contas`.

A conta principal so e atualizada em fluxo separado:

- `baixarContaQuitadaPorParciais`

Esse fluxo roda quando os pagamentos parciais ativos quitam o saldo e o usuario confirma manualmente `Baixar conta agora`.

### Transacao e rollback operacional atual

O fluxo atual nao e uma transacao unica envolvendo pagamento parcial, conta principal e auditoria.

Hoje existem chamadas separadas:

- consulta da conta;
- consulta dos pagamentos ativos;
- `INSERT` em `df_contas_pagamentos`;
- recarregamento das contas;
- recarregamento dos pagamentos parciais no modal.

Rollback operacional de pagamento parcial:

- nao usa `DELETE`;
- usa estorno por arquivamento logico:
  - `arquivado = true`;
  - `arquivado_em` preenchido.

Pontos de erro atuais:

- conta nao encontrada;
- conta ja paga;
- conta oculta, excluida ou deletada;
- data invalida;
- valor invalido;
- valor acima do saldo;
- erro de RLS/permissao no `SELECT` ou `INSERT`;
- falha de rede/Supabase;
- pagamento salvo, mas historico nao recarregado no modal.

## Ponto de captura sugerido

Ponto mais seguro para o primeiro planejamento:

- apos sucesso do `INSERT` em `df_contas_pagamentos`;
- usando o registro retornado pelo service como fonte de `pagamento_id`, `valor_pago`, `data_pagamento`, `conta_id` e `empresa_id`;
- usando os dados ja calculados antes/depois somente quando estiverem disponiveis com seguranca no fluxo.

Nao capturar antes do `INSERT`, porque ainda nao existe `pagamento_id` e o pagamento pode falhar por RLS, validacao ou saldo.

Nao registrar observacao completa.

## Payload permitido

### Campos base do evento

| Campo | Valor |
| --- | --- |
| `empresa_id` | empresa da conta/pagamento |
| `user_id` | usuario autenticado, quando disponivel |
| `ator_tipo` | `usuario` |
| `modulo` | `financeiro` |
| `entidade_tipo` | `df_contas_pagamentos` |
| `entidade_id` | `pagamento_id` |
| `acao` | `financeiro.pagamento_parcial.criado` |
| `severidade` | `info` |
| `origem` | depende da estrategia futura de escrita |
| `status` | `sucesso` |

### `dados_antes` permitidos

```json
{
  "conta_status_anterior": "pendente",
  "valor_pago_anterior": 0,
  "saldo_anterior": 1000,
  "quantidade_parciais_anterior": 0
}
```

Regras:

- usar `saldo_anterior` somente se calculado com os pagamentos ativos ja carregados ou reconsultados;
- usar `quantidade_parciais_anterior` somente se disponivel com seguranca;
- nao incluir objeto completo da conta.

### `dados_depois` permitidos

```json
{
  "conta_status_posterior": "pendente",
  "valor_pago_posterior": 250,
  "saldo_posterior": 750,
  "quantidade_parciais_posterior": 1
}
```

Regras:

- `conta_status_posterior` normalmente continua `pendente`, pois a baixa nao e automatica;
- `valor_pago_posterior` deve representar soma de parciais ativas, nao necessariamente `df_contas.valor_pago`;
- `saldo_posterior` deve ser calculado sem depender de observacao textual;
- nao incluir objeto completo do pagamento.

### `metadados` permitidos

```json
{
  "conta_id": "uuid",
  "pagamento_id": "uuid",
  "empresa_id": "uuid",
  "filial_id": "uuid-ou-null",
  "valor_pagamento": 250,
  "data_pagamento": "2026-07-02",
  "forma_pagamento": null,
  "origem_fluxo": "pagamento_parcial",
  "possui_observacao": true,
  "competencia": "2026-07",
  "vencimento": "2026-07-10"
}
```

Regras:

- `filial_id` so deve ser enviado se ja estiver disponivel na conta sem consulta extra sensivel;
- `competencia` so deve ser enviada se ja existir de forma clara no registro;
- `vencimento` pode ser enviado se vier de `df_contas.data_vencimento` ou campo equivalente;
- `forma_pagamento` deve ficar nulo enquanto o pagamento parcial nao tiver campo proprio para isso;
- `possui_observacao` deve ser booleano, sem gravar o texto.

## Campos proibidos

Nao registrar:

- observacao completa;
- anexo;
- comprovante;
- link;
- base64;
- CPF;
- CNPJ desnecessario;
- e-mail em texto claro;
- token;
- secret;
- payload completo da conta;
- payload completo do pagamento;
- request completo;
- stack trace com dados sensiveis;
- dados de outra empresa;
- nome livre de funcionario;
- dados medicos, laudos, CID ou anexos de RH.

## Origem de escrita: opcoes avaliadas

### Opcao A - gravar pelo service/hook do app apos sucesso

Vantagens:

- ponto de captura proximo ao fluxo que o usuario executou;
- facil acesso ao contexto da UI e aos calculos ja exibidos;
- facil testar no app;
- menor risco de auditar inserts tecnicos fora do fluxo de tela.

Riscos:

- gravar direto em `df_auditoria_eventos` exigiria `INSERT` para `authenticated`, o que contraria a Fase 1;
- escrita seria chamada separada, fora de transacao com o pagamento parcial;
- se a auditoria falhar depois do pagamento, o pagamento permanece criado sem evento;
- retry do app pode gerar duplicidade se nao houver `correlation_id` ou idempotencia;
- maior risco de enviar payload amplo demais se nao houver camada sanitizadora.

Impacto em rollback:

- rollback de app remove a tentativa futura de escrita;
- eventos ja inseridos nao devem ser apagados sem decisao explicita, pois a tabela foi desenhada como imutavel.

Impacto em RLS:

- nao recomendado se exigir `grant insert` para `authenticated`;
- aceitavel apenas se o app chamar uma camada controlada que grave com validacao.

Recomendacao:

- nao usar escrita direta do frontend na tabela.

### Opcao B - gravar por trigger no banco apos `INSERT` em `df_contas_pagamentos`

Vantagens:

- evento fica atomico com o `INSERT` do pagamento;
- nao exige alterar o fluxo visual;
- nao depende de chamada adicional do app;
- reduz risco de pagamento existir sem evento.

Riscos:

- trigger dispara para qualquer origem de insert, nao apenas tela de pagamento parcial;
- pode exigir funcao com privilegio especial para inserir em `df_auditoria_eventos`, pois nao ha policy de `INSERT` para `authenticated`;
- se a funcao virar `SECURITY DEFINER`, precisa ciclo proprio de auditoria, grants e hardening;
- erro no log pode bloquear pagamento financeiro real;
- payload de antes/depois pode ficar limitado ou exigir consultas adicionais;
- aumenta acoplamento entre tabela operacional e auditoria antes de observar uso real.

Impacto em rollback:

- rollback exige remover trigger/funcao;
- se eventos ja existirem, nao apagar historico sem plano especifico.

Impacto em RLS:

- preserva ausencia de `INSERT` para `authenticated`, mas tende a exigir desenho de funcao/trigger bem controlado.

Recomendacao:

- nao usar como primeiro ciclo de escrita enquanto o fluxo de auditoria ainda esta sendo validado.

### Opcao C - gravar por funcao RPC sanitizada

Vantagens:

- centraliza sanitizacao do payload;
- pode validar `empresa_id`, `acao`, `entidade_tipo`, `modulo`, `origem` e `status`;
- evita `INSERT` direto em `df_auditoria_eventos` pelo frontend;
- pode receber payload minimo do app e descartar campos proibidos.

Riscos:

- se for `SECURITY DEFINER`, vira novo ponto critico de seguranca e exige auditoria propria;
- se for `SECURITY INVOKER`, provavelmente nao resolve a falta de `INSERT` para `authenticated`;
- pode ficar fora da transacao do pagamento parcial se chamada apos o `INSERT`;
- pode gerar duplicidade sem `correlation_id`/idempotencia;
- altera superficie RPC do projeto.

Impacto em rollback:

- rollback remove chamada no app e funcao criada;
- eventos ja inseridos exigem politica de tratamento imutavel.

Impacto em RLS:

- nao deve ampliar grants da tabela;
- precisa grants minimos na funcao e diagnostico de exposicao.

Recomendacao:

- opcao viavel somente em ciclo proprio, com diagnostico SECURITY DEFINER se necessario.

## Recomendacao preliminar

Recomendacao conservadora para o proximo ciclo:

1. Nao conceder `INSERT` em `df_auditoria_eventos` para `authenticated`.
2. Nao criar trigger amplo em `df_contas_pagamentos` como primeira escrita.
3. Planejar uma camada controlada de escrita sanitizada, preferencialmente service-controlled/Edge Function ou RPC dedicada com diagnostico proprio.
4. Se a escolha futura for RPC `SECURITY DEFINER`, auditar a funcao antes de habilitar uso real.
5. A primeira implementacao deve ser nao bloqueante para o pagamento parcial, registrando falha de auditoria de forma segura sem impedir o pagamento ja validado.
6. Usar `correlation_id` futuro para reduzir risco de duplicidade.

Origem recomendada para o evento neste planejamento:

- `edge_function`, se for criada uma escrita service-controlled;
- `app`, apenas como origem logica do evento, nao como `INSERT` direto do frontend na tabela;
- evitar `database_trigger` na primeira captura real.

## Plano de implementacao futuro

Fase futura sugerida:

1. Diagnosticar a opcao de escrita escolhida:
   - Edge Function service-controlled; ou
   - RPC sanitizada com auditoria de seguranca.
2. Definir contrato fixo do payload para `financeiro.pagamento_parcial.criado`.
3. Implementar captura apos sucesso do `INSERT` em `df_contas_pagamentos`.
4. Garantir que a escrita de auditoria nao receba observacao completa.
5. Garantir que falha de auditoria nao crie pagamento duplicado.
6. Registrar no evento:
   - `empresa_id`;
   - `user_id`;
   - `entidade_id = pagamento_id`;
   - payload minimo permitido;
   - `correlation_id`, se disponivel.
7. Validar com um pagamento parcial controlado, somente quando operacionalmente seguro.

## Plano de validacao futuro

Antes:

- confirmar `df_auditoria_eventos` vazia ou com contagem conhecida;
- confirmar que `authenticated` segue sem `INSERT`;
- confirmar que a conta de teste esta aberta, visivel e fora da lixeira;
- confirmar saldo pendente antes do pagamento;
- confirmar quantidade de parciais antes.

Execucao:

- registrar um pagamento parcial controlado;
- nao usar observacao sensivel;
- confirmar retorno com `pagamento_id`.

Depois:

- confirmar um unico evento `financeiro.pagamento_parcial.criado`;
- confirmar `entidade_tipo = df_contas_pagamentos`;
- confirmar `entidade_id = pagamento_id`;
- confirmar `dados_antes`, `dados_depois` e `metadados` sem observacao completa;
- confirmar que `df_contas` nao foi baixada automaticamente;
- confirmar que `df_contas_pagamentos` recebeu somente o pagamento esperado;
- confirmar que RLS/policies/grants nao foram ampliados indevidamente;
- confirmar que Admin/Master conseguem ler o evento conforme policy existente.

Teste negativo:

- tentar pagamento invalido e confirmar que nenhum evento de sucesso foi gravado;
- se houver evento de falha em ciclo futuro, ele deve usar outra acao/status e payload proprio.

## Rollback futuro

Rollback de implementacao:

- remover a chamada de escrita de auditoria no app/Edge/RPC;
- manter `df_auditoria_eventos` e eventos ja gravados, salvo decisao explicita em ciclo proprio;
- se uma funcao ou Edge Function for criada, documentar rollback especifico dela;
- se um pagamento parcial de teste for criado, estornar pelo fluxo operacional de arquivamento logico, sem `DELETE`.

Rollback de dados:

- a tabela de auditoria foi desenhada como imutavel;
- nao apagar eventos reais sem autorizacao explicita;
- para evento incorreto em producao, preferir registrar evento corretivo futuro em vez de `UPDATE`/`DELETE`.

## Riscos remanescentes

- Escrita fora de transacao pode deixar pagamento sem evento se a auditoria falhar.
- Escrita atomica via trigger pode bloquear pagamento real se o log falhar.
- RPC `SECURITY DEFINER` mal desenhada pode ampliar superficie de ataque.
- Payload amplo pode vazar observacao financeira ou dados pessoais.
- Sem homologacao, teste real precisa ser curto, controlado e reversivel.
- Eventos imutaveis exigem cuidado antes de inserir registros de teste.

## Confirmacoes deste ciclo

- Banco: nao alterado.
- Dados: nao alterados.
- Eventos em `df_auditoria_eventos`: nenhum inserido.
- Migration: nao criada.
- RLS/policies/functions/grants: nao alterados.
- Frontend: nao alterado.
- Services/hooks: nao alterados.
- Scripts: nao alterados.
- Tela de auditoria: nao criada.
