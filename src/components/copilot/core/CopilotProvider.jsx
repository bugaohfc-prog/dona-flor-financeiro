import { createContext, useContext, useMemo, useState } from 'react'
import { gerarCopilotFinanceiro } from '../../../services/ai/copilotEngine.js'

const CopilotContext = createContext(null)

export function CopilotProvider({ children, contas = [], contasFiltradas = [], navegarPara }) {
  const [open, setOpen] = useState(false)
  const [lastQuestion, setLastQuestion] = useState('')

  const intelligence = useMemo(() => gerarCopilotFinanceiro({ contas, contasFiltradas }), [contas, contasFiltradas])

  const value = useMemo(() => ({
    open,
    setOpen,
    toggle: () => setOpen((current) => !current),
    close: () => setOpen(false),
    intelligence,
    lastQuestion,
    setLastQuestion,
    navegarPara
  }), [open, intelligence, lastQuestion, navegarPara])

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>
}

export function useCopilot() {
  const context = useContext(CopilotContext)
  if (!context) throw new Error('useCopilot deve ser usado dentro de CopilotProvider')
  return context
}
