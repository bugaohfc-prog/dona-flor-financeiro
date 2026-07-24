import { selecionarPorEmpresa } from './supabaseQueryService.js'
import { executarConsultaPaginada } from './supabasePaginationService.js'
import { assertEmpresaId } from './tenantService.js'
import { detectarConflitoOcorrencia, mensagemBloqueioAcao, validarVinculoManualConfirmado } from '../utils/recorrenciaAcoesControladas.js'

const COLUNAS_SERIES = 'id, empresa_id, descricao, valor, valor_variavel, dia_vencimento, tipo_recorrencia, ativo, data_inicio, filial_id, centro_custo_id'
const COLUNAS_CONTAS = 'id, empresa_id, descricao, valor, data_vencimento, competencia, imposto_tipo, status, recorrencia_id, filial_id, centro_custo_id, oculto, excluido, deletado'
const INDICE_RECORRENCIA_ATIVA = 'uq_df_contas_recorrencia_vencimento_ativas'

function resultadoBloqueado(codigo) {
  return { data: null, error: null, bloqueado: true, codigo, mensagem: codigo === 'CONFLITO_INDICE' ? 'Outra conta cobriu esta ocorrencia antes da confirmacao. Atualize a cobertura.' : mensagemBloqueioAcao(codigo) }
}

function erroDoIndiceProtegido(error) {
  const texto = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase()
  return error?.code === '23505' && texto.includes(INDICE_RECORRENCIA_ATIVA.toLowerCase())
}

function contaAtiva(conta) {
  return conta && conta.excluido !== true && conta.deletado !== true
}

export async function consultarCoberturaRecorrencias(supabase, { empresaId, inicio, fim } = {}) {
  assertEmpresaId(empresaId)
  const [respostaSeries, respostaContas] = await Promise.all([
    executarConsultaPaginada(() => selecionarPorEmpresa(supabase, 'df_contas_recorrentes', empresaId, COLUNAS_SERIES)
      .order('descricao', { ascending: true }).order('id', { ascending: true })),
    executarConsultaPaginada(() => selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTAS)
      .or(`and(data_vencimento.gte.${inicio},data_vencimento.lte.${fim}),and(competencia.gte.${inicio},competencia.lte.${fim})`)
      .order('data_vencimento', { ascending: true }).order('id', { ascending: true }))
  ])
  if (respostaSeries.error) return { data: null, error: respostaSeries.error }
  if (respostaContas.error) return { data: null, error: respostaContas.error }
  return { data: { series: respostaSeries.data || [], contas: respostaContas.data || [] }, error: null }
}

export async function vincularContaManualRecorrencia(supabase, { empresaId, contaId, recorrenciaId, dataVencimento, autorizado = false } = {}) {
  assertEmpresaId(empresaId)
  if (!contaId || !recorrenciaId || !dataVencimento) return resultadoBloqueado('DADOS_INCOMPLETOS')

  const [{ data: serie, error: erroSerie }, { data: conta, error: erroConta }] = await Promise.all([
    selecionarPorEmpresa(supabase, 'df_contas_recorrentes', empresaId, COLUNAS_SERIES).eq('id', recorrenciaId).maybeSingle(),
    selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTAS).eq('id', contaId).maybeSingle()
  ])
  if (erroSerie) return { data: null, error: erroSerie }
  if (erroConta) return { data: null, error: erroConta }
  if (!serie || !conta) return resultadoBloqueado('DADOS_INCOMPLETOS')
  if (contaAtiva(conta) && conta.recorrencia_id === recorrenciaId && String(conta.data_vencimento || '').slice(0, 10) === String(dataVencimento).slice(0, 10)) {
    return { data: conta, error: null, bloqueado: false, idempotente: true, auditoriaNecessaria: false }
  }

  const { data: contasOcorrencia, error: erroConflito } = await executarConsultaPaginada(() => selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTAS)
    .eq('recorrencia_id', recorrenciaId)
    .eq('data_vencimento', String(dataVencimento).slice(0, 10))
    .or('excluido.is.null,excluido.eq.false')
    .or('deletado.is.null,deletado.eq.false')
    .order('id', { ascending: true }))
  if (erroConflito) return { data: null, error: erroConflito }

  const ocorrencia = {
    recorrenciaId,
    serie,
    dataVencimento: String(dataVencimento).slice(0, 10),
    competencia: conta.competencia || null,
    contasVinculadas: (contasOcorrencia || []).filter((item) => item.id !== conta.id)
  }
  const validacao = validarVinculoManualConfirmado({ empresaId, serie, conta, ocorrencia, autorizado })
  if (!validacao.elegivel) return resultadoBloqueado(validacao.codigo)
  const conflito = detectarConflitoOcorrencia({ ocorrencia, contas: [] })
  if (conflito.duplicada) return resultadoBloqueado('OCORRENCIA_DUPLICADA')
  if (conflito.existe) return resultadoBloqueado('OCORRENCIA_COBERTA')

  const respostaAtualizacao = await supabase
    .from('df_contas')
    .update({ recorrencia_id: recorrenciaId })
    .eq('id', contaId)
    .eq('empresa_id', empresaId)
    .is('recorrencia_id', null)
    .or('excluido.is.null,excluido.eq.false')
    .or('deletado.is.null,deletado.eq.false')
    .select(COLUNAS_CONTAS)
    .maybeSingle()

  if (erroDoIndiceProtegido(respostaAtualizacao.error)) return resultadoBloqueado('CONFLITO_INDICE')
  if (respostaAtualizacao.error) return { data: null, error: respostaAtualizacao.error }
  if (!respostaAtualizacao.data) {
    const { data: contaAtual, error } = await selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTAS).eq('id', contaId).maybeSingle()
    if (error) return { data: null, error }
    if (contaAtiva(contaAtual) && contaAtual?.recorrencia_id === recorrenciaId && String(contaAtual?.data_vencimento || '').slice(0, 10) === String(dataVencimento).slice(0, 10)) {
      return { data: contaAtual, error: null, bloqueado: false, idempotente: true, auditoriaNecessaria: false }
    }
    return resultadoBloqueado(contaAtual?.recorrencia_id ? 'CONTA_JA_VINCULADA' : 'DADOS_INCOMPLETOS')
  }

  return { data: respostaAtualizacao.data, error: null, bloqueado: false, idempotente: false, auditoriaNecessaria: true }
}
