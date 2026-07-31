function normalizarSlug(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function numeroSeguro(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

function textoSeguro(valor, fallback = '') {
  if (typeof valor === 'number' && !Number.isFinite(valor)) return fallback
  const texto = String(valor ?? '').trim()
  return texto || fallback
}

function moeda(valor) {
  return numeroSeguro(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
  return `"${textoSeguro(valor).replace(/"/g, '""')}"`
}

function escaparHtml(valor) {
  return textoSeguro(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function basePorPagamento(contexto = {}) {
  return normalizarSlug(contexto.base) === 'por-pagamento'
}

export function resolverTotalPagoExportacao(contexto = {}) {
  const resumo = contexto.resumoFinanceiro || {}
  return basePorPagamento(contexto)
    ? numeroSeguro(resumo.totalPagoPeriodo ?? resumo.totalPago)
    : numeroSeguro(resumo.totalPago ?? resumo.totalPagoPeriodo)
}

export function nomeArquivoRelatorioContas({ filialNome, extensao }) {
  const partes = ['analise-financeira']
  const filialSlug = normalizarSlug(filialNome)
  if (filialSlug && filialSlug !== 'todas') partes.push(filialSlug)
  return `${partes.join('-')}.${extensao}`
}

export function metadadosExportacaoRelatorio(contexto = {}) {
  const resumo = contexto.resumoFinanceiro || {}
  return [
    ['Empresa', textoSeguro(contexto.empresaNome, 'Empresa ativa')],
    ['Período', textoSeguro(contexto.periodo, '-')],
    ['Base', textoSeguro(contexto.base, 'Por vencimento')],
    ['Filial', textoSeguro(contexto.filialNome, 'Todas')],
    ['Centro de custo', textoSeguro(contexto.centroNome, 'Todos')],
    ['Status', textoSeguro(contexto.status, 'Todos')],
    ['Gerado em', textoSeguro(contexto.dataGeracao, new Date().toLocaleString('pt-BR'))],
    ['Quantidade de registros', numeroSeguro(contexto.totalRegistros)],
    ['Total previsto', numeroSeguro(resumo.totalPrevisto)],
    ['Total pago', resolverTotalPagoExportacao(contexto)],
    ['Saldo em aberto', numeroSeguro(resumo.saldoEmAberto)],
    ['Vencido', numeroSeguro(resumo.totalVencido)],
  ]
}

function normalizarLinha(linha = {}) {
  return {
    descricao: textoSeguro(linha.descricao, 'Conta sem descrição'),
    valorPrevisto: numeroSeguro(linha.valorPrevisto),
    valorPago: numeroSeguro(linha.valorPago),
    saldoRestante: Math.max(0, numeroSeguro(linha.saldoRestante)),
    valorMovimentoPeriodo: numeroSeguro(linha.valorMovimentoPeriodo),
    dataReferencia: textoSeguro(linha.dataReferenciaFormatada || linha.dataReferencia || linha.vencimentoFormatado, '-'),
    statusGerencial: textoSeguro(linha.statusGerencial, 'Em aberto'),
    tipoPagamento: textoSeguro(linha.tipoPagamento),
    centroNome: textoSeguro(linha.centroNome, 'Sem centro'),
    filialNome: textoSeguro(linha.filialNome, 'Sem filial'),
    observacao: textoSeguro(linha.observacao),
  }
}

const CABECALHO_EXPORTACAO_BASE = [
  'Descrição',
  'Previsto',
  'Pago',
  'Saldo',
  'Data de referência',
  'Status gerencial',
  'Tipo de pagamento',
  'Centro de custo',
  'Filial/Unidade',
  'Observação',
]

export function cabecalhoExportacaoAnaliseFinanceira(contexto = {}) {
  return basePorPagamento(contexto)
    ? [...CABECALHO_EXPORTACAO_BASE.slice(0, 4), 'Movimento no período', ...CABECALHO_EXPORTACAO_BASE.slice(4)]
    : [...CABECALHO_EXPORTACAO_BASE]
}

function valoresLinhaExportacao(linha, contexto = {}) {
  const valores = [linha.descricao, moeda(linha.valorPrevisto), moeda(linha.valorPago), moeda(linha.saldoRestante)]
  if (basePorPagamento(contexto)) valores.push(moeda(linha.valorMovimentoPeriodo))
  return [...valores, linha.dataReferencia, linha.statusGerencial, linha.tipoPagamento, linha.centroNome, linha.filialNome, linha.observacao]
}

export function gerarConteudoCsvAnaliseFinanceira(linhas = [], contexto = {}) {
  const registros = linhas.map(normalizarLinha)
  return [
    ...metadadosExportacaoRelatorio(contexto).map((linha) => linha.map(escaparCsv).join(';')),
    '',
    cabecalhoExportacaoAnaliseFinanceira(contexto).map(escaparCsv).join(';'),
    ...registros.map((linha) => valoresLinhaExportacao(linha, contexto).map(escaparCsv).join(';')),
  ].join('\n')
}

export function exportarRelatorioContasCsv(linhas, contexto) {
  baixarArquivo(
    `\uFEFF${gerarConteudoCsvAnaliseFinanceira(linhas, contexto)}`,
    nomeArquivoRelatorioContas({ ...contexto, extensao: 'csv' }),
    'text/csv;charset=utf-8;',
  )
}

function celulasLinhaHtml(linha, contexto = {}) {
  return valoresLinhaExportacao(linha, contexto).map((valor) => `<td>${escaparHtml(valor)}</td>`).join('')
}

export function gerarHtmlExcelAnaliseFinanceira(linhas = [], contexto = {}) {
  const registros = linhas.map(normalizarLinha)
  return `<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="generator" content="DNA Gestão — HTML compatível com Microsoft Excel (.xls)" />
        <title>Análise Financeira — HTML compatível com Excel</title>
      </head>
      <body>
        <table><tbody>${metadadosExportacaoRelatorio(contexto).map(([rotulo, valor]) => `<tr><th>${escaparHtml(rotulo)}</th><td>${escaparHtml(valor)}</td></tr>`).join('')}</tbody></table>
        <br />
        <table>
          <thead><tr>${cabecalhoExportacaoAnaliseFinanceira(contexto).map((titulo) => `<th>${escaparHtml(titulo)}</th>`).join('')}</tr></thead>
          <tbody>${registros.map((linha) => `<tr>${celulasLinhaHtml(linha, contexto)}</tr>`).join('')}</tbody>
        </table>
      </body>
    </html>`
}

export function exportarRelatorioContasExcel(linhas, contexto) {
  baixarArquivo(
    gerarHtmlExcelAnaliseFinanceira(linhas, contexto),
    nomeArquivoRelatorioContas({ ...contexto, extensao: 'xls' }),
    'application/vnd.ms-excel;charset=utf-8;',
  )
}

function humanizarGrupo(titulo) {
  const chave = normalizarSlug(titulo)
  if (chave.startsWith('vencid')) return 'Vencidas'
  if (chave.startsWith('pag') || chave.startsWith('quitad')) return 'Pagas'
  if (chave.startsWith('futur') || chave.includes('a-vencer')) return 'A vencer'
  if (chave.startsWith('abert') || chave.startsWith('parcial')) return 'Em aberto'
  return textoSeguro(titulo, 'Detalhamento')
}

function cabecalhoTabelaHtml() {
  return '<tr><th>Descrição</th><th>Previsto</th><th>Pago</th><th>Saldo</th><th>Data de referência</th><th>Status</th><th>Centro / Filial</th><th>Observação</th></tr>'
}

function linhaTabelaHtml(linha) {
  return `<tr>
    <td><strong>${escaparHtml(linha.descricao)}</strong></td>
    <td>${escaparHtml(moeda(linha.valorPrevisto))}</td>
    <td>${escaparHtml(moeda(linha.valorPago))}</td>
    <td>${escaparHtml(moeda(linha.saldoRestante))}</td>
    <td>${escaparHtml(linha.dataReferencia)}</td>
    <td>${escaparHtml(linha.statusGerencial)}</td>
    <td>${escaparHtml(`${linha.centroNome} · ${linha.filialNome}`)}</td>
    <td>${escaparHtml(linha.observacao)}</td>
  </tr>`
}

export function gerarHtmlImpressaoAnaliseFinanceira({ linhas = [], grupos = [], contexto = {}, resumo = {}, modo = 'compacto' } = {}) {
  const registros = linhas.map(normalizarLinha)
  const modoCompacto = modo !== 'gerencial'
  const gruposNormalizados = (grupos.length ? grupos : [{ titulo: 'Detalhamento', linhas }]).map((grupo) => ({
    titulo: humanizarGrupo(grupo?.titulo),
    linhas: Array.isArray(grupo?.linhas) ? grupo.linhas.map(normalizarLinha) : [],
  }))
  const quantidade = numeroSeguro(resumo.quantidade ?? resumo.totalContas ?? registros.length)
  const previsto = numeroSeguro(resumo.previsto ?? resumo.totalPrevisto)
  const pago = numeroSeguro(resumo.pago ?? resumo.totalPago)
  const saldo = numeroSeguro(resumo.saldo ?? resumo.saldoEmAberto)
  const vencido = numeroSeguro(resumo.vencido ?? resumo.totalVencido)
  const tabelaCompacta = `<table><thead>${cabecalhoTabelaHtml()}</thead><tbody>${registros.map(linhaTabelaHtml).join('')}</tbody></table>`
  const tabelasGerenciais = gruposNormalizados.map((grupo) => `<section><h2>${escaparHtml(grupo.titulo)} <span>${grupo.linhas.length} conta(s)</span></h2><table><thead>${cabecalhoTabelaHtml()}</thead><tbody>${grupo.linhas.map(linhaTabelaHtml).join('')}</tbody></table></section>`).join('')

  return `<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Análise Financeira</title>
        <style>
          *{box-sizing:border-box}@page{size:A4 landscape;margin:${modoCompacto ? '5mm' : '8mm'}}body{font-family:Arial,sans-serif;color:#17212b;margin:0;background:#fff}.page{width:100%;max-width:100%;padding:${modoCompacto ? '6px' : '14px'}}header{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;border-bottom:2px solid #99f6e4;padding-bottom:8px;margin-bottom:8px}.brand{color:#0f766e;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}h1{margin:2px 0;font-size:${modoCompacto ? '16px' : '22px'}}.subtitle,.issued{color:#64748b;font-size:9px}.issued{text-align:right}.meta{display:flex;flex-wrap:wrap;gap:5px 14px;margin-top:6px;font-size:8px}.resumo{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));border:1px solid #d8e3df;border-radius:7px;overflow:hidden;margin:8px 0}.resumo div{padding:6px;border-right:1px solid #d8e3df;font-size:8px}.resumo div:last-child{border:0}.resumo strong{display:block;margin-top:2px;font-size:11px}h2{font-size:12px;margin:12px 0 4px}h2 span{color:#64748b;font-size:8px}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:${modoCompacto ? '7px' : '8px'}}th,td{border:1px solid #d9e2df;padding:${modoCompacto ? '2px' : '4px'};text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#eef8f5;color:#0f4f49}thead{display:table-header-group}tr{break-inside:avoid}footer{margin-top:8px;padding-top:6px;border-top:1px solid #d9e2df;color:#64748b;font-size:7px}@media print{.page{padding:0}}
        </style>
      </head>
      <body><div class="page">
        <header><div><div class="brand">DNA Gestão</div><h1>Análise Financeira</h1><div class="subtitle">Painel gerencial de contas, despesas e obrigações.</div><div class="meta"><span><strong>Empresa:</strong> ${escaparHtml(textoSeguro(contexto.empresaNome, 'Empresa ativa'))}</span><span><strong>Período:</strong> ${escaparHtml(textoSeguro(contexto.periodo, '-'))}</span><span><strong>Base:</strong> ${escaparHtml(textoSeguro(contexto.base, 'Por vencimento'))}</span><span><strong>Filial:</strong> ${escaparHtml(textoSeguro(contexto.filialNome, 'Todas'))}</span><span><strong>Centro:</strong> ${escaparHtml(textoSeguro(contexto.centroNome, 'Todos'))}</span></div></div><div class="issued">Emitido em ${escaparHtml(textoSeguro(contexto.dataGeracao, new Date().toLocaleString('pt-BR')))}</div></header>
        <div class="resumo"><div>Quantidade<strong>${quantidade}</strong></div><div>Previsto<strong>${escaparHtml(moeda(previsto))}</strong></div><div>Pago<strong>${escaparHtml(moeda(pago))}</strong></div><div>Saldo em aberto<strong>${escaparHtml(moeda(saldo))}</strong></div><div>Vencido<strong>${escaparHtml(moeda(vencido))}</strong></div></div>
        ${modoCompacto ? tabelaCompacta : tabelasGerenciais}
        <footer>DNA Gestão · Documento para conferência interna.</footer>
      </div></body>
    </html>`
}

export function imprimirRelatorioContas(opcoes) {
  const janela = window.open('', '_blank')
  if (!janela) return false
  janela.document.write(gerarHtmlImpressaoAnaliseFinanceira(opcoes))
  janela.document.close()
  janela.focus()
  janela.print()
  return true
}
