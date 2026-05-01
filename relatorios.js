
function montarHTMLRelatorio() {
  const container = document.querySelector('#relatorio-print');

  return `
    <html>
      <head>
        <title>Relatório</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          h1 { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>Relatório Financeiro</h1>
        ${container ? container.innerHTML : ''}
      </body>
    </html>
  `;
}

function gerarPDF() {
  const html = montarHTMLRelatorio();

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  window.open(url, '_blank');

  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
