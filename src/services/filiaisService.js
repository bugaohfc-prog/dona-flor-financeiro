import { supabase } from '../lib/supabase'

const CAMPOS_FILIAL = [
  'id',
  'empresa_id',
  'nome',
  'ativo',
  'created_at',
  'razao_social',
  'nome_fantasia',
  'cnpj',
  'inscricao_estadual',
  'endereco',
  'numero',
  'complemento',
  'bairro',
  'cidade',
  'uf',
  'cep',
  'telefone',
  'email',
  'updated_at'
].join(', ')

function normalizarNomeFilial(nome) {
  return String(nome || '').trim().replace(/\s+/g, ' ')
}

function normalizarTextoOpcional(valor) {
  const texto = String(valor || '').trim().replace(/\s+/g, ' ')
  return texto || null
}

function normalizarUf(valor) {
  const texto = String(valor || '').trim().toUpperCase()
  return texto || null
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
    .select(CAMPOS_FILIAL)
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
    .select(CAMPOS_FILIAL)
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
    .update({ nome: nomeLimpo, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(CAMPOS_FILIAL)
    .single()

  if (error) throw error
  return data
}

export async function atualizarCadastroFiscalFilial({ filialId, dados }) {
  const id = String(filialId || '').trim()
  if (!id) throw new Error('Filial não identificada.')

  const payload = {
    razao_social: normalizarTextoOpcional(dados?.razao_social),
    nome_fantasia: normalizarTextoOpcional(dados?.nome_fantasia),
    cnpj: normalizarTextoOpcional(dados?.cnpj),
    inscricao_estadual: normalizarTextoOpcional(dados?.inscricao_estadual),
    endereco: normalizarTextoOpcional(dados?.endereco),
    numero: normalizarTextoOpcional(dados?.numero),
    complemento: normalizarTextoOpcional(dados?.complemento),
    bairro: normalizarTextoOpcional(dados?.bairro),
    cidade: normalizarTextoOpcional(dados?.cidade),
    uf: normalizarUf(dados?.uf),
    cep: normalizarTextoOpcional(dados?.cep),
    telefone: normalizarTextoOpcional(dados?.telefone),
    email: normalizarTextoOpcional(dados?.email),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('df_filiais')
    .update(payload)
    .eq('id', id)
    .select(CAMPOS_FILIAL)
    .single()

  if (error) throw error
  return data
}

export async function alternarStatusFilial({ filialId, ativo }) {
  const id = String(filialId || '').trim()
  if (!id) throw new Error('Filial não identificada.')

  const { data, error } = await supabase
    .from('df_filiais')
    .update({ ativo: Boolean(ativo), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(CAMPOS_FILIAL)
    .single()

  if (error) throw error
  return data
}
