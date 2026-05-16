import { useCopilot } from '../core/CopilotProvider.jsx'

export default function CopilotFloatingButton() {
  const { open, toggle, intelligence } = useCopilot()
  const hasRisk = intelligence.totals.vencido > 0

  if (open) return null

  return (
    <button className={`copilot-floating-button no-print ${hasRisk ? 'has-risk' : ''}`} type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggle() }} aria-label="Abrir Copilot IA">
      <span>✨</span>
      <strong>Copilot IA</strong>
      {hasRisk && <i />}
    </button>
  )
}
