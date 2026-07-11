import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GENERIC_MESSAGE = 'Envio solicitado. Se o usuário estiver apto, receberá o link por e-mail.'
const DEFAULT_APP_ORIGIN = 'https://dona-flor-financeiro.vercel.app'
const DEFAULT_ALLOWED_ORIGINS = [
  DEFAULT_APP_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]

function allowedOrigins() {
  const configured = String(Deno.env.get('APP_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured])
}

function resolverOrigem(requestOrigin: string | null) {
  if (requestOrigin && allowedOrigins().has(requestOrigin)) return requestOrigin
  return DEFAULT_APP_ORIGIN
}

function corsHeaders(requestOrigin: string | null) {
  return {
    'Access-Control-Allow-Origin': resolverOrigem(requestOrigin),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin'
  }
}

function respostaGenerica(requestOrigin: string | null, status = 200, ok = true) {
  return new Response(
    JSON.stringify({ ok, message: GENERIC_MESSAGE }),
    { headers: { ...corsHeaders(requestOrigin), 'Content-Type': 'application/json' }, status }
  )
}

function isUuid(valor: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor)
}

function resumirErro(error: any) {
  return {
    name: error?.name,
    code: error?.code,
    status: error?.status,
    message: error?.message
  }
}

async function verificarMaster(supabaseUser: any) {
  const { data, error } = await supabaseUser.rpc('is_master')
  if (error) {
    console.warn('[convidar-usuario] Falha ao verificar is_master.', resumirErro(error))
    return false
  }
  return Boolean(data)
}

async function verificarAdminEmpresa(supabaseUser: any, empresaId: string) {
  const tentativas = [
    { p_empresa_id: empresaId },
    { empresa_id: empresaId },
    { empresaId }
  ]

  let ultimoErro = null

  for (const params of tentativas) {
    const { data, error } = await supabaseUser.rpc('df_usuario_eh_admin', params)
    if (!error) return Boolean(data)

    ultimoErro = error
    const mensagem = String(error?.message || '').toLowerCase()
    const erroDeAssinatura = error?.code === 'PGRST202' || mensagem.includes('could not find') || mensagem.includes('schema cache')
    if (!erroDeAssinatura) break
  }

  console.warn('[convidar-usuario] Falha ao verificar df_usuario_eh_admin.', resumirErro(ultimoErro))
  return false
}

serve(async (req) => {
  const requestOrigin = req.headers.get('Origin')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(requestOrigin) })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[convidar-usuario] Configuração interna ausente.')
      return respostaGenerica(requestOrigin, 503, false)
    }

    const authHeader = req.headers.get('Authorization')
    const supabaseUser = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader || '' } }
    })

    const { data: callerData, error: callerError } = await supabaseUser.auth.getUser()
    if (callerError || !callerData.user) {
      console.warn('[convidar-usuario] Chamada sem sessão autenticada.', resumirErro(callerError))
      return respostaGenerica(requestOrigin, 401, false)
    }

    const { email, nome, empresaId } = await req.json()
    const emailNormalizado = String(email || '').trim().toLowerCase()
    const empresaIdNormalizada = String(empresaId || '').trim()

    if (!emailNormalizado || !emailNormalizado.includes('@') || !empresaIdNormalizada || !isUuid(empresaIdNormalizada)) {
      console.warn('[convidar-usuario] Chamada com payload inválido.', {
        callerId: callerData.user.id,
        hasEmail: Boolean(emailNormalizado),
        hasEmpresaId: Boolean(empresaIdNormalizada)
      })
      return respostaGenerica(requestOrigin)
    }

    const [isMaster, isAdminEmpresa] = await Promise.all([
      verificarMaster(supabaseUser),
      verificarAdminEmpresa(supabaseUser, empresaIdNormalizada)
    ])

    if (!isMaster && !isAdminEmpresa) {
      console.warn('[convidar-usuario] Usuário sem permissão para empresa informada.', {
        callerId: callerData.user.id,
        empresaId: empresaIdNormalizada
      })
      return respostaGenerica(requestOrigin)
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data: vinculoAlvo, error: vinculoError } = await supabaseAdmin
      .from('df_usuarios_empresas')
      .select('id, empresa_id, email, user_id')
      .eq('empresa_id', empresaIdNormalizada)
      .eq('email', emailNormalizado)
      .maybeSingle()

    if (vinculoError || !vinculoAlvo) {
      console.warn('[convidar-usuario] E-mail alvo sem vínculo válido na empresa.', {
        callerId: callerData.user.id,
        empresaId: empresaIdNormalizada,
        error: resumirErro(vinculoError)
      })
      return respostaGenerica(requestOrigin)
    }

    const redirectTo = `${resolverOrigem(requestOrigin)}/reset-password`

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(emailNormalizado, {
      redirectTo,
      data: {
        name: nome || emailNormalizado.split('@')[0]
      }
    })

    if (inviteError) {
      console.warn('[convidar-usuario] Convite falhou; tentando reset de senha autorizado.', {
        callerId: callerData.user.id,
        empresaId: empresaIdNormalizada,
        error: resumirErro(inviteError)
      })

      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(emailNormalizado, {
        redirectTo
      })

      if (resetError) {
        console.warn('[convidar-usuario] Reset de senha autorizado falhou.', {
          callerId: callerData.user.id,
          empresaId: empresaIdNormalizada,
          error: resumirErro(resetError)
        })
      }
    }

    return respostaGenerica(requestOrigin)
  } catch (error) {
    console.error('[convidar-usuario] Erro inesperado.', resumirErro(error))
    return respostaGenerica(requestOrigin, 500, false)
  }
})
