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
- Template final validado visualmente no Outlook mobile com branding DNA Gestao.
- Subject usa a empresa ativa processada.
- Corpo do e-mail preserva `Empresa: nome da empresa processada`.
- Node 24 aplicado e validado.
- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` aplicado.

## Estado atual apos branding DNA Gestao

O produto/sistema passou a ser apresentado como DNA Gestao. Dona Flor Financeiro, Choco Arte e futuras empresas devem ser tratadas como empresas/tenants processadas pelo envio automatico.

Estado operacional validado:

- cabecalho do e-mail mostra `DNA Gestao`;
- subtitulo mostra `Alertas financeiros automaticos`;
- rodape mostra `Mensagem automatica enviada pelo DNA Gestao.`;
- subject usa a empresa ativa, por exemplo `Alerta financeiro - Dona Flor Financeiro`;
- corpo preserva a empresa correta em `Empresa: nome da empresa processada`;
- botao `Acessar sistema` continua aparecendo e funcionando;
- layout mobile foi aprovado;
- logs continuam mascarando destinatarios e nao imprimem secrets.

Validacao multiempresa registrada:

- Dona Flor Financeiro: envio validado, subject com empresa ativa e e-mail enviado quando havia alerta.
- Choco Arte: empresa avaliada pelo workflow, destinatario encontrado e envio corretamente pulado por ausencia de alerta elegivel.
- Motivo registrado para Choco Arte: `Nenhuma conta vencendo hoje. Sem notas urgentes.`
- Status registrado: `dry_run_sem_envio`.

Ausencia de alerta em uma empresa nao e falha. O comportamento esperado e avaliar a empresa, registrar o motivo seguro e nao enviar e-mail real quando nao houver conta/nota elegivel.

Atencao residual:

- `MAIL_FROM` e remetente visual podem ainda aparecer como Dona Flor Financeiro enquanto o secret/env nao for alterado e validado.
- Se `MAIL_FROM` ja estiver configurado como `DNA Gestao <donaflor.suporte@gmail.com>`, registrar a validacao visual do remetente em ciclo proprio.
- Nao alterar `MAIL_FROM`, secrets, SMTP, workflow ou script sem ciclo operacional especifico.

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

Atencao: `MAIL_FROM` controla o remetente visual e o reply-to usado pelo script. A troca para `DNA Gestao <donaflor.suporte@gmail.com>` deve ser feita apenas via secret/env em ciclo operacional proprio, mantendo `SMTP_USER` e `SMTP_PASS` inalterados.

Nenhum secret deve ser escrito no codigo ou impresso em log.

Formato esperado para branding atual:

- `MAIL_FROM=DNA Gestão <donaflor.suporte@gmail.com>`

O script codifica o display name do header `From` em MIME/UTF-8 quando houver acentos. Isso evita exibicao como `DNA Gest??o` em clientes como Gmail mobile. O `Reply-To` continua usando somente o e-mail extraido de `MAIL_FROM`.

## DRY_RUN

`DRY_RUN` controla se o envio real fica ativo.

Estado operacional atual:

- execucoes agendadas continuam usando o secret `DRY_RUN`;
- execucoes manuais podem sobrescrever `DRY_RUN` pelo input `dry_run`;
- teste real manual exige travas adicionais antes de qualquer chamada SMTP.

Com `DRY_RUN=true`:

- o script consulta dados com service role no ambiente server-side do GitHub Actions;
- todas as consultas de negocio filtram `empresa_id` explicitamente;
- o script monta assunto, HTML e texto em memoria;
- nenhum e-mail real e enviado;
- os logs mostram apenas resumo seguro.

Envio real so ocorre quando `DRY_RUN` for exatamente `false`.

Qualquer outro valor, incluindo vazio, `true`, `0`, `no`, `off` ou erro de digitacao, e tratado como `DRY_RUN=true`.

Para pausar envio real em emergencia, alterar o secret `DRY_RUN` para `true`.

## Envio real SMTP

Quando `DRY_RUN=false`, o script:

- valida as travas de envio real controlado antes de consultar SMTP;
- valida `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `MAIL_FROM`;
- conecta no SMTP com STARTTLS quando usado `SMTP_PORT=587`;
- autentica com `AUTH PLAIN`;
- envia o HTML e texto montados pelo script;
- usa `MAIL_FROM` como remetente, com display name codificado em MIME/UTF-8 quando necessario;
- usa o e-mail extraido de `MAIL_FROM` como reply-to;
- registra somente resumo seguro.

Se o SMTP falhar, a execucao falha com erro seguro, sem expor senha, corpo do e-mail ou secrets.

## Execucao manual controlada

O workflow `Envio automatico Dona Flor` possui inputs manuais para teste seguro:

- `tipo`: `AUTO`, `HOJE`, `AMANHA` ou `VENCIDAS`;
- `dry_run`: `true` ou `false`;
- `modo_teste`: `true` ou `false`;
- `tipo_destinatario`: `todos`, `contas`, `notas` ou `resumo`;
- `limite_destinatarios`: quantidade maxima permitida;
- `empresa_id`: empresa alvo do teste;
- `confirmar_envio_real`: confirmacao textual para envio real.

Para dry-run manual:

1. Usar `dry_run=true`.
2. Manter `modo_teste=true`.
3. Escolher `tipo` e `tipo_destinatario`.
4. Conferir logs com e-mails mascarados e `message_id:null`.

No modo manual controlado, `tipo_destinatario` limita os destinatarios e os logs ao tipo escolhido:

- `contas`: processa/loga/envia somente alertas de contas;
- `notas`: processa/loga/envia somente alertas de notas;
- `resumo`: processa/loga/envia somente o resumo geral para destinatarios de resumo;
- `todos`: preserva o comportamento completo, com contas, notas e resumo.

As execucoes agendadas nao usam esse filtro manual e continuam seguindo o tipo de alerta calculado pelo horario ou pelo input `tipo`.

Para teste real controlado:

1. Usar `dry_run=false`.
2. Usar `modo_teste=true`.
3. Usar `limite_destinatarios=1`.
4. Informar `empresa_id`.
5. Preencher `confirmar_envio_real=CONFIRMO_ENVIO_REAL_CONTROLADO`.
6. Conferir antes que exista somente 1 destinatario final esperado.

Se qualquer trava falhar, o script aborta antes de SMTP:

- `modo_teste` diferente de `true`;
- `limite_destinatarios` diferente de `1`;
- `empresa_id` ausente;
- confirmacao textual incorreta;
- mais de 1 destinatario final no envio real.

As execucoes agendadas nao usam os inputs manuais e continuam seguindo o secret `DRY_RUN`.

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

O template final foi validado visualmente no Outlook mobile apos branding DNA Gestao.

Elementos validados:

- cabecalho `DNA Gestao`;
- subtitulo `Alertas financeiros automaticos`;
- bloco `Alerta Critico`;
- total financeiro de contas vencidas;
- conta de amanha;
- nota urgente;
- lista de contas vencidas limitada a 6 cards;
- linha `+ X conta(s) vencida(s) nao exibida(s) neste resumo.`;
- notas sem fallback visual de `Sem titulo`;
- botao `Acessar sistema`;
- rodape `Mensagem automatica enviada pelo DNA Gestao.`;
- empresa correta no corpo do e-mail.

## Referencia Pipedream

Foram usados como referencia os steps antigos:

- `montar_email`;
- `envio_email`.

Regras reaproveitadas e atualizadas no script:

- tipo `VENCIDAS` gera assunto `Contas vencidas - nome da empresa`;
- tipo `AMANHA` gera assunto `Contas de amanha - nome da empresa`;
- tipo padrao gera assunto `Alerta financeiro - nome da empresa`;
- o HTML preserva a estrutura geral do cabecalho, bloco de alerta, resumo principal, bloco de notas e link do app, usando DNA Gestao como produto;
- o corpo do e-mail preserva `Empresa: nome da empresa processada`;
- notas urgentes continuam sendo consideradas como gatilho de envio;
- usuarios com perfil `master`, `superadmin`, `super_admin` ou e-mail bloqueado nao entram como destinatarios;
- destinatarios sao mascarados nos logs.

## Consultas

O script usa REST do Supabase com service role e filtros explicitos.

Tabelas consultadas:

- `df_configuracoes`;
- `df_configuracoes_alertas`;
- `df_empresas`;
- `df_destinatarios_alertas`;
- `df_contas`;
- `df_notas`.

Para `df_destinatarios_alertas`, a consulta usa somente destinatarios ativos da empresa processada:

- `empresa_id`.
- `nome`;
- `email`;
- `ativo`;
- `recebe_contas`;
- `recebe_notas`;
- `recebe_resumo`.

O script respeita as preferencias por tipo de alerta:

- `recebe_contas` para alertas de contas;
- `recebe_notas` para alertas de notas;
- `recebe_resumo` para o resumo geral.

Se nao houver destinatario ativo compativel na nova tabela, o script usa `email_padrao` da empresa como fallback. Se tambem nao houver `email_padrao`, o fallback global permanece restrito ao comportamento de `DRY_RUN`.

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

Em `DRY_RUN=true`, o script tambem registra `dry_run_destinatarios` por empresa e por tipo de alerta:

- `contas`;
- `notas`;
- `resumo`.

Esse log mostra origem (`df_destinatarios_alertas` ou `fallback`), quantidade e destinatarios mascarados.

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

Inputs principais:

- `tipo`;
- `dry_run`;
- `modo_teste`;
- `tipo_destinatario`;
- `limite_destinatarios`;
- `empresa_id`;
- `confirmar_envio_real`.

O input `tipo` aceita:

- `AUTO`;
- `HOJE`;
- `AMANHA`;
- `VENCIDAS`.

Em `AUTO`, o script infere o tipo pelo horario em Sao Paulo:

- 20h: `VENCIDAS`;
- 9h: `AMANHA`;
- demais horarios: hoje/padrao.

Para envio real controlado, seguir a secao `Execucao manual controlada` e preencher todas as travas obrigatorias.

## Melhorias futuras opcionais

- adicionar idempotencia para evitar duplicidade em rerun manual;
- confirmar se alerta de alto valor deve olhar todos os vencimentos futuros, como no Pipedream, ou apenas a janela de alerta do app.
