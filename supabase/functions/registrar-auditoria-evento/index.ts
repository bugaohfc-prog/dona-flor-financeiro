import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  ACAO_CONTA_ATUALIZADA,
  ACAO_CONTA_CRIADA,
  ACAO_PAGAMENTO_PARCIAL_CRIADO,
  ENTIDADE_CONTA,
  ENTIDADE_PAGAMENTO,
  acaoEstaAtivada,
  isUuid,
  resolverCorrelationIdConta,
  sanitizarDadosConta,
  sanitizarDadosPorCampos,
  validarEntidadeConta
} from './validation.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const CAMPOS_PROIBIDOS = new Set([
  'observacao',
  'observacao_pagamento',
  'comprovante',
  'anexo',
  'arquivo',
  'link',
  'base64',
  'cpf',
  'cnpj',
  'email',
  'token',
  'secret',
  'senha',
  'password',
  'request',
  'payload',
  'conta',
  'pagamento'
])

const CAMPOS_FINANCEIROS = new Set([
  'status', 'valor', 'vencimento', 'data_pagamento', 'origem', 'arquivado',
  'centro_custo_alterado', 'filial_alterada', 'imposto_tipo_alterado',
  'campos', 'conta_id', 'correlation_id'
])

const CAMPOS_USUARIOS = new Set([
  'perfil', 'ativo', 'quantidade_filiais', 'tipo_envio', 'origem',
  'criacao_manual', 'campos', 'correlation_id'
])

const CAMPOS_RH = new Set([
  'status', 'arquivado', 'arquivada', 'campos', 'funcionario_id',
  'competencia', 'competencia_id', 'categoria', 'natureza', 'correlation_id'
])

const CAMPOS_IMPORTACAO = new Set([
  'aceitas', 'duplicadas', 'total', 'empresa_id', 'correlation_id'
])

const CAMPOS_PLANEJAMENTO = new Set([
  'data_inicial', 'data_final', 'quantidade_planejada', 'quantidade_criada',
  'quantidade_ja_existente', 'quantidade_variavel', 'valor_base_total', 'resultado', 'correlation_id'
])

type DefinicaoAcao = {
  entidadeTipo: string
  tabela: string
  modulo: 'financeiro' | 'usuarios' | 'rh'
  campos: ReadonlySet<string>
  exigeAdmin?: boolean
}

const DEFINICOES_ACAO = new Map<string, DefinicaoAcao>([
  ['financeiro.conta.baixada', { entidadeTipo: ENTIDADE_CONTA, tabela: 'df_contas', modulo: 'financeiro', campos: CAMPOS_FINANCEIROS }],
  ['financeiro.conta.pagamento_corrigido', { entidadeTipo: ENTIDADE_CONTA, tabela: 'df_contas', modulo: 'financeiro', campos: CAMPOS_FINANCEIROS }],
  ['financeiro.conta.baixa_estornada', { entidadeTipo: ENTIDADE_CONTA, tabela: 'df_contas', modulo: 'financeiro', campos: CAMPOS_FINANCEIROS }],
  ['financeiro.pagamento_parcial.estornado', { entidadeTipo: ENTIDADE_PAGAMENTO, tabela: 'df_contas_pagamentos', modulo: 'financeiro', campos: CAMPOS_FINANCEIROS }],
  ['financeiro.importacao.contas_concluida', { entidadeTipo: 'df_empresas', tabela: 'df_empresas', modulo: 'financeiro', campos: CAMPOS_IMPORTACAO, exigeAdmin: true }],
  ['financeiro.recorrencias.planejamento_90_dias', { entidadeTipo: 'df_empresas', tabela: 'df_empresas', modulo: 'financeiro', campos: CAMPOS_PLANEJAMENTO }],
  ['administracao.usuario.convite_criado', { entidadeTipo: 'df_usuarios_empresas', tabela: 'df_usuarios_empresas', modulo: 'usuarios', campos: CAMPOS_USUARIOS, exigeAdmin: true }],
  ['administracao.usuario.acesso_enviado', { entidadeTipo: 'df_usuarios_empresas', tabela: 'df_usuarios_empresas', modulo: 'usuarios', campos: CAMPOS_USUARIOS, exigeAdmin: true }],
  ['administracao.usuario.perfil_alterado', { entidadeTipo: 'df_usuarios_empresas', tabela: 'df_usuarios_empresas', modulo: 'usuarios', campos: CAMPOS_USUARIOS, exigeAdmin: true }],
  ['administracao.usuario.filiais_alteradas', { entidadeTipo: 'df_usuarios_empresas', tabela: 'df_usuarios_empresas', modulo: 'usuarios', campos: CAMPOS_USUARIOS, exigeAdmin: true }],
  ['rh.funcionario.criado', { entidadeTipo: 'df_funcionarios', tabela: 'df_funcionarios', modulo: 'rh', campos: CAMPOS_RH, exigeAdmin: true }],
  ['rh.funcionario.atualizado', { entidadeTipo: 'df_funcionarios', tabela: 'df_funcionarios', modulo: 'rh', campos: CAMPOS_RH, exigeAdmin: true }],
  ['rh.funcionario.arquivado', { entidadeTipo: 'df_funcionarios', tabela: 'df_funcionarios', modulo: 'rh', campos: CAMPOS_RH, exigeAdmin: true }],
  ['rh.funcionario.reativado', { entidadeTipo: 'df_funcionarios', tabela: 'df_funcionarios', modulo: 'rh', campos: CAMPOS_RH, exigeAdmin: true }]
])

for (const acao of ['criada', 'atualizada', 'arquivada', 'reativada']) {
  DEFINICOES_ACAO.set(`folha.competencia.${acao}`, { entidadeTipo: 'df_folha_competencias', tabela: 'df_folha_competencias', modulo: 'rh', campos: CAMPOS_RH, exigeAdmin: true })
}
for (const acao of ['criado', 'atualizado', 'arquivado', 'reativado']) {
  DEFINICOES_ACAO.set(`folha.lancamento.${acao}`, { entidadeTipo: 'df_folha_lancamentos', tabela: 'df_folha_lancamentos', modulo: 'rh', campos: CAMPOS_RH, exigeAdmin: true })
}
for (const acao of ['criado', 'atualizado', 'arquivado']) {
  DEFINICOES_ACAO.set(`folha.item.${acao}`, { entidadeTipo: 'df_folha_lancamento_itens', tabela: 'df_folha_lancamento_itens', modulo: 'rh', campos: CAMPOS_RH, exigeAdmin: true })
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(
    JSON.stringify(body),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
  )
}

function isPlainObject(valor: unknown): valor is Record<string, unknown> {
  return Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor)
}

function resumirErro(error: any) {
  return {
    name: error?.name,
    code: error?.code,
    status: error?.status,
    message: error?.message
  }
}

function numeroFinanceiro(valor: unknown) {
  const numero = Number(valor || 0)
  if (!Number.isFinite(numero)) return null
  return Math.round((numero + Number.EPSILON) * 100) / 100
}

function textoCurto(valor: unknown, max = 120) {
  const texto = String(valor || '').trim()
  if (!texto) return null
  return texto.slice(0, max)
}

function severidadeSegura(valor: unknown) {
  const nivel = String(valor || '').toLowerCase()
  if (['alta', 'critical', 'critica', 'crítica'].includes(nivel)) return 'critical'
  if (['media', 'média', 'warning', 'atencao', 'atenção'].includes(nivel)) return 'warning'
  return 'info'
}

function statusSeguro(valor: unknown) {
  const status = String(valor || '').toLowerCase()
  if (['erro', 'falha', 'failed'].includes(status)) return 'falha'
  if (['bloqueado', 'blocked'].includes(status)) return 'bloqueado'
  return 'sucesso'
}

function possuiCampoProibido(valor: unknown): boolean {
  if (Array.isArray(valor)) return valor.some((item) => possuiCampoProibido(item))
  if (!isPlainObject(valor)) return false

  return Object.entries(valor).some(([chave, conteudo]) => {
    const chaveNormalizada = chave.toLowerCase().trim()
    if (CAMPOS_PROIBIDOS.has(chaveNormalizada)) return true
    return possuiCampoProibido(conteudo)
  })
}

function montarDadosAntes(body: Record<string, unknown>) {
  const dados: Record<string, unknown> = {}

  for (const campo of [
    'conta_status_anterior',
    'valor_pago_anterior',
    'saldo_anterior',
    'quantidade_parciais_anterior'
  ]) {
    if (body[campo] !== undefined && body[campo] !== null) dados[campo] = body[campo]
  }

  return dados
}

function montarDadosDepois(body: Record<string, unknown>) {
  const dados: Record<string, unknown> = {}

  for (const campo of [
    'conta_status_posterior',
    'valor_pago_posterior',
    'saldo_posterior',
    'quantidade_parciais_posterior'
  ]) {
    if (body[campo] !== undefined && body[campo] !== null) dados[campo] = body[campo]
  }

  return dados
}

function montarMetadados(
  body: Record<string, unknown>,
  pagamento: Record<string, unknown>,
  conta: Record<string, unknown>,
  correlationId: string
) {
  return {
    conta_id: conta.id,
    pagamento_id: pagamento.id,
    empresa_id: pagamento.empresa_id,
    filial_id: conta.filial_id || null,
    valor_pagamento: numeroFinanceiro(pagamento.valor_pago),
    data_pagamento: pagamento.data_pagamento,
    forma_pagamento: textoCurto(body.forma_pagamento),
    origem_fluxo: 'pagamento_parcial',
    possui_observacao: Boolean(body.possui_observacao),
    correlation_id: correlationId,
    competencia: textoCurto(body.competencia || conta.competencia, 20),
    vencimento: textoCurto(body.vencimento || conta.data_vencimento || conta.vencimento, 20)
  }
}

async function usuarioPertenceEmpresa(supabaseAdmin: any, user: any, empresaId: string) {
  const email = String(user?.email || '').trim().toLowerCase()

  if (user?.id) {
    const { data, error } = await supabaseAdmin
      .from('df_usuarios_empresas')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('user_id', user.id)
      .limit(1)

    if (error) throw error
    if (Array.isArray(data) && data.length > 0) return true
  }

  if (!email) return false

  const { data, error } = await supabaseAdmin
    .from('df_usuarios_empresas')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('email', email)
    .limit(1)

  if (error) throw error
  return Array.isArray(data) && data.length > 0
}

async function usuarioPodeAdministrarEmpresa(supabaseAdmin: any, user: any, empresaId: string) {
  const email = String(user?.email || '').trim().toLowerCase()
  const perfisPermitidos = ['admin', 'adm', 'administrador', 'master', 'owner']

  if (user?.id) {
    const { data, error } = await supabaseAdmin
      .from('df_usuarios_empresas')
      .select('perfil')
      .eq('empresa_id', empresaId)
      .eq('user_id', user.id)
      .limit(10)
    if (error) throw error
    if ((data || []).some((vinculo: any) => perfisPermitidos.includes(String(vinculo?.perfil || '').trim().toLowerCase()))) return true
  }

  if (!email) return false
  const { data, error } = await supabaseAdmin
    .from('df_usuarios_empresas')
    .select('perfil')
    .eq('empresa_id', empresaId)
    .eq('email', email)
    .limit(10)
  if (error) throw error
  return (data || []).some((vinculo: any) => perfisPermitidos.includes(String(vinculo?.perfil || '').trim().toLowerCase()))
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Metodo nao permitido.' }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Configuracao da Edge Function incompleta.')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ ok: false, message: 'Nao autenticado.' }, 401)
    }

    const supabaseUser = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: callerData, error: callerError } = await supabaseUser.auth.getUser()

    if (callerError || !callerData.user) {
      console.warn('[registrar-auditoria-evento] Chamada sem sessao autenticada.', resumirErro(callerError))
      return jsonResponse({ ok: false, message: 'Nao autenticado.' }, 401)
    }

    const body = await req.json()
    if (!isPlainObject(body) || possuiCampoProibido(body)) {
      console.warn('[registrar-auditoria-evento] Payload invalido ou com campos proibidos.', {
        callerId: callerData.user.id,
        hasBody: isPlainObject(body)
      })
      return jsonResponse({ ok: false, code: 'PAYLOAD_INVALIDO', message: 'Payload invalido.' }, 400)
    }

    const acao = String(body.acao || '').trim()
    const empresaId = String(body.empresa_id || '').trim()
    const entidadeId = String(body.entidade_id || '').trim()
    const contaId = String(body.conta_id || '').trim()
    const pagamentoId = String(body.pagamento_id || '').trim()

    if (!acaoEstaAtivada(acao)) {
      return jsonResponse({ ok: false, code: 'ACAO_NAO_ATIVADA', message: 'Acao de auditoria ainda nao ativada.' }, 400)
    }
    if (!isUuid(empresaId)) {
      return jsonResponse({ ok: false, code: 'EMPRESA_INVALIDA', message: 'Empresa invalida.' }, 400)
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const pertenceEmpresa = await usuarioPertenceEmpresa(supabaseAdmin, callerData.user, empresaId)
    if (!pertenceEmpresa) {
      console.warn('[registrar-auditoria-evento] Usuario sem vinculo com empresa.', {
        callerId: callerData.user.id,
        empresaId
      })
      return jsonResponse({ ok: false, code: 'USUARIO_NAO_AUTORIZADO', message: 'Evento nao autorizado.' }, 403)
    }

    if (acao === ACAO_CONTA_CRIADA || acao === ACAO_CONTA_ATUALIZADA) {
      const entidadeTipo = String(body.entidade_tipo || '').trim()
      if (entidadeTipo !== ENTIDADE_CONTA) {
        return jsonResponse({ ok: false, code: 'ENTIDADE_TIPO_INVALIDA', message: 'Tipo de entidade invalido.' }, 400)
      }
      if (!isUuid(entidadeId)) {
        return jsonResponse({ ok: false, code: 'ENTIDADE_INVALIDA', message: 'Entidade invalida.' }, 400)
      }

      const { data: contaEvento, error: contaEventoError } = await supabaseAdmin
        .from('df_contas')
        .select('id, empresa_id')
        .eq('id', entidadeId)
        .maybeSingle()

      if (contaEventoError) throw contaEventoError
      const entidadeValidada = validarEntidadeConta({ entidadeTipo, entidadeId, empresaId, conta: contaEvento })
      if (!entidadeValidada.ok) {
        return jsonResponse({ ok: false, code: entidadeValidada.code, message: entidadeValidada.message }, 400)
      }

      const dadosAntes = sanitizarDadosConta(body.dados_antes)
      if (!dadosAntes.ok) return jsonResponse({ ok: false, code: dadosAntes.code, message: dadosAntes.message }, 400)
      const dadosDepois = sanitizarDadosConta(body.dados_depois)
      if (!dadosDepois.ok) return jsonResponse({ ok: false, code: dadosDepois.code, message: dadosDepois.message }, 400)
      const metadados = sanitizarDadosConta(body.metadados)
      if (!metadados.ok) return jsonResponse({ ok: false, code: metadados.code, message: metadados.message }, 400)

      const correlation = resolverCorrelationIdConta(acao, entidadeId, body.correlation_id)
      if (!correlation.ok) return jsonResponse({ ok: false, code: correlation.code, message: correlation.message }, 400)
      const correlationId = correlation.data
      const { data: eventoExistente, error: eventoExistenteError } = await supabaseAdmin
        .from('df_auditoria_eventos')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('correlation_id', correlationId)
        .limit(1)
      if (eventoExistenteError) throw eventoExistenteError
      if (Array.isArray(eventoExistente) && eventoExistente.length > 0) return jsonResponse({ ok: true, idempotente: true })

      const { error: insertError } = await supabaseAdmin
        .from('df_auditoria_eventos')
        .insert([{
          empresa_id: empresaId,
          user_id: callerData.user.id,
          ator_tipo: 'usuario',
          modulo: 'financeiro',
          entidade_tipo: ENTIDADE_CONTA,
          entidade_id: entidadeId,
          acao,
          severidade: severidadeSegura(body.severidade),
          origem: textoCurto(body.origem, 40) || 'app',
          status: statusSeguro(body.status),
          dados_antes: dadosAntes.data,
          dados_depois: dadosDepois.data,
          metadados: metadados.data,
          correlation_id: correlationId
        }])
      if (insertError) throw insertError
      return jsonResponse({ ok: true, idempotente: false })
    }

    const definicao = DEFINICOES_ACAO.get(acao)
    if (definicao) {
      const entidadeTipo = String(body.entidade_tipo || '').trim()
      if (entidadeTipo !== definicao.entidadeTipo) {
        return jsonResponse({ ok: false, code: 'ENTIDADE_TIPO_INVALIDA', message: 'Tipo de entidade invalido.' }, 400)
      }
      if (!isUuid(entidadeId)) {
        return jsonResponse({ ok: false, code: 'ENTIDADE_INVALIDA', message: 'Entidade invalida.' }, 400)
      }

      if (definicao.exigeAdmin) {
        const podeAdministrar = await usuarioPodeAdministrarEmpresa(supabaseAdmin, callerData.user, empresaId)
        if (!podeAdministrar) {
          return jsonResponse({ ok: false, code: 'PERFIL_NAO_AUTORIZADO', message: 'Evento nao autorizado.' }, 403)
        }
      }

      let queryEntidade = supabaseAdmin.from(definicao.tabela).select(
        definicao.tabela === 'df_empresas' ? 'id' : 'id, empresa_id'
      ).eq('id', entidadeId)
      if (definicao.tabela !== 'df_empresas') queryEntidade = queryEntidade.eq('empresa_id', empresaId)

      const { data: entidade, error: entidadeError } = await queryEntidade.maybeSingle()
      if (entidadeError) throw entidadeError
      if (!entidade?.id || (definicao.tabela === 'df_empresas' && entidade.id !== empresaId)) {
        return jsonResponse({ ok: false, code: 'ENTIDADE_NAO_AUTORIZADA', message: 'Entidade nao pertence a empresa.' }, 400)
      }

      const dadosAntes = sanitizarDadosPorCampos(body.dados_antes, definicao.campos)
      if (!dadosAntes.ok) return jsonResponse({ ok: false, code: dadosAntes.code, message: dadosAntes.message }, 400)
      const dadosDepois = sanitizarDadosPorCampos(body.dados_depois, definicao.campos)
      if (!dadosDepois.ok) return jsonResponse({ ok: false, code: dadosDepois.code, message: dadosDepois.message }, 400)
      const metadados = sanitizarDadosPorCampos(body.metadados, definicao.campos)
      if (!metadados.ok) return jsonResponse({ ok: false, code: metadados.code, message: metadados.message }, 400)

      const correlationId = textoCurto(body.correlation_id, 180)
      if (!correlationId) {
        return jsonResponse({ ok: false, code: 'CORRELATION_ID_OBRIGATORIO', message: 'Referencia da operacao obrigatoria.' }, 400)
      }

      const { data: eventoExistente, error: eventoExistenteError } = await supabaseAdmin
        .from('df_auditoria_eventos')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('correlation_id', correlationId)
        .limit(1)
      if (eventoExistenteError) throw eventoExistenteError
      if (Array.isArray(eventoExistente) && eventoExistente.length > 0) return jsonResponse({ ok: true, idempotente: true })

      const { error: insertError } = await supabaseAdmin
        .from('df_auditoria_eventos')
        .insert([{
          empresa_id: empresaId,
          user_id: callerData.user.id,
          ator_tipo: 'usuario',
          modulo: definicao.modulo,
          entidade_tipo: definicao.entidadeTipo,
          entidade_id: entidadeId,
          acao,
          severidade: severidadeSegura(body.severidade),
          origem: textoCurto(body.origem, 40) || 'app',
          status: statusSeguro(body.status),
          dados_antes: dadosAntes.data,
          dados_depois: dadosDepois.data,
          metadados: metadados.data,
          correlation_id: correlationId
        }])
      if (insertError) throw insertError
      return jsonResponse({ ok: true, idempotente: false })
    }

    if (!isUuid(contaId) || !isUuid(pagamentoId)) {
      return jsonResponse({ ok: false, code: 'PAGAMENTO_INVALIDO', message: 'Pagamento invalido.' }, 400)
    }

    const { data: conta, error: contaError } = await supabaseAdmin
      .from('df_contas')
      .select('id, empresa_id, filial_id, valor, status, data_vencimento, vencimento, competencia')
      .eq('id', contaId)
      .eq('empresa_id', empresaId)
      .maybeSingle()

    if (contaError) throw contaError
    if (!conta?.id) return jsonResponse({ ok: false, code: 'CONTA_NAO_AUTORIZADA', message: 'Conta invalida.' }, 400)

    const { data: pagamento, error: pagamentoError } = await supabaseAdmin
      .from('df_contas_pagamentos')
      .select('id, empresa_id, conta_id, valor_pago, data_pagamento, arquivado')
      .eq('id', pagamentoId)
      .eq('empresa_id', empresaId)
      .eq('conta_id', contaId)
      .maybeSingle()

    if (pagamentoError) throw pagamentoError
    if (!pagamento?.id) return jsonResponse({ ok: false, code: 'PAGAMENTO_NAO_AUTORIZADO', message: 'Pagamento invalido.' }, 400)

    const correlationId = textoCurto(body.correlation_id, 180) || `${ACAO_PAGAMENTO_PARCIAL_CRIADO}:${pagamentoId}`

    const { data: eventoExistente, error: eventoExistenteError } = await supabaseAdmin
      .from('df_auditoria_eventos')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('acao', ACAO_PAGAMENTO_PARCIAL_CRIADO)
      .eq('entidade_tipo', ENTIDADE_PAGAMENTO)
      .eq('entidade_id', pagamentoId)
      .limit(1)

    if (eventoExistenteError) throw eventoExistenteError
    if (Array.isArray(eventoExistente) && eventoExistente.length > 0) {
      return jsonResponse({ ok: true, idempotente: true })
    }

    const { error: insertError } = await supabaseAdmin
      .from('df_auditoria_eventos')
      .insert([{
        empresa_id: empresaId,
        user_id: callerData.user.id,
        ator_tipo: 'usuario',
        modulo: 'financeiro',
        entidade_tipo: ENTIDADE_PAGAMENTO,
        entidade_id: pagamentoId,
        acao: ACAO_PAGAMENTO_PARCIAL_CRIADO,
        severidade: 'info',
        origem: 'edge_function',
        status: 'sucesso',
        dados_antes: montarDadosAntes(body),
        dados_depois: montarDadosDepois(body),
        metadados: montarMetadados(body, pagamento, conta, correlationId),
        correlation_id: correlationId
      }])

    if (insertError) throw insertError

    return jsonResponse({ ok: true, idempotente: false })
  } catch (error) {
    console.error('[registrar-auditoria-evento] Erro inesperado.', resumirErro(error))
    return jsonResponse({ ok: false, message: 'Nao foi possivel registrar auditoria.' }, 500)
  }
})
