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

function normalizarPerfil(perfil: string) {
  const valor = String(perfil || '').toLowerCase().trim()
  if (['admin', 'adm', 'administrador', 'master', 'owner'].includes(valor)) return 'admin'
  if (['gerente', 'gerencia', 'gestor', 'manager'].includes(valor)) return 'gerente'
  if (['financeiro', 'financas', 'finanças', 'financial'].includes(valor)) return 'financeiro'
  if (['operacional', 'operacao', 'operação', 'atendente'].includes(valor)) return 'operacional'
  if (['visualizacao', 'visualização', 'viewer', 'leitura', 'consulta'].includes(valor)) return 'visualizacao'
  return 'operador'
}

function perfilPodeAdministrarEmpresa(perfil: string) {
  return normalizarPerfil(perfil) === 'admin'
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

async function buscarVinculoAdminEmpresa(supabaseAdmin: any, user: any, empresaId: string) {
  const email = String(user?.email || '').trim().toLowerCase()

  if (user?.id) {
    const { data, error } = await supabaseAdmin
      .from('df_usuarios_empresas')
      .select('id, empresa_id, user_id, email, perfil')
      .eq('empresa_id', empresaId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error
    if (data && perfilPodeAdministrarEmpresa(data.perfil)) return data
  }

  if (email) {
    const { data, error } = await supabaseAdmin
      .from('df_usuarios_empresas')
      .select('id, empresa_id, user_id, email, perfil')
      .eq('empresa_id', empresaId)
      .eq('email', email)
      .maybeSingle()

    if (error) throw error
    if (data && perfilPodeAdministrarEmpresa(data.perfil)) return data
  }

  return null
}

serve(async (req) => {
  const requestOrigin = req.headers.get('Origin')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(requestOrigin) })
  }

  let supabaseAdmin: any = null
  let userIdCriado: string | null = null

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[criar-usuario-manual] Configuração interna ausente.')
      return resposta(requestOrigin, { ok: false, message: 'Serviço temporariamente indisponível.' }, 503)
    }

    const authHeader = req.headers.get('Authorization')
    const supabaseUser = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader || '' } }
    })

    const { data: callerData, error: callerError } = await supabaseUser.auth.getUser()
    if (callerError || !callerData.user) {
      return resposta(requestOrigin, { ok: false, message: 'Usuário não autenticado.' }, 401)
    }

    const body = await req.json()
    const empresaId = String(body?.empresaId || '').trim()
    const email = String(body?.email || '').trim().toLowerCase()
    const nome = String(body?.nome || '').trim() || email.split('@')[0]
    const perfil = normalizarPerfil(body?.perfil)
    const senhaProvisoria = String(body?.senhaProvisoria || '')

    if (!empresaId) return resposta(requestOrigin, { ok: false, message: 'Empresa não identificada.' }, 400)
    if (!email || !email.includes('@')) return resposta(requestOrigin, { ok: false, message: 'E-mail inválido.' }, 400)
    if (senhaProvisoria.length < 12) {
      return resposta(requestOrigin, { ok: false, message: 'A senha provisória precisa ter pelo menos 12 caracteres.' }, 400)
    }

    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const vinculoAdmin = await buscarVinculoAdminEmpresa(supabaseAdmin, callerData.user, empresaId)

    if (!vinculoAdmin) {
      return resposta(requestOrigin, { ok: false, message: 'Apenas administradores desta empresa podem criar acessos manuais.' }, 403)
    }

    const { data: existenteVinculo, error: consultaVinculoError } = await supabaseAdmin
      .from('df_usuarios_empresas')
      .select('id, email, user_id')
      .eq('empresa_id', empresaId)
      .eq('email', email)
      .maybeSingle()

    if (consultaVinculoError) throw consultaVinculoError
    if (existenteVinculo) {
      return resposta(requestOrigin, { ok: false, message: 'Este e-mail já está cadastrado nesta empresa.' }, 409)
    }

    const { data: usuarioCriado, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senhaProvisoria,
      email_confirm: true,
      app_metadata: {
        created_by_admin: true,
        must_change_password: true
      },
      user_metadata: {
        name: nome,
        full_name: nome,
        created_by_admin: true,
        must_change_password: true
      }
    })

    if (authError) throw authError

    userIdCriado = usuarioCriado?.user?.id || null
    if (!userIdCriado) throw new Error('Supabase Auth não retornou o identificador do usuário criado.')

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userIdCriado, name: nome }, { onConflict: 'id' })

    if (profileError) throw profileError

    const payload = {
      empresa_id: empresaId,
      user_id: userIdCriado,
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

    return resposta(requestOrigin, {
      ok: true,
      message: 'Usuário criado com senha provisória. A troca será exigida no primeiro acesso.',
      userId: userIdCriado,
      usuario: vinculo,
      vinculo
    }, 200)
  } catch (error) {
    console.error('[criar-usuario-manual] Falha ao provisionar usuário.', {
      message: error?.message,
      code: error?.code,
      userIdCriado
    })

    if (supabaseAdmin && userIdCriado) {
      const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(userIdCriado)
      if (cleanupError) {
        console.error('[criar-usuario-manual] Falha na compensação do usuário Auth.', {
          userIdCriado,
          message: cleanupError.message
        })
      }
    }

    return resposta(requestOrigin, {
      ok: false,
      message: 'Não foi possível criar o usuário. Nenhum acesso funcional foi mantido.'
    }, 400)
  }
})
