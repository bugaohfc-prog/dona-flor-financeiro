import { statusRelatorioConta } from './relatoriosFinanceiros.js'

const DIA_MS = 86400000

function dataLocalISO(data = new Date()) {
  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, '0'),
    String(data.getDate()).padStart(2, '0')
  ].join('-')
}

function somarDias(dataISO, dias) {
  const [ano, mes, dia] = String(dataISO).split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia + dias))
  return data.toISOString().slice(0, 10)
}

function adicionarMeses(ano, mes, quantidade) {
  const total = ano * 12 + (mes - 1) + quantidade
  return {
    ano: Math.floor(total / 12),
    mes: (total % 12) + 1
  }
}

function chaveMes(ano, mes) {
  return `${ano}-${String(mes).padStart(2, '0')}`
}

function ultimoDiaMes(ano, mes) {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate()
}

function paraCentavos(valor) {
  const numero = Number(valor || 0)
  return Number.isFinite(numero) ? Math.round(numero * 100) : 0
}

function deCentavos(valor) {
  return Number((Number(valor || 0) / 100).toFixed(2))
}

export function criarPeriodosFinanceiros(dataBase = new Date()) {
  const hoje = typeof dataBase === 'string' ? dataBase.slice(0, 10) : dataLocalISO(dataBase)
  return {
    hoje: { inicio: hoje, fim: hoje },
    proximos7: { inicio: somarDias(hoje, 1), fim: somarDias(hoje, 7) },
    proximos30: { inicio: somarDias(hoje, 8), fim: somarDias(hoje, 30) },
    proximos90: { inicio: somarDias(hoje, 31), fim: somarDias(hoje, 90) },
    futuroLongo: { inicio: somarDias(hoje, 91), fim: null }
  }
}

export function criarPeriodoProjecaoMensal(dataBase = new Date(), quantidadeMeses = 12) {
  const hoje = typeof dataBase === 'string' ? dataBase.slice(0, 10) : dataLocalISO(dataBase)
  const [ano, mes] = hoje.split('-').map(Number)
  const quantidade = Math.max(1, Number(quantidadeMeses) || 12)
  const ultimoMes = adicionarMeses(ano, mes, quantidade - 1)
  return {
    inicio: `${chaveMes(ano, mes)}-01`,
    fim: `${chaveMes(ultimoMes.ano, ultimoMes.mes)}-${String(ultimoDiaMes(ultimoMes.ano, ultimoMes.mes)).padStart(2, '0')}`,
    meses: Array.from({ length: quantidade }, (_, indice) => {
      const atual = adicionarMeses(ano, mes, indice)
      return chaveMes(atual.ano, atual.mes)
    })
  }
}

export function criarPeriodoConsultaDashboard(dataBase = new Date()) {
  const hoje = typeof dataBase === 'string' ? dataBase.slice(0, 10) : dataLocalISO(dataBase)
  const fimAno = `${hoje.slice(0, 4)}-12-31`
  const fimHorizonte = criarPeriodosFinanceiros(hoje).proximos90.fim
  return {
    dataInicial: `${hoje.slice(0, 4)}-01-01`,
    dataFinal: fimHorizonte > fimAno ? fimHorizonte : fimAno,
    hoje
  }
}

export function classificarFaixaFinanceira(conta, dataBase = new Date()) {
  const hoje = typeof dataBase === 'string' ? dataBase.slice(0, 10) : dataLocalISO(dataBase)
  const status = statusRelatorioConta(conta, hoje)
  const saldo = Number(conta?.saldo_restante_relatorio ?? conta?.valor ?? 0)
  if (saldo <= 0 || ['paga', 'quitada_por_parciais'].includes(status)) return 'quitada'

  const vencimento = String(conta?.data_vencimento || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) return 'sem_data'
  if (vencimento < hoje) return 'vencida'

  const periodos = criarPeriodosFinanceiros(hoje)
  if (vencimento === hoje) return 'hoje'
  if (vencimento <= periodos.proximos7.fim) return 'proximos7'
  if (vencimento <= periodos.proximos30.fim) return 'proximos30'
  if (vencimento <= periodos.proximos90.fim) return 'proximos90'
  return 'futuroLongo'
}

export function resumirConsumidoresFinanceiros(registros = [], { dataBase = new Date(), empresaId = '', filialId = '', centroCustoId = '' } = {}) {
  const filtrados = (registros || []).filter((conta) => (
    (!empresaId || String(conta?.empresa_id || '') === String(empresaId)) &&
    (!filialId || String(conta?.filial_id || '') === String(filialId)) &&
    (!centroCustoId || String(conta?.centro_custo_id || '') === String(centroCustoId)) &&
    conta?.oculto !== true && conta?.excluido !== true && conta?.deletado !== true
  ))
  const faixas = Object.fromEntries(['vencida', 'hoje', 'proximos7', 'proximos30', 'proximos90', 'futuroLongo'].map((chave) => [chave, { quantidade: 0, valor: 0 }]))

  const resumo = filtrados.reduce((acc, conta) => {
    const previsto = Number(conta.valor_previsto_relatorio ?? conta.valor ?? 0)
    const realizado = Number(conta.valor_pago_atual_relatorio ?? 0)
    const saldo = Number(conta.saldo_restante_relatorio ?? conta.valor ?? 0)
    acc.previsto += previsto
    acc.realizado += realizado
    acc.saldo += saldo
    const faixa = classificarFaixaFinanceira(conta, dataBase)
    if (faixas[faixa]) {
      faixas[faixa].quantidade += 1
      faixas[faixa].valor += saldo
    }
    return acc
  }, { previsto: 0, realizado: 0, saldo: 0 })

  return {
    ...resumo,
    vencido: faixas.vencida.valor,
    faixas,
    registros: filtrados,
    dadosInsuficientes: filtrados.length === 0,
    periodo: criarPeriodosFinanceiros(dataBase)
  }
}

export function resumirDashboardFinanceiro(registros = [], opcoes = {}) {
  const hoje = typeof opcoes.dataBase === 'string' ? opcoes.dataBase.slice(0, 10) : dataLocalISO(opcoes.dataBase || new Date())
  const baseCompleta = resumirConsumidoresFinanceiros(registros, { ...opcoes, dataBase: hoje })
  const anoAtual = hoje.slice(0, 4)
  const registrosAno = baseCompleta.registros.filter((conta) => String(conta?.data_vencimento || '').slice(0, 4) === anoAtual)
  const anual = resumirConsumidoresFinanceiros(registrosAno, { ...opcoes, dataBase: hoje })

  const vencidosHistoricos = resumirConsumidoresFinanceiros(opcoes.vencidosHistoricos || [], { ...opcoes, dataBase: hoje })

  return {
    ...anual,
    vencido: vencidosHistoricos.faixas.vencida.valor,
    hoje: baseCompleta.faixas.hoje,
    faixas: baseCompleta.faixas,
    periodoConsulta: criarPeriodoConsultaDashboard(hoje),
    registrosHorizonte: baseCompleta.registros,
    registrosVencidos: vencidosHistoricos.registros
  }
}

export function resumirProximos90Dashboard(faixas = {}) {
  const chaves = ['proximos7', 'proximos30', 'proximos90']
  const resumo = chaves.reduce((acc, chave) => {
    acc.quantidade += Number(faixas?.[chave]?.quantidade || 0)
    acc.valorCentavos += paraCentavos(faixas?.[chave]?.valor)
    return acc
  }, { quantidade: 0, valorCentavos: 0 })

  return {
    quantidade: resumo.quantidade,
    valor: deCentavos(resumo.valorCentavos)
  }
}

function classificacaoOrigem(conta) {
  return conta?.recorrencia_id ? 'recorrente' : 'manual'
}

function classificacaoValor(conta) {
  return conta?.valor_variavel === true || conta?.df_contas_recorrentes?.valor_variavel === true
    ? 'variavel'
    : 'fixa'
}

export function resumirProjecaoMensalDashboard(registros = [], opcoes = {}) {
  const hoje = typeof opcoes.dataBase === 'string' ? opcoes.dataBase.slice(0, 10) : dataLocalISO(opcoes.dataBase || new Date())
  const periodo = criarPeriodoProjecaoMensal(hoje, opcoes.quantidadeMeses || 12)
  const filtrados = resumirConsumidoresFinanceiros(registros, { ...opcoes, dataBase: hoje }).registros
  const meses = new Map(periodo.meses.map((chave) => [chave, {
    chave,
    previstoCentavos: 0,
    pagoCentavos: 0,
    saldoCentavos: 0,
    quantidade: 0
  }]))
  const classificacoes = {
    fixa: { quantidade: 0, valorCentavos: 0 },
    variavel: { quantidade: 0, valorCentavos: 0 },
    manual: { quantidade: 0, valorCentavos: 0 },
    recorrente: { quantidade: 0, valorCentavos: 0 }
  }

  filtrados.forEach((conta) => {
    const vencimento = String(conta?.data_vencimento || '').slice(0, 10)
    const mes = meses.get(vencimento.slice(0, 7))
    if (!mes || vencimento < periodo.inicio || vencimento > periodo.fim) return

    const status = statusRelatorioConta(conta, hoje)
    const saldoCentavos = paraCentavos(conta?.saldo_restante_relatorio ?? conta?.valor ?? 0)
    const quitada = saldoCentavos <= 0 || ['paga', 'quitada_por_parciais'].includes(status)
    if (vencimento > hoje && quitada) return

    mes.previstoCentavos += paraCentavos(conta?.valor_previsto_relatorio ?? conta?.valor ?? 0)
    mes.pagoCentavos += paraCentavos(conta?.valor_pago_atual_relatorio ?? 0)
    mes.saldoCentavos += saldoCentavos
    mes.quantidade += 1

    if (vencimento < hoje || quitada) return
    const origem = classificacaoOrigem(conta)
    const tipoValor = classificacaoValor(conta)
    classificacoes[origem].quantidade += 1
    classificacoes[origem].valorCentavos += saldoCentavos
    classificacoes[tipoValor].quantidade += 1
    classificacoes[tipoValor].valorCentavos += saldoCentavos
  })

  const projecaoMensal = Array.from(meses.values()).map((mes) => ({
    chave: mes.chave,
    previsto: deCentavos(mes.previstoCentavos),
    pago: deCentavos(mes.pagoCentavos),
    saldo: deCentavos(mes.saldoCentavos),
    quantidade: mes.quantidade
  }))
  const maiorNecessidade = projecaoMensal.reduce((maior, mes) => (
    !maior || mes.saldo > maior.saldo ? mes : maior
  ), null)

  return {
    periodo,
    meses: projecaoMensal,
    maiorNecessidade: maiorNecessidade?.saldo > 0 ? maiorNecessidade : null,
    classificacoes: Object.fromEntries(Object.entries(classificacoes).map(([chave, item]) => [chave, {
      quantidade: item.quantidade,
      valor: deCentavos(item.valorCentavos)
    }]))
  }
}

export function criarDestinoContasDashboard(tipo, referencia = {}) {
  const hoje = String(referencia.hoje || dataLocalISO(new Date())).slice(0, 10)
  const periodos = criarPeriodosFinanceiros(hoje)
  const base = {
    filtroStatus: 'pendentes',
    filtroHorizonte: 'todos',
    dataInicial: '',
    dataFinal: ''
  }
  const destinos = {
    vencidas: { ...base, filtroStatus: 'vencidas' },
    hoje: { ...base, dataInicial: hoje, dataFinal: hoje },
    proximos7: { ...base, filtroStatus: 'futuras', dataInicial: periodos.proximos7.inicio, dataFinal: periodos.proximos7.fim },
    proximos30: { ...base, filtroStatus: 'futuras', dataInicial: periodos.proximos30.inicio, dataFinal: periodos.proximos30.fim },
    proximos90: { ...base, filtroStatus: 'futuras', dataInicial: periodos.proximos90.inicio, dataFinal: periodos.proximos90.fim },
    proximos90Completo: { ...base, filtroStatus: 'futuras', dataInicial: periodos.proximos7.inicio, dataFinal: periodos.proximos90.fim }
  }
  if (tipo === 'mes' && /^\d{4}-\d{2}$/.test(String(referencia.mes || ''))) {
    const [ano, mes] = referencia.mes.split('-').map(Number)
    return {
      ...base,
      dataInicial: `${referencia.mes}-01`,
      dataFinal: `${referencia.mes}-${String(ultimoDiaMes(ano, mes)).padStart(2, '0')}`
    }
  }
  return destinos[tipo] || base
}

export function filtrarAgendaFinanceira(contas = [], opcoes = {}) {
  return resumirConsumidoresFinanceiros(contas, opcoes).registros.filter((conta) => (
    !['quitada', 'sem_data'].includes(classificarFaixaFinanceira(conta, opcoes.dataBase))
  ))
}

export function obterStatusOperacionalImposto(conta, hoje) {
  const status = statusRelatorioConta(conta, hoje)
  if (['paga', 'quitada_por_parciais'].includes(status)) return 'pago'
  if (status === 'vencida') return 'vencido'
  return status === 'parcial' ? 'parcial' : 'aberto'
}

export function impostoPertenceAoFiltro(conta, filtro) {
  if (filtro === 'abertos') return ['aberto', 'parcial'].includes(conta?.statusOperacional)
  if (filtro === 'vencidos') return conta?.statusOperacional === 'vencido'
  if (filtro === 'pagos') return conta?.statusOperacional === 'pago'
  return true
}

export function obterSaldoExibidoImposto(conta) {
  return Number(conta?.saldo_restante_relatorio ?? conta?.valor ?? 0)
}
