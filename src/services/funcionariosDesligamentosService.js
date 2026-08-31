import { selecionarPorEmpresa } from './supabaseQueryService.js'
import { assertEmpresaId } from './tenantService.js'

const TABELA = 'df_funcionarios_desligamentos_efetivos'
const TABELA_CORRECOES = 'df_funcionarios_desligamentos_correcoes'
const SELECT_WORKFLOW = [
  'id',
  'empresa_id',
  'funcionario_id',
  'estado',
  'motivo',
  'data_efetiva',
  'data_acerto',
  'observacoes',
  'aberto_por',
  'aberto_em',
  'atualizado_em',
  'cancelado_por',
  'cancelado_em',
  'motivo_cancelamento',
  'concluido_por',
  'concluido_em',
  'correlation_id',
  'status_anterior',
  'data_efetiva_efetiva',
  'data_acerto_efetiva',
  'motivo_efetivo',
  'observacoes_efetivas',
  'efeito_revertido',
  'status_funcional_efetivo',
  'ultima_correcao_id',
  'ultima_correcao_tipo',
  'ultima_correcao_motivo',
  'ultima_correcao_em'
].join(', ')

const SELECT_CORRECAO = [
  'id', 'empresa_id', 'desligamento_id', 'funcionario_id', 'tipo', 'motivo_correcao',
  'data_efetiva_antes', 'data_efetiva_depois', 'data_acerto_antes', 'data_acerto_depois', 'motivo_antes', 'motivo_depois',
  'observacoes_antes', 'observacoes_depois', 'status_antes', 'status_depois',
  'ator_id', 'correlation_id', 'criado_em'
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

function dataObrigatoria(valor, mensagem) {
  const data = String(valor || '').trim().slice(0, 10)
  if (!data) throw new Error(mensagem)
  return data
}

function dataEfetivaObrigatoria(valor) {
  return dataObrigatoria(valor, 'Informe o último dia trabalhado.')
}

function dataAcertoObrigatoria(valor) {
  return dataObrigatoria(valor, 'Informe a data prevista do acerto.')
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

export function listarCorrecoesDesligamentos({ supabase, empresaId }) {
  assertEmpresaId(empresaId)
  return selecionarPorEmpresa(supabase, TABELA_CORRECOES, empresaId, SELECT_CORRECAO)
    .order('criado_em', { ascending: true })
}

export function abrirDesligamentoFuncionario({ supabase, empresaId, funcionarioId, dados = {} }) {
  assertEmpresaId(empresaId)
  return supabase.rpc('abrir_desligamento_funcionario_controlado', {
    p_empresa_id: empresaId,
    p_funcionario_id: idObrigatorio(funcionarioId, 'Funcionário não identificado.'),
    p_motivo: motivoObrigatorio(dados.motivo),
    p_data_efetiva: dataEfetivaObrigatoria(dados.dataEfetiva),
    p_data_acerto: dataAcertoObrigatoria(dados.dataAcerto),
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
    p_data_efetiva: dataEfetivaObrigatoria(dados.dataEfetiva),
    p_data_acerto: dataAcertoObrigatoria(dados.dataAcerto),
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

export function retificarDesligamentoConcluido({ supabase, empresaId, desligamentoId, dados = {} }) {
  assertEmpresaId(empresaId)
  return supabase.rpc('retificar_desligamento_concluido_controlado', {
    p_empresa_id: empresaId,
    p_desligamento_id: idObrigatorio(desligamentoId, 'Processo de desligamento não identificado.'),
    p_data_efetiva: dataEfetivaObrigatoria(dados.dataEfetiva),
    p_data_acerto: dataAcertoObrigatoria(dados.dataAcerto),
    p_motivo: motivoObrigatorio(dados.motivo),
    p_observacoes: texto(dados.observacoes),
    p_motivo_correcao: motivoObrigatorio(dados.motivoCorrecao, 'Informe o motivo da correção.'),
    p_correlation_id: texto(dados.correlationId)
  })
}

export function reverterDesligamentoConcluidoPorErro({ supabase, empresaId, desligamentoId, motivoReversao, correlationId = null }) {
  assertEmpresaId(empresaId)
  return supabase.rpc('reverter_desligamento_concluido_por_erro_controlado', {
    p_empresa_id: empresaId,
    p_desligamento_id: idObrigatorio(desligamentoId, 'Processo de desligamento não identificado.'),
    p_motivo_reversao: motivoObrigatorio(motivoReversao, 'Informe o motivo da reversão por erro.'),
    p_correlation_id: texto(correlationId)
  })
}
