import { supabase } from '../lib/supabase'

export function normalizarPerfilUsuario(perfil) {
  const valor = String(perfil || '').toLowerCase().trim()

  if (['admin', 'adm', 'administrador', 'master', 'owner'].includes(valor)) return 'admin'
  if (['gerente', 'gerencia', 'gestor', 'manager'].includes(valor)) return 'gerente'
  if (['operador', 'usuario', 'usuário', 'user', 'atendente'].includes(valor)) return 'operador'

  return 'operador'
}

export async function listarUsuariosEmpresa(empresaId) {
  if (!empresaId) return []

  const { data, error } = await supabase
    .from('df_usuarios_empresas')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: true })

  if (error) throw error

  const usuariosNormalizados = (data || []).map((usuario) => ({
    ...usuario,
    email: String(usuario.email || '').trim().toLowerCase(),
    perfil: normalizarPerfilUsuario(usuario.perfil)
  }))

  const mapa = new Map()

  for (const usuario of usuariosNormalizados) {
    const chave = usuario.user_id || usuario.email || usuario.id
    const existente = mapa.get(chave)

    if (!existente) {
      mapa.set(chave, usuario)
      continue
    }

    mapa.set(chave, {
      ...existente,
      ...usuario,
      id: existente.id || usuario.id,
      nome: existente.nome || usuario.nome,
      email: existente.email || usuario.email,
      user_id: existente.user_id || usuario.user_id,
      perfil: existente.perfil === 'admin' ? existente.perfil : usuario.perfil,
      created_at: existente.created_at || usuario.created_at
    })
  }

  return Array.from(mapa.values())
}


export async function adicionarUsuarioEmpresa({ empresaId, email, nome, perfil }) {
  const emailNormalizado = String(email || '').trim().toLowerCase()
  const perfilNormalizado = normalizarPerfilUsuario(perfil)

  if (!empresaId) throw new Error('Empresa não identificada.')
  if (!emailNormalizado || !emailNormalizado.includes('@')) throw new Error('Informe um e-mail válido.')

  const { data: existente, error: erroConsulta } = await supabase
    .from('df_usuarios_empresas')
    .select('id, email, user_id')
    .eq('empresa_id', empresaId)
    .eq('email', emailNormalizado)
    .maybeSingle()

  if (erroConsulta) throw erroConsulta
  if (existente) throw new Error('Este e-mail já está cadastrado nesta empresa.')

  const payload = {
    empresa_id: empresaId,
    user_id: null,
    email: emailNormalizado,
    nome: String(nome || '').trim() || emailNormalizado.split('@')[0],
    perfil: perfilNormalizado
  }

  const { data, error } = await supabase
    .from('df_usuarios_empresas')
    .insert([payload])
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function atualizarPerfilUsuarioEmpresa({ empresaId, usuario, perfil }) {
  const perfilNormalizado = normalizarPerfilUsuario(perfil)

  let consulta = supabase
    .from('df_usuarios_empresas')
    .update({ perfil: perfilNormalizado })
    .eq('empresa_id', empresaId)

  if (usuario.id) {
    consulta = consulta.eq('id', usuario.id)
  } else if (usuario.user_id) {
    consulta = consulta.eq('user_id', usuario.user_id)
  } else {
    consulta = consulta.eq('email', usuario.email)
  }

  const { error } = await consulta
  if (error) throw error
}

export async function removerUsuarioEmpresa({ empresaId, usuario }) {
  let consulta = supabase
    .from('df_usuarios_empresas')
    .delete()
    .eq('empresa_id', empresaId)

  if (usuario.id) {
    consulta = consulta.eq('id', usuario.id)
  } else if (usuario.user_id) {
    consulta = consulta.eq('user_id', usuario.user_id)
  } else {
    consulta = consulta.eq('email', usuario.email)
  }

  const { error } = await consulta
  if (error) throw error
}


export async function enviarAcessoUsuarioEmpresa({ usuario }) {
  const email = String(usuario?.email || '').trim().toLowerCase()

  if (!email || !email.includes('@')) {
    throw new Error('Este usuário não possui e-mail válido para envio de acesso.')
  }

  const redirectTo = `${window.location.origin}/reset-password`

  const { data: conviteData, error: conviteError } = await supabase.functions.invoke('convidar-usuario', {
    body: {
      email,
      nome: usuario.nome || '',
      redirectTo
    }
  })

  if (!conviteError) {
    return {
      tipo: 'convite',
      mensagem: conviteData?.message || 'Convite enviado para o e-mail do usuário.'
    }
  }

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  })

  if (resetError) throw resetError

  return {
    tipo: 'reset',
    mensagem: 'Envio solicitado. Se este e-mail já existir no Auth, o usuário receberá o link para criar/redefinir a senha.'
  }
}
