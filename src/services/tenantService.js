import { supabase } from '../lib/supabase'
import { normalizarPerfilUsuario } from './usuariosService'

export const TENANT_ERRORS = {
  semEmpresa: 'Usuário sem empresa vinculada. Vincule este usuário em df_usuarios_empresas antes de continuar.'
}

export function normalizarVinculoEmpresa(vinculo) {
  if (!vinculo?.empresa_id) return null

  return {
    empresaId: vinculo.empresa_id,
    perfil: normalizarPerfilUsuario(vinculo.perfil),
    nomeEmpresa: vinculo.empresas?.nome || vinculo.df_empresas?.nome || '',
    origem: 'df_usuarios_empresas'
  }
}

export async function sincronizarUsuarioLogadoComEmpresa() {
  const { error } = await supabase.rpc('vincular_usuario_logado')

  if (error) {
    console.warn('Não foi possível executar vínculo automático:', error.message)
  }
}

export async function buscarVinculoEmpresaDoUsuario(userId) {
  if (!userId) return null

  const { data, error } = await supabase
    .from('df_usuarios_empresas')
    .select('empresa_id, perfil')
    .eq('user_id', userId)
    .limit(1)

  if (error) throw error

  const vinculo = Array.isArray(data) ? data[0] : data
  return normalizarVinculoEmpresa(vinculo)
}

export async function buscarNomePerfilUsuario(userId) {
  if (!userId) return ''

  const { data, error } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .limit(1)

  if (error) {
    console.warn('Não foi possível carregar o nome do perfil:', error.message)
    return ''
  }

  const perfil = Array.isArray(data) ? data[0] : data
  return perfil?.name || ''
}

export function assertEmpresaId(empresaId) {
  if (!empresaId) {
    throw new Error('Empresa não identificada para esta operação.')
  }

  return empresaId
}
