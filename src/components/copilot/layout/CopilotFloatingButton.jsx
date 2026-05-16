import { useCopilot } from '../core/CopilotProvider.jsx'

export default function CopilotFloatingButton() {
  const { toggle, intelligence } = useCopilot()
  const hasRisk = intelligence.totals.vencido > 0

  return (
    <button className={`copilot-floating-button no-print ${hasRisk ? 'has-risk' : ''}`} type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggle() }} aria-label="Abrir Copilot IA">
      <span>✨</span>
      <strong>Copilot IA</strong>
      {hasRisk && <i />}
    </button>
  )
}
