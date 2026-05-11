export async function listarContasAtivas(supabase, empresaId) {
  return supabase
    .from('df_contas')
    .select('*, df_centros_custo(nome), df_contas_recorrentes(tipo_recorrencia)')
    .eq('empresa_id', empresaId)
    .eq('excluido', false)
    .order('data_vencimento')
}

export async function listarRecorrenciasAtivas(supabase, empresaId) {
  return supabase
    .from('df_contas_recorrentes')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
}

export async function criarContasEmLote(supabase, contas) {
  return supabase
    .from('df_contas')
    .insert(contas)
    .select('*, df_centros_custo(nome), df_contas_recorrentes(tipo_recorrencia)')
}

export async function criarConta(supabase, payload) {
  return supabase.from('df_contas').insert([payload]).select()
}

export async function atualizarConta(supabase, id, empresaId, payload) {
  return supabase
    .from('df_contas')
    .update(payload)
    .eq('id', id)
    .eq('empresa_id', empresaId)
}

export async function buscarRecorrenciaPorId(supabase, id, empresaId) {
  return supabase
    .from('df_contas_recorrentes')
    .select('*')
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .maybeSingle()
}

export async function listarRecorrenciasPorDia(supabase, empresaId, diaVencimento) {
  return supabase
    .from('df_contas_recorrentes')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .eq('dia_vencimento', diaVencimento)
    .order('created_at', { ascending: false })
}

export async function criarRecorrencia(supabase, payload) {
  return supabase.from('df_contas_recorrentes').insert([payload]).select()
}

export async function atualizarRecorrencia(supabase, id, empresaId, payload) {
  return supabase
    .from('df_contas_recorrentes')
    .update(payload)
    .eq('id', id)
    .eq('empresa_id', empresaId)
}

export async function vincularRecorrenciaNaConta(supabase, contaId, empresaId, recorrenciaId) {
  return atualizarConta(supabase, contaId, empresaId, { recorrencia_id: recorrenciaId })
}

export async function desativarRecorrencia(supabase, id, empresaId) {
  return atualizarRecorrencia(supabase, id, empresaId, { ativo: false })
}

export async function atualizarStatusConta(supabase, id, empresaId, status) {
  return atualizarConta(supabase, id, empresaId, { status })
}

export async function enviarContaParaLixeira(supabase, id, empresaId) {
  return atualizarConta(supabase, id, empresaId, {
    excluido: true,
    excluido_em: new Date().toISOString()
  })
}
