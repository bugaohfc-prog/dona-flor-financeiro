const LAYOUT_DASHBOARD = Object.freeze({
  modoFrame: false,
  envolverConteudoEmMain: false,
  mostrarElementosImpressao: true,
})

const LAYOUT_FRAME = Object.freeze({
  modoFrame: true,
  envolverConteudoEmMain: true,
  mostrarElementosImpressao: false,
})

const ACOES_FLUTUANTES_LIBERADAS = Object.freeze({
  bloqueioInteracaoAtivo: false,
  mostrarFab: true,
})

const ACOES_FLUTUANTES_BLOQUEADAS = Object.freeze({
  bloqueioInteracaoAtivo: true,
  mostrarFab: false,
})

export function resolverLayoutAppShell(tela) {
  return tela === 'dashboard' ? LAYOUT_DASHBOARD : LAYOUT_FRAME
}

export function resolverAcoesFlutuantesAppShell({
  modalConta = false,
  modalNota = false,
  modalCentro = false,
  modalPerfilUsuario = false,
  menuNavegacaoAberto = false,
  confirmacaoAtiva = false,
  globalLoading = false,
} = {}) {
  const bloqueioInteracaoAtivo = [
    modalConta,
    modalNota,
    modalCentro,
    modalPerfilUsuario,
    menuNavegacaoAberto,
    confirmacaoAtiva,
    globalLoading,
  ].some(Boolean)

  return bloqueioInteracaoAtivo
    ? ACOES_FLUTUANTES_BLOQUEADAS
    : ACOES_FLUTUANTES_LIBERADAS
}
