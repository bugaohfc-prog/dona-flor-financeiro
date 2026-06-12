import {
  atualizarPorEmpresa,
  inserirComEmpresa,
  selecionarPorEmpresa
} from './supabaseQueryService'
import { assertEmpresaId } from './tenantService'

const TABELA_EXAMES_PERIODICOS = 'df_funcionarios_exames_periodicos'
const EXAME_PERIODICO_SELECT = [
  'id',
  'empresa_id',
  'funcionario_id',
  'data_exame',
  'arquivado',
  'arquivado_em',
  'criado_em',
  'atualizado_em'
].join(', ')

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

function validarExameId(exameId) {
  const id = normalizarId(exameId)
  if (!id) throw new Error('Exame periodico nao identificado.')
  return id
}

function normalizarDataObrigatoria(valor) {
  const texto = String(valor || '').trim().slice(0, 10)
  if (!texto) throw new Error('Informe a data do exame periodico.')

  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    throw new Error('Data do exame periodico invalida.')
  }

  const [ano, mes, dia] = texto.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)

  if (
    Number.isNaN(data.getTime()) ||
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    throw new Error('Data do exame periodico invalida.')
  }

  return texto
}

function criarDataLocal(dataReferencia) {
  if (!dataReferencia) return null
  if (dataReferencia instanceof Date) {
    return Number.isNaN(dataReferencia.getTime()) ? null : dataReferencia
  }

  const texto = String(dataReferencia).trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null

  const [ano, mes, dia] = texto.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)

  if (
    Number.isNaN(data.getTime()) ||
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return null
  }

  return data
}

function formatarDataISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function calcularProximoPeriodico(dataReferencia) {
  const data = criarDataLocal(dataReferencia)
  if (!data) return null

  const proximaData = new Date(data)
  proximaData.setFullYear(proximaData.getFullYear() + 1)
  return formatarDataISO(proximaData)
}

export async function listarExamesPeriodicos({
  supabase,
  empresaId,
  funcionarioId,
  incluirArquivados = false
}) {
  const empresa = validarEmpresaId(empresaId)
  const funcionario = validarFuncionarioId(funcionarioId)

  let query = selecionarPorEmpresa(supabase, TABELA_EXAMES_PERIODICOS, empresa, EXAME_PERIODICO_SELECT)
    .eq('funcionario_id', funcionario)
    .order('data_exame', { ascending: false })

  if (!incluirArquivados) {
    query = query.eq('arquivado', false)
  }

  return query
}

export async function listarExamesPeriodicosAgenda({
  supabase,
  empresaId
}) {
  const empresa = validarEmpresaId(empresaId)

  return selecionarPorEmpresa(supabase, TABELA_EXAMES_PERIODICOS, empresa, EXAME_PERIODICO_SELECT)
    .eq('arquivado', false)
    .order('data_exame', { ascending: false })
}

export async function criarExamePeriodico({
  supabase,
  empresaId,
  funcionarioId,
  dataExame
}) {
  const empresa = validarEmpresaId(empresaId)
  const funcionario = validarFuncionarioId(funcionarioId)
  const dataNormalizada = normalizarDataObrigatoria(dataExame)

  const payload = {
    empresa_id: empresa,
    funcionario_id: funcionario,
    data_exame: dataNormalizada,
    arquivado: false,
    arquivado_em: null
  }

  return inserirComEmpresa(supabase, TABELA_EXAMES_PERIODICOS, payload, { select: EXAME_PERIODICO_SELECT })
    .single()
}

export async function atualizarExamePeriodico({
  supabase,
  empresaId,
  exameId,
  dataExame
}) {
  const empresa = validarEmpresaId(empresaId)
  const id = validarExameId(exameId)
  const dataNormalizada = normalizarDataObrigatoria(dataExame)

  return atualizarPorEmpresa(supabase, TABELA_EXAMES_PERIODICOS, id, empresa, {
    data_exame: dataNormalizada
  })
    .select(EXAME_PERIODICO_SELECT)
    .single()
}

export async function arquivarExamePeriodico({ supabase, empresaId, exameId }) {
  const empresa = validarEmpresaId(empresaId)
  const id = validarExameId(exameId)

  return atualizarPorEmpresa(supabase, TABELA_EXAMES_PERIODICOS, id, empresa, {
    arquivado: true,
    arquivado_em: new Date().toISOString()
  })
    .select(EXAME_PERIODICO_SELECT)
    .single()
}

export async function reativarExamePeriodico({ supabase, empresaId, exameId }) {
  const empresa = validarEmpresaId(empresaId)
  const id = validarExameId(exameId)

  return atualizarPorEmpresa(supabase, TABELA_EXAMES_PERIODICOS, id, empresa, {
    arquivado: false,
    arquivado_em: null
  })
    .select(EXAME_PERIODICO_SELECT)
    .single()
}

export async function obterUltimoExamePeriodico({ supabase, empresaId, funcionarioId }) {
  const empresa = validarEmpresaId(empresaId)
  const funcionario = validarFuncionarioId(funcionarioId)

  return selecionarPorEmpresa(supabase, TABELA_EXAMES_PERIODICOS, empresa, EXAME_PERIODICO_SELECT)
    .eq('funcionario_id', funcionario)
    .eq('arquivado', false)
    .order('data_exame', { ascending: false })
    .limit(1)
    .maybeSingle()
}
