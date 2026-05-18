import { useCopilot } from '../core/CopilotProvider.jsx'
import { AiInsightsCard, AnomalyCard, DrillDownCard, ExecutiveSummary, NarrativeIntelligenceCard, QuickQuestions, RecommendationsCard, SmartPriorityList } from '../widgets/CopilotWidgets.jsx'

export default function CopilotDrawer() {
  const { open, close, intelligence, lastQuestion } = useCopilot()

  if (!open) return null

  return (
    <div className="copilot-shell no-print" onClick={(event) => event.stopPropagation()}>
      <button className="copilot-backdrop" type="button" aria-label="Fechar assistente financeiro" onClick={close} />
      <aside className="copilot-drawer" aria-label="Painel do assistente financeiro">
        <header className="copilot-header">
          <div>
            <span>Assistente financeiro</span>
            <h2>Acompanhamento financeiro</h2>
            <p>Status: {intelligence.status.label} · Saúde financeira {intelligence.score}/100</p>
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
              <p>{intelligence.respostas?.[lastQuestion] || 'Resposta gerada a partir dos indicadores atuais.'}</p>
            </section>
          )}
          <QuickQuestions />
        </main>
      </aside>
    </div>
  )
}
