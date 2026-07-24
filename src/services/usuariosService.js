import { supabase } from '../lib/supabase.js'

const MASTER_EMAIL_FALLBACK = 'bugaohfc@gmail.com'
const MASTER_VALUES = new Set(['master', 'owner', 'superadmin', 'super_admin', 'super admin'])

export function normalizarPerfilUsuario(perfil) {
  const valor = String(perfil || '').toLowerCase().trim()

  if (['admin', 'adm', 'administrador', 'master', 'owner'].includes(valor)) return 'admin'
  if (['gerente', 'gerencia', 'gestor', 'manager'].includes(valor)) return 'gerente'
  if (['financeiro', 'financas', 'finanças', 'financial'].includes(valor)) return 'financeiro'
  if (['operacional', 'operacao', 'operação', 'atendente'].includes(valor)) return 'operacional'
  if (['visualizacao', 'visualização', 'viewer', 'leitura', 'consulta'].includes(valor)) return 'visualizacao'
  if (['operador', 'usuario', 'usuário', 'user'].includes(valor)) return 'operador'

  return 'operador'
}

export function usuarioEhMasterProtegido(usuario = {}) {
  const email = String(usuario.email || '').trim().toLowerCase()
  const flagsMaster = [usuario.owner, usuario.superadmin, usuario.super_admin].some((valor) => valor === true)
  const valores = [
    usuario.perfil,
    usuario.perfil_original,
    usuario.role,
    usuario.tipo,
    usuario.owner,
    usuario.superadmin,
    usuario.super_admin
  ].map((valor) => String(valor || '').toLowerCase().trim())

  return flagsMaster || email === MASTER_EMAIL_FALLBACK || valores.some((valor) => MASTER_VALUES.has(valor))
}

function normalizarListaUsuarios(usuarios = [], empresaId = null) {
  const usuariosNormalizados = (usuarios || []).map((usuario) => ({
    ...usuario,
    empresa_id: usuario.empresa_id || empresaId,
    email: String(usuario.email || '').trim().toLowerCase(),
    perfil_original: usuario.perfil_original ?? usuario.perfil,
    perfil: normalizarPerfilUsuario(usuario.perfil)
  })).filter((usuario) => !empresaId || usuario.empresa_id === empresaId)

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
      perfil_original: existente.perfil_original || usuario.perfil_original || existente.perfil || usuario.perfil,
      perfil: existente.perfil === 'admin' ? existente.perfil : usuario.perfil,
      created_at: existente.created_at || usuario.created_at
    })
  }

  return Array.from(mapa.values())
}

async function listarUsuariosEmpresaViaFunction(empresaId) {
  const { data, error } = await supabase.functions.invoke('listar-usuarios-empresa', {
    body: { empresaId }
  })

  if (error) throw error
  if (data?.ok === false) throw new Error(data?.message || 'Não foi possível carregar os usuários da empresa.')

  return normalizarListaUsuarios(data?.usuarios || [], empresaId)
}

export async function listarUsuariosEmpresa(empresaId) {
  if (!empresaId) return []
  return listarUsuariosEmpresaViaFunction(empresaId)
}

export async function adicionarUsuarioEmpresa({ empresaId, email, nome, perfil, senhaProvisoria, criarAuthManual = false }) {
  const emailNormalizado = String(email || '').trim().toLowerCase()
  const nomeNormalizado = String(nome || '').trim() || emailNormalizado.split('@')[0]
  const perfilNormalizado = normalizarPerfilUsuario(perfil)
  const senhaLimpa = String(senhaProvisoria || '').trim()

  if (!empresaId) throw new Error('Empresa não identificada.')
  if (!emailNormalizado || !emailNormalizado.includes('@')) throw new Error('Informe um e-mail válido.')

  if (criarAuthManual && senhaLimpa.length < 12) {
    throw new Error('Informe uma senha provisória com pelo menos 12 caracteres.')
  }

  if (criarAuthManual) {
    const { data: adminData, error: adminError } = await supabase.functions.invoke('criar-usuario-manual', {
      body: {
        empresaId,
        email: emailNormalizado,
        nome: nomeNormalizado,
        perfil: perfilNormalizado,
        senhaProvisoria: senhaLimpa
      }
    })

    if (adminError) {
      const mensagem = String(adminError?.message || adminError?.details || '')
      if (mensagem.includes('Failed to send a request')) {
        throw new Error('Não foi possível criar o usuário agora. Tente novamente ou chame o suporte.')
      }
      throw new Error(mensagem || 'Não foi possível criar o usuário agora. Tente novamente ou chame o suporte.')
    }
    if (adminData?.ok === false) throw new Error(adminData?.message || 'Não foi possível criar o usuário.')

    return adminData?.usuario || adminData?.vinculo || {
      empresa_id: empresaId,
      email: emailNormalizado,
      nome: nomeNormalizado,
      perfil: perfilNormalizado,
      user_id: adminData?.userId || null
    }
  }

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
    nome: nomeNormalizado,
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

const MENSAGEM_ENVIO_ACESSO = 'Envio solicitado. Se o usuário estiver apto, receberá o link por e-mail.'

export async function enviarAcessoUsuarioEmpresa({ empresaId, usuario }) {
  const empresa = String(empresaId || '').trim()
  const email = String(usuario?.email || '').trim().toLowerCase()

  if (!empresa) {
    throw new Error('Empresa não identificada para envio de acesso.')
  }

  if (!email || !email.includes('@')) {
    throw new Error('Este usuário não possui e-mail válido para envio de acesso.')
  }

  const { data: conviteData, error: conviteError } = await supabase.functions.invoke('convidar-usuario', {
    body: {
      empresaId: empresa,
      email,
      nome: usuario.nome || ''
    }
  })

  if (conviteError) {
    console.warn('Não foi possível solicitar envio de acesso:', conviteError)
    throw new Error(MENSAGEM_ENVIO_ACESSO)
  }

  if (conviteData?.ok === false) {
    console.warn('Envio de acesso retornou status não conclusivo.')
  }

  return {
    tipo: 'convite',
    mensagem: conviteData?.message || MENSAGEM_ENVIO_ACESSO
  }
}

export async function atualizarNomeUsuarioLogado({ userId, email, nome }) {
  const nomeLimpo = String(nome || '').trim()
  const emailNormalizado = String(email || '').trim().toLowerCase()

  if (!userId) throw new Error('Usuário não identificado.')
  if (nomeLimpo.length < 2) throw new Error('Informe um nome com pelo menos 2 caracteres.')

  const erros = []

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: userId, name: nomeLimpo }, { onConflict: 'id' })

  if (profileError) erros.push(profileError)

  const { error: vinculoUserError } = await supabase
    .from('df_usuarios_empresas')
    .update({ nome: nomeLimpo })
    .eq('user_id', userId)

  if (vinculoUserError) erros.push(vinculoUserError)

  if (emailNormalizado) {
    const { error: vinculoEmailError } = await supabase
      .from('df_usuarios_empresas')
      .update({ nome: nomeLimpo })
      .eq('email', emailNormalizado)

    if (vinculoEmailError) erros.push(vinculoEmailError)
  }

  if (erros.length > 0) {
    throw erros[0]
  }

  return { nome: nomeLimpo }
}

export async function listarFiliaisUsuariosEmpresa(empresaId) {
  if (!empresaId) return []

  const { data, error } = await supabase
    .from('df_usuarios_filiais')
    .select('id, empresa_id, usuario_id, filial_id, created_at')
    .eq('empresa_id', empresaId)

  if (error) throw error
  return data || []
}

export async function atualizarFiliaisUsuarioEmpresa({ empresaId, usuario, filialIds }) {
  if (!empresaId) throw new Error('Empresa não identificada.')
  if (!usuario?.id) throw new Error('Usuário da empresa não identificado.')

  const filiaisNormalizadas = Array.from(new Set((filialIds || []).filter(Boolean)))

  const { error: deleteError } = await supabase
    .from('df_usuarios_filiais')
    .delete()
    .eq('empresa_id', empresaId)
    .eq('usuario_id', usuario.id)

  if (deleteError) throw deleteError

  if (filiaisNormalizadas.length === 0) return []

  const payload = filiaisNormalizadas.map((filialId) => ({
    empresa_id: empresaId,
    usuario_id: usuario.id,
    filial_id: filialId
  }))

  const { data, error } = await supabase
    .from('df_usuarios_filiais')
    .insert(payload)
    .select('id, empresa_id, usuario_id, filial_id, created_at')

  if (error) throw error
  return data || []
}
