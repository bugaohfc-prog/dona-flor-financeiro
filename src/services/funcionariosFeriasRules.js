const STATUS_PERIODO = Object.freeze({
  AGENDADA: 'agendada',
  EM_GOZO: 'em_gozo',
  GOZADA: 'gozada',
  CANCELADA: 'cancelada',
  ARQUIVADA: 'arquivada'
})
const STATUS_CICLO = Object.freeze({
  EM_AQUISICAO: 'em_aquisicao',
  DISPONIVEL: 'disponivel',
  PROGRAMADA: 'programada',
  EM_GOZO: 'em_gozo',
  PARCIAL: 'parcial',
  CONCLUIDA: 'concluida',
  VENCIDA: 'vencida',
  CANCELADA: 'cancelada',
  ARQUIVADA: 'arquivada'
})

export const STATUS_OPERACIONAL_PERIODO_FERIAS = STATUS_PERIODO
export const STATUS_OPERACIONAL_CICLO_FERIAS = STATUS_CICLO

function inteiroPositivo(valor, mensagem) {
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero <= 0) throw new Error(mensagem)
  return numero
}

export function normalizarDataCivilFerias(valor) {
  const texto = String(valor || '').trim().slice(0, 10)
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto)
  if (!correspondencia) return ''
  const [, anoTexto, mesTexto, diaTexto] = correspondencia
  const ano = Number(anoTexto)
  const mes = Number(mesTexto)
  const dia = Number(diaTexto)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  if (
    Number.isNaN(data.getTime()) ||
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) return ''
  return `${anoTexto}-${mesTexto}-${diaTexto}`
}

export function dataCivilHojeFerias(relogio = new Date()) {
  return [
    relogio.getFullYear(),
    String(relogio.getMonth() + 1).padStart(2, '0'),
    String(relogio.getDate()).padStart(2, '0')
  ].join('-')
}

export function somarDiasCivisFerias(dataISO, quantidade) {
  const data = normalizarDataCivilFerias(dataISO)
  if (!data) throw new Error('Data de ferias invalida.')
  const [ano, mes, dia] = data.split('-').map(Number)
  const dataUTC = new Date(Date.UTC(ano, mes - 1, dia))
  dataUTC.setUTCDate(dataUTC.getUTCDate() + Number(quantidade || 0))
  return [
    dataUTC.getUTCFullYear(),
    String(dataUTC.getUTCMonth() + 1).padStart(2, '0'),
    String(dataUTC.getUTCDate()).padStart(2, '0')
  ].join('-')
}

export function calcularFimPeriodoFerias(dataInicio, quantidadeDias) {
  const dias = inteiroPositivo(quantidadeDias, 'Quantidade de dias deve ser maior que zero.')
  return somarDiasCivisFerias(dataInicio, dias - 1)
}

export function calcularRetornoPeriodoFerias(dataInicio, quantidadeDias) {
  return somarDiasCivisFerias(calcularFimPeriodoFerias(dataInicio, quantidadeDias), 1)
}

export function derivarStatusPeriodoFerias(periodo, dataReferencia = dataCivilHojeFerias()) {
  if (!periodo) return ''
  if (periodo.arquivado) return STATUS_PERIODO.ARQUIVADA
  const statusPersistido = String(periodo.status || '').trim().toLowerCase()
  if (statusPersistido === 'cancelada') return STATUS_PERIODO.CANCELADA
  if (statusPersistido === 'concluida') return STATUS_PERIODO.GOZADA

  const inicio = normalizarDataCivilFerias(periodo.data_inicio)
  const retorno = normalizarDataCivilFerias(periodo.data_retorno_trabalho)
  const referencia = normalizarDataCivilFerias(dataReferencia)
  if (!inicio || !retorno || !referencia) return ''
  if (inicio > referencia) return STATUS_PERIODO.AGENDADA
  if (retorno > referencia) return STATUS_PERIODO.EM_GOZO
  return STATUS_PERIODO.GOZADA
}

export function periodoFeriasConsomeSaldo(periodo) {
  const status = derivarStatusPeriodoFerias(periodo)
  return Boolean(status && ![STATUS_PERIODO.CANCELADA, STATUS_PERIODO.ARQUIVADA].includes(status))
}

export function periodosFeriasSeSobrepoem(periodoA, periodoB) {
  const inicioA = normalizarDataCivilFerias(periodoA?.data_inicio)
  const retornoA = normalizarDataCivilFerias(periodoA?.data_retorno_trabalho)
  const inicioB = normalizarDataCivilFerias(periodoB?.data_inicio)
  const retornoB = normalizarDataCivilFerias(periodoB?.data_retorno_trabalho)
  if (!inicioA || !retornoA || !inicioB || !retornoB) return false
  return inicioA < retornoB && inicioB < retornoA
}

export function calcularProximaParcelaFerias(periodos = []) {
  const ocupadas = new Set((periodos || [])
    .filter(periodoFeriasConsomeSaldo)
    .map((periodo) => Number(periodo.numero_parcela))
    .filter((numero) => Number.isInteger(numero) && numero >= 1 && numero <= 3))
  for (let numero = 1; numero <= 3; numero += 1) {
    if (!ocupadas.has(numero)) return numero
  }
  return null
}

export function resumirCicloFerias({ ciclo, periodos = [], dataReferencia = dataCivilHojeFerias() } = {}) {
  const diasDireito = inteiroPositivo(ciclo?.dias_direito ?? 30, 'Dias de direito deve ser maior que zero.')
  const contagem = {
    diasProgramados: 0,
    diasEmGozo: 0,
    diasGozados: 0
  }
  const periodosConsiderados = []

  for (const periodo of periodos || []) {
    const statusOperacional = derivarStatusPeriodoFerias(periodo, dataReferencia)
    if (!statusOperacional || [STATUS_PERIODO.CANCELADA, STATUS_PERIODO.ARQUIVADA].includes(statusOperacional)) continue
    const quantidade = inteiroPositivo(periodo.quantidade_dias, 'Quantidade de dias do periodo deve ser maior que zero.')
    periodosConsiderados.push({ ...periodo, status_operacional: statusOperacional })
    if (statusOperacional === STATUS_PERIODO.AGENDADA) contagem.diasProgramados += quantidade
    if (statusOperacional === STATUS_PERIODO.EM_GOZO) contagem.diasEmGozo += quantidade
    if (statusOperacional === STATUS_PERIODO.GOZADA) contagem.diasGozados += quantidade
  }

  const diasReservados = contagem.diasProgramados + contagem.diasEmGozo + contagem.diasGozados
  const saldoLivreParaProgramar = Math.max(diasDireito - diasReservados, 0)
  const saldoAindaNaoGozado = Math.max(diasDireito - contagem.diasGozados, 0)
  const referencia = normalizarDataCivilFerias(dataReferencia)
  const fimAquisitivo = normalizarDataCivilFerias(ciclo?.periodo_aquisitivo_fim)
  const limite = normalizarDataCivilFerias(ciclo?.data_limite_gozo)
  const statusPersistido = String(ciclo?.status || '').trim().toLowerCase()

  let statusOperacional
  if (ciclo?.arquivado) statusOperacional = STATUS_CICLO.ARQUIVADA
  else if (statusPersistido === 'cancelada') statusOperacional = STATUS_CICLO.CANCELADA
  else if (referencia && fimAquisitivo && referencia <= fimAquisitivo) statusOperacional = STATUS_CICLO.EM_AQUISICAO
  else if (saldoAindaNaoGozado <= 0) statusOperacional = STATUS_CICLO.CONCLUIDA
  else if (contagem.diasEmGozo > 0) statusOperacional = STATUS_CICLO.EM_GOZO
  else if (referencia && limite && limite < referencia) statusOperacional = STATUS_CICLO.VENCIDA
  else if (saldoLivreParaProgramar <= 0 && contagem.diasProgramados > 0) statusOperacional = STATUS_CICLO.PROGRAMADA
  else if (diasReservados > 0) statusOperacional = STATUS_CICLO.PARCIAL
  else statusOperacional = STATUS_CICLO.DISPONIVEL

  return Object.freeze({
    diasDireito,
    ...contagem,
    saldoLivreParaProgramar,
    saldoAindaNaoGozado,
    quantidadeParcelas: periodosConsiderados.length,
    proximaParcela: calcularProximaParcelaFerias(periodos),
    statusOperacional,
    periodos: Object.freeze(periodosConsiderados)
  })
}

export function calcularSaldoDiasFerias({ diasDireito = 30, periodosAtivos = [], dataReferencia } = {}) {
  return resumirCicloFerias({
    ciclo: { dias_direito: diasDireito },
    periodos: periodosAtivos,
    dataReferencia
  }).saldoLivreParaProgramar
}

export function calcularStatusCicloFerias({
  ciclo,
  diasDireito = 30,
  periodosAtivos = [],
  dataLimiteGozo,
  periodoAquisitivoFim,
  dataReferencia
} = {}) {
  return resumirCicloFerias({
    ciclo: ciclo || {
      dias_direito: diasDireito,
      data_limite_gozo: dataLimiteGozo,
      periodo_aquisitivo_fim: periodoAquisitivoFim
    },
    periodos: periodosAtivos,
    dataReferencia
  }).statusOperacional
}

export function rotularStatusPeriodoFerias(status) {
  return ({
    agendada: 'Agendada',
    em_gozo: 'Em gozo',
    gozada: 'Gozada',
    cancelada: 'Cancelada',
    arquivada: 'Arquivada'
  })[status] || 'Não informado'
}

export function rotularStatusCicloFerias(status) {
  return ({
    em_aquisicao: 'Em aquisição',
    disponivel: 'Disponível',
    programada: 'Programada',
    em_gozo: 'Em gozo',
    parcial: 'Parcial',
    concluida: 'Concluída',
    vencida: 'Vencida',
    cancelada: 'Cancelada',
    arquivada: 'Arquivada'
  })[status] || 'Não informado'
}
