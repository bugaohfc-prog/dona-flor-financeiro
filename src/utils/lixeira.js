function assinaturaLixeira(itens = []) {
  return itens
    .map((item) => `${item.id || ''}:${item.excluido_em || ''}:${item.updated_at || ''}`)
    .join('|')
}

export function diasNaLixeira(dataExclusao) {
  if (!dataExclusao) return 0

  const excluidoEm = new Date(dataExclusao)
  const hoje = new Date()
  const diff = hoje - excluidoEm

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function podeExcluirDefinitivo() {
  return true
}

export function atualizarListaLixeiraEstavel(setLista, novaLista = []) {
  setLista((listaAtual = []) => (
    assinaturaLixeira(listaAtual) === assinaturaLixeira(novaLista)
      ? listaAtual
      : novaLista
  ))
}
