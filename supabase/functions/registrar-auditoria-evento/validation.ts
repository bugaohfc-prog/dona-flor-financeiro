export const ACAO_CONTA_CRIADA = 'financeiro.conta.criada'
export const ACAO_CONTA_ATUALIZADA = 'financeiro.conta.atualizada'
export const ACAO_PAGAMENTO_PARCIAL_CRIADO = 'financeiro.pagamento_parcial.criado'
export const ENTIDADE_CONTA = 'df_contas'
export const ENTIDADE_PAGAMENTO = 'df_contas_pagamentos'

export const ACOES_FINANCEIRAS_ADICIONAIS = [
  'financeiro.conta.baixada',
  'financeiro.conta.pagamento_corrigido',
  'financeiro.conta.baixa_estornada',
  'financeiro.pagamento_parcial.estornado',
  'financeiro.importacao.contas_concluida',
  'financeiro.recorrencias.planejamento_90_dias'
] as const

export const ACOES_USUARIOS = [
  'administracao.usuario.convite_criado',
  'administracao.usuario.acesso_enviado',
  'administracao.usuario.perfil_alterado',
  'administracao.usuario.filiais_alteradas'
] as const

export const ACOES_RH = [
  'rh.funcionario.criado',
  'rh.funcionario.atualizado',
  'rh.funcionario.arquivado',
  'rh.funcionario.reativado',
  'folha.competencia.criada',
  'folha.competencia.atualizada',
  'folha.competencia.arquivada',
  'folha.competencia.reativada',
  'folha.lancamento.criado',
  'folha.lancamento.atualizado',
  'folha.lancamento.arquivado',
  'folha.lancamento.reativado',
  'folha.item.criado',
  'folha.item.atualizado',
  'folha.item.arquivado'
] as const

const ACOES_ATIVADAS = new Set([
  ACAO_CONTA_CRIADA,
  ACAO_CONTA_ATUALIZADA,
  ACAO_PAGAMENTO_PARCIAL_CRIADO,
  ...ACOES_FINANCEIRAS_ADICIONAIS,
  ...ACOES_USUARIOS,
  ...ACOES_RH
])

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const CAMPOS_CONTA_PERMITIDOS = new Set([
  'status',
  'valor',
  'vencimento',
  'centro_custo_alterado',
  'filial_alterada',
  'imposto_tipo_alterado',
  'campos',
  'conta_id',
  'correlation_id'
])
const CHAVE_SENSIVEL = /(cpf|cnpj|e_?mail|telefone|celular|token|sessao|session|senha|password|secret|favorecido|observacao|dados?_?banc|conta_?banc|agencia|pix|arquivo|anexo|request|payload|comprovante|base64)/i
const MAX_PROFUNDIDADE = 3
const MAX_ITENS_ARRAY = 30
const MAX_TEXTO = 240
const MAX_JSON = 4000

export type ResultadoValidacao<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string }

export function isUuid(valor: unknown) {
  return typeof valor === 'string' && UUID_PATTERN.test(valor)
}

export function acaoEstaAtivada(acao: unknown) {
  return typeof acao === 'string' && ACOES_ATIVADAS.has(acao)
}

export function validarEntidadeConta({
  entidadeTipo,
  entidadeId,
  empresaId,
  conta
}: {
  entidadeTipo: unknown
  entidadeId: unknown
  empresaId: unknown
  conta: Record<string, unknown> | null | undefined
}): ResultadoValidacao<Record<string, unknown>> {
  if (entidadeTipo !== ENTIDADE_CONTA) {
    return { ok: false, code: 'ENTIDADE_TIPO_INVALIDA', message: 'Tipo de entidade invalido.' }
  }
  if (!isUuid(entidadeId)) {
    return { ok: false, code: 'ENTIDADE_INVALIDA', message: 'Entidade invalida.' }
  }
  if (!isUuid(empresaId)) {
    return { ok: false, code: 'EMPRESA_INVALIDA', message: 'Empresa invalida.' }
  }
  if (!conta?.id || conta.id !== entidadeId || conta.empresa_id !== empresaId) {
    return { ok: false, code: 'ENTIDADE_NAO_AUTORIZADA', message: 'Entidade nao pertence a empresa.' }
  }
  return { ok: true, data: conta }
}

function isPlainObject(valor: unknown): valor is Record<string, unknown> {
  return Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor)
}

function sanitizarValor(valor: unknown, profundidade: number, camposPermitidos: ReadonlySet<string>): ResultadoValidacao<unknown> {
  if (profundidade > MAX_PROFUNDIDADE) {
    return { ok: false, code: 'DADOS_PROFUNDIDADE_EXCEDIDA', message: 'Dados de auditoria invalidos.' }
  }
  if (valor === null || valor === undefined || typeof valor === 'boolean') return { ok: true, data: valor ?? null }
  if (typeof valor === 'number') {
    return Number.isFinite(valor)
      ? { ok: true, data: Math.round((valor + Number.EPSILON) * 100) / 100 }
      : { ok: false, code: 'DADOS_INVALIDOS', message: 'Dados de auditoria invalidos.' }
  }
  if (typeof valor === 'string') return { ok: true, data: valor.slice(0, MAX_TEXTO) }
  if (Array.isArray(valor)) {
    if (valor.length > MAX_ITENS_ARRAY) {
      return { ok: false, code: 'DADOS_LIMITE_EXCEDIDO', message: 'Dados de auditoria excedem o limite.' }
    }
    const itens: unknown[] = []
    for (const item of valor) {
      const resultado = sanitizarValor(item, profundidade + 1, camposPermitidos)
      if (!resultado.ok) return resultado
      itens.push(resultado.data)
    }
    return { ok: true, data: itens }
  }
  if (!isPlainObject(valor)) {
    return { ok: false, code: 'DADOS_INVALIDOS', message: 'Dados de auditoria invalidos.' }
  }

  const objeto: Record<string, unknown> = {}
  for (const [chave, conteudo] of Object.entries(valor)) {
    const normalizada = chave.trim().toLowerCase()
    if (CHAVE_SENSIVEL.test(normalizada) || !camposPermitidos.has(normalizada)) {
      return { ok: false, code: 'CAMPO_NAO_PERMITIDO', message: 'Dados de auditoria contem campo nao permitido.' }
    }
    const resultado = sanitizarValor(conteudo, profundidade + 1, camposPermitidos)
    if (!resultado.ok) return resultado
    objeto[normalizada] = resultado.data
  }
  return { ok: true, data: objeto }
}

export function sanitizarDadosConta(valor: unknown): ResultadoValidacao<Record<string, unknown>> {
  return sanitizarDadosPorCampos(valor, CAMPOS_CONTA_PERMITIDOS)
}

export function sanitizarDadosPorCampos(
  valor: unknown,
  camposPermitidos: ReadonlySet<string>
): ResultadoValidacao<Record<string, unknown>> {
  if (valor === null || valor === undefined) return { ok: true, data: {} }
  if (!isPlainObject(valor)) {
    return { ok: false, code: 'DADOS_INVALIDOS', message: 'Dados de auditoria invalidos.' }
  }
  const resultado = sanitizarValor(valor, 0, camposPermitidos)
  if (!resultado.ok) return resultado
  const data = resultado.data as Record<string, unknown>
  if (JSON.stringify(data).length > MAX_JSON) {
    return { ok: false, code: 'DADOS_LIMITE_EXCEDIDO', message: 'Dados de auditoria excedem o limite.' }
  }
  return { ok: true, data }
}

export function resolverCorrelationIdConta(acao: string, entidadeId: string, correlationId: unknown): ResultadoValidacao<string> {
  if (acao === ACAO_CONTA_CRIADA) {
    return { ok: true, data: `${ACAO_CONTA_CRIADA}:${entidadeId}` }
  }
  if (acao === ACAO_CONTA_ATUALIZADA) {
    const valor = String(correlationId || '').trim()
    if (!valor || valor.length > 180) {
      return { ok: false, code: 'CORRELATION_ID_OBRIGATORIO', message: 'Referencia da operacao obrigatoria.' }
    }
    return { ok: true, data: valor }
  }
  return { ok: false, code: 'ACAO_NAO_ATIVADA', message: 'Acao de auditoria ainda nao ativada.' }
}
