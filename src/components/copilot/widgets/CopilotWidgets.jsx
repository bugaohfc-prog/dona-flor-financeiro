import { useCopilot } from '../core/CopilotProvider.jsx'

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ExecutiveSummary() {
  const { intelligence } = useCopilot()
  const { score, status, executiveSummary, totals } = intelligence

  return (
    <section className={`copilot-card copilot-score-${status.tone}`}>
      <div className="copilot-card-head">
        <span>Executive AI Summary</span>
        <strong>{score}/100</strong>
      </div>
      <p>{executiveSummary}</p>
      <div className="copilot-metrics">
        <div><small>Total</small><b>{moeda(totals.total)}</b></div>
        <div><small>Pendente</small><b>{moeda(totals.pendente)}</b></div>
        <div><small>Vencido</small><b>{moeda(totals.vencido)}</b></div>
      </div>
    </section>
  )
}

export function SmartPriorityList() {
  const { intelligence, navegarPara, close } = useCopilot()

  return (
    <section className="copilot-card">
      <div className="copilot-card-head">
        <span>Smart Priority Engine</span>
        <strong>{intelligence.priorities.length}</strong>
      </div>
      <div className="copilot-priority-list">
        {intelligence.priorities.map((item, index) => (
          <article className={`copilot-priority copilot-priority-${item.tone}`} key={`${item.title}-${index}`}>
            <div>
              <small>{item.level} impacto · {item.impact}</small>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
            <button type="button" onClick={() => { navegarPara?.(item.action.includes('Relatórios') ? 'relatorios' : 'contas'); close() }}>
              {item.action}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

export function AiInsightsCard() {
  const { intelligence } = useCopilot()
  return (
    <section className="copilot-card">
      <div className="copilot-card-head">
        <span>Insights IA</span>
        <strong>Live</strong>
      </div>
      <div className="copilot-insights">
        {intelligence.insights.map((insight) => <p key={insight}>✦ {insight}</p>)}
      </div>
    </section>
  )
}

export function RecommendationsCard() {
  const { intelligence } = useCopilot()
  return (
    <section className="copilot-card">
      <div className="copilot-card-head">
        <span>Recomendações acionáveis</span>
        <strong>{intelligence.recomendacoes.length}</strong>
      </div>
      <div className="copilot-recommendations">
        {intelligence.recomendacoes.map((item, index) => (
          <p key={`${item}-${index}`}><b>{index + 1}</b>{item}</p>
        ))}
      </div>
    </section>
  )
}

export function DrillDownCard() {
  const { intelligence } = useCopilot()
  const centros = intelligence.rankingCentros || []

  return (
    <section className="copilot-card">
      <div className="copilot-card-head">
        <span>Drill-down analytics</span>
        <strong>Top {centros.length || 0}</strong>
      </div>
      <div className="copilot-drilldown">
        {centros.length ? centros.map((centro) => (
          <article key={centro.nome}>
            <div>
              <strong>{centro.nome}</strong>
              <small>{moeda(centro.total)} · {centro.peso}% do recorte · risco {centro.risco}%</small>
            </div>
            <span style={{ width: `${Math.max(6, centro.peso)}%` }} />
          </article>
        )) : <p>Sem centros suficientes para drill-down no recorte atual.</p>}
      </div>
    </section>
  )
}

export function QuickQuestions() {
  const { intelligence, setLastQuestion } = useCopilot()
  return (
    <section className="copilot-card copilot-questions-card">
      <span className="copilot-mini-label">Perguntas rápidas</span>
      <div className="copilot-questions">
        {intelligence.quickQuestions.map((question) => (
          <button type="button" key={question} onClick={() => setLastQuestion(question)}>{question}</button>
        ))}
      </div>
    </section>
  )
}
