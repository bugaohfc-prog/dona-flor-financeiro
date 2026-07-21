import { CopilotProvider } from '../copilot/core/CopilotProvider.jsx'

export default function AppProviders({ children, empresaId, navegarPara }) {
  return (
    <CopilotProvider empresaId={empresaId} navegarPara={navegarPara}>
      {children}
    </CopilotProvider>
  )
}
