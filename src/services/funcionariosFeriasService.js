import { selecionarPorEmpresa } from './supabaseQueryService.js'
import { assertEmpresaId } from './tenantService.js'
import {
  calcularFimPeriodoFerias,
  calcularRetornoPeriodoFerias,
  calcularSaldoDiasFerias,
  calcularStatusCicloFerias,
  normalizarDataCivilFerias,
  resumirCicloFerias
} from './funcionariosFeriasRules.js'

export {
  calcularSaldoDiasFerias,
  calcularStatusCicloFerias,
  resumirCicloFerias
} from './funcionariosFeriasRules.js'

const TABELA_FERIAS_CICLOS = 'df_funcionarios_ferias_ciclos'
const TABELA_FERIAS_PERIODOS = 'df_funcionarios_ferias_periodos'

const CICLO_FERIAS_SELECT = [
  'id', 'empresa_id', 'funcionario_id', 'periodo_aquisitivo_inicio',
  'periodo_aquisitivo_fim', 'data_limite_gozo', 'dias_direito', 'status',
  'arquivado', 'arquivado_em', 'criado_em', 'atualizado_em',
  `periodos:df_funcionarios_ferias_periodos (
    id, empresa_id, ciclo_ferias_id, funcionario_id, data_inicio, quantidade_dias,
    data_fim_calculada, data_retorno_trabalho, numero_parcela, status,
    arquivado, arquivado_em, criado_em, atualizado_em
  )`
].join(', ')

const PERIODO_FERIAS_SELECT = [
  'id', 'empresa_id', 'ciclo_ferias_id', 'funcionario_id', 'data_inicio',
  'quantidade_dias', 'data_fim_calculada', 'data_retorno_trabalho',
  'numero_parcela', 'status', 'arquivado', 'arquivado_em', 'criado_em', 'atualizado_em'
].join(', ')

function normalizarId(valor, mensagem) {
  const id = String(valor || '').trim()
  if (!id) throw new Error(mensagem)
  return id
}

function validarEmpresaId(empresaId) {
  return assertEmpresaId(String(empresaId || '').trim())
}

function validarData(valor, mensagem) {
  const data = normalizarDataCivilFerias(valor)
  if (!data) throw new Error(mensagem)
  return data
}

function validarInteiroPositivo(valor, mensagem) {
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero <= 0) throw new Error(mensagem)
  return numero
}

function validarMotivo(valor) {
  const motivo = String(valor || '').trim()
  if (motivo.length < 5) throw new Error('Informe o motivo administrativo do ajuste.')
  return motivo
}

async function rpc(supabase, nome, argumentos) {
  if (!supabase?.rpc) throw new Error('Cliente Supabase indisponivel para operacao de ferias.')
  const resposta = await supabase.rpc(nome, argumentos)
  if (resposta?.error || !resposta?.data || typeof resposta.data !== 'object') return resposta
  const entidade = resposta.data.periodo || resposta.data.ciclo || resposta.data
  return {
    ...resposta,
    data: entidade && typeof entidade === 'object'
      ? { ...entidade, resumo_ferias: resposta.data.resumo || null }
      : entidade
  }
}

export function calcularFimFerias(dataInicio, quantidadeDias) {
  return calcularFimPeriodoFerias(dataInicio, quantidadeDias)
}

export function calcularRetornoTrabalho(dataInicio, quantidadeDias) {
  return calcularRetornoPeriodoFerias(dataInicio, quantidadeDias)
}

export async function listarCiclosFerias({ supabase, empresaId, funcionarioId, incluirArquivados = false }) {
  const empresa = validarEmpresaId(empresaId)
  const funcionario = normalizarId(funcionarioId, 'Funcionario nao identificado.')
  let query = selecionarPorEmpresa(supabase, TABELA_FERIAS_CICLOS, empresa, CICLO_FERIAS_SELECT)
    .eq('funcionario_id', funcionario)
    .order('periodo_aquisitivo_inicio', { ascending: false })
  if (!incluirArquivados) query = query.eq('arquivado', false)
  return query
}

export async function listarTodosCiclosFerias({ supabase, empresaId, incluirArquivados = false }) {
  const empresa = validarEmpresaId(empresaId)
  let query = selecionarPorEmpresa(supabase, TABELA_FERIAS_CICLOS, empresa, CICLO_FERIAS_SELECT)
    .order('periodo_aquisitivo_inicio', { ascending: false })
  if (!incluirArquivados) query = query.eq('arquivado', false)
  return query
}

export async function listarTodosPeriodosFerias({ supabase, empresaId, incluirArquivados = false }) {
  const empresa = validarEmpresaId(empresaId)
  let query = selecionarPorEmpresa(supabase, TABELA_FERIAS_PERIODOS, empresa, PERIODO_FERIAS_SELECT)
    .order('data_inicio', { ascending: false })
  if (!incluirArquivados) query = query.eq('arquivado', false)
  return query
}

export async function obterCicloFeriasPorId({ supabase, empresaId, cicloId }) {
  const empresa = validarEmpresaId(empresaId)
  const id = normalizarId(cicloId, 'Ciclo de ferias nao identificado.')
  return selecionarPorEmpresa(supabase, TABELA_FERIAS_CICLOS, empresa, CICLO_FERIAS_SELECT)
    .eq('id', id)
    .maybeSingle()
}

export function criarCicloFerias({ supabase, empresaId, funcionarioId, dados = {} }) {
  return rpc(supabase, 'criar_ciclo_ferias_controlado', {
    p_empresa_id: validarEmpresaId(empresaId),
    p_funcionario_id: normalizarId(funcionarioId, 'Funcionario nao identificado.'),
    p_periodo_aquisitivo_inicio: validarData(dados.periodo_aquisitivo_inicio, 'Informe o inicio do periodo aquisitivo.'),
    p_periodo_aquisitivo_fim: validarData(dados.periodo_aquisitivo_fim, 'Informe o fim do periodo aquisitivo.'),
    p_data_limite_gozo: validarData(dados.data_limite_gozo, 'Informe a data limite de gozo.'),
    p_dias_direito: validarInteiroPositivo(dados.dias_direito ?? 30, 'Dias de direito deve ser maior que zero.')
  })
}

export function atualizarCicloFerias({ supabase, empresaId, cicloId, dados = {} }) {
  return rpc(supabase, 'ajustar_dias_ciclo_ferias_controlado', {
    p_empresa_id: validarEmpresaId(empresaId),
    p_ciclo_id: normalizarId(cicloId, 'Ciclo de ferias nao identificado.'),
    p_dias_direito: validarInteiroPositivo(dados.dias_direito, 'Dias de direito deve ser maior que zero.'),
    p_motivo: validarMotivo(dados.motivo)
  })
}

function alterarEstadoCiclo({ supabase, empresaId, cicloId, acao }) {
  return rpc(supabase, 'alterar_estado_ciclo_ferias_controlado', {
    p_empresa_id: validarEmpresaId(empresaId),
    p_ciclo_id: normalizarId(cicloId, 'Ciclo de ferias nao identificado.'),
    p_acao: acao
  })
}

export function arquivarCicloFerias(parametros) {
  return alterarEstadoCiclo({ ...parametros, acao: 'arquivar' })
}

export function reativarCicloFerias(parametros) {
  return alterarEstadoCiclo({ ...parametros, acao: 'reativar' })
}

export async function listarPeriodosFerias({ supabase, empresaId, cicloId, funcionarioId, incluirArquivados = false }) {
  const empresa = validarEmpresaId(empresaId)
  const ciclo = normalizarId(cicloId, 'Ciclo de ferias nao identificado.')
  const funcionario = normalizarId(funcionarioId, 'Funcionario nao identificado.')
  let query = selecionarPorEmpresa(supabase, TABELA_FERIAS_PERIODOS, empresa, PERIODO_FERIAS_SELECT)
    .eq('ciclo_ferias_id', ciclo)
    .eq('funcionario_id', funcionario)
    .order('data_inicio', { ascending: false })
  if (!incluirArquivados) query = query.eq('arquivado', false)
  return query
}

export async function listarPeriodosFeriasAgenda({ supabase, empresaId, dataInicioMinima, dataInicioMaxima }) {
  const empresa = validarEmpresaId(empresaId)
  let query = selecionarPorEmpresa(supabase, TABELA_FERIAS_PERIODOS, empresa, PERIODO_FERIAS_SELECT)
    .eq('arquivado', false)
    .neq('status', 'cancelada')
    .not('data_inicio', 'is', null)
    .order('data_inicio', { ascending: true })
  if (dataInicioMinima) query = query.gte('data_inicio', validarData(dataInicioMinima, 'Data inicial invalida.'))
  if (dataInicioMaxima) query = query.lte('data_inicio', validarData(dataInicioMaxima, 'Data final invalida.'))
  return query
}

export async function obterPeriodoFeriasPorId({ supabase, empresaId, periodoId }) {
  const empresa = validarEmpresaId(empresaId)
  const id = normalizarId(periodoId, 'Periodo de ferias nao identificado.')
  return selecionarPorEmpresa(supabase, TABELA_FERIAS_PERIODOS, empresa, PERIODO_FERIAS_SELECT)
    .eq('id', id)
    .maybeSingle()
}

export function criarPeriodoFerias({ supabase, empresaId, cicloId, dataInicio, quantidadeDias }) {
  return rpc(supabase, 'criar_periodo_ferias_controlado', {
    p_empresa_id: validarEmpresaId(empresaId),
    p_ciclo_id: normalizarId(cicloId, 'Ciclo de ferias nao identificado.'),
    p_data_inicio: validarData(dataInicio, 'Informe a data de inicio das ferias.'),
    p_quantidade_dias: validarInteiroPositivo(quantidadeDias, 'Quantidade de dias deve ser maior que zero.')
  })
}

export function atualizarPeriodoFerias({ supabase, empresaId, periodoId, dados = {} }) {
  return rpc(supabase, 'atualizar_periodo_ferias_controlado', {
    p_empresa_id: validarEmpresaId(empresaId),
    p_periodo_id: normalizarId(periodoId, 'Periodo de ferias nao identificado.'),
    p_data_inicio: validarData(dados.dataInicio ?? dados.data_inicio, 'Informe a data de inicio das ferias.'),
    p_quantidade_dias: validarInteiroPositivo(dados.quantidadeDias ?? dados.quantidade_dias, 'Quantidade de dias deve ser maior que zero.')
  })
}

function alterarEstadoPeriodo({ supabase, empresaId, periodoId, acao }) {
  return rpc(supabase, 'alterar_estado_periodo_ferias_controlado', {
    p_empresa_id: validarEmpresaId(empresaId),
    p_periodo_id: normalizarId(periodoId, 'Periodo de ferias nao identificado.'),
    p_acao: acao
  })
}

export function cancelarPeriodoFerias(parametros) {
  return alterarEstadoPeriodo({ ...parametros, acao: 'cancelar' })
}

export function arquivarPeriodoFerias(parametros) {
  return alterarEstadoPeriodo({ ...parametros, acao: 'arquivar' })
}

export function reativarPeriodoFerias(parametros) {
  return alterarEstadoPeriodo({ ...parametros, acao: 'reativar' })
}
