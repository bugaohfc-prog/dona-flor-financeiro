const INDICE_RECORRENCIA_ATIVA = 'uq_df_contas_recorrencia_vencimento_ativas'
const texto = (valor) => String(valor || '').trim()
const mesmaEmpresa = (empresaId, entidade) => Boolean(texto(empresaId) && texto(entidade?.empresa_id) === texto(empresaId))

export const AUDITORIA_ACOES_RECORRENCIAS = Object.freeze({
  escritaDisponivel: false,
  exigeConfirmacaoExplicita: true,
  exigeIdempotencia: true,
  exigeBloqueioDuploClique: true,
  indiceAutoridadeFinal: INDICE_RECORRENCIA_ATIVA,
  permissoesMinimas: ['admin', 'master'],
  acoesAuditoriaAtivadas: false,
  auditoriaAtomicaComEscrita: false,
  limitacoes: [
    'A Edge Function rejeita ações não ativadas.',
    'A autorização administrativa precisa ser validada no servidor.',
    'A auditoria é uma chamada posterior e pode falhar depois da escrita.',
    'Vínculo e geração exigem reconciliação após conflito ou falha parcial.'
  ],
  impactosAposSucesso: ['Contas', 'Dashboard', 'Relatórios', 'Cobertura de recorrências']
})

export const CAMPOS_FUTUROS_ACOES_RECORRENCIAS = Object.freeze({
  vinculo: ['contaId', 'empresaId', 'recorrencia_id'],
  geracao: ['empresa_id', 'descricao', 'valor', 'data_vencimento', 'vencimento', 'centro_custo_id', 'filial_id', 'observacao', 'recorrencia_id', 'imposto_tipo', 'competencia', 'status', 'excluido', 'enviar_whatsapp', 'enviar_email', 'enviar_push', 'dias_aviso']
})

export function mensagemBloqueioAcao(codigo) {
  const mensagens = {
    ACAO_NAO_LIBERADA: 'Ação ainda não liberada. Revise os dados antes de continuar.',
    SEM_PERMISSAO: 'Somente Admin ou Master poderá concluir esta ação.',
    EMPRESA_INVALIDA: 'A conta e a recorrência devem pertencer à empresa ativa.',
    ORGANIZACAO_INCOMPATIVEL: 'Filial ou centro de custo incompatível com a recorrência.',
    CONTA_JA_VINCULADA: 'A conta manual já está vinculada a uma recorrência.',
    CONTA_INATIVA: 'Conta excluída ou deletada não pode ser vinculada.',
    OCORRENCIA_COBERTA: 'Já existe uma conta ativa para esta ocorrência.',
    OCORRENCIA_DUPLICADA: 'Há duplicidade nesta ocorrência; resolva-a antes de gerar.',
    RECORRENCIA_INATIVA: 'A recorrência precisa estar ativa.',
    DADOS_INCOMPLETOS: 'Dados obrigatórios da ação estão incompletos.'
  }
  return mensagens[codigo] || mensagens.ACAO_NAO_LIBERADA
}

function resultado(codigo = null) {
  return codigo ? { elegivel: false, codigo, mensagem: mensagemBloqueioAcao(codigo) } : { elegivel: true, codigo: null, mensagem: '' }
}

export function validarSugestaoParaVinculo({ empresaId, serie, conta, autorizado = false } = {}) {
  if (!autorizado) return resultado('SEM_PERMISSAO')
  if (!serie?.id || !conta?.id) return resultado('DADOS_INCOMPLETOS')
  if (!mesmaEmpresa(empresaId, serie) || !mesmaEmpresa(empresaId, conta)) return resultado('EMPRESA_INVALIDA')
  if (conta.excluido === true || conta.deletado === true) return resultado('CONTA_INATIVA')
  if (conta.recorrencia_id) return resultado('CONTA_JA_VINCULADA')
  if ((serie.filial_id && serie.filial_id !== conta.filial_id) || (serie.centro_custo_id && serie.centro_custo_id !== conta.centro_custo_id)) return resultado('ORGANIZACAO_INCOMPATIVEL')
  return resultado()
}

export function montarPreviaPayloadVinculo(contexto = {}) {
  const validacao = validarSugestaoParaVinculo(contexto)
  if (!validacao.elegivel) return { ...validacao, payload: null }
  return { ...validacao, payload: { contaId: contexto.conta.id, empresaId: contexto.empresaId, alteracoes: { recorrencia_id: contexto.serie.id } } }
}

export function detectarConflitoOcorrencia({ ocorrencia, contas = [] } = {}) {
  const candidatas = [...(ocorrencia?.contasVinculadas || []), ...(contas || [])]
  const vinculadas = Array.from(new Map(candidatas.filter((conta) => conta?.excluido !== true && conta?.deletado !== true && texto(conta?.recorrencia_id) === texto(ocorrencia?.recorrenciaId || ocorrencia?.serie?.id) && texto(conta?.data_vencimento).slice(0, 10) === texto(ocorrencia?.dataVencimento).slice(0, 10)).map((conta) => [conta.id, conta])).values())
  return { existe: vinculadas.length > 0, duplicada: vinculadas.length > 1, quantidade: vinculadas.length, indice: INDICE_RECORRENCIA_ATIVA }
}

export function validarOcorrenciaParaGeracao({ empresaId, ocorrencia, autorizado = false, contas = [] } = {}) {
  if (!autorizado) return resultado('SEM_PERMISSAO')
  const serie = ocorrencia?.serie
  if (!serie?.id || !ocorrencia?.dataVencimento) return resultado('DADOS_INCOMPLETOS')
  if (!mesmaEmpresa(empresaId, serie)) return resultado('EMPRESA_INVALIDA')
  if (serie.ativo !== true) return resultado('RECORRENCIA_INATIVA')
  const conflito = detectarConflitoOcorrencia({ ocorrencia, contas })
  if (conflito.duplicada) return resultado('OCORRENCIA_DUPLICADA')
  if (conflito.existe) return resultado('OCORRENCIA_COBERTA')
  return resultado()
}

export function montarPreviaPayloadGeracao(contexto = {}) {
  const validacao = validarOcorrenciaParaGeracao(contexto)
  if (!validacao.elegivel) return { ...validacao, payload: null }
  const { serie } = contexto.ocorrencia
  const dataVencimento = contexto.ocorrencia.dataVencimento
  const configuracao = contexto.configuracao || {}
  return { ...validacao, payload: {
    empresa_id: contexto.empresaId, descricao: serie.descricao, valor: Number(serie.valor || 0),
    data_vencimento: dataVencimento, vencimento: dataVencimento,
    centro_custo_id: serie.centro_custo_id || null, filial_id: serie.filial_id || null,
    observacao: serie.observacao || null, recorrencia_id: serie.id,
    imposto_tipo: contexto.ocorrencia.impostoTipo || null, competencia: contexto.ocorrencia.competencia || null,
    status: 'pendente', excluido: false,
    enviar_whatsapp: configuracao.enviar_whatsapp === true,
    enviar_email: configuracao.enviar_email === true,
    enviar_push: configuracao.enviar_push === true,
    dias_aviso: Number(configuracao.dias_aviso || 1)
  } }
}
