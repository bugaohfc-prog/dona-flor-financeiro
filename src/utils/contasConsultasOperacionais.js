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

export function selecionarFonteContas({ operacionais = [], pagas = [], busca = [], ocultas = [], termo = '', modo = 'pendentes' }) {
  if (String(termo).trim()) return busca
  if (modo === 'pagas') return pagas
  if (modo === 'ocultas') return ocultas
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
  return { carregada: true, ...resposta }
}

export function selecionarFonteContextualContas({ consumidor, operacionais = [], contextuais = [] } = {}) {
  return consumidorRequerHistoricoCompleto(consumidor) ? contextuais : operacionais
}

export function calcularResumoFinanceiroContas(contas = [], hoje = formatarDataBancoLocal(new Date())) {
  return contas.reduce((resumo, conta) => {
    if (!contaEstaAtiva(conta) || conta?.oculto === true) return resumo
    const valor = Number(conta?.valor || 0)
    const pago = conta?.status === 'pago' ? Number(conta?.valor_pago ?? conta?.valor ?? 0) : 0
    resumo.total += valor
    resumo.pago += pago
    if (conta?.status !== 'pago') resumo.pendente += valor
    if (contaEstaVencida(conta, hoje)) resumo.vencido += valor
    resumo.encargos += Number(conta?.juros_multa || 0)
    resumo.descontos += Number(conta?.desconto || 0)
    return resumo
  }, { total: 0, pago: 0, pendente: 0, vencido: 0, encargos: 0, descontos: 0 })
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
  return null
}

export function restaurarModoAoLimparBusca(tinhaBusca, valorAtual) {
  return tinhaBusca && !String(valorAtual || '').trim() ? 'pendentes' : null
}

export function contasParaExportacao(contasVisiveis = []) {
  return [...contasVisiveis]
}
