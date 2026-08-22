import { selecionarPorEmpresa } from './supabaseQueryService.js'
import { assertEmpresaId } from './tenantService.js'

const TABELA = 'df_funcionarios_desligamentos'
const SELECT_WORKFLOW = [
  'id',
  'empresa_id',
  'funcionario_id',
  'estado',
  'motivo',
  'data_efetiva',
  'observacoes',
  'aberto_por',
  'aberto_em',
  'atualizado_em',
  'cancelado_por',
  'cancelado_em',
  'motivo_cancelamento',
  'concluido_por',
  'concluido_em',
  'correlation_id'
].join(', ')

function texto(valor) {
  const normalizado = String(valor || '').trim().replace(/\s+/g, ' ')
  return normalizado || null
}

function idObrigatorio(valor, mensagem) {
  const id = String(valor || '').trim()
  if (!id) throw new Error(mensagem)
  return id
}

function dataObrigatoria(valor) {
  const data = String(valor || '').trim().slice(0, 10)
  if (!data) throw new Error('Informe o último dia pretendido.')
  return data
}

function motivoObrigatorio(valor, mensagem = 'Informe o motivo do desligamento.') {
  const motivo = texto(valor)
  if (!motivo || motivo.length < 3) throw new Error(mensagem)
  return motivo
}

export function listarDesligamentosFuncionario({ supabase, empresaId, funcionarioId = null }) {
  assertEmpresaId(empresaId)
  let query = selecionarPorEmpresa(supabase, TABELA, empresaId, SELECT_WORKFLOW)
    .order('aberto_em', { ascending: false })

  if (funcionarioId) {
    query = query.eq('funcionario_id', idObrigatorio(funcionarioId, 'Funcionário não identificado.'))
  }

  return query
}

export function abrirDesligamentoFuncionario({ supabase, empresaId, funcionarioId, dados = {} }) {
  assertEmpresaId(empresaId)
  return supabase.rpc('abrir_desligamento_funcionario_controlado', {
    p_empresa_id: empresaId,
    p_funcionario_id: idObrigatorio(funcionarioId, 'Funcionário não identificado.'),
    p_motivo: motivoObrigatorio(dados.motivo),
    p_data_efetiva: dataObrigatoria(dados.dataEfetiva),
    p_observacoes: texto(dados.observacoes),
    p_correlation_id: texto(dados.correlationId)
  })
}

export function atualizarDesligamentoFuncionario({ supabase, empresaId, desligamentoId, dados = {} }) {
  assertEmpresaId(empresaId)
  return supabase.rpc('atualizar_desligamento_funcionario_controlado', {
    p_empresa_id: empresaId,
    p_desligamento_id: idObrigatorio(desligamentoId, 'Processo de desligamento não identificado.'),
    p_motivo: motivoObrigatorio(dados.motivo),
    p_data_efetiva: dataObrigatoria(dados.dataEfetiva),
    p_observacoes: texto(dados.observacoes),
    p_correlation_id: texto(dados.correlationId)
  })
}

export function cancelarDesligamentoFuncionario({ supabase, empresaId, desligamentoId, motivoCancelamento, correlationId = null }) {
  assertEmpresaId(empresaId)
  return supabase.rpc('cancelar_desligamento_funcionario_controlado', {
    p_empresa_id: empresaId,
    p_desligamento_id: idObrigatorio(desligamentoId, 'Processo de desligamento não identificado.'),
    p_motivo_cancelamento: motivoObrigatorio(motivoCancelamento, 'Informe o motivo do cancelamento.'),
    p_correlation_id: texto(correlationId)
  })
}

export function concluirDesligamentoFuncionario({ supabase, empresaId, desligamentoId, correlationId = null }) {
  assertEmpresaId(empresaId)
  return supabase.rpc('concluir_desligamento_funcionario_controlado', {
    p_empresa_id: empresaId,
    p_desligamento_id: idObrigatorio(desligamentoId, 'Processo de desligamento não identificado.'),
    p_correlation_id: texto(correlationId)
  })
}
