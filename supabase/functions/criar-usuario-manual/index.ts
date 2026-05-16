import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

function normalizarPerfil(perfil: string) {
  const valor = String(perfil || '').toLowerCase().trim()
  if (['admin', 'adm', 'administrador', 'master', 'owner'].includes(valor)) return 'admin'
  if (['gerente', 'gerencia', 'gestor', 'manager'].includes(valor)) return 'gerente'
  if (['financeiro', 'financas', 'finanças', 'financial'].includes(valor)) return 'financeiro'
  if (['operacional', 'operacao', 'operação', 'atendente'].includes(valor)) return 'operacional'
  if (['visualizacao', 'visualização', 'viewer', 'leitura', 'consulta'].includes(valor)) return 'visualizacao'
  return 'operador'
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

    const { data: isAdmin, error: adminError } = await supabaseUser.rpc('is_admin')
    if (adminError || !isAdmin) {
      throw new Error('Apenas administradores podem criar acessos manuais.')
    }

    const body = await req.json()
    const empresaId = String(body?.empresaId || '').trim()
    const email = String(body?.email || '').trim().toLowerCase()
    const nome = String(body?.nome || '').trim() || email.split('@')[0]
    const perfil = normalizarPerfil(body?.perfil)
    const senhaProvisoria = String(body?.senhaProvisoria || '').trim()

    if (!empresaId) throw new Error('Empresa não identificada.')
    if (!email || !email.includes('@')) throw new Error('E-mail inválido.')
    if (senhaProvisoria.length < 6) throw new Error('A senha provisória precisa ter pelo menos 6 caracteres.')

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data: existenteVinculo, error: consultaVinculoError } = await supabaseAdmin
      .from('df_usuarios_empresas')
      .select('id, email, user_id')
      .eq('empresa_id', empresaId)
      .eq('email', email)
      .maybeSingle()

    if (consultaVinculoError) throw consultaVinculoError
    if (existenteVinculo) throw new Error('Este e-mail já está cadastrado nesta empresa.')

    const { data: usuarioCriado, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senhaProvisoria,
      email_confirm: true,
      user_metadata: {
        name: nome,
        full_name: nome,
        created_by_admin: true,
        must_change_password: true
      }
    })

    if (authError) throw authError

    const userId = usuarioCriado?.user?.id || null

    if (userId) {
      await supabaseAdmin
        .from('profiles')
        .upsert({ id: userId, name: nome }, { onConflict: 'id' })
    }

    const payload = {
      empresa_id: empresaId,
      user_id: userId,
      email,
      nome,
      perfil
    }

    const { data: vinculo, error: vinculoError } = await supabaseAdmin
      .from('df_usuarios_empresas')
      .insert([payload])
      .select('*')
      .single()

    if (vinculoError) throw vinculoError

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Usuário criado manualmente com e-mail e senha provisória.',
        userId,
        usuario: vinculo,
        vinculo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
