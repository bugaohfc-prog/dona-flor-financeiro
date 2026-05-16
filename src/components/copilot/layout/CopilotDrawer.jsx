import { useCopilot } from '../core/CopilotProvider.jsx'
import { AiInsightsCard, ExecutiveSummary, QuickQuestions, SmartPriorityList } from '../widgets/CopilotWidgets.jsx'

export default function CopilotDrawer() {
  const { open, close, intelligence, lastQuestion } = useCopilot()

  if (!open) return null

  return (
    <div className="copilot-shell no-print" onClick={(event) => event.stopPropagation()}>
      <button className="copilot-backdrop" type="button" aria-label="Fechar Copilot" onClick={close} />
      <aside className="copilot-drawer" aria-label="Painel Copilot IA">
        <header className="copilot-header">
          <div>
            <span>Copilot IA 11.6</span>
            <h2>Sistema Operacional Financeiro Inteligente</h2>
            <p>Status: {intelligence.status.label} · Score {intelligence.score}/100</p>
          </div>
          <button type="button" onClick={close} aria-label="Fechar">×</button>
        </header>

        <main className="copilot-content">
          <ExecutiveSummary />
          <SmartPriorityList />
          <AiInsightsCard />
          {lastQuestion && (
            <section className="copilot-card copilot-answer">
              <span className="copilot-mini-label">Pergunta selecionada</span>
              <strong>{lastQuestion}</strong>
              <p>Resposta executiva gerada a partir dos KPIs atuais. Na próxima etapa, este bloco receberá narrativa contextual avançada e drill-down.</p>
            </section>
          )}
          <QuickQuestions />
        </main>
      </aside>
    </div>
  )
}
