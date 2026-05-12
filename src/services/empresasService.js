import { supabase } from '../lib/supabase'

function normalizarNomeEmpresa(nome) {
  return String(nome || '').trim().replace(/\s+/g, ' ')
}

export async function listarEmpresasMaster() {
  const { data: empresas, error } = await supabase
    .from('df_empresas')
    .select('id, nome, created_at')
    .order('nome', { ascending: true })

  if (error) throw error

  const { data: vinculos, error: vinculosError } = await supabase
    .from('df_usuarios_empresas')
    .select('empresa_id, user_id, email, perfil')

  if (vinculosError) throw vinculosError

  const usuariosPorEmpresa = new Map()
  ;(vinculos || []).forEach((vinculo) => {
    if (!vinculo?.empresa_id) return
    const chaveUsuario = vinculo.user_id || String(vinculo.email || '').trim().toLowerCase()
    if (!chaveUsuario) return

    const usuarios = usuariosPorEmpresa.get(vinculo.empresa_id) || new Set()
    usuarios.add(chaveUsuario)
    usuariosPorEmpresa.set(vinculo.empresa_id, usuarios)
  })

  return (empresas || []).map((empresa) => ({
    ...empresa,
    totalUsuarios: usuariosPorEmpresa.get(empresa.id)?.size || 0
  }))
}

export async function criarEmpresaMaster({ nome, masterUserId, masterEmail, masterNome }) {
  const nomeLimpo = normalizarNomeEmpresa(nome)
  if (nomeLimpo.length < 2) throw new Error('Informe o nome da empresa.')

  const { data: existente, error: erroConsulta } = await supabase
    .from('df_empresas')
    .select('id, nome')
    .ilike('nome', nomeLimpo)
    .limit(1)

  if (erroConsulta) throw erroConsulta
  if (Array.isArray(existente) && existente.length > 0) {
    throw new Error('Já existe uma empresa com esse nome.')
  }

  const { data: empresa, error } = await supabase
    .from('df_empresas')
    .insert([{ nome: nomeLimpo }])
    .select('id, nome, created_at')
    .single()

  if (error) throw error

  if (masterEmail || masterUserId) {
    const payloadVinculo = {
      empresa_id: empresa.id,
      user_id: masterUserId || null,
      email: String(masterEmail || '').trim().toLowerCase() || null,
      nome: normalizarNomeEmpresa(masterNome) || String(masterEmail || '').split('@')[0] || 'Administrador',
      perfil: 'admin'
    }

    const { error: vinculoError } = await supabase
      .from('df_usuarios_empresas')
      .insert([payloadVinculo])

    if (vinculoError) {
      console.warn('Empresa criada, mas não foi possível vincular o master automaticamente:', vinculoError.message)
    }
  }

  return empresa
}

export async function renomearEmpresaMaster({ empresaId, nome }) {
  const nomeLimpo = normalizarNomeEmpresa(nome)
  if (!empresaId) throw new Error('Empresa não identificada.')
  if (nomeLimpo.length < 2) throw new Error('Informe o nome da empresa.')

  const { data, error } = await supabase
    .from('df_empresas')
    .update({ nome: nomeLimpo })
    .eq('id', empresaId)
    .select('id, nome, created_at')
    .single()

  if (error) throw error
  return data
}
