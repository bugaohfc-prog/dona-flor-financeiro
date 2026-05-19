export function erroEhSessaoExpirada(erro) {
  const mensagem = String(erro?.message || erro || '').toLowerCase()
  return mensagem.includes('jwt') || mensagem.includes('expired') || mensagem.includes('unauthorized') || mensagem.includes('session')
}
