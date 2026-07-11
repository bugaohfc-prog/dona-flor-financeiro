import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEFAULT_ALLOWED_ORIGINS = [
  'https://dona-flor-financeiro.vercel.app',
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

function corsHeaders(requestOrigin: string | null) {
  const origin = requestOrigin && allowedOrigins().has(requestOrigin)
    ? requestOrigin
    : DEFAULT_ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin'
  }
}

function resposta(requestOrigin: string | null, body: Record<string, unknown>, status: number) {
  return new Response(
    JSON.stringify(body),
    {
      headers: { ...corsHeaders(requestOrigin), 'Content-Type': 'application/json' },
      status
    }
  )
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
      console.error('[concluir-troca-senha] Configuração interna ausente.')
      return resposta(requestOrigin, { ok: false, message: 'Serviço temporariamente indisponível.' }, 503)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return resposta(requestOrigin, { ok: false, message: 'Sessão inválida ou expirada.' }, 401)
    }

    const supabaseUser = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: callerData, error: callerError } = await supabaseUser.auth.getUser()
    if (callerError || !callerData.user) {
      return resposta(requestOrigin, { ok: false, message: 'Sessão inválida ou expirada.' }, 401)
    }

    const { novaSenha } = await req.json()
    const senha = String(novaSenha || '')

    if (senha.length < 12) {
      return resposta(requestOrigin, { ok: false, message: 'A senha precisa ter pelo menos 12 caracteres.' }, 400)
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const alteradaEm = new Date().toISOString()

    const { data: usuarioAtualizado, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      callerData.user.id,
      {
        password: senha,
        app_metadata: {
          ...(callerData.user.app_metadata || {}),
          must_change_password: false,
          password_changed_at: alteradaEm
        },
        user_metadata: {
          ...(callerData.user.user_metadata || {}),
          must_change_password: false,
          password_changed_at: alteradaEm
        }
      }
    )

    if (updateError) throw updateError

    return resposta(requestOrigin, {
      ok: true,
      message: 'Senha atualizada com sucesso.',
      userId: usuarioAtualizado?.user?.id || callerData.user.id
    }, 200)
  } catch (error) {
    console.error('[concluir-troca-senha] Falha ao atualizar senha.', {
      message: error?.message,
      code: error?.code
    })

    return resposta(requestOrigin, {
      ok: false,
      message: 'Não foi possível atualizar a senha agora.'
    }, 400)
  }
})
