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
      throw new Error('Variáveis SUPABASE_URL e SERVICE_ROLE_KEY são obrigatórias para listar usuários.')
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
      throw new Error('Apenas administradores podem listar usuários da empresa.')
    }

    const body = await req.json()
    const empresaId = String(body?.empresaId || '').trim()
    if (!empresaId) throw new Error('Empresa não identificada.')

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('df_usuarios_empresas')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: true })

    if (usuariosError) throw usuariosError

    const usuarioIds = Array.from(new Set((usuarios || []).map((usuario) => usuario.user_id).filter(Boolean)))

    let profiles: any[] = []
    if (usuarioIds.length > 0) {
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('id, name, full_name, nome, email, role, perfil, status')
        .in('id', usuarioIds)

      profiles = profileData || []
    }

    const profilesPorId = new Map(profiles.map((profile) => [profile.id, profile]))

    const resultado = (usuarios || []).map((usuario) => {
      const profile = usuario.user_id ? profilesPorId.get(usuario.user_id) : null
      return {
        ...usuario,
        nome: usuario.nome || profile?.name || profile?.full_name || profile?.nome || usuario.email,
        email: usuario.email || profile?.email || '',
        perfil: usuario.perfil || profile?.role || profile?.perfil || 'operador',
        status: usuario.status || profile?.status || 'ativo'
      }
    })

    return new Response(
      JSON.stringify({ ok: true, usuarios: resultado }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
