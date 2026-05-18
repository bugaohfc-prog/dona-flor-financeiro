import { supabase } from '../lib/supabase'

export const PLANOS_BASE = [
  {
    codigo: 'starter',
    nome: 'Inicial',
    descricao: 'Para empresas com uma filial.',
    limite_filiais: 1,
    limite_usuarios: 3,
    valor_mensal: 0,
    recursos: ['1 filial', '3 usuários', 'Contas e notas', 'Painel financeiro']
  },
  {
    codigo: 'profissional',
    nome: 'Profissional',
    descricao: 'Para empresas com até cinco filiais.',
    limite_filiais: 5,
    limite_usuarios: 15,
    valor_mensal: 149,
    recursos: ['Até 5 filiais', 'Até 15 usuários', 'Painel financeiro', 'Relatórios gerenciais']
  },
  ]

function isTabelaAusente(error) {
  const mensagem = String(error?.message || '').toLowerCase()
  return error?.code === '42P01' || mensagem.includes('does not exist') || mensagem.includes('schema cache')
}

export function obterPlanoFallback(codigo = 'profissional') {
  return PLANOS_BASE.find((plano) => plano.codigo === codigo) || PLANOS_BASE[1]
}

export async function listarPlanosBilling() {
  const { data, error } = await supabase
    .from('df_planos')
    .select('id, codigo, nome, descricao, limite_filiais, limite_usuarios, valor_mensal, ativo')
    .eq('ativo', true)
    .order('valor_mensal', { ascending: true, nullsFirst: false })

  if (error) {
    if (isTabelaAusente(error)) return PLANOS_BASE
    throw error
  }

  if (!Array.isArray(data) || data.length === 0) return PLANOS_BASE

  return data.map((plano) => ({
    ...plano,
    recursos: montarRecursosPlano(plano)
  }))
}

export async function buscarAssinaturaEmpresa(empresaId) {
  if (!empresaId) return null

  const { data, error } = await supabase
    .from('df_assinaturas')
    .select('id, empresa_id, plano_codigo, status, trial_inicio, trial_fim, assinatura_inicio, assinatura_fim, limite_filiais, limite_usuarios')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (isTabelaAusente(error)) return null
    throw error
  }

  return data || null
}

export async function buscarResumoBilling(empresaId) {
  const [planos, assinatura] = await Promise.all([
    listarPlanosBilling(),
    buscarAssinaturaEmpresa(empresaId)
  ])

  const planoAtual = planos.find((plano) => plano.codigo === assinatura?.plano_codigo) || obterPlanoFallback(assinatura?.plano_codigo)

  return {
    planos,
    assinatura,
    planoAtual: {
      ...planoAtual,
      limite_filiais: assinatura?.limite_filiais ?? planoAtual.limite_filiais,
      limite_usuarios: assinatura?.limite_usuarios ?? planoAtual.limite_usuarios
    }
  }
}

export async function salvarAssinaturaEmpresa() {
  if (!empresaId) throw new Error('Empresa não identificada.')
  if (!planoCodigo) throw new Error('Selecione um plano.')

  const payload = const { data: existente, error: erroBusca } = await supabase
    .from('df_assinaturas')
    .select('id')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (erroBusca) throw erroBusca

  if (existente?.id) {
    const { data, error } = await supabase
      .from('df_assinaturas')
      .update(payload)
      .eq('id', existente.id)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('df_assinaturas')
    .insert([{ ...payload, trial_inicio: new Date().toISOString().slice(0, 10) }])
    .select('*')
    .single()

  if (error) throw error
  return data
}

function montarRecursosPlano(plano) {
  const recursos = []
  recursos.push(plano.limite_filiais ? `Até ${plano.limite_filiais} filial(is)` : 'Filiais ilimitadas')
  recursos.push(plano.limite_usuarios ? `Até ${plano.limite_usuarios} usuário(s)` : 'Usuários ilimitados')
  recursos.push('Painel financeiro')
  recursos.push('Gestão do plano comercial')
  return recursos
}
