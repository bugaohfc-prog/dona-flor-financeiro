import { memo, useCallback } from 'react'
import { useCopilot } from '../core/CopilotProvider.jsx'

function CopilotFloatingButton({ onPreload }) {
  const { open, toggle, intelligence } = useCopilot()
  const hasRisk = intelligence.totals.vencido > 0

  const abrirAssistenteFinanceiro = useCallback(async (event) => {
    event.preventDefault()
    event.stopPropagation()
    const resposta = await onPreload?.()
    if (resposta?.error) return
    toggle()
  }, [onPreload, toggle])

  if (open) return null

  return (
    <button className={`copilot-floating-button no-print ${hasRisk ? 'has-risk' : ''}`} type="button" onPointerEnter={onPreload} onFocus={onPreload} onTouchStart={onPreload} onClick={abrirAssistenteFinanceiro} aria-label="Abrir assistente financeiro">
      <span>✨</span>
      <strong>Assistente financeiro</strong>
      {hasRisk && <i />}
    </button>
  )
}

export default memo(CopilotFloatingButton)
