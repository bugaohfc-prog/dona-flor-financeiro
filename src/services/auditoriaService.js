const ACAO_VALIDA = /^[a-z0-9_]+\.[a-z0-9_]+\.[a-z0-9_]+$/

const MODULOS = new Map([
  ['administracao', 'usuarios'],
  ['folha', 'rh'],
  ['auditoria', 'sistema']
])

const SEVERIDADES = new Map([
  ['alta', 'critical'],
  ['critica', 'critical'],
  ['crítica', 'critical'],
  ['media', 'warning'],
  ['média', 'warning'],
  ['atencao', 'warning'],
  ['atenção', 'warning']
])

const STATUS = new Map([
  ['erro', 'falha'],
  ['failed', 'falha'],
  ['blocked', 'bloqueado']
])

const CHAVES_PROIBIDAS = new Set([
  'observacao', 'observacao_pagamento', 'comprovante', 'anexo', 'arquivo',
  'link', 'base64', 'cpf', 'cnpj', 'email', 'token', 'secret', 'senha',
  'password', 'request', 'payload', 'conta', 'pagamento'
])

const CHAVE_SENSIVEL = /(cpf|cnpj|e_?mail|telefone|celular|token|senha|password|secret|conta_bancaria|dados_bancarios|agencia_bancaria|chave_pix)/i

function normalizarTexto(valor) {
  return String(valor || '').trim().toLowerCase()
}

function gerarCorrelationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function sanitizarValor(valor, profundidade = 0) {
  if (profundidade > 5) return '[conteudo_omitido]'
  if (Array.isArray(valor)) return valor.slice(0, 100).map((item) => sanitizarValor(item, profundidade + 1))
  if (!valor || typeof valor !== 'object') {
    if (typeof valor === 'string') return valor.slice(0, 500)
    return valor
  }

  return Object.fromEntries(Object.entries(valor).flatMap(([chave, conteudo]) => {
    const normalizada = normalizarTexto(chave)
    if (CHAVES_PROIBIDAS.has(normalizada) || CHAVE_SENSIVEL.test(normalizada)) return []
    return [[chave, sanitizarValor(conteudo, profundidade + 1)]]
  }))
}

function normalizarModulo(modulo) {
  const valor = normalizarTexto(modulo)
  return MODULOS.get(valor) || valor || 'sistema'
}

function normalizarSeveridade(severidade) {
  const valor = normalizarTexto(severidade)
  if (['info', 'warning', 'critical'].includes(valor)) return valor
  return SEVERIDADES.get(valor) || 'info'
}

function normalizarStatus(status) {
  const valor = normalizarTexto(status)
  if (['sucesso', 'falha', 'bloqueado'].includes(valor)) return valor
  return STATUS.get(valor) || 'sucesso'
}

async function obterCodigoErro(error) {
  let codigo = error?.name || error?.code || 'ERRO_AUDITORIA'
  try {
    const detalhe = await error?.context?.clone?.().json()
    codigo = detalhe?.code || codigo
  } catch {
    // Nem toda falha de transporte possui resposta JSON.
  }
  return String(codigo || 'ERRO_AUDITORIA').slice(0, 80)
}

export async function registrarEventoAuditoria(supabase, payload = {}) {
  if (!supabase || !payload?.empresa_id || !payload?.entidade_id || !payload?.acao) {
    throw new Error('Contexto de auditoria incompleto.')
  }
  if (!ACAO_VALIDA.test(payload.acao)) {
    throw new Error(`Ação de auditoria inválida: ${payload.acao}`)
  }

  const body = {
    empresa_id: payload.empresa_id,
    acao: payload.acao,
    entidade_tipo: payload.entidade_tipo || 'sistema',
    entidade_id: payload.entidade_id,
    modulo: normalizarModulo(payload.modulo),
    origem: normalizarTexto(payload.origem) || 'app',
    severidade: normalizarSeveridade(payload.severidade),
    status: normalizarStatus(payload.status),
    dados_antes: payload.dados_antes ? sanitizarValor(payload.dados_antes) : null,
    dados_depois: payload.dados_depois ? sanitizarValor(payload.dados_depois) : null,
    metadados: sanitizarValor(payload.metadados || {}),
    correlation_id: String(payload.correlation_id || gerarCorrelationId()).slice(0, 180)
  }

  const resposta = await supabase.functions.invoke('registrar-auditoria-evento', { body })
  if (resposta?.error) {
    const codigo = await obterCodigoErro(resposta.error)
    const error = new Error(`Falha ao registrar auditoria (${codigo}).`)
    error.code = codigo
    throw error
  }
  if (resposta?.data?.ok === false) {
    const codigo = String(resposta.data.code || 'AUDITORIA_REJEITADA').slice(0, 80)
    const error = new Error(`Falha ao registrar auditoria (${codigo}).`)
    error.code = codigo
    throw error
  }
  return resposta
}

export async function registrarEventoAuditoriaSeguro(supabase, payload, contexto = 'evento') {
  try {
    const resposta = await registrarEventoAuditoria(supabase, payload)
    return { data: resposta?.data ?? null, error: null }
  } catch (error) {
    console.warn(`Falha ao registrar auditoria de ${contexto}.`, {
      message: error?.message,
      code: error?.code
    })
    return { data: null, error }
  }
}
