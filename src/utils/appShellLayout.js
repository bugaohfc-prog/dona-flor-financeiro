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

export function resolverLayoutAppShell(tela) {
  return tela === 'dashboard' ? LAYOUT_DASHBOARD : LAYOUT_FRAME
}
