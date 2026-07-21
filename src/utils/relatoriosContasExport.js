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

export function metadadosExportacaoRelatorio(contexto = {}) {
  const resumo = contexto.resumoFinanceiro || {}
  return [
    ['Empresa', contexto.empresaNome || 'Empresa ativa'],
    ['Periodo', contexto.periodo || '-'],
    ['Base', contexto.base || 'Por vencimento'],
    ['Filial', contexto.filialNome || 'Todas'],
    ['Centro de custo', contexto.centroNome || 'Todos'],
    ['Status', contexto.status || 'Todos'],
    ['Gerado em', contexto.dataGeracao || new Date().toLocaleString('pt-BR')],
    ['Quantidade de registros', contexto.totalRegistros ?? 0],
    ['Total previsto', resumo.totalPrevisto ?? 0],
    ['Total pago', resumo.totalPagoPeriodo ?? resumo.totalPago ?? 0],
    ['Saldo em aberto', resumo.saldoEmAberto ?? 0]
  ]
}

export function exportarRelatorioContasCsv(linhas, contexto) {
  const cabecalho = [
    'Descricao',
    'Valor',
    'Data de referencia',
    'Status operacional',
    'Tipo de pagamento',
    'Centro de custo',
    'Filial/Unidade',
    'Observacao'
  ]

  const conteudo = [
    ...metadadosExportacaoRelatorio(contexto).map((linha) => linha.map(escaparCsv).join(';')),
    '',
    cabecalho.map(escaparCsv).join(';'),
    ...linhas.map((linha) => [
      linha.descricao,
      linha.valorFormatado,
      linha.dataReferenciaFormatada || linha.vencimentoFormatado,
      linha.statusOperacional,
      linha.tipoPagamento || '',
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
      <td>${escaparHtml(linha.dataReferenciaFormatada || linha.vencimentoFormatado)}</td>
      <td>${escaparHtml(linha.statusOperacional)}</td>
      <td>${escaparHtml(linha.tipoPagamento || '')}</td>
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
          <tbody>
            ${metadadosExportacaoRelatorio(contexto).map(([rotulo, valor]) => `
              <tr>
                <th>${escaparHtml(rotulo)}</th>
                <td>${escaparHtml(valor)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <br />
        <table>
          <thead>
            <tr>
              <th>Descricao</th>
              <th>Valor</th>
              <th>Data de referencia</th>
              <th>Status operacional</th>
              <th>Tipo de pagamento</th>
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

export function imprimirRelatorioContas({ linhas, grupos, contexto, resumo, modo = 'compacto' }) {
  const janela = window.open('', '_blank')
  if (!janela) return false
  const dataEmissao = new Date()
  const dataEmissaoFormatada = dataEmissao.toLocaleString('pt-BR')
  const modoCompacto = modo !== 'gerencial'

  const linhasCompactasHtml = linhas.map((linha) => `
    <tr>
      <td>
        <strong>${escaparHtml(linha.descricao)}</strong>
        ${linha.observacao ? `<small>Obs.: ${escaparHtml(linha.observacao)}</small>` : ''}
      </td>
      <td>${escaparHtml(linha.valorFormatado)}</td>
      <td>${escaparHtml(linha.dataReferenciaFormatada || linha.vencimentoFormatado)}</td>
      <td>${escaparHtml(`${linha.statusOperacional}${linha.tipoPagamento ? ` · ${linha.tipoPagamento}` : ''}`)}</td>
      <td>${escaparHtml(linha.centroNome)}</td>
      <td>${escaparHtml(linha.filialNome)}</td>
    </tr>
  `).join('')

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
            <th>Data de referencia</th>
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
              <td>${escaparHtml(linha.dataReferenciaFormatada || linha.vencimentoFormatado)}</td>
              <td>${escaparHtml(`${linha.statusOperacional}${linha.tipoPagamento ? ` · ${linha.tipoPagamento}` : ''}`)}</td>
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
          @page { size: A4 landscape; margin: ${modoCompacto ? '5mm' : '8mm'}; }
          body { font-family: Arial, sans-serif; color: #17212b; margin: 0; background: #ffffff; }
          .page { width: 100%; max-width: 100%; padding: ${modoCompacto ? '6px' : '14px'}; overflow: visible; }
          header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: ${modoCompacto ? '8px' : '14px'}; border-bottom: 1px solid #ccfbf1; margin-bottom: ${modoCompacto ? '4px' : '10px'}; padding-bottom: ${modoCompacto ? '4px' : '9px'}; }
          .brand { color: #0f766e; font-size: ${modoCompacto ? '7px' : '10px'}; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
          h1 { margin: 1px 0; font-size: ${modoCompacto ? '13px' : '21px'}; color: #0f172a; line-height: 1.05; }
          .subtitle { color: #586275; font-size: ${modoCompacto ? '8px' : '12px'}; font-weight: 700; line-height: 1.15; }
          p { margin: 2px 0; color: #4b5563; }
          .meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: ${modoCompacto ? '1px 8px' : '5px 14px'}; margin-top: ${modoCompacto ? '3px' : '10px'}; font-size: ${modoCompacto ? '7px' : '10px'}; line-height: 1.1; }
          .issued { color: #64748b; font-size: ${modoCompacto ? '7px' : '10px'}; text-align: right; line-height: 1.15; }
          .resumo { display: flex; gap: 0; margin: ${modoCompacto ? '3px 0 4px' : '12px 0'}; border: 1px solid #d8e3df; border-radius: ${modoCompacto ? '4px' : '8px'}; overflow: hidden; }
          .resumo div { flex: 1 1 0; padding: ${modoCompacto ? '2px 5px' : '7px 9px'}; font-size: ${modoCompacto ? '7px' : '10px'}; color: #475569; border-right: 1px solid #d8e3df; min-width: 0; white-space: nowrap; }
          .resumo div:last-child { border-right: 0; }
          .resumo strong { display: inline-block; margin-left: 4px; font-size: ${modoCompacto ? '8px' : '13px'}; color: #0f172a; }
          h2 { margin: ${modoCompacto ? '5px 0 2px' : '16px 0 7px'}; font-size: ${modoCompacto ? '9px' : '14px'}; line-height: 1.1; }
          h2 span { color: #64748b; font-size: ${modoCompacto ? '7px' : '10px'}; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: ${modoCompacto ? '7px' : '9px'}; line-height: ${modoCompacto ? '1.02' : '1.15'}; page-break-inside: auto; }
          th, td { border: 1px solid #d9e2df; padding: ${modoCompacto ? '1px 2px' : '5px 6px'}; text-align: left; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; }
          th { background: #eef8f5; color: #0f4f49; }
          td strong { display: block; font-size: ${modoCompacto ? '7px' : '9px'}; line-height: 1.02; }
          td small { display: block; margin-top: 1px; font-size: ${modoCompacto ? '6px' : '8px'}; line-height: 1; color: #475569; }
          .observacao-cell { font-size: ${modoCompacto ? '6px' : '8px'}; line-height: 1.02; color: #475569; }
          thead { display: table-header-group; }
          tr { page-break-inside: auto; page-break-after: auto; }
          footer { margin-top: ${modoCompacto ? '3px' : '12px'}; padding-top: ${modoCompacto ? '3px' : '7px'}; border-top: 1px solid #d9e2df; color: #64748b; font-size: ${modoCompacto ? '6px' : '9px'}; display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
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
          ${modoCompacto ? `
            <table>
              <colgroup>
                <col style="width: 34%" />
                <col style="width: 10%" />
                <col style="width: 10%" />
                <col style="width: 12%" />
                <col style="width: 17%" />
                <col style="width: 17%" />
              </colgroup>
              <thead>
                <tr>
                  <th>Descrição / observação</th>
                  <th>Valor</th>
                  <th>Data de referencia</th>
                  <th>Status</th>
                  <th>Centro</th>
                  <th>Filial/Unidade</th>
                </tr>
              </thead>
              <tbody>${linhasCompactasHtml}</tbody>
            </table>
          ` : gruposHtml}
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
