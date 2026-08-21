import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

const MOEDA_BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const DATA_HORA_PT_BR = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo'
})

export function paraCentavos(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? Math.round(numero * 100) : 0
}

export function deCentavos(centavos) {
  return Number((Number(centavos || 0) / 100).toFixed(2))
}

export function somarEmCentavos(linhas = [], campo) {
  return deCentavos(linhas.reduce((total, linha) => total + paraCentavos(linha?.[campo]), 0))
}

export function formatarMoedaExecutiva(valor) {
  return MOEDA_BRL.format(deCentavos(paraCentavos(valor)))
}

export function formatarDataExecutiva(valor) {
  const correspondencia = String(valor || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!correspondencia) return valor ? String(valor) : '-'
  return `${correspondencia[3]}/${correspondencia[2]}/${correspondencia[1]}`
}

export function formatarEmissaoExecutiva(valor = new Date()) {
  return DATA_HORA_PT_BR.format(valor)
}

export function normalizarTextoExecutivo(valor) {
  return String(valor ?? '')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\u00a0/g, ' ')
}

export function agruparResumoPorFilial(linhas = [], campos = []) {
  const grupos = new Map()
  linhas.forEach((linha) => {
    const filial = String(linha?.filial || 'Sem filial').trim() || 'Sem filial'
    if (!grupos.has(filial)) {
      grupos.set(filial, { filial, quantidade: 0, ...Object.fromEntries(campos.map((campo) => [campo, 0])) })
    }
    const grupo = grupos.get(filial)
    grupo.quantidade += 1
    campos.forEach((campo) => { grupo[campo] += paraCentavos(linha?.[campo]) })
  })
  return [...grupos.values()]
    .map((grupo) => ({
      ...grupo,
      ...Object.fromEntries(campos.map((campo) => [campo, deCentavos(grupo[campo])]))
    }))
    .sort((a, b) => a.filial.localeCompare(b.filial, 'pt-BR', { sensitivity: 'base' }))
}

function desenharCabecalho(doc, titulo, paginaInicial = false) {
  const largura = doc.internal.pageSize.getWidth()
  doc.setFillColor(15, 118, 110)
  doc.rect(0, 0, largura, paginaInicial ? 21 : 13, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(paginaInicial ? 9 : 7)
  doc.text('DNA Gestão', 10, paginaInicial ? 8 : 5.5)
  doc.setFontSize(paginaInicial ? 16 : 10)
  doc.text(normalizarTextoExecutivo(titulo), 10, paginaInicial ? 16 : 10)
}

function desenharRodape(doc, titulo, totalPaginasExpressao) {
  const largura = doc.internal.pageSize.getWidth()
  const altura = doc.internal.pageSize.getHeight()
  const pagina = doc.internal.getCurrentPageInfo().pageNumber
  doc.setDrawColor(226, 232, 240)
  doc.line(10, altura - 9, largura - 10, altura - 9)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text(`DNA Gestão - ${normalizarTextoExecutivo(titulo)}`, 10, altura - 5)
  doc.text(`Página ${pagina} de ${totalPaginasExpressao}`, largura - 10, altura - 5, { align: 'right' })
}

function desenharCards(doc, cards, inicioY) {
  const larguraUtil = doc.internal.pageSize.getWidth() - 20
  const colunas = Math.min(Math.max(cards.length, 1), 5)
  const espacamento = 3
  const larguraCard = (larguraUtil - ((colunas - 1) * espacamento)) / colunas
  cards.forEach((card, indice) => {
    const coluna = indice % colunas
    const linha = Math.floor(indice / colunas)
    const x = 10 + (coluna * (larguraCard + espacamento))
    const y = inicioY + (linha * 16)
    doc.setFillColor(card.destaque ? 236 : 248, card.destaque ? 253 : 250, card.destaque ? 245 : 252)
    doc.setDrawColor(153, 246, 228)
    doc.roundedRect(x, y, larguraCard, 13, 2, 2, 'FD')
    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.4)
    doc.text(normalizarTextoExecutivo(card.label).toUpperCase(), x + 3, y + 4.5)
    doc.setTextColor(15, 118, 110)
    doc.setFontSize(10)
    doc.text(normalizarTextoExecutivo(card.valor), x + 3, y + 10)
  })
  return inicioY + (Math.ceil(cards.length / colunas) * 16)
}

export function criarPdfExecutivo({
  titulo,
  emitidoEm,
  filtros = [],
  quantidade = 0,
  cards = [],
  resumoFiliais,
  analitico
} = {}) {
  if (!quantidade || !analitico?.linhas?.length) {
    throw new Error('Nenhum registro encontrado para os filtros selecionados.')
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })
  const totalPaginasExpressao = '{total_pages_count_string}'
  const largura = doc.internal.pageSize.getWidth()
  desenharCabecalho(doc, titulo, true)

  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.3)
  const filtrosNormalizados = filtros.map(normalizarTextoExecutivo)
  doc.text(filtrosNormalizados.slice(0, 2), 10, 27, { lineHeightFactor: 1.35, maxWidth: 132 })
  doc.text(filtrosNormalizados.slice(2), 148, 27, { lineHeightFactor: 1.35, maxWidth: 92 })
  doc.text(`Emitido em: ${emitidoEm}`, largura - 10, 27, { align: 'right' })
  doc.text(`Registros: ${quantidade}`, largura - 10, 31, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text('SEÇÃO 1 - SINTÉTICO', 10, 39)
  let proximoY = desenharCards(doc, cards, 43)

  autoTable(doc, {
    startY: proximoY + 1,
    margin: { left: 10, right: 10, bottom: 13 },
    head: [resumoFiliais.headers],
    body: resumoFiliais.linhas,
    foot: resumoFiliais.total ? [resumoFiliais.total] : undefined,
    showFoot: 'lastPage',
    theme: 'grid',
    rowPageBreak: 'avoid',
    styles: { font: 'helvetica', fontSize: 7, cellPadding: 1.7, overflow: 'linebreak', valign: 'middle', lineColor: [203, 213, 225], lineWidth: 0.15 },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [204, 251, 241], textColor: [15, 118, 110], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: resumoFiliais.columnStyles || {},
    didDrawPage: () => desenharRodape(doc, titulo, totalPaginasExpressao)
  })

  const altura = doc.internal.pageSize.getHeight()
  proximoY = doc.lastAutoTable.finalY + 10
  if (proximoY > altura - 30) {
    doc.addPage('a4', 'landscape')
    desenharCabecalho(doc, titulo)
    proximoY = 20
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text('SEÇÃO 2 - ANALÍTICO', 10, proximoY)

  autoTable(doc, {
    startY: proximoY + 4,
    margin: { left: 10, right: 10, top: 18, bottom: 13 },
    head: [analitico.headers],
    body: analitico.linhas,
    theme: 'grid',
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
    styles: { font: 'helvetica', fontSize: 6.5, cellPadding: 1.45, overflow: 'linebreak', valign: 'middle', lineColor: [203, 213, 225], lineWidth: 0.15, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', minCellHeight: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: analitico.columnStyles || {},
    didDrawPage: (dados) => {
      if (dados.pageNumber > 1 && doc.internal.getCurrentPageInfo().pageNumber > 1) desenharCabecalho(doc, titulo)
      desenharRodape(doc, titulo, totalPaginasExpressao)
    }
  })

  if (typeof doc.putTotalPages === 'function') doc.putTotalPages(totalPaginasExpressao)
  return doc
}
