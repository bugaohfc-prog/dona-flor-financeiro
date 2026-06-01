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

1. Banco/RLS com rollback para destinatários por empresa.
2. Service/hook para leitura e gravação segura.
3. Frontend de cadastro em Configurações.
4. Ajuste do GitHub Actions para priorizar destinatários configurados.
5. Validação controlada de envio real.
