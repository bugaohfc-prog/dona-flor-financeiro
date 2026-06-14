function normalizarSlug(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function baixarArquivo(conteudo, nomeArquivo, tipo) {
  const blob = new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escaparCsv(valor) {
  const texto = String(valor ?? '')
  return `"${texto.replace(/"/g, '""')}"`
}

function escaparHtml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function nomeArquivoRelatorioContas({ tipoRelatorio, filialNome, extensao }) {
  const partes = ['relatorio-contas', normalizarSlug(tipoRelatorio)]
  const filialSlug = normalizarSlug(filialNome)
  if (filialSlug && filialSlug !== 'todas') partes.push(filialSlug)
  return `${partes.filter(Boolean).join('-')}.${extensao}`
}

export function exportarRelatorioContasCsv(linhas, contexto) {
  const cabecalho = [
    'Descricao',
    'Valor',
    'Vencimento',
    'Status operacional',
    'Centro de custo',
    'Filial/Unidade',
    'Observacao'
  ]

  const conteudo = [
    cabecalho.map(escaparCsv).join(';'),
    ...linhas.map((linha) => [
      linha.descricao,
      linha.valorFormatado,
      linha.vencimentoFormatado,
      linha.statusOperacional,
      linha.centroNome,
      linha.filialNome,
      linha.observacao
    ].map(escaparCsv).join(';'))
  ].join('\n')

  baixarArquivo(
    `\uFEFF${conteudo}`,
    nomeArquivoRelatorioContas({ ...contexto, extensao: 'csv' }),
    'text/csv;charset=utf-8;'
  )
}

export function exportarRelatorioContasExcel(linhas, contexto) {
  const linhasHtml = linhas.map((linha) => `
    <tr>
      <td>${escaparHtml(linha.descricao)}</td>
      <td>${escaparHtml(linha.valorFormatado)}</td>
      <td>${escaparHtml(linha.vencimentoFormatado)}</td>
      <td>${escaparHtml(linha.statusOperacional)}</td>
      <td>${escaparHtml(linha.centroNome)}</td>
      <td>${escaparHtml(linha.filialNome)}</td>
      <td>${escaparHtml(linha.observacao)}</td>
    </tr>
  `).join('')

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Descricao</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status operacional</th>
              <th>Centro de custo</th>
              <th>Filial/Unidade</th>
              <th>Observacao</th>
            </tr>
          </thead>
          <tbody>${linhasHtml}</tbody>
        </table>
      </body>
    </html>
  `

  baixarArquivo(
    html,
    nomeArquivoRelatorioContas({ ...contexto, extensao: 'xls' }),
    'application/vnd.ms-excel;charset=utf-8;'
  )
}

export function imprimirRelatorioContas({ linhas, grupos, contexto, resumo }) {
  const janela = window.open('', '_blank')
  if (!janela) return false

  const gruposHtml = grupos.map((grupo) => `
    <section>
      <h2>${escaparHtml(grupo.titulo)} <span>${grupo.linhas.length} conta(s)</span></h2>
      <table>
        <thead>
          <tr>
            <th>Descricao</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Status operacional</th>
            <th>Centro de custo</th>
            <th>Filial/Unidade</th>
            <th>Observacao</th>
          </tr>
        </thead>
        <tbody>
          ${grupo.linhas.map((linha) => `
            <tr>
              <td>${escaparHtml(linha.descricao)}</td>
              <td>${escaparHtml(linha.valorFormatado)}</td>
              <td>${escaparHtml(linha.vencimentoFormatado)}</td>
              <td>${escaparHtml(linha.statusOperacional)}</td>
              <td>${escaparHtml(linha.centroNome)}</td>
              <td>${escaparHtml(linha.filialNome)}</td>
              <td>${escaparHtml(linha.observacao)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
  `).join('')

  janela.document.write(`
    <html>
      <head>
        <title>Relatorio de Contas</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; color: #17212b; margin: 28px; }
          header { border-bottom: 2px solid #0f766e; margin-bottom: 20px; padding-bottom: 12px; }
          h1 { margin: 0 0 6px; font-size: 24px; }
          p { margin: 4px 0; color: #4b5563; }
          .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 18px; margin-top: 14px; font-size: 12px; }
          .resumo { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 18px 0; }
          .resumo div { border: 1px solid #d8e3df; border-radius: 10px; padding: 10px; }
          .resumo strong { display: block; font-size: 16px; margin-top: 4px; }
          h2 { margin: 22px 0 8px; font-size: 16px; }
          h2 span { color: #64748b; font-size: 12px; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; page-break-inside: auto; }
          th, td { border: 1px solid #d9e2df; padding: 7px; text-align: left; vertical-align: top; }
          th { background: #eef8f5; color: #0f4f49; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          @media print { body { margin: 12mm; } }
        </style>
      </head>
      <body>
        <header>
          <h1>Relatório de Contas</h1>
          <p>Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
          <div class="meta">
            <span><strong>Tipo:</strong> ${escaparHtml(contexto.tipoRelatorio)}</span>
            <span><strong>Filial/Unidade:</strong> ${escaparHtml(contexto.filialNome)}</span>
            <span><strong>Centro de custo:</strong> ${escaparHtml(contexto.centroNome)}</span>
            <span><strong>Período:</strong> ${escaparHtml(contexto.periodo)}</span>
            <span><strong>Total de contas:</strong> ${linhas.length}</span>
            <span><strong>Valor total:</strong> ${escaparHtml(resumo.valorTotalFormatado)}</span>
          </div>
        </header>
        <div class="resumo">
          <div>Total de contas<strong>${resumo.totalContas}</strong></div>
          <div>Valor total<strong>${escaparHtml(resumo.valorTotalFormatado)}</strong></div>
          <div>Vencidas<strong>${resumo.quantidadeVencidas}</strong></div>
          <div>A vencer<strong>${resumo.quantidadeAVencer}</strong></div>
        </div>
        ${gruposHtml}
      </body>
    </html>
  `)
  janela.document.close()
  janela.focus()
  janela.print()
  return true
}
