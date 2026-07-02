import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const ACAO_PERMITIDA = 'financeiro.pagamento_parcial.criado'
const ENTIDADE_TIPO = 'df_contas_pagamentos'

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

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(
    JSON.stringify(body),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
  )
}

function isUuid(valor: unknown) {
  return typeof valor === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(valor)
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
      return jsonResponse({ ok: false, message: 'Payload invalido.' }, 400)
    }

    const acao = String(body.acao || '').trim()
    const empresaId = String(body.empresa_id || '').trim()
    const contaId = String(body.conta_id || '').trim()
    const pagamentoId = String(body.pagamento_id || '').trim()

    if (acao !== ACAO_PERMITIDA || !isUuid(empresaId) || !isUuid(contaId) || !isUuid(pagamentoId)) {
      return jsonResponse({ ok: false, message: 'Evento invalido.' }, 400)
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const pertenceEmpresa = await usuarioPertenceEmpresa(supabaseAdmin, callerData.user, empresaId)
    if (!pertenceEmpresa) {
      console.warn('[registrar-auditoria-evento] Usuario sem vinculo com empresa.', {
        callerId: callerData.user.id,
        empresaId
      })
      return jsonResponse({ ok: false, message: 'Evento nao autorizado.' }, 403)
    }

    const { data: conta, error: contaError } = await supabaseAdmin
      .from('df_contas')
      .select('id, empresa_id, filial_id, valor, status, data_vencimento, vencimento, competencia')
      .eq('id', contaId)
      .eq('empresa_id', empresaId)
      .maybeSingle()

    if (contaError) throw contaError
    if (!conta?.id) return jsonResponse({ ok: false, message: 'Conta invalida.' }, 400)

    const { data: pagamento, error: pagamentoError } = await supabaseAdmin
      .from('df_contas_pagamentos')
      .select('id, empresa_id, conta_id, valor_pago, data_pagamento, arquivado')
      .eq('id', pagamentoId)
      .eq('empresa_id', empresaId)
      .eq('conta_id', contaId)
      .maybeSingle()

    if (pagamentoError) throw pagamentoError
    if (!pagamento?.id) return jsonResponse({ ok: false, message: 'Pagamento invalido.' }, 400)

    const correlationId = textoCurto(body.correlation_id, 180) || `${ACAO_PERMITIDA}:${pagamentoId}`

    const { data: eventoExistente, error: eventoExistenteError } = await supabaseAdmin
      .from('df_auditoria_eventos')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('acao', ACAO_PERMITIDA)
      .eq('entidade_tipo', ENTIDADE_TIPO)
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
        entidade_tipo: ENTIDADE_TIPO,
        entidade_id: pagamentoId,
        acao: ACAO_PERMITIDA,
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
