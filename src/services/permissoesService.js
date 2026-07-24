import { supabase } from '../lib/supabase.js'
import { normalizarPerfilUsuario } from './usuariosService.js'

export const PERFIS_GLOBAIS = {
  MASTER: 'master',
  ADMIN: 'admin',
  GERENTE: 'gerente',
  OPERADOR: 'operador'
}

// Master não deve ser definido por e-mail fixo.
// A permissão global vem do banco para evitar que admins operacionais recebam painel master por engano.
const MASTER_EMAILS = new Set()

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function normalizarPerfilGlobal(perfil) {
  const valor = String(perfil || '').toLowerCase().trim()

  if (['master', 'super_admin', 'superadmin', 'owner', 'dono'].includes(valor)) return PERFIS_GLOBAIS.MASTER
  if (['admin', 'adm', 'administrador'].includes(valor)) return PERFIS_GLOBAIS.ADMIN

  return normalizarPerfilUsuario(valor)
}

function masterAtivo(registro) {
  if (!registro) return false
  if (registro.ativo === false) return false
  if (registro.status && String(registro.status).toLowerCase() !== 'ativo') return false
  return true
}

function prioridadePerfilEmpresa(perfil) {
  const perfilNormalizado = normalizarPerfilGlobal(perfil)
  if (perfilNormalizado === PERFIS_GLOBAIS.MASTER) return 4
  if (perfilNormalizado === PERFIS_GLOBAIS.ADMIN) return 3
  if (perfilNormalizado === PERFIS_GLOBAIS.GERENTE) return 2
  if (perfilNormalizado === PERFIS_GLOBAIS.OPERADOR) return 1
  return 0
}

export function criarPermissoesUsuario({ perfilEmpresa = 'operador', master = null } = {}) {
  const perfilGlobalEmpresa = normalizarPerfilGlobal(perfilEmpresa)
  const isMaster = Boolean(master?.isMaster || perfilGlobalEmpresa === PERFIS_GLOBAIS.MASTER)
  const perfilNormalizado = isMaster ? PERFIS_GLOBAIS.MASTER : normalizarPerfilUsuario(perfilEmpresa)
  const perfilGlobal = isMaster ? PERFIS_GLOBAIS.MASTER : perfilNormalizado

  return {
    perfilEmpresa: perfilNormalizado,
    perfilGlobal,
    isMaster,
    canManageUsers: Boolean(isMaster || perfilNormalizado === 'admin'),
    canAccessSettings: Boolean(isMaster || ['admin', 'gerente'].includes(perfilNormalizado)),
    canManageCompanies: isMaster,
    canSwitchCompany: isMaster
  }
}

export async function buscarPermissoesUsuario({ userId, email, perfilEmpresa = 'operador' } = {}) {
  const emailNormalizado = normalizarEmail(email)
  const base = criarPermissoesUsuario({ perfilEmpresa })

  if (MASTER_EMAILS.has(emailNormalizado)) {
    return criarPermissoesUsuario({
      perfilEmpresa,
      master: { isMaster: true, perfil: PERFIS_GLOBAIS.MASTER }
    })
  }

  if (!userId && !emailNormalizado) return base

  try {
    const filtrosUsuario = []
    if (userId) filtrosUsuario.push(`id.eq.${userId}`)
    if (emailNormalizado) filtrosUsuario.push(`email.eq.${emailNormalizado}`)

    if (filtrosUsuario.length > 0) {
      const { data: usuarios, error: usuarioError } = await supabase
        .from('df_usuarios')
        .select('id, email, tipo, ativo')
        .or(filtrosUsuario.join(','))
        .limit(10)

      if (usuarioError) {
        console.warn('Não foi possível consultar df_usuarios para permissões:', usuarioError.message)
      } else {
        const usuarioMaster = (usuarios || []).find((registro) => {
          const mesmoUserId = userId && registro.id === userId
          const mesmoEmail = emailNormalizado && normalizarEmail(registro.email) === emailNormalizado
          return (mesmoUserId || mesmoEmail) && masterAtivo(registro) && normalizarPerfilGlobal(registro.tipo) === PERFIS_GLOBAIS.MASTER
        })

        if (usuarioMaster) {
          return criarPermissoesUsuario({
            perfilEmpresa,
            master: { isMaster: true, perfil: PERFIS_GLOBAIS.MASTER }
          })
        }
      }
    }

    const { data, error } = await supabase
      .from('df_usuarios_master')
      .select('*')
      .limit(100)

    if (error) {
      console.warn('Não foi possível consultar df_usuarios_master:', error.message)
      return base
    }

    const registroMaster = (data || []).find((registro) => {
      const mesmoUserId = userId && registro.user_id && registro.user_id === userId
      const mesmoEmail = emailNormalizado && normalizarEmail(registro.email) === emailNormalizado
      return (mesmoUserId || mesmoEmail) && masterAtivo(registro)
    })

    if (!registroMaster) return base

    return criarPermissoesUsuario({
      perfilEmpresa,
      master: {
        isMaster: true,
        perfil: normalizarPerfilGlobal(registroMaster.perfil || registroMaster.tipo || PERFIS_GLOBAIS.MASTER)
      }
    })
  } catch (error) {
    console.warn('Falha ao carregar permissões globais:', error.message)
    return base
  }
}

export async function listarEmpresasDisponiveisParaMaster({ isMaster } = {}) {
  if (!isMaster) return []

  const { data, error } = await supabase
    .from('df_empresas')
    .select('id, nome, created_at')
    .order('nome', { ascending: true })

  if (error) throw error
  return data || []
}


export async function listarEmpresasDisponiveisParaUsuario({ userId, email, isMaster } = {}) {
  if (isMaster) {
    return listarEmpresasDisponiveisParaMaster({ isMaster })
  }

  const emailNormalizado = normalizarEmail(email)
  if (!userId && !emailNormalizado) return []

  let query = supabase
    .from('df_usuarios_empresas')
    .select('empresa_id, perfil, nome, email, user_id')

  if (userId && emailNormalizado) {
    query = query.or(`user_id.eq.${userId},email.eq.${emailNormalizado}`)
  } else if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.eq('email', emailNormalizado)
  }

  const { data: vinculos, error } = await query

  if (error) throw error

  const mapa = new Map()
  ;(vinculos || []).forEach((vinculo) => {
    if (!vinculo?.empresa_id) return
    const perfil = normalizarPerfilGlobal(vinculo.perfil)
    const existente = mapa.get(vinculo.empresa_id)
    const perfilExistente = existente?.perfil || ''
    const prioridadeAtual = prioridadePerfilEmpresa(perfil)
    const prioridadeExistente = prioridadePerfilEmpresa(perfilExistente)
    mapa.set(vinculo.empresa_id, {
      id: vinculo.empresa_id,
      nome: existente?.nome || '',
      perfil: prioridadeAtual > prioridadeExistente ? perfil : (perfilExistente || perfil)
    })
  })

  const empresasIds = Array.from(mapa.keys())
  if (empresasIds.length === 0) return []

  const { data: empresas, error: empresasError } = await supabase
    .from('df_empresas')
    .select('id, nome, created_at')
    .in('id', empresasIds)
    .order('nome', { ascending: true })

  if (empresasError) throw empresasError

  ;(empresas || []).forEach((empresa) => {
    const atual = mapa.get(empresa.id)
    if (!atual) return
    mapa.set(empresa.id, {
      ...atual,
      nome: empresa.nome || atual.nome || 'Empresa',
      created_at: empresa.created_at
    })
  })

  return Array.from(mapa.values()).sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')))
}
