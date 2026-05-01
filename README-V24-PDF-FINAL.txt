Dona Flor V24 - PDF final sem código

Análise do bug:
- O PDF anterior estava imprimindo JavaScript acumulado das versões antigas.
- Havia funções antigas de PDF ainda ativas: iframe, Blob HTML, document.write e window.open.
- Essas funções brigavam entre si e imprimiam o código em vez do relatório.

Correção:
- PDF não usa nova aba.
- PDF não usa iframe.
- PDF não usa Blob HTML.
- PDF não usa document.write.
- PDF abre uma prévia limpa dentro do app.
- O botão se chama "Salvar PDF", para não ser capturado pelos scripts antigos.
- No print, o CSS mostra apenas #df-v24-report-bg e oculta todo o restante.
- CSV segue funcionando com integração real.

SQL:
- Não precisa SQL.
