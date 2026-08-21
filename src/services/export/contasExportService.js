import { calcularVerdadeFinanceiraConta } from '../../utils/relatoriosFinanceiros.js'
import { downloadBlob, exportCsv } from './reportExportService.js'
import {
  agruparResumoPorFilial,
  criarPdfExecutivo,
  formatarDataExecutiva,
  formatarEmissaoExecutiva,
  formatarMoedaExecutiva,
  normalizarTextoExecutivo,
  somarEmCentavos
} from './executiveReportService.js'

export const CONTAS_HEADERS = [
  'Vencimento', 'Descrição', 'Filial', 'Centro de Custo', 'Valor', 'Pago', 'Saldo', 'Status', 'Origem'
]

function hojeCivil(data = new Date()) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function statusHumano(verdade) {
  const rotulos = {
    paga: 'Pago',
    quitada_por_parciais: 'Quitada por parciais - baixa pendente',
    vencida: verdade.parcialmentePago ? 'Vencida - parcialmente paga' : 'Vencida',
    parcial: 'Parcialmente paga',
    futura: 'A vencer',
    aberta: 'Vencendo hoje'
  }
  return rotulos[verdade.statusFinanceiro] || 'Não informado'
}

function descreverFiltros(filtros = {}) {
  const periodo = filtros.dataInicial || filtros.dataFinal
    ? `Período (Vencimento): ${formatarDataExecutiva(filtros.dataInicial)} a ${formatarDataExecutiva(filtros.dataFinal)}`
    : `Período (Vencimento): ${filtros.horizonteLabel || 'Todos'}`
  const partes = [
    periodo,
    `Filial: ${filtros.filialNome || 'Todas as filiais'}`,
    `Situação: ${filtros.statusLabel || 'Todas'}`,
    `Centro de Custo: ${filtros.centroNome || 'Todos'}`
  ]
  if (filtros.mesLabel) partes.push(`Mês: ${filtros.mesLabel}`)
  if (String(filtros.busca || '').trim()) partes.push(`Busca: ${String(filtros.busca).trim()}`)
  return partes
}

function normalizarConta(conta, hoje) {
  const verdade = calcularVerdadeFinanceiraConta(conta, undefined, hoje)
  return {
    id: conta.id,
    vencimento: String(conta.data_vencimento || '').slice(0, 10),
    descricao: conta.descricao || 'Conta sem descrição',
    filial: conta.df_filiais?.nome || 'Sem filial',
    centroCusto: conta.df_centros_custo?.nome || 'Sem centro',
    valor: verdade.valorPrevisto,
    pago: verdade.valorPagoAtual,
    saldo: verdade.saldoRestante,
    saldoVencido: verdade.vencida ? verdade.saldoRestante : 0,
    status: verdade.statusFinanceiro,
    statusHumano: statusHumano(verdade),
    origem: conta.recorrencia_id ? 'Recorrente' : 'Manual'
  }
}

export function criarModeloExportacaoContas({ registros = [], filtros = {}, emitidoEm = new Date(), hoje } = {}) {
  const dataCivil = hoje || hojeCivil(emitidoEm)
  const linhas = (Array.isArray(registros) ? registros : []).map((conta) => normalizarConta(conta, dataCivil))
  const quantidades = linhas.reduce((total, linha) => {
    if (linha.status === 'vencida') total.vencidas += 1
    else if (linha.status !== 'paga' && linha.status !== 'quitada_por_parciais' && linha.vencimento === dataCivil) total.vencendoHoje += 1
    else if (linha.status === 'futura' || (linha.status === 'parcial' && linha.vencimento > dataCivil)) total.aVencer += 1
    return total
  }, { vencidas: 0, vencendoHoje: 0, aVencer: 0 })

  return {
    titulo: 'Contas a Pagar',
    linhas,
    filtros: descreverFiltros(filtros),
    emitidoEm: formatarEmissaoExecutiva(emitidoEm),
    hoje: dataCivil,
    totais: {
      quantidade: linhas.length,
      total: somarEmCentavos(linhas, 'valor'),
      pago: somarEmCentavos(linhas, 'pago'),
      saldo: somarEmCentavos(linhas, 'saldo'),
      saldoVencido: somarEmCentavos(linhas, 'saldoVencido'),
      ...quantidades
    },
    resumoFiliais: agruparResumoPorFilial(linhas, ['valor', 'pago', 'saldo', 'saldoVencido'])
  }
}

export function criarNomeArquivoContas({ dataInicial, dataFinal, extensao }) {
  const inicio = String(dataInicial || '').replace(/[^0-9-]/g, '')
  const fim = String(dataFinal || '').replace(/[^0-9-]/g, '')
  const intervalo = inicio && fim && inicio !== fim ? `${inicio}-a-${fim}` : (inicio || fim || 'resultado-filtrado')
  return `contas-a-pagar-${intervalo}.${extensao}`
}

export function criarDadosCsvContas(modelo) {
  return {
    headers: CONTAS_HEADERS,
    rows: (modelo?.linhas || []).map((linha) => [
      linha.vencimento, linha.descricao, linha.filial, linha.centroCusto,
      linha.valor, linha.pago, linha.saldo, linha.status, linha.origem
    ])
  }
}

export function criarLinhasPdfContas(modelo) {
  return (modelo?.linhas || []).map((linha) => [
    formatarDataExecutiva(linha.vencimento),
    normalizarTextoExecutivo(linha.descricao),
    normalizarTextoExecutivo(linha.filial),
    normalizarTextoExecutivo(linha.centroCusto),
    formatarMoedaExecutiva(linha.valor),
    formatarMoedaExecutiva(linha.pago),
    formatarMoedaExecutiva(linha.saldo),
    normalizarTextoExecutivo(linha.statusHumano),
    linha.origem
  ])
}

export function exportarContasCsv({ modelo, filename }) {
  if (!modelo?.linhas?.length) throw new Error('Nenhuma conta encontrada para os filtros selecionados.')
  exportCsv({ filename, ...criarDadosCsvContas(modelo) })
}

export function criarPdfContas(modelo) {
  return criarPdfExecutivo({
    titulo: modelo?.titulo,
    emitidoEm: modelo?.emitidoEm,
    filtros: modelo?.filtros,
    quantidade: modelo?.linhas?.length,
    cards: [
      { label: 'Total das Contas', valor: formatarMoedaExecutiva(modelo?.totais?.total) },
      { label: 'Total Pago', valor: formatarMoedaExecutiva(modelo?.totais?.pago) },
      { label: 'Saldo em Aberto', valor: formatarMoedaExecutiva(modelo?.totais?.saldo), destaque: true },
      { label: 'Quantidade', valor: String(modelo?.totais?.quantidade || 0) },
      { label: 'Vencidas / Hoje / A vencer', valor: `${modelo?.totais?.vencidas || 0} / ${modelo?.totais?.vencendoHoje || 0} / ${modelo?.totais?.aVencer || 0}` }
    ],
    resumoFiliais: {
      headers: ['Filial', 'Quantidade', 'Total', 'Pago', 'Saldo', 'Saldo Vencido'],
      linhas: (modelo?.resumoFiliais || []).map((linha) => [
        normalizarTextoExecutivo(linha.filial), linha.quantidade, formatarMoedaExecutiva(linha.valor),
        formatarMoedaExecutiva(linha.pago), formatarMoedaExecutiva(linha.saldo), formatarMoedaExecutiva(linha.saldoVencido)
      ]),
      total: ['TOTAL GERAL', modelo?.totais?.quantidade || 0, formatarMoedaExecutiva(modelo?.totais?.total), formatarMoedaExecutiva(modelo?.totais?.pago), formatarMoedaExecutiva(modelo?.totais?.saldo), formatarMoedaExecutiva(modelo?.totais?.saldoVencido)],
      columnStyles: { 0: { cellWidth: 72 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } }
    },
    analitico: {
      headers: CONTAS_HEADERS,
      linhas: criarLinhasPdfContas(modelo),
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' }, 1: { cellWidth: 57 }, 2: { cellWidth: 37 }, 3: { cellWidth: 42 },
        4: { cellWidth: 24, halign: 'right' }, 5: { cellWidth: 24, halign: 'right' }, 6: { cellWidth: 24, halign: 'right' },
        7: { cellWidth: 32 }, 8: { cellWidth: 17, halign: 'center' }
      }
    }
  })
}

export function exportarContasPdf({ modelo, filename }) {
  downloadBlob(filename, criarPdfContas(modelo).output('blob'))
}
