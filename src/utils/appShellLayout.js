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

const ACOES_FLUTUANTES_OCULTAS_NA_ROTA = Object.freeze({
  bloqueioInteracaoAtivo: false,
  mostrarFab: false,
})

export const ROTAS_COM_ACOES_FLUTUANTES = Object.freeze([
  'dashboard',
  'agenda',
  'notas',
])

export function resolverLayoutAppShell(tela) {
  return tela === 'dashboard' ? LAYOUT_DASHBOARD : LAYOUT_FRAME
}

export function resolverAcoesFlutuantesAppShell({
  telaAtual = '',
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

  if (bloqueioInteracaoAtivo) return ACOES_FLUTUANTES_BLOQUEADAS
  if (telaAtual && !ROTAS_COM_ACOES_FLUTUANTES.includes(telaAtual)) return ACOES_FLUTUANTES_OCULTAS_NA_ROTA
  return ACOES_FLUTUANTES_LIBERADAS
}
