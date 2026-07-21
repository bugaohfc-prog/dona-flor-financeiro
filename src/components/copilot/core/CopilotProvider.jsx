import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { gerarCopilotFinanceiro } from '../../../services/ai/copilotEngine.js'
import { useRelatorioFinanceiro } from '../../../hooks/useRelatorioFinanceiro.js'

const CopilotContext = createContext(null)

export function CopilotProvider({ children, empresaId, navegarPara }) {
  const [open, setOpen] = useState(false)
  const [lastQuestion, setLastQuestion] = useState('')

  const hoje = useMemo(() => {
    const data = new Date()
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
  }, [])
  const criterios = useMemo(() => ({
    base: 'vencimento',
    dataInicial: `${hoje.slice(0, 4)}-01-01`,
    dataFinal: `${hoje.slice(0, 4)}-12-31`,
    status: 'todas', filialId: '', centroCustoId: '', origem: 'todas', incluirOcultas: false, busca: '', hoje
  }), [hoje])
  const fonte = useRelatorioFinanceiro({ empresaId, criterios, automatico: open })
  const intelligence = useMemo(() => gerarCopilotFinanceiro({
    contas: fonte.registros,
    empresaId,
    periodo: { inicio: criterios.dataInicial, fim: criterios.dataFinal },
    carregando: fonte.carregando,
    erro: fonte.erro
  }), [criterios.dataFinal, criterios.dataInicial, empresaId, fonte.carregando, fonte.erro, fonte.registros])

  const toggle = useCallback(() => setOpen((current) => !current), [])
  const close = useCallback(() => setOpen(false), [])

  const value = useMemo(() => ({
    open,
    setOpen,
    toggle,
    close,
    intelligence,
    lastQuestion,
    setLastQuestion,
    recarregar: fonte.consultar,
    navegarPara
  }), [close, intelligence, lastQuestion, navegarPara, open, toggle])

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>
}

export function useCopilot() {
  const context = useContext(CopilotContext)
  if (!context) throw new Error('useCopilot deve ser usado dentro de CopilotProvider')
  return context
}
