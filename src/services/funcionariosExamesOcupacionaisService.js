import { selecionarPorEmpresa } from './supabaseQueryService.js'
import { assertEmpresaId } from './tenantService.js'

const TABELA_EXAMES_OCUPACIONAIS = 'df_funcionarios_exames_ocupacionais'
const TIPOS = new Set(['ADMISSIONAL', 'PERIODICO', 'DEMISSIONAL'])
const ESTADOS = new Set(['PENDENTE', 'REALIZADO', 'CANCELADO'])

export const EXAME_OCUPACIONAL_SELECT = [
  'id',
  'empresa_id',
  'funcionario_id',
  'tipo',
  'estado',
  'data_prevista',
  'data_realizada',
  'origem',
  'legado_tipo',
  'legado_id',
  'arquivado',
  'arquivado_em',
  'criado_em',
  'atualizado_em'
].join(', ')

function texto(valor) {
  return String(valor || '').trim()
}

function validarId(valor, mensagem) {
  const id = texto(valor)
  if (!id) throw new Error(mensagem)
  return id
}

function normalizarOpcao(valor, opcoes, mensagem) {
  const opcao = texto(valor).toUpperCase()
  if (!opcoes.has(opcao)) throw new Error(mensagem)
  return opcao
}

function normalizarData(valor) {
  const data = texto(valor).slice(0, 10)
  return data || null
}

function montarDadosExame({ tipo, estado, dataPrevista = null, dataRealizada = null }) {
  const tipoNormalizado = normalizarOpcao(tipo, TIPOS, 'Tipo de exame ocupacional inválido.')
  const estadoNormalizado = normalizarOpcao(estado, ESTADOS, 'Estado de exame ocupacional inválido.')
  const prevista = normalizarData(dataPrevista)
  const realizada = normalizarData(dataRealizada)

  if (estadoNormalizado === 'REALIZADO' && !realizada) {
    throw new Error('Informe a data realizada do exame ocupacional.')
  }
  if (estadoNormalizado === 'PENDENTE' && (!prevista || realizada)) {
    throw new Error('Exame pendente exige data prevista e não aceita data realizada.')
  }
  if (estadoNormalizado === 'CANCELADO' && realizada) {
    throw new Error('Exame cancelado não aceita data realizada.')
  }

  return {
    tipo: tipoNormalizado,
    estado: estadoNormalizado,
    dataPrevista: prevista,
    dataRealizada: realizada
  }
}

function criarConsultaEmpresa(supabase, empresaId, incluirArquivados) {
  const empresa = assertEmpresaId(texto(empresaId))
  let query = selecionarPorEmpresa(
    supabase,
    TABELA_EXAMES_OCUPACIONAIS,
    empresa,
    EXAME_OCUPACIONAL_SELECT
  ).order('data_realizada', { ascending: false, nullsFirst: false })

  if (!incluirArquivados) query = query.eq('arquivado', false)
  return query
}

export function listarExamesOcupacionaisEmpresa({
  supabase,
  empresaId,
  incluirArquivados = false
}) {
  return criarConsultaEmpresa(supabase, empresaId, incluirArquivados)
}

export function listarExamesOcupacionaisFuncionario({
  supabase,
  empresaId,
  funcionarioId,
  incluirArquivados = false
}) {
  const funcionario = validarId(funcionarioId, 'Funcionário não identificado.')
  return criarConsultaEmpresa(supabase, empresaId, incluirArquivados)
    .eq('funcionario_id', funcionario)
}

export async function registrarExameOcupacionalControlado({
  supabase,
  empresaId,
  funcionarioId,
  tipo,
  estado,
  dataPrevista = null,
  dataRealizada = null,
  correlationId = null
}) {
  const empresa = assertEmpresaId(texto(empresaId))
  const funcionario = validarId(funcionarioId, 'Funcionário não identificado.')
  const dados = montarDadosExame({ tipo, estado, dataPrevista, dataRealizada })

  return supabase.rpc('registrar_exame_ocupacional_controlado', {
    p_empresa_id: empresa,
    p_funcionario_id: funcionario,
    p_tipo: dados.tipo,
    p_estado: dados.estado,
    p_data_prevista: dados.dataPrevista,
    p_data_realizada: dados.dataRealizada,
    p_correlation_id: texto(correlationId) || null
  })
}

export async function atualizarExameOcupacionalControlado({
  supabase,
  empresaId,
  exameId,
  tipo,
  estado,
  dataPrevista = null,
  dataRealizada = null,
  correlationId = null
}) {
  const empresa = assertEmpresaId(texto(empresaId))
  const exame = validarId(exameId, 'Exame ocupacional não identificado.')
  const dados = montarDadosExame({ tipo, estado, dataPrevista, dataRealizada })

  return supabase.rpc('atualizar_exame_ocupacional_controlado', {
    p_empresa_id: empresa,
    p_exame_id: exame,
    p_tipo: dados.tipo,
    p_estado: dados.estado,
    p_data_prevista: dados.dataPrevista,
    p_data_realizada: dados.dataRealizada,
    p_correlation_id: texto(correlationId) || null
  })
}

export async function arquivarExameOcupacionalControlado({
  supabase,
  empresaId,
  exameId,
  correlationId = null
}) {
  const empresa = assertEmpresaId(texto(empresaId))
  const exame = validarId(exameId, 'Exame ocupacional não identificado.')

  return supabase.rpc('arquivar_exame_ocupacional_controlado', {
    p_empresa_id: empresa,
    p_exame_id: exame,
    p_correlation_id: texto(correlationId) || null
  })
}
