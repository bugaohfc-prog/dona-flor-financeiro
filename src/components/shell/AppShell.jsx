import AppProviders from '../providers/AppProviders.jsx'
import AppShellStyles from './AppShellStyles.jsx'

export default function AppShell({ contas, contasFiltradas, navegarPara, menuAberto, setMenuAberto, pageStyle, children }) {
  function fecharMenuAoClicarFora() {
    if (menuAberto) setMenuAberto(false)
  }

  return (
    <AppProviders contas={contas} contasFiltradas={contasFiltradas} navegarPara={navegarPara}>
      <div className="app-page" style={pageStyle} onClick={fecharMenuAoClicarFora}>
        <AppShellStyles />
        {children}
      </div>
    </AppProviders>
  )
}
