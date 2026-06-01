import { supabase } from '../lib/supabase'

const CAMPOS_DESTINATARIO = [
  'id',
  'empresa_id',
  'nome',
  'email',
  'ativo',
  'recebe_contas',
  'recebe_notas',
  'recebe_resumo',
  'observacao',
  'criado_em',
  'atualizado_em'
].join(', ')

function normalizarId(valor, mensagem) {
  const id = String(valor || '').trim()
  if (!id) throw new Error(mensagem)
  return id
}

function normalizarTexto(valor) {
  const texto = String(valor || '').trim().replace(/\s+/g, ' ')
  return texto || null
}

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function tratarErroSupabase(error) {
  if (!error) return error

  const mensagem = String(error.message || '')
  const codigo = String(error.code || '')

  if (codigo === '23505' || mensagem.toLowerCase().includes('duplicate key')) {
    return new Error('Ja existe um destinatario com este e-mail nesta empresa.')
  }

  if (codigo === '42501' || mensagem.toLowerCase().includes('row-level security')) {
    return new Error('Seu perfil nao permite alterar destinatarios de alertas nesta empresa.')
  }

  if (codigo === '23514' && mensagem.toLowerCase().includes('empresa_id')) {
    return new Error('Nao e permitido alterar a empresa de um destinatario.')
  }

  return error
}

function montarPayloadDestinatario(dados = {}, empresaId = null) {
  const nome = normalizarTexto(dados.nome)
  const email = normalizarEmail(dados.email)
  const recebeContas = dados.recebe_contas !== false
  const recebeNotas = dados.recebe_notas !== false
  const recebeResumo = dados.recebe_resumo !== false

  if (!nome) throw new Error('Informe o nome do destinatario.')
  if (!email) throw new Error('Informe o e-mail do destinatario.')
  if (!validarEmail(email)) throw new Error('Informe um e-mail valido.')
  if (!recebeContas && !recebeNotas && !recebeResumo) {
    throw new Error('Marque pelo menos uma preferencia de recebimento.')
  }

  const payload = {
    nome,
    email,
    ativo: dados.ativo !== false,
    recebe_contas: recebeContas,
    recebe_notas: recebeNotas,
    recebe_resumo: recebeResumo,
    observacao: normalizarTexto(dados.observacao)
  }

  if (empresaId) payload.empresa_id = empresaId

  return payload
}

export async function listarDestinatariosAlertas({ empresaId, incluirInativos = false } = {}) {
  const empresa = normalizarId(empresaId, 'Empresa ativa nao identificada para listar destinatarios.')

  let query = supabase
    .from('df_destinatarios_alertas')
    .select(CAMPOS_DESTINATARIO)
    .eq('empresa_id', empresa)

  if (!incluirInativos) query = query.eq('ativo', true)

  const { data, error } = await query
    .order('ativo', { ascending: false })
    .order('nome', { ascending: true })
    .order('email', { ascending: true })

  if (error) throw tratarErroSupabase(error)
  return data || []
}

export async function criarDestinatarioAlerta({ empresaId, destinatario } = {}) {
  const empresa = normalizarId(empresaId, 'Empresa ativa nao identificada para criar destinatario.')
  const payload = montarPayloadDestinatario(destinatario, empresa)

  const { data, error } = await supabase
    .from('df_destinatarios_alertas')
    .insert([payload])
    .select(CAMPOS_DESTINATARIO)
    .single()

  if (error) throw tratarErroSupabase(error)
  return data
}

export async function atualizarDestinatarioAlerta({ empresaId, destinatarioId, destinatario } = {}) {
  const empresa = normalizarId(empresaId, 'Empresa ativa nao identificada para editar destinatario.')
  const id = normalizarId(destinatarioId, 'Destinatario nao identificado.')
  const payload = montarPayloadDestinatario(destinatario)

  const { data, error } = await supabase
    .from('df_destinatarios_alertas')
    .update(payload)
    .eq('id', id)
    .eq('empresa_id', empresa)
    .select(CAMPOS_DESTINATARIO)
    .single()

  if (error) throw tratarErroSupabase(error)
  return data
}

export async function alterarStatusDestinatarioAlerta({ empresaId, destinatarioId, ativo } = {}) {
  const empresa = normalizarId(empresaId, 'Empresa ativa nao identificada para alterar destinatario.')
  const id = normalizarId(destinatarioId, 'Destinatario nao identificado.')

  const { data, error } = await supabase
    .from('df_destinatarios_alertas')
    .update({ ativo: Boolean(ativo) })
    .eq('id', id)
    .eq('empresa_id', empresa)
    .select(CAMPOS_DESTINATARIO)
    .single()

  if (error) throw tratarErroSupabase(error)
  return data
}
