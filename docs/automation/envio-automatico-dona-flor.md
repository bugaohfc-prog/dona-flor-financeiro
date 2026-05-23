# Envio automatico Dona Flor - GitHub Actions

Data: 2026-05-23

## Objetivo

Migrar o workflow Pipedream `Envio automatico Dona flor` para GitHub Actions, mantendo `DRY_RUN` como padrao seguro e habilitando envio real por SMTP somente quando `DRY_RUN=false` estiver explicitamente configurado.

## Arquivos

- `.github/workflows/envio-automatico-dona-flor.yml`
- `scripts/envio-automatico-dona-flor.mjs`

## Agenda

O Pipedream roda com cron `0 8,9,20 * * *` em `America/Sao_Paulo`.

No GitHub Actions, o schedule usa UTC:

- `7 11,12,23 * * *`

Equivalencia:

- 11:07 UTC = 08:07 em Sao Paulo;
- 12:07 UTC = 09:07 em Sao Paulo;
- 23:07 UTC = 20:07 em Sao Paulo.

O minuto 7 evita o topo da hora, quando jobs agendados podem atrasar mais.

## Secrets necessarios

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DRY_RUN`
- `MAIL_TO_FALLBACK`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`

Nenhum secret deve ser escrito no codigo ou impresso em log.

Configuracao SMTP validada para o proximo teste real:

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=suporte.donaflor@gmail.com`
- `SMTP_PASS`: senha de app do Google
- `MAIL_FROM=Dona Flor Financeiro <suporte.donaflor@gmail.com>`

Para Gmail, `SMTP_PASS` deve ser uma App Password, nao a senha normal da conta.

## DRY_RUN

`DRY_RUN` e o modo seguro padrao.

Com `DRY_RUN=true`:

- o script consulta dados com service role no ambiente server-side do GitHub Actions;
- todas as consultas de negocio filtram `empresa_id` explicitamente;
- o script monta assunto, HTML e texto em memoria;
- nenhum e-mail real e enviado;
- os logs mostram apenas resumo seguro.

Envio real so ocorre quando o secret `DRY_RUN` for exatamente `false`.

Qualquer outro valor, incluindo vazio, `true`, `0`, `no`, `off` ou erro de digitacao, e tratado como `DRY_RUN=true`.

Para voltar ao modo seguro, alterar o secret `DRY_RUN` para `true` ou remover o valor `false`.

## Envio real SMTP

Quando `DRY_RUN=false`, o script:

- valida `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `MAIL_FROM`;
- conecta no SMTP com STARTTLS quando usado `SMTP_PORT=587`;
- autentica com `AUTH PLAIN`;
- envia o HTML e texto ja montados pelo script;
- usa `MAIL_FROM` como remetente e reply-to;
- registra somente resumo seguro.

Se o SMTP falhar, a execucao falha com erro seguro, sem expor senha, corpo do e-mail ou secrets.

## Referencia Pipedream

Foram usados como referencia os steps atuais:

- `montar_email`;
- `envio_email`.

Regras reaproveitadas no script:

- tipo `VENCIDAS` gera assunto `Contas vencidas - Dona Flor`;
- tipo `AMANHA` gera assunto `Contas de amanha - Dona Flor`;
- tipo padrao gera assunto `Alerta financeiro - Dona Flor`;
- o HTML preserva a estrutura geral do cabecalho Dona Flor, bloco de alerta, resumo principal, bloco de notas e link do app;
- notas urgentes continuam sendo consideradas como gatilho de envio;
- usuarios com perfil `master`, `superadmin`, `super_admin` ou e-mail bloqueado nao entram como destinatarios;
- destinatarios sao mascarados nos logs.

## Consultas

O script usa REST do Supabase com service role e filtros explicitos.

Tabelas consultadas:

- `df_configuracoes`;
- `df_configuracoes_alertas`;
- `df_empresas`;
- `df_usuarios_empresas`;
- `df_contas`;
- `df_notas`.

Para `df_usuarios_empresas`, a consulta usa somente colunas confirmadas no schema atual:

- `user_id`;
- `email`;
- `nome`;
- `perfil`;
- `empresa_id`.

Colunas opcionais do Pipedream antigo, como `role` e `receber_email`, não são consultadas neste ciclo para evitar erro HTTP 400 quando não existirem no banco.

Campos atuais preferidos:

- contas: `data_vencimento`, `vencimento`, `status`, `excluido`;
- notas: `data_evento`, `concluida`, `excluido`, `prioridade`.

Para notas, ha fallback defensivo para campos legados do Pipedream antigo:

- `data_lembrete`;
- `deletado`;
- `status`.

## Logs seguros

Os logs registram somente:

- `empresa_id`;
- nome da empresa;
- tipo de alerta;
- assunto gerado;
- quantidades de contas e notas;
- primeiro destinatario mascarado;
- lista de destinatarios mascarados;
- total de destinatarios;
- message id quando disponivel;
- status `dry_run_ok`, `dry_run_sem_envio`, `enviado` ou aviso seguro.

Os logs nao registram:

- secrets;
- descricoes completas de contas;
- valores detalhados;
- texto completo de notas;
- HTML ou texto completo do e-mail;
- e-mails completos.

## Como testar

Teste seguro:

- manter `DRY_RUN=true`;
- executar manualmente pelo GitHub Actions;
- conferir logs com `dry_run_ok` ou `dry_run_sem_envio`;
- confirmar que nenhum e-mail real foi enviado.

Teste real controlado:

- confirmar secrets SMTP no GitHub Actions;
- alterar apenas o secret `DRY_RUN` para `false`;
- executar manualmente com o tipo desejado;
- conferir logs com status `enviado`;
- voltar `DRY_RUN` para `true` apos o teste, se quiser retornar ao modo seguro.

## TODO futuro

Antes de manter envio real recorrente:

- adicionar idempotencia para evitar duplicidade em rerun manual;
- confirmar se alerta de alto valor deve olhar todos os vencimentos futuros, como no Pipedream, ou apenas a janela de alerta do app;
- confirmar os campos reais para filial e centro no e-mail detalhado antes de reativar cards completos de contas;
- confirmar os campos reais de texto/observacao das notas antes de reativar detalhes completos no corpo do e-mail.

## Execucao manual

No GitHub Actions, usar `workflow_dispatch`.

O input `tipo` aceita:

- `AUTO`;
- `HOJE`;
- `AMANHA`;
- `VENCIDAS`.

Em `AUTO`, o script infere o tipo pelo horario em Sao Paulo:

- 20h: `VENCIDAS`;
- 9h: `AMANHA`;
- demais horarios: hoje/padrao.
