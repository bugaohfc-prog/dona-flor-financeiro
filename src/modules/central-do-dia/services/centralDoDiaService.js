const SELECT_ATIVIDADE_CENTRAL = 'id,user_id,empresa_id,criado_em,modulo,acao,entidade_tipo,severidade,status,origem'

export async function listarAtividadeRecenteCentral({ supabase, empresaId, limite = 12 } = {}) {
  if (!supabase || !empresaId) {
    return { data: [], error: new Error('Empresa não identificada para carregar a atividade recente.') }
  }

  const limiteSeguro = Math.min(Math.max(Number(limite) || 12, 1), 20)
  return supabase
    .from('df_auditoria_eventos')
    .select(SELECT_ATIVIDADE_CENTRAL)
    .eq('empresa_id', empresaId)
    .order('criado_em', { ascending: false })
    .limit(limiteSeguro)
}
