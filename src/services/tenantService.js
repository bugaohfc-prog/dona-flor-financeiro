import { supabase } from '../lib/supabase.js'
import { normalizarPerfilGlobal } from './permissoesService.js'

export const TENANT_ERRORS = {
  semEmpresa: 'Usuário sem empresa vinculada. Peça ao administrador para liberar seu acesso.'
}

export function normalizarVinculoEmpresa(vinculo) {
  if (!vinculo?.empresa_id) return null

  return {
    empresaId: vinculo.empresa_id,
    perfil: normalizarPerfilGlobal(vinculo.perfil),
    nomeEmpresa: vinculo.nome_empresa || vinculo.empresas?.nome || vinculo.df_empresas?.nome || '',
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
  if (!vinculo?.empresa_id) return null

  let nomeEmpresa = ''

  const { data: empresa, error: empresaError } = await supabase
    .from('df_empresas')
    .select('nome')
    .eq('id', vinculo.empresa_id)
    .limit(1)

  if (empresaError) {
    console.warn('Não foi possível carregar o nome da empresa ativa:', empresaError.message)
  } else {
    const empresaEncontrada = Array.isArray(empresa) ? empresa[0] : empresa
    nomeEmpresa = empresaEncontrada?.nome || ''
  }

  return normalizarVinculoEmpresa({ ...vinculo, nome_empresa: nomeEmpresa })
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


export function assertPayloadEmpresaId(payload) {
  if (!payload?.empresa_id) {
    throw new Error('Empresa não identificada para esta operação.')
  }

  return payload
}

export function assertPayloadsEmpresaId(payloads) {
  if (!Array.isArray(payloads) || payloads.length === 0) return payloads

  payloads.forEach(assertPayloadEmpresaId)
  return payloads
}
