# Auditoria - taxonomia e data dictionary P1

Data: 2026-07-01

## Resumo executivo

Este documento define a taxonomia inicial e o data dictionary P1 para a frente de Logs / Auditoria do DNA Gestão.

O objetivo é padronizar como eventos de auditoria deverão ser nomeados, classificados e armazenados em ciclo futuro, sem implementar nada neste momento.

Decisão preliminar conservadora: para eventos amplos de auditoria operacional, a opção preferida é criar uma futura tabela `public.df_auditoria_eventos`, mantendo `public.df_auditoria_admin` como trilha administrativa já existente. Essa decisão ainda exige ciclo próprio de banco, migration, RLS, rollback e validação antes de qualquer aplicação.

Este ciclo não altera banco, dados, código, frontend, services/hooks, scripts, migrations, RLS, policies, funções ou grants.

## Decisão preliminar: tabela existente versus nova tabela

### Opção A - evoluir `public.df_auditoria_admin`

Vantagens:

- tabela já existe em produção;
- RLS já está habilitada e forçada;
- já possui trilha real de eventos;
- já possui leitura restrita a Admin/Master por policy;
- evita criar mais uma tabela de auditoria antes de necessidade comprovada.

Riscos:

- o nome atual sugere escopo administrativo, não auditoria geral do sistema;
- ampliar a tabela pode misturar eventos administrativos, financeiros, RH, automações e segurança;
- campos atuais são mínimos e não distinguem bem módulo, severidade, status, ator, origem e correlação;
- mudanças de schema na tabela existente podem afetar triggers atuais;
- qualquer ampliação precisa preservar imutabilidade e payload sanitizado já validado.

Impacto:

- menor esforço inicial;
- maior risco de acoplamento com triggers existentes;
- pode ser suficiente para tela somente leitura dos logs atuais;
- pode ficar limitada para trilha ampla por registro.

Quando usar:

- para exibir logs já existentes;
- para continuar auditando ações administrativas pequenas e sanitizadas;
- para ciclo curto de tela somente leitura sem novos eventos.

Quando evitar:

- se a frente passar a auditar Contas, Usuários, RH, Edge Functions e scripts em escala;
- se for necessário campo próprio de `modulo`, `entidade_tipo`, `severidade`, `status`, `correlation_id` e antes/depois padronizado;
- se houver risco de payloads com sensibilidades diferentes na mesma tabela sem taxonomia forte.

### Opção B - criar futura `public.df_auditoria_eventos`

Vantagens:

- separa auditoria operacional ampla da auditoria administrativa já existente;
- permite schema desenhado para eventos padronizados;
- reduz risco de quebrar triggers atuais em `df_auditoria_admin`;
- facilita criar data dictionary, índices, RLS e filtros desde o início;
- melhora evolução para tela de auditoria, histórico por registro e automações.

Riscos:

- exige migration;
- exige nova RLS e grants com muito cuidado;
- exige decisão sobre exposição via Data API;
- exige rollback e diagnóstico próprios;
- cria duas fontes de auditoria se não houver plano de consulta unificada.

Impacto:

- maior esforço inicial;
- melhor separação de domínio;
- melhor base para crescimento seguro;
- exige uma tela ou view futura que saiba consultar as duas origens, se necessário.

Quando usar:

- para auditoria P1 ampla de Contas, Usuários/Permissões, RH e Segurança;
- para eventos app/Edge Function/script;
- para histórico por registro;
- para payloads padronizados por evento;
- para filtros por módulo, entidade, severidade e status.

Quando evitar:

- se o próximo ciclo for apenas exibir os logs atuais;
- se não houver autorização para migration/RLS;
- se a taxonomia ainda não estiver revisada.

### Recomendação preliminar

Recomendação conservadora: criar uma futura `public.df_auditoria_eventos` para novos eventos operacionais P1, mantendo `public.df_auditoria_admin` intacta para a trilha administrativa atual.

Justificativa:

- evita alterar uma tabela já produtiva e validada;
- permite modelar auditoria geral com campos adequados;
- reduz risco de misturar escopos sensíveis;
- preserva triggers existentes;
- permite migrar ou unificar visualmente depois, sem pressa.

Próximo ciclo recomendado: preparar uma migration futura para `public.df_auditoria_eventos` com RLS, rollback, diagnóstico e validação, mas somente após revisão desta taxonomia.

## Padrão oficial do campo `acao`

Formato:

```text
modulo.entidade.acao
```

Regras:

- usar minúsculas;
- usar ponto como separador;
- não usar espaços;
- não incluir ID, empresa, usuário ou valor no nome da ação;
- manter nomes estáveis para permitir filtros e relatórios;
- o detalhe variável deve ir em `metadados`, `dados_antes` ou `dados_depois`, sempre sanitizado.

Exemplos:

- `financeiro.conta.criada`
- `financeiro.conta.editada`
- `financeiro.conta.baixada`
- `financeiro.conta.baixa_estornada`
- `financeiro.pagamento_parcial.criado`
- `financeiro.pagamento_parcial.estornado`
- `usuarios.vinculo.criado`
- `usuarios.vinculo.perfil_alterado`
- `usuarios.convite.enviado`
- `seguranca.acao.bloqueada`

## Módulos permitidos

| Módulo | Finalidade | Exemplos de eventos | Sensibilidade |
| --- | --- | --- | --- |
| `financeiro` | Contas, pagamentos, impostos, recorrência e parcelamento | `financeiro.conta.baixada`, `financeiro.imposto.consolidado` | Alta, por valores financeiros e operação real |
| `usuarios` | Usuários, vínculos, perfis, filiais e convites | `usuarios.vinculo.perfil_alterado`, `usuarios.convite.enviado` | Alta, por permissão e identidade |
| `empresas` | Empresa, filial/unidade e dados de tenant | `empresas.empresa.criada`, `empresas.filial.atualizada` | Alta, por multiempresa |
| `rh` | Funcionários, exames por data, férias e folha futura | `rh.funcionario.arquivado`, `rh.exame_periodico.criado` | Muito alta, por LGPD |
| `seguranca` | Ações bloqueadas, cross-tenant, Edge Functions sensíveis e DELETE físico bloqueado | `seguranca.cross_tenant.bloqueado` | Crítica |
| `automacao` | Scripts, GitHub Actions, importações e envios automatizados | `automacao.envio_email.executado`, `automacao.importacao.concluida` | Alta, por execução fora do app |
| `sistema` | Eventos técnicos internos, recuperação e falhas agregadas | `sistema.renderizacao.falha` | Média a alta, dependendo do payload |

## Entidades permitidas

| Entidade | Módulos prováveis | Observação |
| --- | --- | --- |
| `df_contas` | `financeiro` | Conta principal; pode envolver valor, vencimento, status, imposto e lixeira |
| `df_contas_pagamentos` | `financeiro` | Pagamentos parciais; nunca registrar observação completa sem sanitização |
| `df_contas_recorrentes` | `financeiro` | Séries recorrentes; auditar criação, alteração e desativação futura |
| `df_notas` | `financeiro` | Notas/pendências; evitar conteúdo textual completo |
| `df_usuarios_empresas` | `usuarios`, `seguranca` | Vínculos, perfis e permissão por empresa |
| `df_usuarios_filiais` | `usuarios`, `seguranca` | Vínculos de filial/unidade |
| `profiles` | `usuarios` | Perfil de Auth/app; evitar dados pessoais desnecessários |
| `auth.users` | `usuarios`, `seguranca` | Apenas referência indireta/sanitizada; não gravar payload do Auth |
| `df_empresas` | `empresas` | Tenant raiz; mudanças são sensíveis |
| `df_filiais` | `empresas` | Unidade operacional; mudanças afetam filtros e relatórios |
| `df_funcionarios` | `rh` | Dados pessoais; payload mínimo e sanitizado |
| `df_funcionarios_exames_periodicos` | `rh` | Apenas datas; não registrar dado médico |
| `df_funcionarios_ferias_ciclos` | `rh` | Férias; cuidado com dados trabalhistas |
| `df_funcionarios_ferias_periodos` | `rh` | Períodos de gozo; cuidado com histórico trabalhista |
| `df_destinatarios_alertas` | `seguranca`, `automacao` | Já auditada em `df_auditoria_admin` com e-mail hash |
| `automacoes/scripts` | `automacao` | Entidade lógica para scripts e workflows |

## Data dictionary dos campos mínimos

| Campo | Tipo sugerido | Obrigatório | Descrição | Exemplo | Pode conter dado sensível? | Regra de mascaramento |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | Sim | Identificador do evento | `gen_random_uuid()` | Não | Sem mascaramento |
| `empresa_id` | `uuid` | Sim, salvo evento técnico global | Empresa/tenant do evento | `8b3...` | Não diretamente | Obrigatório para evento de dado operacional |
| `user_id` | `uuid` | Opcional | Usuário autenticado associado | `auth.uid()` | Não diretamente | Nulo para script/sistema sem usuário |
| `ator_tipo` | `text` | Sim | Quem originou o evento | `usuario`, `edge_function`, `script` | Não | Usar enum lógico permitido |
| `ator_email_hash` | `text` | Opcional | Hash do e-mail do ator quando necessário | `md5(lower(email))` | Sim, derivado | Nunca gravar e-mail claro quando hash bastar |
| `modulo` | `text` | Sim | Módulo da taxonomia | `financeiro` | Não | Usar lista permitida |
| `entidade_tipo` | `text` | Sim | Tabela ou entidade lógica afetada | `df_contas` | Não | Usar lista permitida |
| `entidade_id` | `uuid` | Opcional | ID do registro afetado | ID da conta | Não diretamente | Nulo para evento agregado |
| `acao` | `text` | Sim | Nome padronizado do evento | `financeiro.conta.baixada` | Não | Formato `modulo.entidade.acao` |
| `severidade` | `text` | Sim | Criticidade operacional | `info`, `warning`, `critical` | Não | Usar lista permitida |
| `origem` | `text` | Sim | Camada que gravou o evento | `app`, `database_trigger` | Não | Usar lista permitida |
| `status` | `text` | Sim | Resultado do evento | `sucesso`, `falha`, `bloqueado` | Não | Usar lista permitida |
| `motivo` | `text` | Opcional | Motivo curto e sanitizado | `sem_permissao` | Pode | Não gravar observações livres completas |
| `dados_antes` | `jsonb` | Opcional | Estado anterior permitido | `{ "status": "pendente" }` | Pode | Só campos permitidos por evento |
| `dados_depois` | `jsonb` | Opcional | Estado posterior permitido | `{ "status": "pago" }` | Pode | Só campos permitidos por evento |
| `metadados` | `jsonb` | Opcional | Dados auxiliares sanitizados | `{ "quantidade_itens": 2 }` | Pode | Não gravar payload completo |
| `correlation_id` | `text` ou `uuid` | Opcional | Liga eventos do mesmo fluxo | ID de execução | Não | Não usar token/sessão real |
| `criado_em` | `timestamptz` | Sim | Data/hora do evento | `now()` | Não | Sem mascaramento |

## Severidades permitidas

| Severidade | Quando usar | Exemplos |
| --- | --- | --- |
| `info` | Evento esperado, autorizado e concluído | conta criada, pagamento parcial criado, convite enviado |
| `warning` | Evento permitido com atenção ou falha operacional não crítica | tentativa bloqueada por regra, Edge Function falhou sem alterar dados |
| `critical` | Evento sensível de segurança, permissão, cross-tenant ou ação administrativa crítica | cross-tenant bloqueado, DELETE físico bloqueado, tentativa de ação sem permissão |

## Origens permitidas

| Origem | Quando usar |
| --- | --- |
| `app` | Evento gravado a partir do frontend/service/hook em ciclo futuro autorizado |
| `edge_function` | Evento gravado por Edge Function sensível |
| `database_trigger` | Evento gravado por trigger no banco |
| `script` | Evento gravado por script operacional autorizado |
| `manual` | Evento documentado/registrado por ação operacional manual autorizada |
| `sistema` | Evento técnico interno ou agregação automática |

## Status permitidos

| Status | Quando usar |
| --- | --- |
| `sucesso` | A ação foi executada como esperado |
| `falha` | A ação tentou executar, mas falhou sem bloqueio de segurança esperado |
| `bloqueado` | A ação foi impedida por regra de negócio, permissão, RLS, trigger, validação ou segurança |

## Regras de mascaramento

Proibido registrar:

- senha;
- hash de senha;
- token;
- secret;
- CPF em texto claro;
- e-mail em texto claro quando hash for suficiente;
- dados médicos;
- laudos;
- CID;
- diagnósticos;
- anexos;
- base64;
- links sensíveis;
- observações completas de funcionário;
- payload completo de request;
- conteúdo completo de nota;
- texto integral de observação financeira quando não for necessário.

Permitido com cuidado:

- valores financeiros necessários para auditoria;
- status antes/depois;
- IDs;
- contagem de itens;
- hashes;
- flags booleanas;
- motivo curto sanitizado;
- datas operacionais quando necessárias;
- nome de módulo, entidade e ação.

Regra geral: se o dado não for necessário para explicar quem fez, em qual empresa, em qual entidade, qual ação ocorreu e qual foi o resultado, não gravar.

## Eventos P1 - Financeiro / Contas

| Ação | Módulo | Entidade | Origem recomendada | Severidade | Status esperado | `dados_antes` permitidos | `dados_depois` permitidos | `metadados` permitidos | Campos proibidos | Segurança |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `financeiro.conta.criada` | `financeiro` | `df_contas` | `app` ou `database_trigger` | `info` | `sucesso` | `{}` | `status`, `valor`, `vencimento`, `centro_custo_id`, `filial_id`, `imposto_tipo` | `origem_fluxo`, `recorrencia_id`, `grupo_parcelamento_id` | observação completa, descrição livre sensível | Valor permitido por ser evento financeiro |
| `financeiro.conta.editada` | `financeiro` | `df_contas` | `app` ou `database_trigger` | `info` | `sucesso` | apenas campos alterados permitidos | apenas campos alterados permitidos | `campos_alterados` | payload completo, observação completa | Registrar diff mínimo |
| `financeiro.conta.baixada` | `financeiro` | `df_contas` | `app` ou `database_trigger` | `info` | `sucesso` | `status`, `valor_pago`, `data_pagamento` | `status`, `valor_pago`, `data_pagamento` | `forma_fluxo` | observação de pagamento completa | Motivo curto opcional |
| `financeiro.conta.baixa_corrigida` | `financeiro` | `df_contas` | `app` | `warning` | `sucesso` | `valor_pago`, `data_pagamento`, `status` | `valor_pago`, `data_pagamento`, `status` | `campos_corrigidos` | observação completa | Atenção por alterar baixa existente |
| `financeiro.conta.baixa_estornada` | `financeiro` | `df_contas` | `app` | `warning` | `sucesso` | `status`, `valor_pago`, `data_pagamento` | `status`, `valor_pago`, `data_pagamento` | `motivo_curto` | observação completa | Não apagar histórico de pagamentos parciais |
| `financeiro.pagamento_parcial.criado` | `financeiro` | `df_contas_pagamentos` | `app` ou `database_trigger` | `info` | `sucesso` | `{}` | `valor_pago`, `data_pagamento`, `conta_id` | `saldo_estimado`, `quantidade_parciais` | observação completa | Valor permitido, texto livre não |
| `financeiro.pagamento_parcial.estornado` | `financeiro` | `df_contas_pagamentos` | `app` ou `database_trigger` | `warning` | `sucesso` | `arquivado`, `arquivado_em` | `arquivado`, `arquivado_em` | `conta_id`, `valor_pago` | observação completa | Estorno por arquivamento lógico |
| `financeiro.conta.quitacao_por_parciais` | `financeiro` | `df_contas` | `app` | `info` | `sucesso` | `status`, `valor_pago` | `status`, `valor_pago`, `data_pagamento` | `quantidade_parciais`, `soma_parciais` | observações completas | Registrar soma e quantidade |
| `financeiro.conta.ocultada` | `financeiro` | `df_contas` | `app` ou `database_trigger` | `warning` | `sucesso` | `oculto`, `excluido`, `deletado` | `oculto`, `excluido`, `deletado` | `grupo_parcelamento_id` | descrição completa | Não confundir com DELETE físico |
| `financeiro.conta.reativada` | `financeiro` | `df_contas` | `app` ou `database_trigger` | `info` | `sucesso` | `oculto`, `excluido`, `deletado` | `oculto`, `excluido`, `deletado` | `grupo_parcelamento_id` | descrição completa | Reversão lógica |
| `financeiro.imposto.importado` | `financeiro` | `df_contas` | `script` ou `manual` | `info` | `sucesso` | `{}` | `valor`, `competencia`, `vencimento`, `imposto_tipo` | `fonte`, `quantidade_itens`, `arquivo_origem_hash` | arquivo completo, observação integral | Registrar origem resumida |
| `financeiro.imposto.consolidado` | `financeiro` | `df_contas` | `manual` ou `script` | `warning` | `sucesso` | `valor`, `status`, `oculto` | `valor`, `status`, `oculto` | `ids_consolidados`, `receitas`, `competencia` | observação completa se contiver dados sensíveis | Exige rollback por grupo |

## Eventos P1 - Usuários / Permissões

| Ação | Módulo | Entidade | Origem recomendada | Severidade | Status esperado | `dados_antes` permitidos | `dados_depois` permitidos | `metadados` permitidos | Campos proibidos | Segurança |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `usuarios.usuario.criado` | `usuarios` | `auth.users` / `profiles` | `edge_function` | `critical` | `sucesso` | `{}` | `user_id`, `profile_id` | `email_hash`, `created_by_admin` | senha, token, e-mail claro | Referência indireta ao Auth |
| `usuarios.convite.enviado` | `usuarios` | `df_usuarios_empresas` | `edge_function` | `info` | `sucesso` | `{}` | `empresa_id`, `user_id` se existir | `email_hash`, `metodo` | e-mail claro, link de convite | Fluxo sensível |
| `usuarios.convite.reset_autorizado` | `usuarios` | `df_usuarios_empresas` | `edge_function` | `warning` | `sucesso` | `{}` | `{}` | `email_hash`, `motivo_curto` | token, link, e-mail claro | Atenção por reset autorizado |
| `usuarios.vinculo.criado` | `usuarios` | `df_usuarios_empresas` | `app` ou `edge_function` | `critical` | `sucesso` | `{}` | `empresa_id`, `user_id`, `perfil` | `email_hash` | e-mail claro | Afeta acesso |
| `usuarios.vinculo.perfil_alterado` | `usuarios` | `df_usuarios_empresas` | `app` | `critical` | `sucesso` | `perfil` | `perfil` | `alvo_user_id`, `email_hash` | e-mail claro | Deve registrar ator e alvo |
| `usuarios.vinculo.removido` | `usuarios` | `df_usuarios_empresas` | `app` | `critical` | `sucesso` | `empresa_id`, `user_id`, `perfil` | `{}` | `email_hash`, `motivo_curto` | e-mail claro | Remoção de acesso |
| `usuarios.filial.vinculada` | `usuarios` | `df_usuarios_filiais` | `app` | `info` | `sucesso` | `{}` | `usuario_id`, `filial_id`, `empresa_id` | `origem_fluxo` | nomes livres desnecessários | Afeta escopo operacional |
| `usuarios.filial.desvinculada` | `usuarios` | `df_usuarios_filiais` | `app` | `warning` | `sucesso` | `usuario_id`, `filial_id`, `empresa_id` | `{}` | `motivo_curto` | nomes livres desnecessários | Afeta escopo operacional |

## Eventos P1 - Segurança / Administração

| Ação | Módulo | Entidade | Origem recomendada | Severidade | Status esperado | `dados_antes` permitidos | `dados_depois` permitidos | `metadados` permitidos | Campos proibidos | Segurança |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `seguranca.acao.bloqueada` | `seguranca` | entidade afetada | `app`, `edge_function` ou `database_trigger` | `critical` | `bloqueado` | `{}` | `{}` | `motivo_curto`, `acao_tentada`, `perfil_detectado` | payload completo | Não gravar dados da tentativa além do necessário |
| `seguranca.cross_tenant.bloqueado` | `seguranca` | entidade afetada | `database_trigger` ou `edge_function` | `critical` | `bloqueado` | `{}` | `{}` | `empresa_id_tentada`, `empresa_id_contexto`, `entidade_tipo` | payload completo | Evento crítico multiempresa |
| `seguranca.edge_function.sucesso` | `seguranca` | `automacoes/scripts` ou função | `edge_function` | `info` | `sucesso` | `{}` | `{}` | `function_name`, `empresa_id`, `resultado_resumido` | request completo, token | Para funções sensíveis |
| `seguranca.edge_function.falha` | `seguranca` | `automacoes/scripts` ou função | `edge_function` | `warning` | `falha` | `{}` | `{}` | `function_name`, `erro_sanitizado`, `empresa_id` | stack completa com secrets, token | Sanitizar erro |
| `seguranca.delete_fisico.bloqueado` | `seguranca` | entidade afetada | `database_trigger` | `critical` | `bloqueado` | `{}` | `{}` | `entidade_tipo`, `entidade_id` | conteúdo do registro | Preferir inativação lógica |

## Eventos P1 futuro - RH

RH é P1 futuro por importância, mas não deve entrar no primeiro ciclo de implementação sem revisão LGPD específica.

| Ação | Módulo | Entidade | Origem recomendada | Severidade | Status esperado | `dados_antes` permitidos | `dados_depois` permitidos | `metadados` permitidos | Campos proibidos | Segurança |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `rh.funcionario.criado` | `rh` | `df_funcionarios` | `app` ou `database_trigger` | `info` | `sucesso` | `{}` | `status`, `filial_id`, `cargo_presente` | `campos_preenchidos` | CPF, telefone, e-mail claro, observações | Não gravar payload completo |
| `rh.funcionario.editado` | `rh` | `df_funcionarios` | `app` ou `database_trigger` | `warning` | `sucesso` | campos permitidos alterados | campos permitidos alterados | `campos_alterados` | CPF, observações, dados sensíveis | Diff mínimo |
| `rh.funcionario.arquivado` | `rh` | `df_funcionarios` | `app` ou `database_trigger` | `warning` | `sucesso` | `arquivado`, `arquivado_em`, `status` | `arquivado`, `arquivado_em`, `status` | `motivo_curto` | motivo livre sensível | Arquivamento lógico |
| `rh.funcionario.reativado` | `rh` | `df_funcionarios` | `app` ou `database_trigger` | `info` | `sucesso` | `arquivado`, `arquivado_em`, `status` | `arquivado`, `arquivado_em`, `status` | `motivo_curto` | motivo livre sensível | Reativação lógica |
| `rh.exame_periodico.criado` | `rh` | `df_funcionarios_exames_periodicos` | `app` ou `database_trigger` | `info` | `sucesso` | `{}` | `data_exame`, `funcionario_id` | `empresa_id` | laudo, resultado, CID, diagnóstico | Só datas |
| `rh.exame_periodico.editado` | `rh` | `df_funcionarios_exames_periodicos` | `app` ou `database_trigger` | `warning` | `sucesso` | `data_exame` | `data_exame` | `funcionario_id` | laudo, resultado, CID, diagnóstico | Só datas |
| `rh.exame_periodico.arquivado` | `rh` | `df_funcionarios_exames_periodicos` | `app` ou `database_trigger` | `warning` | `sucesso` | `arquivado`, `arquivado_em` | `arquivado`, `arquivado_em` | `funcionario_id` | dado médico | Arquivamento lógico |
| `rh.ferias.criada` | `rh` | `df_funcionarios_ferias_ciclos` / `df_funcionarios_ferias_periodos` | `app` ou `database_trigger` | `info` | `sucesso` | `{}` | datas operacionais, `status` | `funcionario_id` | observações sensíveis | Dados trabalhistas mínimos |
| `rh.ferias.editada` | `rh` | `df_funcionarios_ferias_ciclos` / `df_funcionarios_ferias_periodos` | `app` ou `database_trigger` | `warning` | `sucesso` | datas/status permitidos | datas/status permitidos | `campos_alterados` | observações sensíveis | Diff mínimo |
| `rh.ferias.arquivada` | `rh` | `df_funcionarios_ferias_ciclos` / `df_funcionarios_ferias_periodos` | `app` ou `database_trigger` | `warning` | `sucesso` | `arquivado`, `arquivado_em`, `status` | `arquivado`, `arquivado_em`, `status` | `funcionario_id` | motivo livre sensível | Arquivamento lógico |

## Perfis de leitura recomendados

| Perfil | Recomendação inicial | Observação |
| --- | --- | --- |
| Master | Leitura ampla com cautela multiempresa | Pode exigir filtros e sinalização de empresa para evitar confusão operacional |
| Admin | Leitura somente da própria empresa | Deve depender de `empresa_id` e helper/policy segura |
| Gerente | Sem acesso inicial | Avaliar depois apenas logs operacionais não sensíveis |
| Operador | Sem acesso | Não ampliar superfície de leitura |

Regras:

- não criar policy `ALL`;
- não criar policy `DELETE`;
- não permitir escrita direta pelo frontend sem desenho específico;
- preferir escrita controlada por função/serviço/triggers bem auditados, com RLS e rollback;
- preservar isolamento por `empresa_id`.

## Próximo ciclo recomendado

Próximo ciclo conservador:

1. Revisar esta taxonomia.
2. Preparar proposta de migration futura para `public.df_auditoria_eventos`.
3. Incluir rollback e diagnóstico SQL somente leitura.
4. Não aplicar a migration até autorização explícita.
5. Começar implementação real por um escopo pequeno:
   - opção A: tela somente leitura dos logs já existentes em `df_auditoria_admin`;
   - opção B: tabela nova `df_auditoria_eventos` sem captura ampla ainda;
   - opção C: primeiro evento P1 de Contas, se banco/RLS/tabela já estiverem aprovados.

Recomendação final deste documento: preparar a futura `public.df_auditoria_eventos`, sem mexer em `public.df_auditoria_admin` neste momento.

## Confirmações deste ciclo

- Banco: não alterado.
- Dados: não alterados.
- Schema/migration: não alterados.
- RLS/policies/grants/functions Supabase: não alterados.
- Frontend: não alterado.
- Services/hooks: não alterados.
- Scripts: não alterados.
- Implementação de logs: não realizada.
