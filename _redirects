import { supabase } from '../lib/supabase'

function normalizarNomeFilial(nome) {
  return String(nome || '').trim().replace(/\s+/g, ' ')
}

function validarEmpresaId(empresaId) {
  const id = String(empresaId || '').trim()
  if (!id) throw new Error('Empresa não identificada para gerenciar filiais.')
  return id
}

export async function listarFiliaisPorEmpresa(empresaId) {
  const empresa = validarEmpresaId(empresaId)

  const { data, error } = await supabase
    .from('df_filiais')
    .select('id, empresa_id, nome, ativo, created_at')
    .eq('empresa_id', empresa)
    .order('nome', { ascending: true })

  if (error) throw error
  return data || []
}

export async function criarFilial({ empresaId, nome }) {
  const empresa = validarEmpresaId(empresaId)
  const nomeLimpo = normalizarNomeFilial(nome)

  if (nomeLimpo.length < 2) throw new Error('Informe o nome da filial.')

  const { data: existentes, error: erroConsulta } = await supabase
    .from('df_filiais')
    .select('id, nome')
    .eq('empresa_id', empresa)
    .ilike('nome', nomeLimpo)
    .limit(1)

  if (erroConsulta) throw erroConsulta
  if (Array.isArray(existentes) && existentes.length > 0) {
    throw new Error('Já existe uma filial com esse nome nesta empresa.')
  }

  const { data, error } = await supabase
    .from('df_filiais')
    .insert([{ empresa_id: empresa, nome: nomeLimpo, ativo: true }])
    .select('id, empresa_id, nome, ativo, created_at')
    .single()

  if (error) throw error
  return data
}

export async function renomearFilial({ filialId, nome }) {
  const id = String(filialId || '').trim()
  const nomeLimpo = normalizarNomeFilial(nome)

  if (!id) throw new Error('Filial não identificada.')
  if (nomeLimpo.length < 2) throw new Error('Informe o nome da filial.')

  const { data, error } = await supabase
    .from('df_filiais')
    .update({ nome: nomeLimpo })
    .eq('id', id)
    .select('id, empresa_id, nome, ativo, created_at')
    .single()

  if (error) throw error
  return data
}

export async function alternarStatusFilial({ filialId, ativo }) {
  const id = String(filialId || '').trim()
  if (!id) throw new Error('Filial não identificada.')

  const { data, error } = await supabase
    .from('df_filiais')
    .update({ ativo: Boolean(ativo) })
    .eq('id', id)
    .select('id, empresa_id, nome, ativo, created_at')
    .single()

  if (error) throw error
  return data
}
