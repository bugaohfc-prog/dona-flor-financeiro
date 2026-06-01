# E-mail e notificações - planejamento

## Estado atual

O envio automático atual roda pelo GitHub Actions e usa apenas e-mail. WhatsApp e Push não possuem backend real no fluxo atual e devem ser tratados como canais não configurados até existir implementação própria.

O fluxo atual permanece em:

- `.github/workflows/envio-automatico-dona-flor.yml`
- `scripts/envio-automatico-dona-flor.mjs`

## Campos usados pelo GitHub Actions

O envio automático consulta configurações por empresa e usa os campos atuais:

- `notificacoes_ativas`
- `enviar_email`
- `email_padrao`
- `nome_empresa`
- `dias_alerta_contas`
- `dias_alerta_notas`

`email_padrao` funciona como fallback quando não há destinatários encontrados entre usuários vinculados à empresa.

## Conceitos separados

Usuário do sistema é quem acessa o DNA Gestão, possui perfil, permissões e vínculo operacional com a empresa.

Destinatário de alerta é um e-mail autorizado a receber notificações automáticas, sem precisar ter login no sistema.

E-mail padrão da empresa é um contato/fallback institucional usado quando não houver lista específica de destinatários.

E-mail de contato da empresa é dado cadastral ou comercial da empresa e não deve ser confundido com permissão de acesso nem com lista oficial de alertas.

## Proposta futura

Criar uma lista de destinatários de alertas por `empresa_id`, separada de usuários do sistema. Essa lista deve permitir cadastrar donos ou responsáveis que recebem e-mails automáticos sem criar conta de acesso.

A lista deve ter controle por empresa, validação de e-mail, status ativo/inativo e trilha mínima para auditoria. A leitura pelo GitHub Actions deve sempre filtrar `empresa_id`.

## Estrutura inicial de banco

Tabela proposta/criada em migration para validação manual:

- `public.df_destinatarios_alertas`

Finalidade:

- manter a lista oficial de e-mails que podem receber alertas por empresa;
- separar destinatários de alerta de usuários do sistema;
- permitir inativação por `ativo=false`, sem DELETE físico;
- preparar uma base segura para service/hook, frontend e GitHub Actions em ciclos futuros.

Campos principais:

- `id`
- `empresa_id`
- `nome`
- `email`
- `ativo`
- `recebe_contas`
- `recebe_notas`
- `recebe_resumo`
- `observacao`
- `criado_em`
- `atualizado_em`
- `criado_por`
- `atualizado_por`

Arquivos do ciclo de banco/RLS:

- `supabase/migrations/20260601160000_create_df_destinatarios_alertas.sql`
- `docs/security/rollback/rollback_df_destinatarios_alertas_20260601.sql`
- `docs/security/diagnostics/diagnostico_df_destinatarios_alertas_20260601.sql`

## RLS aplicada

A tabela `df_destinatarios_alertas` deve ser tenant-scoped por `empresa_id`.

Regras previstas:

- RLS habilitada e forçada;
- `anon` sem acesso;
- `authenticated` com `SELECT`, `INSERT` e `UPDATE`;
- sem grant de `DELETE` para `authenticated`;
- sem policy `ALL`;
- sem policy de `DELETE`;
- DELETE físico bloqueado por trigger;
- alteração de `empresa_id` bloqueada após INSERT;
- e-mail único por empresa.

Leitura:

- permitida para master;
- permitida para perfis com vínculo na empresa compatíveis com acesso à área de Configurações, incluindo admin e gerente.

Escrita:

- restrita a master ou admin da empresa, conforme helpers existentes do projeto.

Rollback:

- o rollback remove policies, triggers, índices, tabela e funções criadas para `df_destinatarios_alertas`;
- deve ser usado somente se a migration recém-aplicada falhar nos testes iniciais e antes de uso real da funcionalidade.

## Riscos

- Misturar usuário do sistema com destinatário de alerta pode conceder acesso indevido.
- Destinatários precisam respeitar isolamento por `empresa_id`.
- Qualquer tabela nova deve nascer com RLS, políticas claras e rollback.
- Secrets, SMTP e service role devem continuar fora do frontend.
- Logs não devem expor destinatários completos nem dados sensíveis.

## Encoding

O texto `Gestão` está correto no código quando lido em UTF-8. Se o Gmail mobile exibir interrogações, as hipóteses principais são:

- `MAIL_FROM` com nome acentuado sem codificação MIME no cabeçalho `From`;
- corpo do e-mail usando `Content-Transfer-Encoding: 8bit`, que pode ser menos robusto em alguns clientes;
- divergência entre secret `MAIL_FROM`, template e cliente de e-mail.

Este ciclo não corrige encoding no envio real.

## Ordem segura futura

1. Revisar e aplicar manualmente a migration de banco/RLS.
2. Rodar o diagnóstico estrutural e testes negativos de RLS.
3. Criar service/hook para leitura e gravação segura.
4. Criar frontend de cadastro em Configurações.
5. Ajustar o GitHub Actions para priorizar destinatários configurados.
6. Validar envio real de forma controlada.

## Frontend de destinatarios de alertas

Status em 2026-06-01:

- o bloco `Destinatarios de alertas` em Configuracoes passou a ser funcional;
- destinatarios sao cadastrados em `public.df_destinatarios_alertas`;
- destinatario de alerta continua nao sendo usuario do sistema;
- nao ha criacao de login, senha ou vinculo em `df_usuarios_empresas`;
- inativacao usa `ativo=false`, sem DELETE fisico.

Permissoes esperadas no frontend:

- Admin: lista, cria, edita, inativa e reativa destinatarios da empresa ativa;
- Master: lista, cria, edita, inativa e reativa destinatarios da empresa ativa;
- Gerente: visualiza a lista em modo leitura;
- Operador: nao ganha acesso novo.

Arquivos do ciclo de service/hook/frontend:

- `src/services/destinatariosAlertasService.js`
- `src/hooks/useDestinatariosAlertas.js`
- `src/App.jsx`

Limites preservados:

- GitHub Actions continua usando o fluxo antigo ate ciclo proprio;
- `scripts/envio-automatico-dona-flor.mjs` nao foi alterado;
- secrets nao foram alterados;
- nenhum workflow foi disparado;
- nenhum e-mail real foi enviado.

Proximo passo seguro:

Integrar os destinatarios ao script de envio automatico com modo `dry-run`, priorizando leitura por `empresa_id`, destinatarios ativos e preferencias `recebe_contas`, `recebe_notas` e `recebe_resumo`.

## Integracao dry-run com GitHub Actions

Status em 2026-06-01:

- o script `scripts/envio-automatico-dona-flor.mjs` passou a consultar `public.df_destinatarios_alertas`;
- somente destinatarios com `ativo=true` entram na avaliacao;
- as preferencias `recebe_contas`, `recebe_notas` e `recebe_resumo` sao respeitadas por tipo de alerta;
- destinatarios duplicados sao removidos por e-mail;
- se nao houver destinatarios ativos compativeis, o script usa `email_padrao` da empresa;
- se tambem nao houver `email_padrao`, o fallback global permanece restrito ao comportamento de `dry-run`;
- os logs de `dry-run` mostram empresa, tipo de alerta, origem, quantidade e e-mails mascarados;
- SMTP nao e chamado quando `DRY_RUN=true`;
- envio real ainda nao foi liberado para a nova lista de destinatarios.

Limites preservados:

- nenhuma alteracao de banco, RLS, migration, grants, policies ou triggers;
- nenhuma alteracao de frontend, service ou hook;
- nenhuma alteracao de secrets;
- nenhum workflow foi disparado;
- nenhum e-mail real foi enviado.

Proximo passo seguro:

Validar os logs de `dry-run` no GitHub Actions e somente depois abrir ciclo proprio para envio real controlado.
