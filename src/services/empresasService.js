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

export async function criarEmpresaMaster({ nome, masterNome }) {
  const nomeLimpo = normalizarNomeEmpresa(nome)
  if (nomeLimpo.length < 2) throw new Error('Informe o nome da empresa.')

  const { data, error } = await supabase.functions.invoke('criar-empresa-master', {
    body: {
      nome: nomeLimpo,
      masterNome
    }
  })

  if (error) {
    console.warn('Falha ao chamar criar-empresa-master:', error)
    throw new Error('Não foi possível criar a empresa.')
  }
  if (!data?.ok || !data?.empresa?.id) {
    throw new Error(data?.message || 'Não foi possível criar a empresa.')
  }

  return data.empresa
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
