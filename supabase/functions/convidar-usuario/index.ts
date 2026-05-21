import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const GENERIC_MESSAGE = 'Envio solicitado. Se o usuário estiver apto, receberá o link por e-mail.'

function respostaGenerica(status = 200, ok = true) {
  return new Response(
    JSON.stringify({ ok, message: GENERIC_MESSAGE }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Variáveis SUPABASE_URL e SERVICE_ROLE_KEY são obrigatórias. Configure SERVICE_ROLE_KEY em Supabase Secrets.')
    }

    const authHeader = req.headers.get('Authorization')
    const supabaseUser = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader || '' } }
    })

    const { data: callerData, error: callerError } = await supabaseUser.auth.getUser()
    if (callerError || !callerData.user) {
      console.warn('[convidar-usuario] Chamada sem sessão autenticada.', resumirErro(callerError))
      return respostaGenerica(401, false)
    }

    const { email, nome, redirectTo, empresaId } = await req.json()
    const emailNormalizado = String(email || '').trim().toLowerCase()
    const empresaIdNormalizada = String(empresaId || '').trim()

    if (!emailNormalizado || !emailNormalizado.includes('@') || !empresaIdNormalizada || !isUuid(empresaIdNormalizada)) {
      console.warn('[convidar-usuario] Chamada com payload inválido.', {
        callerId: callerData.user.id,
        hasEmail: Boolean(emailNormalizado),
        hasEmpresaId: Boolean(empresaIdNormalizada)
      })
      return respostaGenerica()
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
      return respostaGenerica()
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data: vinculoAlvo, error: vinculoError } = await supabaseAdmin
      .from('df_usuarios_empresas')
      .select('id, empresa_id, email, user_id')
      .eq('empresa_id', empresaIdNormalizada)
      .eq('email', emailNormalizado)
      .maybeSingle()

    if (vinculoError) {
      console.warn('[convidar-usuario] Falha ao validar vínculo do e-mail alvo.', {
        callerId: callerData.user.id,
        empresaId: empresaIdNormalizada,
        error: resumirErro(vinculoError)
      })
      return respostaGenerica()
    }

    if (!vinculoAlvo) {
      console.warn('[convidar-usuario] E-mail alvo sem vínculo na empresa informada.', {
        callerId: callerData.user.id,
        empresaId: empresaIdNormalizada
      })
      return respostaGenerica()
    }

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

    return respostaGenerica()
  } catch (error) {
    console.error('[convidar-usuario] Erro inesperado.', resumirErro(error))
    return respostaGenerica(500, false)
  }
})
