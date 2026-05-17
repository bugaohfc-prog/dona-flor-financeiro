import { useCallback } from 'react'
import AppProviders from '../providers/AppProviders.jsx'
import AppShellStyles from './AppShellStyles.jsx'

export default function AppShell({ contas, contasFiltradas, navegarPara, menuAberto, setMenuAberto, pageStyle, children }) {
  const fecharMenuAoClicarFora = useCallback(() => {
    if (menuAberto) setMenuAberto(false)
  }, [menuAberto, setMenuAberto])

  return (
    <AppProviders contas={contas} contasFiltradas={contasFiltradas} navegarPara={navegarPara}>
      <div className="app-page" style={pageStyle} onClick={fecharMenuAoClicarFora}>
        <AppShellStyles />
        {children}
      </div>
    </AppProviders>
  )
}
