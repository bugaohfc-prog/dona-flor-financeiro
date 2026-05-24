# Envio automatico Dona Flor - GitHub Actions

Data: 2026-05-23

## Estado oficial

O envio automatico financeiro da Dona Flor foi migrado do Pipedream para GitHub Actions.

Estado final validado:

- Pipedream desligado.
- GitHub Actions e o fluxo oficial de envio automatico.
- Workflow: `.github/workflows/envio-automatico-dona-flor.yml`.
- Script: `scripts/envio-automatico-dona-flor.mjs`.
- Envio real ativo com `DRY_RUN=false`.
- SMTP Gmail validado.
- Conta correta de envio: `donaflor.suporte@gmail.com`.
- `MAIL_FROM=Dona Flor Financeiro <donaflor.suporte@gmail.com>`.
- E-mail real enviado com sucesso.
- `message_id` gerado nos logs.
- Logs mascaram destinatarios.
- Template final validado visualmente no Outlook mobile.
- Node 24 aplicado e validado.
- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` aplicado.

## Agenda

Cron oficial em horario de Sao Paulo:

- 08:07;
- 09:07;
- 20:07.

No GitHub Actions, o schedule usa UTC:

- `7 11,12,23 * * *`.

Equivalencia:

- 11:07 UTC = 08:07 em Sao Paulo;
- 12:07 UTC = 09:07 em Sao Paulo;
- 23:07 UTC = 20:07 em Sao Paulo.

O minuto 7 evita o topo da hora, quando jobs agendados podem atrasar mais.

## Runtime

O workflow usa Node 24 via `actions/setup-node`.

Tambem define:

- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`.

Essa configuracao foi aplicada como manutencao preventiva contra avisos de deprecacao do Node 20 no GitHub Actions.

## Secrets necessarios

Secrets usados pelo workflow:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DRY_RUN`
- `MAIL_TO_FALLBACK`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`

Configuracao SMTP validada:

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=donaflor.suporte@gmail.com`
- `SMTP_PASS`: senha de app do Google
- `MAIL_FROM=Dona Flor Financeiro <donaflor.suporte@gmail.com>`
- `MAIL_TO_FALLBACK=donafloradm@outlook.com` usado no teste controlado.

Nenhum secret deve ser escrito no codigo ou impresso em log.

## DRY_RUN

`DRY_RUN` controla se o envio real fica ativo.

Estado oficial atual:

- `DRY_RUN=false`.
- Envio real ativo pelo GitHub Actions.

Com `DRY_RUN=true`:

- o script consulta dados com service role no ambiente server-side do GitHub Actions;
- todas as consultas de negocio filtram `empresa_id` explicitamente;
- o script monta assunto, HTML e texto em memoria;
- nenhum e-mail real e enviado;
- os logs mostram apenas resumo seguro.

Envio real so ocorre quando o secret `DRY_RUN` for exatamente `false`.

Qualquer outro valor, incluindo vazio, `true`, `0`, `no`, `off` ou erro de digitacao, e tratado como `DRY_RUN=true`.

Para pausar envio real em emergencia, alterar o secret `DRY_RUN` para `true`.

## Envio real SMTP

Quando `DRY_RUN=false`, o script:

- valida `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `MAIL_FROM`;
- conecta no SMTP com STARTTLS quando usado `SMTP_PORT=587`;
- autentica com `AUTH PLAIN`;
- envia o HTML e texto montados pelo script;
- usa `MAIL_FROM` como remetente e reply-to;
- registra somente resumo seguro.

Se o SMTP falhar, a execucao falha com erro seguro, sem expor senha, corpo do e-mail ou secrets.

## Validacao realizada

O fluxo GitHub Actions foi validado nas etapas abaixo.

`DRY_RUN=true`:

- workflow executou com sucesso;
- avaliou as empresas Dona Flor Financeiro e Choco Arte;
- detectou corretamente conta para amanha, nota urgente, contas vencidas e empresa com alerta;
- nenhum e-mail real foi enviado.

`DRY_RUN=false` em teste manual controlado:

- envio real por Gmail SMTP funcionou;
- e-mail foi enviado para `donafloradm@outlook.com`;
- log registrou status `enviado`;
- log registrou `message_id`.

Estado oficial final:

- Pipedream desligado;
- GitHub Actions ativo como fluxo oficial;
- `DRY_RUN=false` ativo para envio real.

## Erro SMTP 535

Durante o primeiro teste real, o Gmail retornou erro SMTP `535`.

Causa identificada:

- estava sendo usado `suporte.donaflor@gmail.com`;
- a senha de app havia sido gerada na conta `donaflor.suporte@gmail.com`.

Correcao aplicada nos GitHub Secrets:

- `SMTP_USER=donaflor.suporte@gmail.com`;
- `MAIL_FROM=Dona Flor Financeiro <donaflor.suporte@gmail.com>`.

Depois da correcao, o envio real controlado foi validado com sucesso.

Se o erro SMTP `535` voltar a ocorrer, conferir se a senha de app foi gerada na mesma conta Google configurada em `SMTP_USER` e `MAIL_FROM`.

## Template final validado

O template final foi validado visualmente no Outlook mobile.

Elementos validados:

- cabecalho `Dona Flor Gestao Financeira`;
- bloco `Alerta Critico`;
- total financeiro de contas vencidas;
- conta de amanha;
- nota urgente;
- lista de contas vencidas limitada a 6 cards;
- linha `+ X conta(s) vencida(s) nao exibida(s) neste resumo.`;
- notas sem fallback visual de `Sem titulo`;
- botao `Acessar sistema`;
- rodape de mensagem automatica.

## Referencia Pipedream

Foram usados como referencia os steps antigos:

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

Colunas opcionais do Pipedream antigo, como `role` e `receber_email`, nao sao consultadas para evitar erro HTTP 400 quando nao existirem no banco.

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
- `message_id` quando disponivel;
- status `dry_run_ok`, `dry_run_sem_envio`, `enviado` ou aviso seguro.

Os logs nao registram:

- secrets;
- descricoes completas de contas;
- valores detalhados;
- texto completo de notas;
- HTML ou texto completo do e-mail;
- e-mails completos.

## Procedimento de emergencia

Para pausar envio real:

1. Acessar GitHub Actions secrets.
2. Alterar `DRY_RUN` para `true`.
3. Executar manualmente o workflow, se necessario, para confirmar que o log mostra modo seguro.
4. Conferir que nenhum e-mail real foi enviado.

Para testar manualmente:

1. Acessar GitHub Actions.
2. Abrir o workflow `Envio automatico Dona Flor`.
3. Usar `Run workflow`.
4. Escolher o tipo desejado, se necessario.
5. Conferir logs com destinatarios mascarados.

Para reativar envio real:

1. Alterar `DRY_RUN` para `false`.
2. Executar manualmente o workflow.
3. Conferir recebimento do e-mail.
4. Conferir log com status `enviado` e `message_id`.

## Cuidados operacionais

- Nunca commitar secrets no repositorio.
- Nunca imprimir `SMTP_PASS` em log.
- Nunca imprimir e-mails completos em log.
- Manter mascaramento de destinatarios.
- `SMTP_PASS` deve ser senha de app do Google.
- `SMTP_PASS` nao deve ser a senha normal da conta Gmail.
- Se erro SMTP `535` ocorrer, conferir `SMTP_USER` e a senha de app da mesma conta Google.
- O schedule do GitHub Actions usa UTC.
- O cron atual ja esta convertido para horarios equivalentes em Sao Paulo.
- Nao religar Pipedream sem necessidade, para evitar duplicidade de e-mails.

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

## Melhorias futuras opcionais

- adicionar idempotencia para evitar duplicidade em rerun manual;
- confirmar se alerta de alto valor deve olhar todos os vencimentos futuros, como no Pipedream, ou apenas a janela de alerta do app.
