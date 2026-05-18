export function erroEhSessaoExpirada(erro) {
  const mensagem = String(erro?.message || erro || '').toLowerCase()
  return mensagem.includes('jwt') || mensagem.includes('expired') || mensagem.includes('unauthorized') || mensagem.includes('session')
}

const PADROES_ERRO_TECNICO = [
  'pgrst',
  'postgrest',
  'supabase',
  'row-level security',
  'rls',
  'permission denied',
  'violates',
  'constraint',
  'duplicate key',
  'foreign key',
  'schema cache',
  'column',
  'relation',
  'invalid input syntax',
  'failed to fetch',
  'failed to send a request',
  'networkerror',
  'service_role',
  'null value'
]

export function mensagemSeguraErro(erro, fallback = 'Não foi possível concluir a operação.') {
  const mensagem = String(erro?.message || erro || '').trim()
  if (!mensagem) return fallback
  if (erroEhSessaoExpirada(erro)) return 'Sua sessão expirou. Faça login novamente.'

  const mensagemNormalizada = mensagem.toLowerCase()
  if (PADROES_ERRO_TECNICO.some((padrao) => mensagemNormalizada.includes(padrao))) {
    return fallback
  }

  return mensagem
}
