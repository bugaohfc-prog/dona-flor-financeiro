import { useCopilot } from '../core/CopilotProvider.jsx'

export default function CopilotFloatingButton({ onPreload }) {
  const { open, toggle, intelligence } = useCopilot()
  const hasRisk = intelligence.totals.vencido > 0

  if (open) return null

  return (
    <button className={`copilot-floating-button no-print ${hasRisk ? 'has-risk' : ''}`} type="button" onPointerEnter={onPreload} onFocus={onPreload} onTouchStart={onPreload} onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggle() }} aria-label="Abrir Copilot IA">
      <span>✨</span>
      <strong>Copilot IA</strong>
      {hasRisk && <i />}
    </button>
  )
}
