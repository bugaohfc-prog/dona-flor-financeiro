import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const GENERIC_ERROR_MESSAGE = 'Nao foi possivel criar a empresa.'

function resposta(status: number, body: Record<string, unknown>) {
  return new Response(
    JSON.stringify(body),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
  )
}

function normalizarNome(nome: unknown) {
  return String(nome || '').trim().replace(/\s+/g, ' ')
}

function resumirErro(error: any) {
  return {
    name: error?.name,
    code: error?.code,
    status: error?.status,
    message: error?.message
  }
}

function extrairBearerToken(authHeader: string | null) {
  const token = String(authHeader || '').replace(/^Bearer\s+/i, '').trim()
  return token || null
}

function obterNomeVinculo(user: any, masterNome: unknown) {
  const email = String(user?.email || '').trim().toLowerCase()
  const metadata = user?.user_metadata || {}
  const nomeMetadata = metadata.nome || metadata.name || metadata.full_name

  return (
    normalizarNome(masterNome) ||
    normalizarNome(nomeMetadata) ||
    normalizarNome(email.split('@')[0]) ||
    'Administrador'
  )
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('ANON_KEY')
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error('[criar-empresa-master] Variaveis de ambiente ausentes.', {
        hasUrl: Boolean(supabaseUrl),
        hasAnonKey: Boolean(anonKey),
        hasServiceRoleKey: Boolean(serviceRoleKey)
      })
      return resposta(500, { ok: false, message: GENERIC_ERROR_MESSAGE })
    }

    const authHeader = req.headers.get('Authorization')
    const accessToken = extrairBearerToken(authHeader)
    if (!accessToken) {
      console.warn('[criar-empresa-master] Chamada sem Authorization Bearer.')
      return resposta(401, { ok: false, message: GENERIC_ERROR_MESSAGE })
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { data: callerData, error: callerError } = await supabaseUser.auth.getUser(accessToken)
    if (callerError || !callerData.user) {
      console.warn('[criar-empresa-master] Chamada sem sessao autenticada.', resumirErro(callerError))
      return resposta(401, { ok: false, message: GENERIC_ERROR_MESSAGE })
    }

    console.info('[criar-empresa-master] Usuario autenticado encontrado.', {
      callerId: callerData.user.id,
      email: callerData.user.email || null
    })

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data: vinculoMaster, error: masterError } = await supabaseAdmin
      .from('df_usuarios_empresas')
      .select('user_id, email, empresa_id, perfil')
      .eq('user_id', callerData.user.id)
      .eq('perfil', 'master')
      .limit(1)
      .maybeSingle()

    if (masterError) {
      console.warn('[criar-empresa-master] Erro ao consultar df_usuarios_empresas para validar master.', {
        callerId: callerData.user.id,
        email: callerData.user.email || null,
        error: resumirErro(masterError)
      })
      return resposta(500, { ok: false, message: GENERIC_ERROR_MESSAGE })
    }

    console.info('[criar-empresa-master] Resultado da validacao master direta.', {
      callerId: callerData.user.id,
      email: callerData.user.email || null,
      isMaster: Boolean(vinculoMaster)
    })

    if (!vinculoMaster) {
      console.warn('[criar-empresa-master] Bloqueio por usuario nao master.', {
        callerId: callerData.user.id,
        email: callerData.user.email || null
      })
      return resposta(403, { ok: false, message: GENERIC_ERROR_MESSAGE })
    }

    const { nome, masterNome } = await req.json()
    const nomeLimpo = normalizarNome(nome)

    if (nomeLimpo.length < 2) {
      return resposta(200, { ok: false, message: 'Informe o nome da empresa.' })
    }

    const { data: empresasExistentes, error: erroConsulta } = await supabaseAdmin
      .from('df_empresas')
      .select('id, nome')
      .ilike('nome', nomeLimpo)
      .limit(1)

    if (erroConsulta) {
      console.warn('[criar-empresa-master] Falha ao verificar duplicidade.', {
        callerId: callerData.user.id,
        error: resumirErro(erroConsulta)
      })
      return resposta(500, { ok: false, message: GENERIC_ERROR_MESSAGE })
    }

    if (Array.isArray(empresasExistentes) && empresasExistentes.length > 0) {
      return resposta(200, { ok: false, message: 'Ja existe uma empresa com esse nome.' })
    }

    const { data: empresa, error: empresaError } = await supabaseAdmin
      .from('df_empresas')
      .insert([{ nome: nomeLimpo }])
      .select('id, nome, created_at')
      .single()

    if (empresaError || !empresa?.id) {
      console.warn('[criar-empresa-master] Falha ao inserir empresa.', {
        callerId: callerData.user.id,
        error: resumirErro(empresaError)
      })
      return resposta(500, { ok: false, message: GENERIC_ERROR_MESSAGE })
    }

    const email = String(callerData.user.email || '').trim().toLowerCase()
    const payloadVinculo = {
      empresa_id: empresa.id,
      user_id: callerData.user.id,
      email: email || null,
      nome: obterNomeVinculo(callerData.user, masterNome),
      perfil: 'admin'
    }

    const { error: vinculoError } = await supabaseAdmin
      .from('df_usuarios_empresas')
      .insert([payloadVinculo])

    if (vinculoError) {
      console.warn('[criar-empresa-master] Falha ao criar vinculo inicial; tentando rollback da empresa.', {
        callerId: callerData.user.id,
        empresaId: empresa.id,
        error: resumirErro(vinculoError)
      })

      const { error: rollbackError } = await supabaseAdmin
        .from('df_empresas')
        .delete()
        .eq('id', empresa.id)

      if (rollbackError) {
        console.error('[criar-empresa-master] Rollback da empresa falhou.', {
          callerId: callerData.user.id,
          empresaId: empresa.id,
          error: resumirErro(rollbackError)
        })
      } else {
        console.info('[criar-empresa-master] Rollback da empresa realizado.', {
          callerId: callerData.user.id,
          empresaId: empresa.id
        })
      }

      return resposta(500, { ok: false, message: GENERIC_ERROR_MESSAGE })
    }

    return resposta(200, {
      ok: true,
      message: 'Empresa criada com sucesso.',
      empresa
    })
  } catch (error) {
    console.error('[criar-empresa-master] Erro inesperado.', resumirErro(error))
    return resposta(500, { ok: false, message: GENERIC_ERROR_MESSAGE })
  }
})
