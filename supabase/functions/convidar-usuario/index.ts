import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
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
      throw new Error('Usuário não autenticado.')
    }

    const { email, nome, redirectTo } = await req.json()
    const emailNormalizado = String(email || '').trim().toLowerCase()

    if (!emailNormalizado || !emailNormalizado.includes('@')) {
      throw new Error('E-mail inválido.')
    }

    const { data: isAdmin, error: adminError } = await supabaseUser.rpc('is_admin')
    if (adminError || !isAdmin) {
      throw new Error('Apenas administradores podem convidar usuários.')
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(emailNormalizado, {
      redirectTo,
      data: {
        name: nome || emailNormalizado.split('@')[0]
      }
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ ok: true, message: 'Convite enviado para o e-mail do usuário.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
