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

export const CONTROLE_IMPOSTOS_HEADERS = [
  'Imposto', 'Descrição', 'Competência', 'Vencimento', 'Previsto', 'Pago', 'Saldo', 'Status', 'Filial', 'Centro de Custo'
]

const TIPOS_FISCAIS = Object.freeze({
  simples_nacional: 'Simples Nacional',
  fgts: 'FGTS',
  inss: 'INSS',
  outro: 'Outro imposto'
})

export const formatarDataExportacao = formatarDataExecutiva
export const formatarMoedaExportacao = formatarMoedaExecutiva

export function obterStatusHumanoImposto(conta = {}) {
  if (conta.statusOperacional === 'pago') {
    return conta.status_relatorio === 'quitada_por_parciais' ? 'Quitada por parciais - baixa pendente' : 'Pago'
  }
  if (conta.statusOperacional === 'vencido') return conta.parcialmente_pago ? 'Vencido - parcialmente pago' : 'Vencido'
  if (conta.statusOperacional === 'parcial') return 'Parcialmente pago'
  if (conta.statusOperacional === 'aberto') return 'A vencer'
  return String(conta.status_relatorio || conta.status || 'Não informado')
}

function descricaoFiltro(filtros = {}) {
  const partes = [
    `Período (${filtros.campoPeriodoLabel || 'Vencimento'}): ${formatarDataExecutiva(filtros.dataInicial)} a ${formatarDataExecutiva(filtros.dataFinal)}`,
    `Filial: ${filtros.filialNome || 'Todas as filiais'}`,
    `Situação/classificação: ${filtros.filtroLabel || 'Todos'}`
  ]
  if (String(filtros.busca || '').trim()) partes.push(`Busca: ${String(filtros.busca).trim()}`)
  if (filtros.incluirOcultas) partes.push('Inclui contas ocultas')
  return partes
}

function normalizarImposto(conta = {}) {
  const tipoFiscal = String(conta.imposto_tipo || '').trim()
  const imposto = TIPOS_FISCAIS[tipoFiscal]
  if (!imposto) throw new Error('Há obrigação fiscal sem classificação estruturada em imposto_tipo.')
  return {
    id: conta.id,
    imposto,
    descricao: conta.descricao || 'Conta sem descrição',
    competencia: conta.competenciaFiscal || 'Sem competência',
    vencimento: conta.data_vencimento || conta.vencimento || '',
    previsto: Number(conta.valor_previsto_relatorio || 0),
    pago: Number(conta.valor_pago_atual_relatorio || 0),
    saldo: Number(conta.saldo_restante_relatorio || 0),
    statusRelatorio: conta.status_relatorio || conta.status || '',
    statusHumano: obterStatusHumanoImposto(conta),
    filial: conta.filialNome || 'Sem filial',
    centroCusto: conta.centroNome || 'Sem centro'
  }
}

export function criarModeloExportacaoControleImpostos({ registros = [], filtros = {}, emitidoEm = new Date() } = {}) {
  const linhas = (Array.isArray(registros) ? registros : []).map(normalizarImposto)
  return {
    titulo: 'Controle de Impostos',
    linhas,
    filtros: descricaoFiltro(filtros),
    emitidoEm: formatarEmissaoExecutiva(emitidoEm),
    totais: {
      quantidade: linhas.length,
      previsto: somarEmCentavos(linhas, 'previsto'),
      pago: somarEmCentavos(linhas, 'pago'),
      saldo: somarEmCentavos(linhas, 'saldo')
    },
    resumoFiliais: agruparResumoPorFilial(linhas, ['previsto', 'pago', 'saldo'])
  }
}

export function criarNomeArquivoControleImpostos({ dataInicial, dataFinal, extensao }) {
  const inicio = String(dataInicial || '').replace(/[^0-9-]/g, '')
  const fim = String(dataFinal || '').replace(/[^0-9-]/g, '')
  const intervalo = inicio && fim && inicio !== fim ? `${inicio}-a-${fim}` : (inicio || fim || 'periodo')
  return `controle-impostos-${intervalo}.${extensao}`
}

export function criarDadosCsvControleImpostos(modelo) {
  return {
    headers: CONTROLE_IMPOSTOS_HEADERS,
    rows: (modelo?.linhas || []).map((linha) => [
      linha.imposto, linha.descricao, linha.competencia, linha.vencimento, linha.previsto,
      linha.pago, linha.saldo, linha.statusRelatorio, linha.filial, linha.centroCusto
    ])
  }
}

export function criarLinhasPdfControleImpostos(modelo) {
  return (modelo?.linhas || []).map((linha) => [
    normalizarTextoExecutivo(linha.imposto),
    normalizarTextoExecutivo(linha.descricao),
    normalizarTextoExecutivo(linha.competencia),
    formatarDataExecutiva(linha.vencimento),
    formatarMoedaExecutiva(linha.previsto),
    formatarMoedaExecutiva(linha.pago),
    formatarMoedaExecutiva(linha.saldo),
    normalizarTextoExecutivo(linha.statusHumano),
    normalizarTextoExecutivo(linha.filial),
    normalizarTextoExecutivo(linha.centroCusto)
  ])
}

export function exportarControleImpostosCsv({ modelo, filename }) {
  if (!modelo?.linhas?.length) throw new Error('Nenhum imposto encontrado para os filtros selecionados.')
  exportCsv({ filename, ...criarDadosCsvControleImpostos(modelo) })
}

export function criarPdfControleImpostos(modelo) {
  if (!modelo?.linhas?.length) throw new Error('Nenhum imposto encontrado para os filtros selecionados.')
  return criarPdfExecutivo({
    titulo: modelo?.titulo,
    emitidoEm: modelo?.emitidoEm,
    filtros: modelo?.filtros,
    quantidade: modelo?.linhas?.length,
    cards: [
      { label: 'Total Previsto', valor: formatarMoedaExecutiva(modelo?.totais?.previsto) },
      { label: 'Total Pago', valor: formatarMoedaExecutiva(modelo?.totais?.pago) },
      { label: 'Saldo em Aberto', valor: formatarMoedaExecutiva(modelo?.totais?.saldo), destaque: true },
      { label: 'Obrigações', valor: String(modelo?.totais?.quantidade || 0) }
    ],
    resumoFiliais: {
      headers: ['Filial', 'Quantidade', 'Previsto', 'Pago', 'Saldo'],
      linhas: (modelo?.resumoFiliais || []).map((linha) => [
        normalizarTextoExecutivo(linha.filial), linha.quantidade,
        formatarMoedaExecutiva(linha.previsto), formatarMoedaExecutiva(linha.pago), formatarMoedaExecutiva(linha.saldo)
      ]),
      total: ['TOTAL GERAL', modelo?.totais?.quantidade || 0, formatarMoedaExecutiva(modelo?.totais?.previsto), formatarMoedaExecutiva(modelo?.totais?.pago), formatarMoedaExecutiva(modelo?.totais?.saldo)],
      columnStyles: { 0: { cellWidth: 95 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
    },
    analitico: {
      headers: CONTROLE_IMPOSTOS_HEADERS,
      linhas: criarLinhasPdfControleImpostos(modelo),
      columnStyles: {
        0: { cellWidth: 18 }, 1: { cellWidth: 43 }, 2: { cellWidth: 20 }, 3: { cellWidth: 19, halign: 'center' },
        4: { cellWidth: 23, halign: 'right' }, 5: { cellWidth: 23, halign: 'right' }, 6: { cellWidth: 23, halign: 'right' },
        7: { cellWidth: 31 }, 8: { cellWidth: 34 }, 9: { cellWidth: 43 }
      }
    }
  })
}

export function exportarControleImpostosPdf({ modelo, filename }) {
  downloadBlob(filename, criarPdfControleImpostos(modelo).output('blob'))
}
