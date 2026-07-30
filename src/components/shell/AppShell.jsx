import { useCallback } from 'react'
import AppProviders from '../providers/AppProviders.jsx'
import AppSuspenseBoundary from '../routes/AppSuspenseBoundary.jsx'
import AppShellStyles from './AppShellStyles.jsx'
import AppFrameStyles from './AppFrameStyles.jsx'
import DesktopRefinementStyles from './DesktopRefinementStyles.jsx'
import MobileFinalStyles from './MobileFinalStyles.jsx'
import MobileUxPatchStyles from './MobileUxPatchStyles.jsx'
import CopilotStyles from '../copilot/layout/CopilotStyles.jsx'

export default function AppShell({
  empresaId,
  navegarPara,
  menuAberto,
  setMenuAberto,
  pageStyle,
  modoFrame = false,
  envolverConteudoEmMain = false,
  mostrarElementosImpressao = false,
  topShell,
  sidebar,
  mobileMenu,
  fab,
  copilot,
  modals,
  overlays,
  children,
}) {
  const fecharMenuAoClicarFora = useCallback(() => {
    if (menuAberto) setMenuAberto(false)
  }, [menuAberto, setMenuAberto])

  const conteudoRota = (
    <AppSuspenseBoundary>
      {children}
    </AppSuspenseBoundary>
  )

  return (
    <AppProviders empresaId={empresaId} navegarPara={navegarPara}>
      <div
        className={modoFrame ? 'app-page app-frame' : 'app-page'}
        style={pageStyle}
        onClick={fecharMenuAoClicarFora}
      >
        <AppShellStyles />
        {modoFrame ? <AppFrameStyles /> : null}
        <DesktopRefinementStyles />
        <MobileFinalStyles />
        {modoFrame ? <MobileUxPatchStyles /> : null}
        <CopilotStyles />

        {mostrarElementosImpressao ? (
          <>
            <div className="print-header">
              <h1>Relatório Financeiro</h1>
              <p>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="print-footer">
              Relatório gerado pelo DNA Gestão
            </div>
          </>
        ) : null}

        {topShell}
        {sidebar}
        {mobileMenu}

        {envolverConteudoEmMain ? (
          <main className="app-frame-content">{conteudoRota}</main>
        ) : conteudoRota}

        {fab}
        {copilot}
        {modals}
        {overlays}
      </div>
    </AppProviders>
  )
}
