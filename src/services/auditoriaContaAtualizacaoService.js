const ACAO_ATUALIZACAO_CONTA = 'financeiro.conta.atualizada'
const ENTIDADE_CONTA = 'df_contas'
const LIMITE_CORRELATION_ID = 180

function textoSeguro(valor, fallback) {
  const texto = String(valor || fallback || '').replace(/[\r\n\t]+/g, ' ').trim()
  return texto.slice(0, 160)
}

export function criarCorrelationIdAtualizacaoConta(contaId, operationUuid) {
  const conta = String(contaId || '').trim()
  const operacao = String(operationUuid || '').trim()

  if (!conta || !operacao) {
    throw new Error('Não foi possível identificar a operação de atualização da conta.')
  }

  const correlationId = `${ACAO_ATUALIZACAO_CONTA}:${conta}:${operacao}`
  if (correlationId.length > LIMITE_CORRELATION_ID) {
    throw new Error('Identificador da operação de atualização excede o limite permitido.')
  }

  return correlationId
}

export function montarPayloadAuditoriaAtualizacaoConta({
  empresaId,
  contaId,
  correlationId
}) {
  return {
    empresa_id: empresaId,
    acao: ACAO_ATUALIZACAO_CONTA,
    entidade_tipo: ENTIDADE_CONTA,
    entidade_id: contaId,
    modulo: 'financeiro',
    origem: 'app',
    severidade: 'media',
    status: 'sucesso',
    dados_antes: null,
    dados_depois: {
      campos: ['descricao', 'valor', 'vencimento', 'centro_custo', 'filial', 'imposto_tipo']
    },
    metadados: { conta_id: contaId },
    correlation_id: correlationId
  }
}

export async function registrarAuditoriaAtualizacaoConta({
  supabase,
  empresaId,
  contaId,
  correlationId
}) {
  const payload = montarPayloadAuditoriaAtualizacaoConta({
    empresaId,
    contaId,
    correlationId
  })

  try {
    const response = await supabase.functions.invoke('registrar-auditoria-evento', {
      body: payload
    })
    const rejeitada = response?.data?.ok === false

    if (response?.error || rejeitada) {
      const code = textoSeguro(
        response?.data?.code || response?.error?.code || response?.error?.name,
        'AUDITORIA_NAO_REGISTRADA'
      )
      const message = rejeitada
        ? textoSeguro(response?.data?.message, 'A auditoria da atualização foi rejeitada.')
        : 'Falha de transporte ao registrar a auditoria da atualização.'

      console.warn('Falha ao registrar auditoria da atualização da conta.', { code, message })
      return { data: response?.data ?? null, error: response?.error || new Error(message), code, message }
    }

    return { data: response?.data ?? null, error: null, code: null, message: null }
  } catch {
    const code = 'AUDITORIA_INDISPONIVEL'
    const message = 'Falha inesperada ao registrar a auditoria da atualização.'
    console.warn('Falha ao registrar auditoria da atualização da conta.', { code, message })
    return { data: null, error: new Error(message), code, message }
  }
}
