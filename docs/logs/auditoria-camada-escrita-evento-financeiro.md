# Auditoria - camada de escrita do evento financeiro

Data: 2026-07-02

## Resumo executivo

Este documento desenha a camada controlada de escrita para o evento:

- `financeiro.pagamento_parcial.criado`

O ciclo e somente documentacao/modelagem. Nao foi criada Edge Function real, RPC real, trigger, migration, policy, grant ou evento em `public.df_auditoria_eventos`.

Recomendacao preliminar: usar uma camada Edge Function/service-controlled em ciclo futuro, mantendo `public.df_auditoria_eventos` sem `INSERT` para `authenticated`.

## Contexto atual

Estrutura existente:

- `public.df_auditoria_eventos`
- RLS habilitada e forcada
- policy `SELECT` para Admin/Master
- `authenticated` com somente `SELECT`
- `anon` sem acesso
- zero eventos inseridos

Fluxo do evento financeiro:

1. O usuario registra pagamento parcial no modal.
2. `useContas.registrarPagamentoParcial` chama `contasService.registrarPagamentoParcial`.
3. O service valida conta, empresa, saldo e pagamentos parciais ativos.
4. O service faz `INSERT` em `public.df_contas_pagamentos`.
5. A listagem e o historico de parciais sao recarregados.

Decisoes ja registradas:

- nao gravar direto pelo frontend em `public.df_auditoria_eventos`;
- nao conceder `INSERT` para `authenticated`;
- nao criar trigger amplo agora;
- nao inserir evento sem contrato sanitizado.

## Opcao A - Edge Function/service-controlled

### Fluxo

Fluxo futuro proposto:

1. O frontend conclui o pagamento parcial com sucesso.
2. O frontend chama uma Edge Function de auditoria com payload minimo.
3. A Edge Function valida o JWT do usuario.
4. A Edge Function valida empresa, conta e pagamento no banco.
5. A Edge Function rejeita campos proibidos.
6. A Edge Function monta o evento sanitizado.
7. A Edge Function grava em `public.df_auditoria_eventos` com service role.
8. A tabela continua sem `INSERT` para `authenticated`.

### Vantagens

- Mantem `df_auditoria_eventos` sem escrita direta por usuario comum.
- Centraliza validacao e sanitizacao fora do frontend.
- Evita expor uma RPC `SECURITY DEFINER` publica.
- Permite usar service role somente no servidor, sem expor segredo no cliente.
- Permite validar o usuario autenticado antes da escrita.
- Permite falha nao bloqueante no app, se essa for a decisao operacional.
- Mantem RLS/grants da tabela sem ampliacao.

### Riscos

- Adiciona uma Edge Function nova, com deploy e manutencao.
- Escrita fica fora da transacao do `INSERT` do pagamento parcial.
- Se a Edge Function falhar depois do pagamento, pode existir pagamento sem evento.
- Exige cuidado para nao aceitar payload completo do cliente.
- Exige validação robusta de tenant para evitar cross-tenant.

### Impacto em seguranca

Baixo a medio, se bem implementada:

- service role fica somente na Edge Function;
- frontend nao recebe grant novo;
- payload e revalidado no servidor;
- dados livres sao descartados.

Ponto sensivel:

- a Edge Function precisa validar o JWT recebido e nao confiar apenas no `empresa_id` enviado pelo cliente.

### Impacto em RLS/grants

Nao deve alterar grants da tabela:

- `anon`: sem acesso;
- `authenticated`: permanece somente com `SELECT`;
- escrita via service role na camada controlada.

Nao deve criar policy de `INSERT` em `df_auditoria_eventos`.

### Risco de duplicidade

Medio, porque a escrita e chamada separada do pagamento.

Mitigacoes:

- enviar `correlation_id` deterministico;
- usar `pagamento_id` + `acao` como chave logica;
- checar evento existente antes de inserir;
- avaliar indice unico parcial em ciclo futuro, sem criar agora.

### Como evitar payload sensivel

A Edge Function deve montar o evento a partir de allowlist, ignorando qualquer campo fora do contrato.

Regras:

- nao persistir `observacao`;
- nao persistir request completo;
- nao persistir comprovante/anexo/link/base64;
- nao persistir email claro;
- nao persistir CPF/CNPJ desnecessario;
- recalcular ou reconsultar dados criticos quando possivel.

### Como validar `empresa_id`

Validacoes obrigatorias:

- `empresa_id` deve existir.
- usuario autenticado deve pertencer a empresa ou ter permissao operacional valida.
- `pagamento_id` deve pertencer a `empresa_id`.
- `conta_id` deve pertencer a `empresa_id`.
- `pagamento.conta_id` deve ser igual ao `conta_id` informado.

### Como validar `user_id`

Validacoes obrigatorias:

- JWT valido.
- `user_id` extraido do JWT, nao confiado do body.
- se `user_id` vier no payload, usar somente para conferencia e rejeitar divergencia.
- se houver email no JWT, nao gravar email claro; no maximo hash se necessario.

### Rollback futuro

Rollback de implementacao:

- remover chamada futura da Edge Function no app;
- remover/deployar versao anterior da Edge Function;
- manter eventos ja inseridos, salvo decisao explicita;
- nao alterar `df_auditoria_eventos` nem grants.

Rollback operacional:

- se um pagamento parcial de teste for criado, estornar pelo fluxo de arquivamento logico;
- nao usar `DELETE` fisico.

### Teste futuro

Testes minimos:

- chamada com usuario autenticado valido;
- chamada sem JWT deve falhar;
- chamada com `empresa_id` de outra empresa deve falhar;
- chamada com `pagamento_id` inexistente deve falhar;
- chamada com `pagamento_id` de outra conta deve falhar;
- chamada duplicada deve retornar evento existente ou nao inserir duplicado;
- payload com `observacao` deve ser ignorado ou rejeitado;
- Admin/Master devem ler o evento via policy existente.

### Recomendacao

Recomendada como caminho preliminar para Fase 2A.

Motivo: preserva o desenho seguro da tabela, nao amplia grants e permite sanitizacao explicita antes de gravar evento real.

## Opcao B - RPC sanitizada

### Fluxo

Fluxo possivel:

1. Frontend conclui pagamento parcial.
2. Frontend chama RPC dedicada.
3. A RPC valida usuario, empresa, pagamento, conta e evento.
4. A RPC insere em `public.df_auditoria_eventos`.

### Vantagens

- Centraliza contrato no banco.
- Pode reconsultar `df_contas` e `df_contas_pagamentos` de forma consistente.
- Evita `INSERT` direto do frontend na tabela.
- Pode ser mais simples que Edge Function se o projeto quiser manter a escrita no Postgres.

### Riscos

- Para inserir sem grant direto, provavelmente exigira `SECURITY DEFINER`.
- `SECURITY DEFINER` em `public` e ponto critico e exige ciclo proprio.
- Precisa hardening de grants: revogar `PUBLIC` e `anon`, controlar `authenticated`.
- Precisa `search_path` fixo.
- Precisa rodar Advisor e diagnostico de exposicao.
- Pode virar API publica sensivel se mal configurada.

### Impacto em seguranca

Medio a alto antes do hardening.

Exigencias minimas se a opcao for escolhida:

- auditoria especifica da funcao;
- assinatura restrita;
- `search_path` fixo;
- grants minimos;
- `PUBLIC` e `anon` sem `EXECUTE`;
- validacao explicita de `auth.uid()`;
- allowlist de evento e payload;
- Advisor antes/depois.

### Impacto em RLS/grants

Nao deve conceder `INSERT` na tabela para `authenticated`.

Porem, a funcao RPC exigiria grants proprios:

- `authenticated` com `EXECUTE`, se for chamada pelo app;
- `anon` sem `EXECUTE`;
- `PUBLIC` sem `EXECUTE`.

### Risco de duplicidade

Medio.

Mitigacoes:

- `correlation_id` deterministico;
- checagem por `acao + entidade_tipo + entidade_id`;
- avaliar indice unico parcial futuro.

### Como evitar payload sensivel

A RPC deve aceitar parametros estruturados e montar JSON internamente.

Evitar:

- receber JSON arbitrario amplo;
- copiar `observacao`;
- gravar request completo;
- confiar em `user_id` enviado pelo cliente.

### Como validar `empresa_id`

A RPC deve:

- receber `p_empresa_id`, `p_conta_id`, `p_pagamento_id`;
- consultar `df_contas_pagamentos`;
- confirmar `pagamento.empresa_id = p_empresa_id`;
- confirmar `pagamento.conta_id = p_conta_id`;
- consultar `df_contas`;
- confirmar `conta.empresa_id = p_empresa_id`;
- confirmar permissao do usuario autenticado na empresa.

### Como validar `user_id`

A RPC deve usar:

- `(select auth.uid())` como fonte do usuario;
- nunca confiar em `p_user_id` para autorizacao;
- gravar `user_id` derivado do JWT.

### Rollback futuro

Rollback de implementacao:

- remover chamada no app;
- revogar grants da RPC;
- dropar funcao, se autorizado;
- manter eventos ja inseridos, salvo decisao explicita.

### Teste futuro

Testes minimos:

- `anon` sem `EXECUTE`;
- `PUBLIC` sem `EXECUTE`;
- `authenticated` autorizado consegue registrar evento para propria empresa;
- usuario de outra empresa falha;
- payload com campos proibidos falha ou e ignorado;
- chamada duplicada nao duplica evento;
- Advisor nao aponta exposicao indevida.

### Recomendacao

Nao recomendada como primeira escolha.

Pode ser considerada se Edge Function for julgada pesada ou desnecessaria, mas somente apos diagnostico proprio de `SECURITY DEFINER`, grants e Advisor.

## Opcao C - trigger especifico em `df_contas_pagamentos`

### Fluxo

Fluxo possivel:

1. `INSERT` em `public.df_contas_pagamentos`.
2. Trigger `AFTER INSERT` monta evento.
3. Trigger insere em `public.df_auditoria_eventos`.

### Vantagens

- Evento fica proximo da origem de dados.
- Reduz dependencia do frontend.
- Pode ser atomico com o `INSERT` do pagamento.
- Evita pagamento criado sem evento, se o trigger funcionar.

### Riscos

- Dificuldade de identificar a origem real do fluxo.
- Pode registrar eventos de scripts/importacoes/manutencoes sem contexto adequado.
- Pode ter payload pobre, sem saldos antes/depois completos.
- Pode exigir funcao privilegiada para inserir na tabela de auditoria.
- Se a auditoria falhar, pode bloquear pagamento real.
- Pode duplicar evento se no futuro tambem houver camada app/Edge.

### Impacto em seguranca

Medio a alto.

Pontos sensiveis:

- trigger function pode precisar privilegiar escrita;
- `auth.uid()` pode ser nulo dependendo da origem;
- service role/script pode gerar eventos sem usuario real;
- erro de log fica acoplado ao fluxo financeiro.

### Impacto em RLS/grants

Nao exige `INSERT` para `authenticated`, mas pode exigir funcao/trigger com permissao suficiente.

Se virar `SECURITY DEFINER`, exige diagnostico proprio.

### Risco de duplicidade

Alto se uma camada app/Edge for adicionada depois.

Mitigacoes:

- escolher uma unica origem oficial de escrita;
- usar `pagamento_id + acao`;
- documentar que trigger e fonte exclusiva se for adotado.

### Como evitar payload sensivel

O trigger deve montar payload fixo:

- valores;
- IDs;
- datas;
- flags booleanas;
- contagens calculadas.

Nao deve copiar `observacao`.

### Como validar `empresa_id`

O trigger pode usar `new.empresa_id`, mas deve confiar tambem nas validacoes existentes de `df_contas_pagamentos_validar_conta_empresa`.

Mesmo assim, deve confirmar:

- `new.empresa_id is not null`;
- `new.conta_id is not null`;
- conta existe e pertence a empresa.

### Como validar `user_id`

Limitacao principal:

- `auth.uid()` pode existir em chamada via app autenticado;
- pode ser nulo em script/service role;
- pode nao representar claramente o ator humano se a escrita vier de automacao.

### Rollback futuro

Rollback:

- dropar trigger;
- dropar funcao do trigger;
- manter eventos ja inseridos, salvo decisao explicita;
- confirmar que pagamento parcial continua funcionando.

### Teste futuro

Testes minimos:

- inserir pagamento parcial via app e confirmar evento;
- inserir pagamento parcial via origem tecnica controlada e validar ator/origem;
- confirmar que falha na auditoria nao quebra fluxo ou, se quebrar, que isso e decisao aceita;
- confirmar zero duplicidade.

### Recomendacao

Evitar agora.

Motivo: ainda nao ha forma limpa documentada de capturar `user_id` real em todos os cenarios, o payload pode ficar incompleto e ha risco de duplicidade com uma futura camada controlada.

## Recomendacao preliminar final

Escolha recomendada para o proximo ciclo:

- **Opcao A - Edge Function/service-controlled**

Justificativa:

- nao exige ampliar grants de `public.df_auditoria_eventos`;
- permite manter `authenticated` sem `INSERT`;
- permite validar payload por allowlist;
- permite validar JWT, empresa, conta e pagamento antes da escrita;
- evita criar RPC `SECURITY DEFINER` publica neste momento;
- evita trigger automatico acoplado ao fluxo financeiro;
- combina melhor com uma primeira captura real, pequena e reversivel.

Decisao operacional sugerida:

- a escrita de auditoria deve ser melhor esforco no primeiro ciclo real;
- falha na auditoria nao deve duplicar nem desfazer o pagamento parcial ja criado;
- a falha deve ser tratada com aviso tecnico sanitizado, sem expor token, payload ou observacao.

## Contrato do evento

Evento:

- `financeiro.pagamento_parcial.criado`

Tabela de auditoria:

- `public.df_auditoria_eventos`

Entidade auditada:

- `df_contas_pagamentos`

Campos planejados do registro:

| Campo | Valor planejado |
| --- | --- |
| `empresa_id` | empresa do pagamento parcial |
| `user_id` | usuario autenticado extraido do JWT |
| `ator_tipo` | `usuario` |
| `modulo` | `financeiro` |
| `entidade_tipo` | `df_contas_pagamentos` |
| `entidade_id` | `pagamento_id` |
| `acao` | `financeiro.pagamento_parcial.criado` |
| `severidade` | `info` |
| `origem` | `edge_function` se Opcao A for adotada |
| `status` | `sucesso` |

## Payload permitido

Campos permitidos no contrato:

- `empresa_id`
- `user_id`
- `conta_id`
- `pagamento_id`
- `filial_id`, se disponivel
- `valor_pagamento`
- `data_pagamento`
- `forma_pagamento`, se disponivel
- `conta_status_anterior`
- `conta_status_posterior`
- `valor_pago_anterior`
- `valor_pago_posterior`
- `saldo_anterior`
- `saldo_posterior`
- `quantidade_parciais_anterior`
- `quantidade_parciais_posterior`
- `origem_fluxo = pagamento_parcial`
- `possui_observacao = true/false`

Distribuicao sugerida:

### `dados_antes`

```json
{
  "conta_status_anterior": "pendente",
  "valor_pago_anterior": 0,
  "saldo_anterior": 1000,
  "quantidade_parciais_anterior": 0
}
```

### `dados_depois`

```json
{
  "conta_status_posterior": "pendente",
  "valor_pago_posterior": 250,
  "saldo_posterior": 750,
  "quantidade_parciais_posterior": 1
}
```

### `metadados`

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
  "possui_observacao": true
}
```

## Payload proibido

Proibido no evento:

- observacao completa;
- comprovante;
- anexo;
- link;
- base64;
- CPF/CNPJ desnecessario;
- e-mail em texto claro;
- token;
- secret;
- payload completo de conta;
- payload completo de pagamento;
- payload completo de request;
- stack trace com dados sensiveis;
- dados de RH ou dados medicos.

## Idempotencia sugerida

Regra logica sugerida:

- um evento `financeiro.pagamento_parcial.criado` por `pagamento_id`.

Chave logica:

- `acao`
- `entidade_tipo`
- `entidade_id`

`correlation_id` sugerido:

```text
financeiro.pagamento_parcial.criado:<pagamento_id>
```

Fluxo de idempotencia:

1. Receber `pagamento_id`.
2. Montar `correlation_id` deterministico.
3. Antes de inserir, consultar se ja existe evento com:
   - `acao = financeiro.pagamento_parcial.criado`;
   - `entidade_tipo = df_contas_pagamentos`;
   - `entidade_id = pagamento_id`.
4. Se existir, retornar sucesso idempotente sem inserir novo evento.
5. Se nao existir, inserir evento.

Opcao futura:

- avaliar indice unico parcial por `acao`, `entidade_tipo`, `entidade_id` para eventos onde `entidade_id is not null`.

Nao criar indice unico neste ciclo.

## Validacoes obrigatorias da camada

A camada escolhida deve validar:

- usuario autenticado;
- JWT valido;
- `user_id` derivado do JWT;
- usuario pertence a empresa ou tem permissao operacional valida;
- `empresa_id` existe;
- pagamento pertence a empresa;
- conta pertence a empresa;
- pagamento pertence a conta;
- evento ainda nao registrado, se a regra de idempotencia for adotada;
- payload contem somente campos permitidos;
- payload nao contem campos proibidos;
- `valor_pagamento` e numerico e positivo;
- `data_pagamento` tem formato valido;
- `acao` e exatamente `financeiro.pagamento_parcial.criado`;
- `modulo` e exatamente `financeiro`;
- `entidade_tipo` e exatamente `df_contas_pagamentos`.

## Plano de implementacao futuro

### Fase 2A - camada controlada de escrita

Escopo:

- criar a camada controlada escolhida;
- registrar somente `financeiro.pagamento_parcial.criado`;
- nao criar tela;
- nao registrar outros eventos;
- nao conceder `INSERT` em `df_auditoria_eventos` para `authenticated`;
- nao criar trigger em tabela operacional.

Validacoes:

- chamada autenticada valida;
- chamada anonima bloqueada;
- cross-tenant bloqueado;
- duplicidade bloqueada ou tratada como sucesso idempotente;
- payload sanitizado;
- evento inserido uma unica vez.

### Fase 2B - leitura e saneamento do evento

Escopo:

- testar leitura por Admin/Master via policy existente;
- validar contagem de eventos;
- validar que `df_auditoria_eventos` segue sem `INSERT` para `authenticated`;
- validar que payload nao contem observacao, token, email claro ou request completo.

### Fase 3 - tela somente leitura

Escopo:

- listar eventos para Master/Admin;
- filtros por empresa, periodo, modulo, acao, entidade e usuario;
- sem edicao;
- sem exclusao;
- sem exportacao inicial;
- sem acesso para Gerente/Operador.

## Confirmacoes deste ciclo

- Banco: nao alterado.
- Dados: nao alterados.
- Eventos em `df_auditoria_eventos`: nenhum inserido.
- Migration: nao criada.
- RLS/policies/functions/grants: nao alterados.
- Edge Function real: nao criada.
- RPC real: nao criada.
- Trigger: nao criado.
- Frontend: nao alterado.
- Services/hooks: nao alterados.
- Tela: nao criada.
