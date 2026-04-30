Dona Flor V18.3 - Webhook Pipedream

Correção:
- Adiciona campo para colar URL do Pipedream em Configurações.
- Botão Enviar automático usa fetch() e não abre Outlook.
- Mantém botão Abrir Outlook como alternativa manual.
- Não precisa novo SQL.

Como usar:
1. Suba os arquivos no GitHub.
2. Faça redeploy na Vercel.
3. Abra Configurações > E-mail automático.
4. Cole a URL do Pipedream.
5. Clique em Salvar URL.
6. Clique em Enviar automático.

Pipedream:
- Trigger: HTTP / Webhook > New Requests.
- Step: Email > Send Yourself an Email.
- Subject: Resumo financeiro - Dona Flor
- Text: {{steps.trigger.event.body.corpo}}
