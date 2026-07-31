function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ExecutiveSummary({ intelligence }) {
  const { score, status, executiveSummary, totals } = intelligence
  return (
    <section className={`copilot-card copilot-score-${status.tone}`}>
      <div className="copilot-card-head"><span>Resumo executivo</span><strong>{score}/100 · {status.label}</strong></div>
      <p>{executiveSummary}</p>
      <div className="copilot-metrics">
        <div><small>Previsto</small><b>{moeda(totals.total)}</b></div>
        <div><small>Em aberto</small><b>{moeda(totals.pendente)}</b></div>
        <div><small>Vencido</small><b>{moeda(totals.vencido)}</b></div>
      </div>
    </section>
  )
}

export function SmartPriorityList({ intelligence, onNavigate }) {
  return (
    <section className="copilot-card">
      <div className="copilot-card-head"><span>Prioridades</span><strong>{intelligence.priorities.length}</strong></div>
      <div className="copilot-priority-list">
        {intelligence.priorities.map((item, index) => (
          <article className={`copilot-priority copilot-priority-${item.tone}`} key={`${item.title}-${index}`}>
            <div><small>{item.level} impacto · {item.impact}</small><strong>{item.title}</strong><p>{item.description}</p></div>
            <button type="button" onClick={() => onNavigate?.(item.action.includes('Relatórios') ? 'relatorios-contas' : 'contas')}>{item.action}</button>
          </article>
        ))}
      </div>
    </section>
  )
}

export function RecommendationsCard({ intelligence }) {
  return (
    <section className="copilot-card">
      <div className="copilot-card-head"><span>Recomendações</span><strong>{intelligence.recomendacoes.length}</strong></div>
      <div className="copilot-recommendations">
        {intelligence.recomendacoes.map((item, index) => <p key={`${item}-${index}`}><b>{index + 1}</b>{item}</p>)}
      </div>
    </section>
  )
}

export function NarrativeIntelligenceCard({ intelligence }) {
  const narrativa = intelligence.narrativa || {}
  const blocos = [
    ['Liquidez', narrativa.liquidez],
    ['Concentração', narrativa.concentracao],
    ['Curto prazo', narrativa.curtoPrazo],
    ['Comportamento', narrativa.comportamento],
  ].filter(([, texto]) => texto)
  return (
    <section className="copilot-card copilot-narrative-card">
      <div className="copilot-card-head"><span>Análise determinística</span><strong>{intelligence.dadosInsuficientes ? 'Base limitada' : 'Base atual'}</strong></div>
      <p>{narrativa.parecer || intelligence.executiveSummary}</p>
      <div className="copilot-insights">{blocos.map(([titulo, texto]) => <p key={titulo}><b>{titulo}:</b> {texto}</p>)}</div>
    </section>
  )
}

export function QuickQuestions({ intelligence, perguntaAtiva, onQuestion }) {
  return (
    <section className="copilot-card copilot-questions-card">
      <span className="copilot-mini-label">Perguntas rápidas</span>
      <div className="copilot-questions">
        {intelligence.quickQuestions.map((pergunta) => <button type="button" key={pergunta} onClick={() => onQuestion?.(pergunta)}>{pergunta}</button>)}
      </div>
      {perguntaAtiva ? <div className="copilot-answer"><strong>{perguntaAtiva}</strong><p>{intelligence.respostas[perguntaAtiva]}</p></div> : null}
    </section>
  )
}
