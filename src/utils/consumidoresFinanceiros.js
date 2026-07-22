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

export function criarPeriodoConsultaDashboard(dataBase = new Date()) {
  const hoje = typeof dataBase === 'string' ? dataBase.slice(0, 10) : dataLocalISO(dataBase)
  const fimAno = `${hoje.slice(0, 4)}-12-31`
  const fimHorizonte = somarDias(hoje, 90)
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

  return {
    ...anual,
    vencido: baseCompleta.faixas.vencida.valor,
    hoje: baseCompleta.faixas.hoje,
    faixas: baseCompleta.faixas,
    periodoConsulta: criarPeriodoConsultaDashboard(hoje),
    registrosHorizonte: baseCompleta.registros
  }
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
