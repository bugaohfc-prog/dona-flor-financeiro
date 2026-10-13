import { supabase } from '../lib/supabase.js'
import { assertEmpresaId } from './tenantService.js'
import { gerarCorrelationId } from '../utils/correlationId.js'

export const OBRIGACOES_OPERACIONAIS_SELECT = `
  id, empresa_id, desligamento_id, regra_codigo,
  responsavel_usuario_empresa_id, criada_por_usuario_empresa_id,
  titulo_snapshot, proxima_acao, terceiro_aguardado, estado, severidade,
  prazo_em, proxima_revisao_em, snooze_ate,
  resultado_resolucao, motivo_resolucao, resolvida_em, resolvida_por,
  motivo_cancelamento, cancelada_em, cancelada_por, criada_em, atualizada_em,
  responsavel:df_usuarios_empresas!df_obrigacoes_operacionais_responsavel_tenant_fk(
    id, user_id, usuario_id, nome, email, perfil, acesso_todas_filiais
  ),
  desligamento:df_funcionarios_desligamentos!df_obrigacoes_operacionais_desligamento_tenant_fk(
    id, funcionario_id, estado, data_efetiva,
    funcionario:df_funcionarios(id, nome, filial_id)
  )
`

function texto(valor) {
  return String(valor || '').trim()
}

function idObrigatorio(valor, mensagem) {
  const id = texto(valor)
  if (!id) throw new Error(mensagem)
  return id
}

function correlationId(valor) {
  return texto(valor) || gerarCorrelationId()
}

export async function listarObrigacoesOperacionais({ empresaId }) {
  const empresa = assertEmpresaId(texto(empresaId))
  const { data, error } = await supabase
    .from('df_obrigacoes_operacionais')
    .select(OBRIGACOES_OPERACIONAIS_SELECT)
    .eq('empresa_id', empresa)
    .order('atualizada_em', { ascending: false })

  if (error) throw error
  return data || []
}

export async function reatribuirObrigacaoOperacional({ empresaId, obrigacaoId, responsavelId, correlationId: cid }) {
  const empresa = assertEmpresaId(texto(empresaId))
  const { data, error } = await supabase.rpc('reatribuir_obrigacao_operacional_controlado', {
    p_empresa_id: empresa,
    p_obrigacao_id: idObrigatorio(obrigacaoId, 'Obrigação não identificada.'),
    p_responsavel_usuario_empresa_id: idObrigatorio(responsavelId, 'Selecione um responsável.'),
    p_correlation_id: correlationId(cid)
  })
  if (error) throw error
  return data
}

export async function atualizarAcompanhamentoObrigacao({
  empresaId,
  obrigacaoId,
  estado,
  terceiroAguardado = null,
  proximaRevisaoEm = null,
  snoozeMinutos = null,
  removerSnooze = false,
  correlationId: cid
}) {
  const empresa = assertEmpresaId(texto(empresaId))
  const estadoNormalizado = texto(estado).toUpperCase()
  if (!['ABERTA', 'AGUARDANDO_TERCEIRO'].includes(estadoNormalizado)) {
    throw new Error('Estado de acompanhamento inválido.')
  }

  const { data, error } = await supabase.rpc('atualizar_acompanhamento_obrigacao_controlado', {
    p_empresa_id: empresa,
    p_obrigacao_id: idObrigatorio(obrigacaoId, 'Obrigação não identificada.'),
    p_estado: estadoNormalizado,
    p_terceiro_aguardado: texto(terceiroAguardado) || null,
    p_proxima_revisao_em: texto(proximaRevisaoEm).slice(0, 10) || null,
    p_snooze_minutos: snoozeMinutos == null ? null : Number(snoozeMinutos),
    p_remover_snooze: removerSnooze === true,
    p_correlation_id: correlationId(cid)
  })
  if (error) throw error
  return data
}

export async function resolverObrigacaoOperacional({ empresaId, obrigacaoId, resultado, motivo = null, correlationId: cid }) {
  const empresa = assertEmpresaId(texto(empresaId))
  const resultadoNormalizado = texto(resultado).toUpperCase()
  if (!['CUMPRIDA', 'NAO_APLICAVEL', 'DISPENSADA'].includes(resultadoNormalizado)) {
    throw new Error('Resultado da obrigação inválido.')
  }

  const { data, error } = await supabase.rpc('resolver_obrigacao_operacional_controlado', {
    p_empresa_id: empresa,
    p_obrigacao_id: idObrigatorio(obrigacaoId, 'Obrigação não identificada.'),
    p_resultado: resultadoNormalizado,
    p_motivo: texto(motivo) || null,
    p_correlation_id: correlationId(cid)
  })
  if (error) throw error
  return data
}

export async function listarAuditoriaObrigacao({ empresaId, obrigacaoId }) {
  const empresa = assertEmpresaId(texto(empresaId))
  const { data, error } = await supabase
    .from('df_auditoria_eventos')
    .select('id, acao, motivo, dados_antes, dados_depois, metadados, correlation_id, created_at, user_id')
    .eq('empresa_id', empresa)
    .eq('entidade_tipo', 'obrigacao_operacional')
    .eq('entidade_id', idObrigatorio(obrigacaoId, 'Obrigação não identificada.'))
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
