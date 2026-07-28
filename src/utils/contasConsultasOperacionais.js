import {
  derivarStatusFinanceiroConta,
  reconciliarSituacaoConta,
} from './relatoriosFinanceiros.js'

export function formatarDataBancoLocal(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function contaEstaAtiva(conta) {
  return conta?.excluido !== true && conta?.deletado !== true
}

export function contaEstaVencida(conta, hoje) {
  return conta?.status !== 'pago' && String(conta?.data_vencimento || '') < hoje
}

export function filtrarContasPorModo(contas = [], modo = 'pendentes', hoje = formatarDataBancoLocal(new Date())) {
  return contas.filter((conta) => {
    if (!contaEstaAtiva(conta)) return false
    if (modo === 'ocultas') return conta.oculto === true
    if (conta.oculto === true) return false
    if (modo === 'pagas') return conta.status === 'pago'
    if (modo === 'vencidas') return contaEstaVencida(conta, hoje)
    if (modo === 'futuras') return conta.status !== 'pago' && String(conta.data_vencimento || '') > hoje
    if (modo === 'pendentes' || modo === 'abertas') return conta.status !== 'pago'
    return true
  })
}

export const HORIZONTES_PLANEJAMENTO_CONTAS = Object.freeze({
  '30_dias': { dias: 30 },
  '90_dias': { dias: 90 },
  '6_meses': { meses: 6 },
  '12_meses': { meses: 12 },
  todos: null
})

function dataBancoLocal(valor) {
  const texto = String(valor || '').slice(0, 10)
  const partes = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!partes) return null
  const data = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]))
  return Number.isNaN(data.getTime()) ? null : data
}

function adicionarMesesCalendario(data, quantidade) {
  const dia = data.getDate()
  const destino = new Date(data.getFullYear(), data.getMonth() + quantidade, 1)
  const ultimoDia = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate()
  destino.setDate(Math.min(dia, ultimoDia))
  return destino
}

export function calcularHorizonteVisualContas(tipo = 'todos', opcoes = {}) {
  const referencia = dataBancoLocal(opcoes.hoje) || new Date()
  const inicio = formatarDataBancoLocal(referencia)
  const configuracao = HORIZONTES_PLANEJAMENTO_CONTAS[tipo]
  if (!configuracao) return { tipo: 'todos', inicio, fim: null }

  const fim = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate())
  if (configuracao.dias) fim.setDate(fim.getDate() + configuracao.dias)
  if (configuracao.meses) {
    const fimMensal = adicionarMesesCalendario(referencia, configuracao.meses)
    fim.setFullYear(fimMensal.getFullYear(), fimMensal.getMonth(), fimMensal.getDate())
  }
  return { tipo, inicio, fim: formatarDataBancoLocal(fim) }
}

export function filtrarContasPorHorizonte(contas = [], tipo = 'todos', opcoes = {}) {
  const periodo = calcularHorizonteVisualContas(tipo, opcoes)
  if (!periodo.fim || opcoes.modoBuscaGlobal || ['pagas', 'ocultas', 'excluidas'].includes(opcoes.modo)) {
    return [...contas]
  }

  return contas.filter((conta) => {
    const vencimento = String(conta?.data_vencimento || '').slice(0, 10)
    if (!vencimento) return false
    if (opcoes.modo === 'vencidas') return vencimento < periodo.inicio
    if (vencimento < periodo.inicio) return true
    return vencimento <= periodo.fim
  })
}

export function calcularPeriodoPagas(tipo = 'mes_atual', opcoes = {}) {
  const hoje = opcoes.dataReferencia ? new Date(opcoes.dataReferencia) : new Date()
  let inicio
  let fim
  if (tipo === 'mes_anterior') {
    inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
    fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
  } else if (tipo === 'ano_atual') {
    inicio = new Date(hoje.getFullYear(), 0, 1)
    fim = new Date(hoje.getFullYear(), 11, 31)
  } else if (tipo === 'ano') {
    const ano = Number(opcoes.ano) || hoje.getFullYear()
    inicio = new Date(ano, 0, 1)
    fim = new Date(ano, 11, 31)
  } else if (tipo === 'intervalo') {
    return { dataInicial: opcoes.dataInicial || undefined, dataFinal: opcoes.dataFinal || undefined, hoje: formatarDataBancoLocal(hoje) }
  } else {
    inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  }
  return { dataInicial: formatarDataBancoLocal(inicio), dataFinal: formatarDataBancoLocal(fim), hoje: formatarDataBancoLocal(hoje) }
}

export function selecionarFonteContas({ operacionais = [], pagas = [], busca = [], ocultas = [], excluidas = [], termo = '', modo = 'pendentes' }) {
  if (String(termo).trim()) return busca
  if (modo === 'pagas') return pagas
  if (modo === 'ocultas') return ocultas
  if (modo === 'excluidas') return excluidas
  return operacionais
}

const CONSUMIDORES_HISTORICO_COMPLETO = new Set([
  'dashboard',
  'relatorios-contas',
  'controle-impostos',
  'recorrencias',
  'copilot'
])

export function consumidorRequerHistoricoCompleto(consumidor) {
  return CONSUMIDORES_HISTORICO_COMPLETO.has(String(consumidor || ''))
}

export async function carregarFonteContextualContas(consumidor, carregar) {
  if (!consumidorRequerHistoricoCompleto(consumidor)) return { carregada: false, data: [] }
  const resposta = await carregar()
  return { carregada: !resposta?.error, ...resposta }
}
export function resolverEstadoFonteContextual({ carregando = false, carregada = false, erro = null } = {}) {
  if (carregando) return 'carregando'
  if (erro) return 'erro'
  if (carregada) return 'pronto'
  return 'indisponivel'
}

export function fonteContextualDisponivel(estado = {}) {
  return resolverEstadoFonteContextual(estado) === 'pronto'
}

export async function atualizarFontesDashboard({ carregarOperacionais, carregarContextuais } = {}) {
  return Promise.all([
    carregarOperacionais(),
    carregarContextuais()
  ])
}

export async function atualizarAposMutacaoContas({ invalidarContextual, carregarOperacionais, carregarContextual } = {}) {
  invalidarContextual()
  const resultadoOperacional = await carregarOperacionais()
  if (typeof carregarContextual === 'function') await carregarContextual()
  return resultadoOperacional
}

export function selecionarFonteContextualContas({ consumidor, operacionais = [], contextuais = [] } = {}) {
  return consumidorRequerHistoricoCompleto(consumidor) ? contextuais : operacionais
}

export function calcularResumoFinanceiroContas(contas = [], hoje = formatarDataBancoLocal(new Date())) {
  return contas.reduce((resumo, conta) => {
    if (!contaEstaAtiva(conta) || conta?.oculto === true) return resumo
    const pagamentos = Array.isArray(conta.pagamentos_parciais)
      ? conta.pagamentos_parciais
      : (Number(conta.pagamentosParciaisTotal || 0) > 0
          ? [{ valor_pago: conta.pagamentosParciaisTotal }]
          : [])
    const situacao = reconciliarSituacaoConta(conta, pagamentos)
    const statusFinanceiro = derivarStatusFinanceiroConta(conta, situacao, hoje)
    const valorPrevisto = situacao.valorPrevistoCentavos / 100
    const valorPago = situacao.valorPagoAtualCentavos / 100
    const saldo = situacao.saldoRestanteCentavos / 100

    resumo.total += valorPrevisto
    resumo.pago += valorPago
    resumo.pendente += saldo
    if (statusFinanceiro === 'vencida') resumo.vencido += saldo
    resumo.encargos += Number(conta?.juros_multa || 0)
    resumo.descontos += Number(conta?.desconto || 0)
    return resumo
  }, { total: 0, pago: 0, pendente: 0, vencido: 0, encargos: 0, descontos: 0 })
}

export function criarAlvoContaParaNavegacao(contaOuId, origem = 'agenda', nonce = Date.now()) {
  const conta = contaOuId && typeof contaOuId === 'object' ? contaOuId : null
  const id = conta?.id || contaOuId
  if (!id) return null
  return {
    tipo: 'conta',
    id,
    conta,
    origem,
    nonce,
  }
}

export function origemPermiteContaForaDoFiltro(origem) {
  return origem === 'agenda' || origem === 'controle-impostos'
}

export function normalizarValorBuscaContas(valor) {
  const texto = String(valor || '')
    .toLowerCase()
    .replace(/r\$/g, '')
    .replace(/\s/g, '')
    .replace(/[^\d,.-]/g, '')
  if (!/\d/.test(texto)) return null

  const ultimaVirgula = texto.lastIndexOf(',')
  const ultimoPonto = texto.lastIndexOf('.')
  let normalizado = texto
  if (ultimaVirgula >= 0 && ultimoPonto >= 0) {
    normalizado = ultimaVirgula > ultimoPonto
      ? texto.replace(/\./g, '').replace(',', '.')
      : texto.replace(/,/g, '')
  } else if (ultimaVirgula >= 0) {
    normalizado = texto.replace(/\./g, '').replace(',', '.')
  } else if (ultimoPonto >= 0) {
    const casasDecimais = texto.length - ultimoPonto - 1
    normalizado = casasDecimais === 2 ? texto : texto.replace(/\./g, '')
  }

  const numero = Number(normalizado)
  return Number.isFinite(numero) && numero >= 0 ? numero : null
}

export function normalizarDataBuscaContas(valor) {
  const texto = String(valor || '').trim()
  const brasileira = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brasileira) return `${brasileira[3]}-${brasileira[2]}-${brasileira[1]}`
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : null
}

export function interpretarTermoBuscaContas(valor) {
  return {
    termoTexto: String(valor || '').trim().replace(/[,%()]/g, ' '),
    valor: normalizarValorBuscaContas(valor),
    data: normalizarDataBuscaContas(valor)
  }
}

export function obterPeriodoConsultaPagas({ periodoPagas, anoPagas, dataInicialPagas, dataFinalPagas, dataReferencia } = {}) {
  return calcularPeriodoPagas(periodoPagas, {
    ano: anoPagas,
    dataInicial: dataInicialPagas,
    dataFinal: dataFinalPagas,
    dataReferencia
  })
}

export function invalidarConsultaContas(controle) {
  return controle?.iniciar('__consulta_contas_invalidada__')
}

export function mesclarPaginaContas(atuais = [], pagina = [], substituir = false) {
  if (substituir) return [...pagina]
  const ids = new Set(atuais.map((conta) => conta.id))
  return [...atuais, ...pagina.filter((conta) => !ids.has(conta.id))]
}

export function deveConsultarSobDemanda({ modo, termo = '' }) {
  if (String(termo).trim()) return 'busca'
  if (modo === 'pagas') return 'pagas'
  if (modo === 'ocultas') return 'ocultas'
  if (modo === 'excluidas') return 'excluidas'
  return null
}

export function restaurarModoAoLimparBusca(tinhaBusca, valorAtual) {
  return tinhaBusca && !String(valorAtual || '').trim() ? 'pendentes' : null
}

export function contasParaExportacao(contasVisiveis = []) {
  return [...contasVisiveis]
}
