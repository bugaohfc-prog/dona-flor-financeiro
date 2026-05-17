import { memo, useCallback } from 'react'
import { useCopilot } from '../core/CopilotProvider.jsx'

function CopilotFloatingButton({ onPreload }) {
  const { open, toggle, intelligence } = useCopilot()
  const hasRisk = intelligence.totals.vencido > 0

  const abrirCopilot = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()
    toggle()
  }, [toggle])

  if (open) return null

  return (
    <button className={`copilot-floating-button no-print ${hasRisk ? 'has-risk' : ''}`} type="button" onPointerEnter={onPreload} onFocus={onPreload} onTouchStart={onPreload} onClick={abrirCopilot} aria-label="Abrir Copilot IA">
      <span>✨</span>
      <strong>Copilot IA</strong>
      {hasRisk && <i />}
    </button>
  )
}

export default memo(CopilotFloatingButton)
