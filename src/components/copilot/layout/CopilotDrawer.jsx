import { useCopilot } from '../core/CopilotProvider.jsx'
import { AiInsightsCard, AnomalyCard, DrillDownCard, ExecutiveSummary, NarrativeIntelligenceCard, QuickQuestions, RecommendationsCard, SmartPriorityList } from '../widgets/CopilotWidgets.jsx'

export default function CopilotDrawer() {
  const { open, close, intelligence, lastQuestion } = useCopilot()

  if (!open) return null

  return (
    <div className="copilot-shell no-print" onClick={(event) => event.stopPropagation()}>
      <button className="copilot-backdrop" type="button" aria-label="Fechar Copilot" onClick={close} />
      <aside className="copilot-drawer" aria-label="Painel Copilot IA">
        <header className="copilot-header">
          <div>
            <span>Copilot IA 11.8</span>
            <h2>Sistema Operacional Financeiro Inteligente</h2>
            <p>Status: {intelligence.status.label} · Score {intelligence.score}/100</p>
            <div className="copilot-live-indicator"><b /> Analisando dados em tempo real</div>
          </div>
          <button type="button" onClick={close} aria-label="Fechar">×</button>
        </header>

        <main className="copilot-content">
          <ExecutiveSummary />
          <NarrativeIntelligenceCard />
          <SmartPriorityList />
          <AnomalyCard />
          <DrillDownCard />
          <RecommendationsCard />
          <AiInsightsCard />
          {lastQuestion && (
            <section className="copilot-card copilot-answer">
              <span className="copilot-mini-label">Pergunta selecionada</span>
              <strong>{lastQuestion}</strong>
              <p>{intelligence.respostas?.[lastQuestion] || 'Resposta executiva gerada a partir dos KPIs atuais.'}</p>
            </section>
          )}
          <QuickQuestions />
        </main>
      </aside>
    </div>
  )
}
