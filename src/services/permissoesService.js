import { supabase } from '../lib/supabase'
import { normalizarPerfilUsuario } from './usuariosService'

export const PERFIS_GLOBAIS = {
  MASTER: 'master',
  ADMIN: 'admin',
  GERENTE: 'gerente',
  OPERADOR: 'operador'
}

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function normalizarPerfilGlobal(perfil) {
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

export function criarPermissoesUsuario({ perfilEmpresa = 'operador', master = null } = {}) {
  const perfilNormalizado = normalizarPerfilUsuario(perfilEmpresa)
  const perfilGlobal = master?.isMaster ? PERFIS_GLOBAIS.MASTER : perfilNormalizado

  return {
    perfilEmpresa: perfilNormalizado,
    perfilGlobal,
    isMaster: Boolean(master?.isMaster),
    canManageUsers: Boolean(master?.isMaster || perfilNormalizado === 'admin'),
    canAccessSettings: Boolean(master?.isMaster || ['admin', 'gerente'].includes(perfilNormalizado)),
    canManageCompanies: Boolean(master?.isMaster),
    canSwitchCompany: Boolean(master?.isMaster)
  }
}

export async function buscarPermissoesUsuario({ userId, email, perfilEmpresa = 'operador' } = {}) {
  const emailNormalizado = normalizarEmail(email)
  const base = criarPermissoesUsuario({ perfilEmpresa })

  if (!userId && !emailNormalizado) return base

  try {
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
