# Envio automatico Dona Flor - GitHub Actions DRY_RUN

Data: 2026-05-23

## Objetivo

Criar a primeira versao da migracao do workflow Pipedream `Envio automatico Dona flor` para GitHub Actions, mantendo o ciclo em `DRY_RUN` e sem envio real de e-mail.

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

Nenhum secret deve ser escrito no codigo ou impresso em log.

## DRY_RUN

Neste ciclo, `DRY_RUN` deve permanecer ativo.

Com `DRY_RUN=true`:

- o script consulta dados com service role no ambiente server-side do GitHub Actions;
- todas as consultas de negocio filtram `empresa_id` explicitamente;
- o script monta assunto, HTML e texto em memoria;
- nenhum e-mail real e enviado;
- os logs mostram apenas resumo seguro.

Se `DRY_RUN=false`, o script falha de forma intencional informando que envio real ainda nao foi habilitado neste ciclo.

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
- usuarios com `receber_email=false` nao entram como destinatarios;
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
- total de destinatarios;
- status `dry_run_ok`, `dry_run_sem_envio` ou aviso seguro.

Os logs nao registram:

- secrets;
- descricoes completas de contas;
- valores detalhados;
- texto completo de notas;
- HTML ou texto completo do e-mail;
- e-mails completos.

## TODO para envio real

Antes de habilitar envio real:

- decidir provedor final, como SendGrid, SMTP ou outro;
- criar secret do provedor somente no GitHub Actions;
- implementar `sendEmail()` real;
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
