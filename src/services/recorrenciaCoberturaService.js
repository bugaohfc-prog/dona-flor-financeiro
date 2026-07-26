import { inserirComEmpresa, selecionarPorEmpresa } from './supabaseQueryService.js'
import { executarConsultaPaginada } from './supabasePaginationService.js'
import { assertEmpresaId } from './tenantService.js'
import {
  detectarConflitoOcorrencia,
  mensagemBloqueioAcao,
  montarPreviaPayloadGeracao,
  validarOcorrenciaParaGeracao,
  validarVinculoManualConfirmado
} from '../utils/recorrenciaAcoesControladas.js'

const COLUNAS_SERIES = 'id, empresa_id, descricao, observacao, valor, valor_variavel, dia_vencimento, tipo_recorrencia, ativo, data_inicio, data_fim, filial_id, centro_custo_id'
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
  return conta && conta.excluido !== true && conta.deletado !== true && conta.oculto !== true
}

function contaCobreOcorrencia(conta, recorrenciaId, dataVencimento) {
  return conta?.excluido !== true
    && conta?.deletado !== true
    && conta?.recorrencia_id === recorrenciaId
    && String(conta?.data_vencimento || '').slice(0, 10) === String(dataVencimento || '').slice(0, 10)
}

function perfilAdministrativo(perfil) {
  return ['admin', 'master', 'owner', 'superadmin', 'super_admin'].includes(String(perfil || '').trim().toLowerCase())
}

export async function validarPermissaoVinculoRecorrencia(supabase, empresaId) {
  const { data: autenticacao, error: erroAutenticacao } = await supabase.auth.getUser()
  const usuario = autenticacao?.user
  if (erroAutenticacao || !usuario?.id) return { autorizado: false, error: erroAutenticacao || null }

  const { data: isMaster, error: erroMaster } = await supabase.rpc('is_master')
  if (!erroMaster && isMaster === true) return { autorizado: true, perfil: 'master', error: null }

  let consulta = supabase
    .from('df_usuarios_empresas')
    .select('perfil')
    .eq('empresa_id', empresaId)
    .eq('user_id', usuario.id)
    .limit(1)

  let { data: vinculo, error } = await consulta.maybeSingle()
  if (!vinculo && !error && usuario.email) {
    consulta = supabase
      .from('df_usuarios_empresas')
      .select('perfil')
      .eq('empresa_id', empresaId)
      .eq('email', String(usuario.email).trim().toLowerCase())
      .limit(1)
    ;({ data: vinculo, error } = await consulta.maybeSingle())
  }

  if (error) return { autorizado: false, error }
  return { autorizado: perfilAdministrativo(vinculo?.perfil), perfil: vinculo?.perfil || null, error: null }
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

async function consultarContasOcorrencia(supabase, { empresaId, recorrenciaId, dataVencimento }) {
  return executarConsultaPaginada(() => selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTAS)
    .eq('recorrencia_id', recorrenciaId)
    .eq('data_vencimento', String(dataVencimento).slice(0, 10))
    .or('excluido.is.null,excluido.eq.false')
    .or('deletado.is.null,deletado.eq.false')
    .order('id', { ascending: true }))
}

export async function gerarOcorrenciaRecorrencia(supabase, {
  empresaId,
  recorrenciaId,
  dataVencimento,
  competencia,
  configuracao = {}
} = {}) {
  assertEmpresaId(empresaId)
  if (!recorrenciaId || !dataVencimento) return resultadoBloqueado('DADOS_INCOMPLETOS')

  const permissao = await validarPermissaoVinculoRecorrencia(supabase, empresaId)
  if (permissao.error) return { data: null, error: permissao.error }
  if (!permissao.autorizado) return resultadoBloqueado('SEM_PERMISSAO')

  const { data: serie, error: erroSerie } = await selecionarPorEmpresa(
    supabase,
    'df_contas_recorrentes',
    empresaId,
    COLUNAS_SERIES
  ).eq('id', recorrenciaId).maybeSingle()
  if (erroSerie) return { data: null, error: erroSerie }
  if (!serie) return resultadoBloqueado('DADOS_INCOMPLETOS')

  const { data: contasOcorrencia, error: erroContas } = await consultarContasOcorrencia(supabase, {
    empresaId,
    recorrenciaId,
    dataVencimento
  })
  if (erroContas) return { data: null, error: erroContas }

  const vinculadas = (contasOcorrencia || []).filter((conta) => contaCobreOcorrencia(conta, recorrenciaId, dataVencimento))
  if (vinculadas.length > 1) return resultadoBloqueado('OCORRENCIA_DUPLICADA')
  if (vinculadas.length === 1) {
    return {
      data: vinculadas[0],
      error: null,
      bloqueado: false,
      idempotente: true,
      auditoriaNecessaria: false
    }
  }

  const ocorrencia = {
    recorrenciaId,
    serie,
    dataVencimento: String(dataVencimento).slice(0, 10),
    competencia: competencia || null,
    cobertura: 'faltante',
    contasVinculadas: []
  }
  const previa = montarPreviaPayloadGeracao({
    empresaId,
    ocorrencia,
    autorizado: true,
    contas: vinculadas,
    configuracao
  })
  if (!previa.elegivel) return resultadoBloqueado(previa.codigo)

  const respostaInsercao = await inserirComEmpresa(supabase, 'df_contas', previa.payload, {
    select: COLUNAS_CONTAS
  }).maybeSingle()

  if (erroDoIndiceProtegido(respostaInsercao.error)) {
    const reconciliacao = await consultarContasOcorrencia(supabase, { empresaId, recorrenciaId, dataVencimento })
    if (reconciliacao.error) return { data: null, error: reconciliacao.error }
    const atuais = (reconciliacao.data || []).filter((conta) => contaCobreOcorrencia(conta, recorrenciaId, dataVencimento))
    if (atuais.length === 1) {
      return {
        data: atuais[0],
        error: null,
        bloqueado: false,
        idempotente: true,
        auditoriaNecessaria: false,
        reconciliado: true
      }
    }
    return resultadoBloqueado(atuais.length > 1 ? 'OCORRENCIA_DUPLICADA' : 'CONFLITO_INDICE')
  }
  if (respostaInsercao.error) return { data: null, error: respostaInsercao.error }
  if (!respostaInsercao.data) return resultadoBloqueado('CONFLITO_INDICE')

  return {
    data: respostaInsercao.data,
    error: null,
    bloqueado: false,
    idempotente: false,
    auditoriaNecessaria: true
  }
}

export async function vincularContaManualRecorrencia(supabase, { empresaId, contaId, recorrenciaId, dataVencimento } = {}) {
  assertEmpresaId(empresaId)
  if (!contaId || !recorrenciaId || !dataVencimento) return resultadoBloqueado('DADOS_INCOMPLETOS')

  const permissao = await validarPermissaoVinculoRecorrencia(supabase, empresaId)
  if (permissao.error) return { data: null, error: permissao.error }
  if (!permissao.autorizado) return resultadoBloqueado('SEM_PERMISSAO')

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

  const { data: contasOcorrencia, error: erroConflito } = await consultarContasOcorrencia(supabase, {
    empresaId,
    recorrenciaId,
    dataVencimento
  })
  if (erroConflito) return { data: null, error: erroConflito }

  const ocorrencia = {
    recorrenciaId,
    serie,
    dataVencimento: String(dataVencimento).slice(0, 10),
    competencia: conta.competencia || null,
    contasVinculadas: (contasOcorrencia || []).filter((item) => item.id !== conta.id)
  }
  const validacao = validarVinculoManualConfirmado({ empresaId, serie, conta, ocorrencia, autorizado: true })
  if (!validacao.elegivel) return resultadoBloqueado(validacao.codigo)
  const conflito = detectarConflitoOcorrencia({ ocorrencia, contas: [] })
  if (conflito.duplicada) return resultadoBloqueado('OCORRENCIA_DUPLICADA')
  if (conflito.existe) return resultadoBloqueado('OCORRENCIA_COBERTA')

  let consultaAtualizacao = supabase
    .from('df_contas')
    .update({ recorrencia_id: recorrenciaId })
    .eq('id', contaId)
    .eq('empresa_id', empresaId)
    .eq('data_vencimento', String(dataVencimento).slice(0, 10))
    .is('recorrencia_id', null)
    .or('oculto.is.null,oculto.eq.false')
    .or('excluido.is.null,excluido.eq.false')
    .or('deletado.is.null,deletado.eq.false')

  consultaAtualizacao = conta.filial_id
    ? consultaAtualizacao.eq('filial_id', conta.filial_id)
    : consultaAtualizacao.is('filial_id', null)
  consultaAtualizacao = conta.centro_custo_id
    ? consultaAtualizacao.eq('centro_custo_id', conta.centro_custo_id)
    : consultaAtualizacao.is('centro_custo_id', null)

  const respostaAtualizacao = await consultaAtualizacao
    .select(COLUNAS_CONTAS)
    .maybeSingle()

  if (erroDoIndiceProtegido(respostaAtualizacao.error)) return resultadoBloqueado('CONFLITO_INDICE')
  if (respostaAtualizacao.error) return { data: null, error: respostaAtualizacao.error }
  if (!respostaAtualizacao.data) {
    const [{ data: serieAtual, error: erroSerieAtual }, { data: contaAtual, error: erroContaAtual }] = await Promise.all([
      selecionarPorEmpresa(supabase, 'df_contas_recorrentes', empresaId, COLUNAS_SERIES).eq('id', recorrenciaId).maybeSingle(),
      selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTAS).eq('id', contaId).maybeSingle()
    ])
    if (erroSerieAtual) return { data: null, error: erroSerieAtual }
    if (erroContaAtual) return { data: null, error: erroContaAtual }
    if (contaAtiva(contaAtual) && contaAtual?.recorrencia_id === recorrenciaId && String(contaAtual?.data_vencimento || '').slice(0, 10) === String(dataVencimento).slice(0, 10)) {
      return { data: contaAtual, error: null, bloqueado: false, idempotente: true, auditoriaNecessaria: false }
    }
    const validacaoAtual = validarVinculoManualConfirmado({
      empresaId,
      serie: serieAtual,
      conta: contaAtual,
      ocorrencia: {
        recorrenciaId,
        serie: serieAtual,
        dataVencimento: String(dataVencimento).slice(0, 10),
        contasVinculadas: []
      },
      autorizado: true
    })
    return resultadoBloqueado(validacaoAtual.elegivel ? 'CONFLITO_INDICE' : validacaoAtual.codigo)
  }

  return { data: respostaAtualizacao.data, error: null, bloqueado: false, idempotente: false, auditoriaNecessaria: true }
}
