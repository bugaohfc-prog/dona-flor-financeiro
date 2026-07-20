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