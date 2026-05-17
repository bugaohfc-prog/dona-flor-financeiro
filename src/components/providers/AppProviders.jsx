import { CopilotProvider } from '../copilot/core/CopilotProvider.jsx'

export default function AppProviders({ children, contas, contasFiltradas, navegarPara }) {
  return (
    <CopilotProvider contas={contas} contasFiltradas={contasFiltradas} navegarPara={navegarPara}>
      {children}
    </CopilotProvider>
  )
}
