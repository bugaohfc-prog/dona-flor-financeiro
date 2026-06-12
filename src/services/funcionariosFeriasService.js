import {
  atualizarPorEmpresa,
  inserirComEmpresa,
  selecionarPorEmpresa
} from './supabaseQueryService'
import { assertEmpresaId } from './tenantService'

const TABELA_FERIAS_CICLOS = 'df_funcionarios_ferias_ciclos'
const TABELA_FERIAS_PERIODOS = 'df_funcionarios_ferias_periodos'

const CICLO_FERIAS_SELECT = [
  'id',
  'empresa_id',
  'funcionario_id',
  'periodo_aquisitivo_inicio',
  'periodo_aquisitivo_fim',
  'data_limite_gozo',
  'dias_direito',
  'status',
  'arquivado',
  'arquivado_em',
  'criado_em',
  'atualizado_em'
].join(', ')

const PERIODO_FERIAS_SELECT = [
  'id',
  'empresa_id',
  'ciclo_ferias_id',
  'funcionario_id',
  'data_inicio',
  'quantidade_dias',
  'data_fim_calculada',
  'data_retorno_trabalho',
  'numero_parcela',
  'status',
  'arquivado',
  'arquivado_em',
  'criado_em',
  'atualizado_em'
].join(', ')

const STATUS_CICLO_PERMITIDOS = new Set([
  'pendente',
  'parcial',
  'agendada',
  'concluida',
  'vencida',
  'cancelada'
])

const STATUS_PERIODO_PERMITIDOS = new Set(['agendada', 'concluida', 'cancelada'])

function normalizarId(valor) {
  return String(valor || '').trim()
}

function validarEmpresaId(empresaId) {
  return assertEmpresaId(normalizarId(empresaId))
}

function validarFuncionarioId(funcionarioId) {
  const id = normalizarId(funcionarioId)
  if (!id) throw new Error('Funcionario nao identificado.')
  return id
}

function validarCicloId(cicloId) {
  const id = normalizarId(cicloId)
  if (!id) throw new Error('Ciclo de ferias nao identificado.')
  return id
}

function validarPeriodoId(periodoId) {
  const id = normalizarId(periodoId)
  if (!id) throw new Error('Periodo de ferias nao identificado.')
  return id
}

function normalizarDataObrigatoria(valor, mensagem = 'Informe a data.') {
  const texto = String(valor || '').trim().slice(0, 10)
  if (!texto) throw new Error(mensagem)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) throw new Error('Data invalida.')

  const [ano, mes, dia] = texto.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))

  if (
    Number.isNaN(data.getTime()) ||
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    throw new Error('Data invalida.')
  }

  return texto
}

function normalizarInteiroPositivo(valor, mensagem) {
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero <= 0) throw new Error(mensagem)
  return numero
}

function somarDias(dataISO, dias) {
  const texto = normalizarDataObrigatoria(dataISO)
  const [ano, mes, dia] = texto.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  data.setUTCDate(data.getUTCDate() + dias)
  return [
    data.getUTCFullYear(),
    String(data.getUTCMonth() + 1).padStart(2, '0'),
    String(data.getUTCDate()).padStart(2, '0')
  ].join('-')
}

function normalizarStatus(valor, statusPermitidos, statusPadrao, mensagem) {
  const status = String(valor || '').trim().toLowerCase()
  const statusFinal = status || statusPadrao
  if (!statusPermitidos.has(statusFinal)) throw new Error(mensagem)
  return statusFinal
}

function garantirSemCamposBloqueados(dados = {}, camposBloqueados = []) {
  const entrada = dados && typeof dados === 'object' ? dados : {}
  const campo = camposBloqueados.find((nome) => Object.prototype.hasOwnProperty.call(entrada, nome))
  if (campo) throw new Error(`Campo nao permitido para esta operacao: ${campo}.`)
  return entrada
}

function normalizarNumeroParcela(valor) {
  const numero = normalizarInteiroPositivo(valor, 'Numero da parcela deve ser um inteiro positivo.')
  if (numero < 1 || numero > 3) throw new Error('Numero da parcela deve estar entre 1 e 3.')
  return numero
}

function periodoConsomeSaldo(periodo) {
  return periodo && !periodo.arquivado && periodo.status !== 'cancelada'
}

function obterDataHojeISO() {
  const hoje = new Date()
  return [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, '0'),
    String(hoje.getDate()).padStart(2, '0')
  ].join('-')
}

export function calcularFimFerias(dataInicio, quantidadeDias) {
  const inicio = normalizarDataObrigatoria(dataInicio, 'Informe a data de inicio das ferias.')
  const dias = normalizarInteiroPositivo(quantidadeDias, 'Quantidade de dias deve ser maior que zero.')
  return somarDias(inicio, dias - 1)
}

export function calcularRetornoTrabalho(dataInicio, quantidadeDias) {
  return somarDias(calcularFimFerias(dataInicio, quantidadeDias), 1)
}

export function calcularSaldoDiasFerias({ diasDireito = 30, periodosAtivos = [] } = {}) {
  const direito = normalizarInteiroPositivo(diasDireito, 'Dias de direito deve ser maior que zero.')
  const diasUsados = (periodosAtivos || [])
    .filter(periodoConsomeSaldo)
    .reduce((total, periodo) => total + normalizarInteiroPositivo(
      periodo.quantidade_dias,
      'Quantidade de dias do periodo deve ser maior que zero.'
    ), 0)

  return Math.max(direito - diasUsados, 0)
}

export function calcularStatusCicloFerias({
  diasDireito = 30,
  periodosAtivos = [],
  dataLimiteGozo
} = {}) {
  const saldo = calcularSaldoDiasFerias({ diasDireito, periodosAtivos })
  if (saldo <= 0) return 'concluida'

  const periodosQueConsomemSaldo = (periodosAtivos || []).filter(periodoConsomeSaldo)
  if (dataLimiteGozo && normalizarDataObrigatoria(dataLimiteGozo) < obterDataHojeISO()) return 'vencida'
  if (periodosQueConsomemSaldo.some((periodo) => periodo.status === 'agendada')) return 'agendada'
  if (periodosQueConsomemSaldo.length > 0) return 'parcial'
  return 'pendente'
}

function montarPayloadCiclo(dados = {}, opcoes = {}) {
  const entrada = garantirSemCamposBloqueados(dados, [
    'id',
    'empresa_id',
    'empresaId',
    'funcionario_id',
    'funcionarioId',
    'arquivado',
    'arquivado_em',
    'criado_em',
    'atualizado_em'
  ])
  const payload = {}

  if (opcoes.criacao || Object.prototype.hasOwnProperty.call(entrada, 'periodo_aquisitivo_inicio')) {
    payload.periodo_aquisitivo_inicio = normalizarDataObrigatoria(
      entrada.periodo_aquisitivo_inicio,
      'Informe o inicio do periodo aquisitivo.'
    )
  }

  if (opcoes.criacao || Object.prototype.hasOwnProperty.call(entrada, 'periodo_aquisitivo_fim')) {
    payload.periodo_aquisitivo_fim = normalizarDataObrigatoria(
      entrada.periodo_aquisitivo_fim,
      'Informe o fim do periodo aquisitivo.'
    )
  }

  if (opcoes.criacao || Object.prototype.hasOwnProperty.call(entrada, 'data_limite_gozo')) {
    payload.data_limite_gozo = normalizarDataObrigatoria(
      entrada.data_limite_gozo,
      'Informe a data limite de gozo.'
    )
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'dias_direito')) {
    payload.dias_direito = normalizarInteiroPositivo(
      entrada.dias_direito,
      'Dias de direito deve ser maior que zero.'
    )
  } else if (opcoes.criacao) {
    payload.dias_direito = 30
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'status')) {
    payload.status = normalizarStatus(
      entrada.status,
      STATUS_CICLO_PERMITIDOS,
      'pendente',
      'Status do ciclo de ferias invalido.'
    )
  } else if (opcoes.criacao) {
    payload.status = 'pendente'
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('Nenhum dado de ciclo de ferias informado para salvar.')
  }

  return payload
}

function montarPayloadPeriodoBase({ dataInicio, quantidadeDias, numeroParcela, status }) {
  const data_inicio = normalizarDataObrigatoria(dataInicio, 'Informe a data de inicio das ferias.')
  const quantidade_dias = normalizarInteiroPositivo(
    quantidadeDias,
    'Quantidade de dias deve ser maior que zero.'
  )

  return {
    data_inicio,
    quantidade_dias,
    data_fim_calculada: calcularFimFerias(data_inicio, quantidade_dias),
    data_retorno_trabalho: calcularRetornoTrabalho(data_inicio, quantidade_dias),
    numero_parcela: normalizarNumeroParcela(numeroParcela),
    status: normalizarStatus(
      status,
      STATUS_PERIODO_PERMITIDOS,
      'agendada',
      'Status do periodo de ferias invalido.'
    )
  }
}

async function carregarCicloParaOperacao({ supabase, empresaId, cicloId }) {
  const { data, error } = await obterCicloFeriasPorId({ supabase, empresaId, cicloId })
  if (error) throw error
  if (!data) throw new Error('Ciclo de ferias nao encontrado.')
  return data
}

async function carregarPeriodosAtivosDoCiclo({ supabase, empresaId, cicloId, funcionarioId }) {
  const { data, error } = await listarPeriodosFerias({
    supabase,
    empresaId,
    cicloId,
    funcionarioId,
    incluirArquivados: false
  })

  if (error) throw error
  return (data || []).filter(periodoConsomeSaldo)
}

function validarSaldoParaPeriodo({ ciclo, periodosAtivos, quantidadeDias, status, periodoIgnoradoId }) {
  if (status === 'cancelada') return null

  const periodosConsiderados = (periodosAtivos || []).filter((periodo) => periodo.id !== periodoIgnoradoId)
  const saldo = calcularSaldoDiasFerias({
    diasDireito: ciclo.dias_direito,
    periodosAtivos: periodosConsiderados
  })

  if (quantidadeDias > saldo) {
    throw new Error('Quantidade de dias maior que o saldo disponivel do ciclo.')
  }

  return saldo
}

function obterCampo(entrada, nomeSnake, nomeCamel, valorPadrao) {
  if (Object.prototype.hasOwnProperty.call(entrada, nomeSnake)) return entrada[nomeSnake]
  if (Object.prototype.hasOwnProperty.call(entrada, nomeCamel)) return entrada[nomeCamel]
  return valorPadrao
}

function calcularProximaParcela(periodosAtivos = []) {
  const maiorParcela = (periodosAtivos || [])
    .filter(periodoConsomeSaldo)
    .reduce((maior, periodo) => Math.max(maior, Number(periodo.numero_parcela) || 0), 0)
  return normalizarNumeroParcela(maiorParcela + 1)
}

export async function listarCiclosFerias({
  supabase,
  empresaId,
  funcionarioId,
  incluirArquivados = false
}) {
  const empresa = validarEmpresaId(empresaId)
  const funcionario = validarFuncionarioId(funcionarioId)

  let query = selecionarPorEmpresa(supabase, TABELA_FERIAS_CICLOS, empresa, CICLO_FERIAS_SELECT)
    .eq('funcionario_id', funcionario)
    .order('periodo_aquisitivo_inicio', { ascending: false })

  if (!incluirArquivados) {
    query = query.eq('arquivado', false)
  }

  return query
}

export async function obterCicloFeriasPorId({ supabase, empresaId, cicloId }) {
  const empresa = validarEmpresaId(empresaId)
  const id = validarCicloId(cicloId)

  return selecionarPorEmpresa(supabase, TABELA_FERIAS_CICLOS, empresa, CICLO_FERIAS_SELECT)
    .eq('id', id)
    .maybeSingle()
}

export async function criarCicloFerias({ supabase, empresaId, funcionarioId, dados }) {
  const empresa = validarEmpresaId(empresaId)
  const funcionario = validarFuncionarioId(funcionarioId)

  const payload = {
    ...montarPayloadCiclo(dados, { criacao: true }),
    empresa_id: empresa,
    funcionario_id: funcionario,
    arquivado: false,
    arquivado_em: null
  }

  return inserirComEmpresa(supabase, TABELA_FERIAS_CICLOS, payload, { select: CICLO_FERIAS_SELECT })
    .single()
}

export async function atualizarCicloFerias({ supabase, empresaId, cicloId, dados }) {
  const empresa = validarEmpresaId(empresaId)
  const id = validarCicloId(cicloId)
  const payload = montarPayloadCiclo(dados)

  return atualizarPorEmpresa(supabase, TABELA_FERIAS_CICLOS, id, empresa, payload)
    .select(CICLO_FERIAS_SELECT)
    .single()
}

export async function arquivarCicloFerias({ supabase, empresaId, cicloId }) {
  const empresa = validarEmpresaId(empresaId)
  const id = validarCicloId(cicloId)

  return atualizarPorEmpresa(supabase, TABELA_FERIAS_CICLOS, id, empresa, {
    arquivado: true,
    arquivado_em: new Date().toISOString()
  })
    .select(CICLO_FERIAS_SELECT)
    .single()
}

export async function reativarCicloFerias({ supabase, empresaId, cicloId }) {
  const empresa = validarEmpresaId(empresaId)
  const id = validarCicloId(cicloId)

  return atualizarPorEmpresa(supabase, TABELA_FERIAS_CICLOS, id, empresa, {
    arquivado: false,
    arquivado_em: null
  })
    .select(CICLO_FERIAS_SELECT)
    .single()
}

export async function listarPeriodosFerias({
  supabase,
  empresaId,
  cicloId,
  funcionarioId,
  incluirArquivados = false
}) {
  const empresa = validarEmpresaId(empresaId)
  const ciclo = validarCicloId(cicloId)
  const funcionario = validarFuncionarioId(funcionarioId)

  let query = selecionarPorEmpresa(supabase, TABELA_FERIAS_PERIODOS, empresa, PERIODO_FERIAS_SELECT)
    .eq('ciclo_ferias_id', ciclo)
    .eq('funcionario_id', funcionario)
    .order('data_inicio', { ascending: false })

  if (!incluirArquivados) {
    query = query.eq('arquivado', false)
  }

  return query
}

export async function listarPeriodosFeriasAgenda({
  supabase,
  empresaId,
  dataInicioMinima,
  dataInicioMaxima
}) {
  const empresa = validarEmpresaId(empresaId)

  let query = selecionarPorEmpresa(supabase, TABELA_FERIAS_PERIODOS, empresa, PERIODO_FERIAS_SELECT)
    .eq('arquivado', false)
    .eq('status', 'agendada')
    .not('data_inicio', 'is', null)
    .order('data_inicio', { ascending: true })

  if (dataInicioMinima) {
    query = query.gte('data_inicio', normalizarDataObrigatoria(dataInicioMinima))
  }

  if (dataInicioMaxima) {
    query = query.lte('data_inicio', normalizarDataObrigatoria(dataInicioMaxima))
  }

  return query
}

export async function obterPeriodoFeriasPorId({ supabase, empresaId, periodoId }) {
  const empresa = validarEmpresaId(empresaId)
  const id = validarPeriodoId(periodoId)

  return selecionarPorEmpresa(supabase, TABELA_FERIAS_PERIODOS, empresa, PERIODO_FERIAS_SELECT)
    .eq('id', id)
    .maybeSingle()
}

export async function criarPeriodoFerias({
  supabase,
  empresaId,
  cicloId,
  funcionarioId,
  dataInicio,
  quantidadeDias,
  numeroParcela,
  status = 'agendada'
}) {
  const empresa = validarEmpresaId(empresaId)
  const ciclo = validarCicloId(cicloId)
  const funcionario = validarFuncionarioId(funcionarioId)
  const cicloFerias = await carregarCicloParaOperacao({ supabase, empresaId: empresa, cicloId: ciclo })
  if (cicloFerias.funcionario_id !== funcionario) {
    throw new Error('Ciclo de ferias nao pertence ao funcionario informado.')
  }

  const periodosAtivos = await carregarPeriodosAtivosDoCiclo({
    supabase,
    empresaId: empresa,
    cicloId: ciclo,
    funcionarioId: funcionario
  })
  const parcela = numeroParcela ? normalizarNumeroParcela(numeroParcela) : calcularProximaParcela(periodosAtivos)

  const payloadBase = montarPayloadPeriodoBase({
    dataInicio,
    quantidadeDias,
    numeroParcela: parcela,
    status
  })

  validarSaldoParaPeriodo({
    ciclo: cicloFerias,
    periodosAtivos,
    quantidadeDias: payloadBase.quantidade_dias,
    status: payloadBase.status
  })

  const payload = {
    ...payloadBase,
    empresa_id: empresa,
    ciclo_ferias_id: ciclo,
    funcionario_id: funcionario,
    arquivado: false,
    arquivado_em: null
  }

  return inserirComEmpresa(supabase, TABELA_FERIAS_PERIODOS, payload, { select: PERIODO_FERIAS_SELECT })
    .single()
}

export async function atualizarPeriodoFerias({ supabase, empresaId, periodoId, dados }) {
  const empresa = validarEmpresaId(empresaId)
  const id = validarPeriodoId(periodoId)
  const entrada = garantirSemCamposBloqueados(dados, [
    'id',
    'empresa_id',
    'empresaId',
    'ciclo_ferias_id',
    'cicloFeriasId',
    'funcionario_id',
    'funcionarioId',
    'data_fim_calculada',
    'dataFimCalculada',
    'data_retorno_trabalho',
    'dataRetornoTrabalho',
    'arquivado',
    'arquivado_em',
    'criado_em',
    'atualizado_em'
  ])
  const { data: periodoAtual, error } = await obterPeriodoFeriasPorId({ supabase, empresaId: empresa, periodoId: id })
  if (error) throw error
  if (!periodoAtual) throw new Error('Periodo de ferias nao encontrado.')

  const cicloFerias = await carregarCicloParaOperacao({
    supabase,
    empresaId: empresa,
    cicloId: periodoAtual.ciclo_ferias_id
  })
  const periodosAtivos = await carregarPeriodosAtivosDoCiclo({
    supabase,
    empresaId: empresa,
    cicloId: periodoAtual.ciclo_ferias_id,
    funcionarioId: periodoAtual.funcionario_id
  })

  const dataInicio = obterCampo(entrada, 'data_inicio', 'dataInicio', periodoAtual.data_inicio)
  const quantidadeDias = obterCampo(entrada, 'quantidade_dias', 'quantidadeDias', periodoAtual.quantidade_dias)
  const numeroParcela = obterCampo(entrada, 'numero_parcela', 'numeroParcela', periodoAtual.numero_parcela)
  const status = Object.prototype.hasOwnProperty.call(entrada, 'status')
    ? entrada.status
    : periodoAtual.status

  const payload = montarPayloadPeriodoBase({
    dataInicio,
    quantidadeDias,
    numeroParcela,
    status
  })

  validarSaldoParaPeriodo({
    ciclo: cicloFerias,
    periodosAtivos,
    quantidadeDias: payload.quantidade_dias,
    status: payload.status,
    periodoIgnoradoId: id
  })

  return atualizarPorEmpresa(supabase, TABELA_FERIAS_PERIODOS, id, empresa, payload)
    .select(PERIODO_FERIAS_SELECT)
    .single()
}

export async function arquivarPeriodoFerias({ supabase, empresaId, periodoId }) {
  const empresa = validarEmpresaId(empresaId)
  const id = validarPeriodoId(periodoId)

  return atualizarPorEmpresa(supabase, TABELA_FERIAS_PERIODOS, id, empresa, {
    arquivado: true,
    arquivado_em: new Date().toISOString()
  })
    .select(PERIODO_FERIAS_SELECT)
    .single()
}

export async function reativarPeriodoFerias({ supabase, empresaId, periodoId }) {
  const empresa = validarEmpresaId(empresaId)
  const id = validarPeriodoId(periodoId)
  const { data: periodoAtual, error } = await obterPeriodoFeriasPorId({ supabase, empresaId: empresa, periodoId: id })
  if (error) throw error
  if (!periodoAtual) throw new Error('Periodo de ferias nao encontrado.')

  const cicloFerias = await carregarCicloParaOperacao({
    supabase,
    empresaId: empresa,
    cicloId: periodoAtual.ciclo_ferias_id
  })
  const periodosAtivos = await carregarPeriodosAtivosDoCiclo({
    supabase,
    empresaId: empresa,
    cicloId: periodoAtual.ciclo_ferias_id,
    funcionarioId: periodoAtual.funcionario_id
  })

  validarSaldoParaPeriodo({
    ciclo: cicloFerias,
    periodosAtivos,
    quantidadeDias: periodoAtual.quantidade_dias,
    status: periodoAtual.status,
    periodoIgnoradoId: id
  })

  return atualizarPorEmpresa(supabase, TABELA_FERIAS_PERIODOS, id, empresa, {
    arquivado: false,
    arquivado_em: null
  })
    .select(PERIODO_FERIAS_SELECT)
    .single()
}
