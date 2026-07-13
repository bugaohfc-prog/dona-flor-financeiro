const mensagemSegura = (erro) => String(erro?.message || erro || 'erro desconhecido').slice(0, 240)

export async function registrarFalhaTecnica(supabase, { empresaId, entidadeId, origem = 'app', acao = 'sistema.erro_tecnico', mensagem, metadados = {} } = {}) {
  if (!supabase || !empresaId || !entidadeId) return { data: null, error: new Error('Contexto técnico incompleto.') }
  return supabase.functions.invoke('registrar-auditoria-evento', {
    body: {
      empresa_id: empresaId,
      acao,
      entidade_tipo: 'sistema',
      entidade_id: entidadeId,
      modulo: 'sistema',
      origem,
      severidade: 'alta',
      status: 'erro',
      dados_antes: null,
      dados_depois: null,
      metadados: { mensagem: mensagemSegura({ message: mensagem }), ...metadados }
    }
  })
}
