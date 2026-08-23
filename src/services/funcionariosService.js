import { atualizarPorEmpresa, selecionarPorEmpresa } from './supabaseQueryService.js'
import { assertEmpresaId } from './tenantService.js'

const TABELA_FUNCIONARIOS = 'df_funcionarios'
const FUNCIONARIO_LIST_SELECT = [
  'id',
  'empresa_id',
  'pessoa_id',
  'readmissao_origem_funcionario_id',
  'filial_id',
  'nome',
  'cargo',
  'data_nascimento',
  'data_admissao',
  'data_exame_admissional',
  'status',
  'arquivado',
  'arquivado_em'
].join(', ')

const FUNCIONARIO_DETAIL_SELECT = [
  'id',
  'empresa_id',
  'pessoa_id',
  'readmissao_origem_funcionario_id',
  'filial_id',
  'nome',
  'cpf',
  'cargo',
  'telefone',
  'email',
  'data_nascimento',
  'data_admissao',
  'data_exame_admissional',
  'status',
  'observacoes',
  'arquivado',
  'arquivado_em',
  'created_at',
  'updated_at'
].join(', ')

const STATUS_PERMITIDOS = new Set(['ativo', 'afastado', 'desligado'])

function validarFuncionarioId(funcionarioId) {
  const id = String(funcionarioId || '').trim()
  if (!id) throw new Error('Funcionario nao identificado.')
  return id
}

function normalizarTexto(valor) {
  const texto = String(valor || '').trim().replace(/\s+/g, ' ')
  return texto || null
}

function normalizarEmail(valor) {
  const email = String(valor || '').trim().toLowerCase()
  return email || null
}

function normalizarData(valor) {
  const texto = String(valor || '').trim()
  if (!texto) return null
  return texto.slice(0, 10)
}

function normalizarCpf(valor) {
  const textoOriginal = String(valor || '').trim()
  if (!textoOriginal) return null

  const cpf = textoOriginal.replace(/\D/g, '')
  if (cpf.length !== 11) {
    throw new Error('CPF deve conter 11 digitos.')
  }

  return cpf
}

function normalizarStatus(valor, obrigatorio = false) {
  const status = String(valor || '').trim().toLowerCase()
  if (!status && !obrigatorio) return undefined
  const statusFinal = status || 'ativo'

  if (!STATUS_PERMITIDOS.has(statusFinal)) {
    throw new Error('Status de funcionario invalido.')
  }

  return statusFinal
}

function garantirPayloadSemEmpresa(dados = {}) {
  if (Object.prototype.hasOwnProperty.call(dados, 'empresa_id')) {
    throw new Error('Empresa do funcionario deve vir apenas da empresa ativa.')
  }
}

function montarPayloadFuncionario(dados = {}, opcoes = {}) {
  const entrada = dados && typeof dados === 'object' ? dados : {}
  garantirPayloadSemEmpresa(entrada)

  if (Object.prototype.hasOwnProperty.call(entrada, 'data_admissao')) {
    throw new Error('A data de admissao deve ser alterada pela operacao controlada.')
  }

  const payload = {}

  if (opcoes.criacao || Object.prototype.hasOwnProperty.call(entrada, 'nome')) {
    const nome = normalizarTexto(entrada.nome)
    if (!nome) throw new Error('Informe o nome do funcionario.')
    payload.nome = nome
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'cpf')) {
    payload.cpf = normalizarCpf(entrada.cpf)
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'cargo')) {
    payload.cargo = normalizarTexto(entrada.cargo)
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'telefone')) {
    payload.telefone = normalizarTexto(entrada.telefone)
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'email')) {
    payload.email = normalizarEmail(entrada.email)
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'data_nascimento')) {
    payload.data_nascimento = normalizarData(entrada.data_nascimento)
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'data_exame_admissional')) {
    payload.data_exame_admissional = normalizarData(entrada.data_exame_admissional)
  }

  if (opcoes.criacao || Object.prototype.hasOwnProperty.call(entrada, 'status')) {
    const status = normalizarStatus(entrada.status, opcoes.criacao)
    if (status) payload.status = status
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'observacoes')) {
    payload.observacoes = normalizarTexto(entrada.observacoes)
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'filial_id')) {
    payload.filial_id = normalizarTexto(entrada.filial_id)
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('Nenhum dado de funcionario informado para salvar.')
  }

  return payload
}

export async function listarFuncionarios({ supabase, empresaId, incluirArquivados = false }) {
  assertEmpresaId(empresaId)

  let query = selecionarPorEmpresa(supabase, TABELA_FUNCIONARIOS, empresaId, FUNCIONARIO_LIST_SELECT)
    .order('nome', { ascending: true })

  if (!incluirArquivados) {
    query = query.eq('arquivado', false)
  }

  return query
}

export async function obterFuncionarioPorId({ supabase, empresaId, funcionarioId }) {
  assertEmpresaId(empresaId)
  const id = validarFuncionarioId(funcionarioId)

  return selecionarPorEmpresa(supabase, TABELA_FUNCIONARIOS, empresaId, FUNCIONARIO_DETAIL_SELECT)
    .eq('id', id)
    .maybeSingle()
}

export async function criarFuncionario({ supabase, empresaId, dados }) {
  assertEmpresaId(empresaId)

  const entrada = dados && typeof dados === 'object' ? dados : {}
  const payload = {
    ...montarPayloadFuncionario(
      Object.fromEntries(Object.entries(entrada).filter(([chave]) => chave !== 'data_admissao')),
      { criacao: true }
    ),
    data_admissao: normalizarData(entrada.data_admissao)
  }

  const resultado = await supabase.rpc('criar_funcionario_com_pessoa_controlado', {
    p_empresa_id: empresaId,
    p_dados: payload,
    p_correlation_id: null
  })

  return {
    ...resultado,
    cicloCriadoId: resultado?.data?.ciclo_criado_id || null
  }
}

export async function atualizarFuncionario({ supabase, empresaId, funcionarioId, dados }) {
  assertEmpresaId(empresaId)
  const id = validarFuncionarioId(funcionarioId)
  const payload = montarPayloadFuncionario(dados)

  return supabase.rpc('atualizar_funcionario_pessoa_vinculo_controlado', {
    p_empresa_id: empresaId,
    p_funcionario_id: id,
    p_dados: payload,
    p_correlation_id: null
  })
}

export async function alterarAdmissaoFuncionarioControlada({
  supabase,
  empresaId,
  funcionarioId,
  novaDataAdmissao,
  somentePreflight = false,
  confirmarCiclosPreservados = false,
  motivo = null,
  correlationId = null
}) {
  assertEmpresaId(empresaId)
  const id = validarFuncionarioId(funcionarioId)
  const dataAdmissao = normalizarData(novaDataAdmissao)

  return supabase.rpc('alterar_admissao_funcionario_controlado', {
    p_empresa_id: empresaId,
    p_funcionario_id: id,
    p_nova_data_admissao: dataAdmissao,
    p_somente_preflight: Boolean(somentePreflight),
    p_confirmar_ciclos_preservados: Boolean(confirmarCiclosPreservados),
    p_motivo: normalizarTexto(motivo),
    p_correlation_id: normalizarTexto(correlationId)
  })
}

export async function readmitirPessoaControlada({
  supabase,
  empresaId,
  vinculoAnteriorId,
  requestKey,
  novaDataAdmissao,
  filialId = null,
  cargo = null,
  dataExameAdmissional = null,
  correlationId = null
}) {
  assertEmpresaId(empresaId)
  const vinculoId = validarFuncionarioId(vinculoAnteriorId)
  const chave = String(requestKey || '').trim()
  const dataAdmissao = normalizarData(novaDataAdmissao)

  if (chave.length < 16 || chave.length > 200) {
    throw new Error('Chave de seguranca da readmissao invalida.')
  }
  if (!dataAdmissao) {
    throw new Error('Informe a nova data de admissao.')
  }

  const resultado = await supabase.rpc('readmitir_pessoa_controlado', {
    p_empresa_id: empresaId,
    p_vinculo_anterior_id: vinculoId,
    p_request_key: chave,
    p_nova_data_admissao: dataAdmissao,
    p_filial_id: normalizarTexto(filialId),
    p_cargo: normalizarTexto(cargo),
    p_data_exame_admissional: normalizarData(dataExameAdmissional),
    p_correlation_id: normalizarTexto(correlationId)
  })

  return {
    ...resultado,
    cicloCriadoId: resultado?.data?.ciclo_criado_id || null
  }
}

export async function arquivarFuncionario({ supabase, empresaId, funcionarioId }) {
  assertEmpresaId(empresaId)
  const id = validarFuncionarioId(funcionarioId)

  return atualizarPorEmpresa(supabase, TABELA_FUNCIONARIOS, id, empresaId, {
    arquivado: true,
    arquivado_em: new Date().toISOString()
  })
    .select(FUNCIONARIO_LIST_SELECT)
    .single()
}

export async function reativarFuncionario({ supabase, empresaId, funcionarioId }) {
  assertEmpresaId(empresaId)
  const id = validarFuncionarioId(funcionarioId)

  return atualizarPorEmpresa(supabase, TABELA_FUNCIONARIOS, id, empresaId, {
    arquivado: false,
    arquivado_em: null
  })
    .select(FUNCIONARIO_LIST_SELECT)
    .single()
}
