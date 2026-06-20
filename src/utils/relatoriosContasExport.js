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
  const tipoSlug = normalizarSlug(tipoRelatorio)
    .replace(/^relatorio-de-contas-/, '')
    .replace(/^relatorio-/, '')
  const partes = ['relatorio-contas', tipoSlug]
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
  const dataEmissao = new Date()
  const dataEmissaoFormatada = dataEmissao.toLocaleString('pt-BR')

  const gruposHtml = grupos.map((grupo) => `
    <section>
      <h2>${escaparHtml(grupo.titulo)} <span>${grupo.linhas.length} conta(s)</span></h2>
      <table>
        <colgroup>
          <col style="width: 24%" />
          <col style="width: 10%" />
          <col style="width: 10%" />
          <col style="width: 13%" />
          <col style="width: 14%" />
          <col style="width: 13%" />
          <col style="width: 16%" />
        </colgroup>
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Status operacional</th>
            <th>Centro de custo</th>
            <th>Filial/Unidade</th>
            <th>Observação</th>
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
              <td class="observacao-cell">${escaparHtml(linha.observacao)}</td>
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
          * { box-sizing: border-box; }
          @page { size: A4 landscape; margin: 6mm; }
          body { font-family: Arial, sans-serif; color: #17212b; margin: 0; background: #ffffff; }
          .page { width: 100%; max-width: 100%; padding: 9px; overflow: visible; }
          header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; border-bottom: 1px solid #ccfbf1; margin-bottom: 5px; padding-bottom: 5px; }
          .brand { color: #0f766e; font-size: 8px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
          h1 { margin: 1px 0 1px; font-size: 16px; color: #0f172a; line-height: 1.05; }
          .subtitle { color: #586275; font-size: 9px; font-weight: 700; line-height: 1.15; }
          p { margin: 2px 0; color: #4b5563; }
          .meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px 10px; margin-top: 5px; font-size: 8px; line-height: 1.12; }
          .issued { color: #64748b; font-size: 9px; text-align: right; line-height: 1.2; }
          .resumo { display: flex; gap: 0; margin: 5px 0 6px; border: 1px solid #d8e3df; border-radius: 6px; overflow: hidden; }
          .resumo div { flex: 1 1 0; padding: 3px 6px; font-size: 8px; color: #475569; border-right: 1px solid #d8e3df; min-width: 0; white-space: nowrap; }
          .resumo div:last-child { border-right: 0; }
          .resumo strong { display: inline-block; margin-left: 4px; font-size: 10px; color: #0f172a; }
          h2 { margin: 7px 0 3px; font-size: 10px; line-height: 1.1; }
          h2 span { color: #64748b; font-size: 8px; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 7.6px; line-height: 1.05; page-break-inside: auto; }
          th, td { border: 1px solid #d9e2df; padding: 2px 3px; text-align: left; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; }
          th { background: #eef8f5; color: #0f4f49; }
          .observacao-cell { font-size: 7px; line-height: 1.02; color: #475569; }
          thead { display: table-header-group; }
          tr { page-break-inside: auto; page-break-after: auto; }
          footer { margin-top: 5px; padding-top: 4px; border-top: 1px solid #d9e2df; color: #64748b; font-size: 7px; display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
          @media print { .page { padding: 0; } }
          @media (max-width: 760px) {
            .page { padding: 16px; }
            header { grid-template-columns: 1fr; }
            .issued { text-align: left; }
            .meta, .resumo { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <header>
            <div>
              <div class="brand">DNA Gestão</div>
              <h1>Relatório de Contas</h1>
              <div class="subtitle">Documento gerencial para conferência de contas por tipo, período, centro e unidade.</div>
              <div class="meta">
                <span><strong>Tipo:</strong> ${escaparHtml(contexto.tipoRelatorio)}</span>
                <span><strong>Filial/Unidade:</strong> ${escaparHtml(contexto.filialNome)}</span>
                <span><strong>Centro de custo:</strong> ${escaparHtml(contexto.centroNome)}</span>
                <span><strong>Período:</strong> ${escaparHtml(contexto.periodo)}</span>
                <span><strong>Total de contas:</strong> ${linhas.length}</span>
                <span><strong>Valor total:</strong> ${escaparHtml(resumo.valorTotalFormatado)}</span>
              </div>
            </div>
            <div class="issued">Emitido em ${escaparHtml(dataEmissaoFormatada)}</div>
          </header>
          <div class="resumo">
            <div>Total de contas<strong>${resumo.totalContas}</strong></div>
            <div>Valor total<strong>${escaparHtml(resumo.valorTotalFormatado)}</strong></div>
            <div>Vencidas<strong>${resumo.quantidadeVencidas}</strong></div>
            <div>A vencer<strong>${resumo.quantidadeAVencer}</strong></div>
          </div>
          ${gruposHtml}
          <footer>
            <span>DNA Gestão • Documento para conferência interna.</span>
            <span>Emitido em ${escaparHtml(dataEmissaoFormatada)}</span>
          </footer>
        </div>
      </body>
    </html>
  `)
  janela.document.close()
  janela.focus()
  janela.print()
  return true
}
