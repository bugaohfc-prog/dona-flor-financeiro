import { useMemo, useState } from 'react'

export default function AIFinancialCopilot({ dados, formatarValor, formatarPercentual, onGoToAccounts }) {
  const [aberto, setAberto] = useState(false)
  const perguntas = useMemo(() => [
    { pergunta: 'Qual meu maior risco?', resposta: dados.maiorRisco },
    { pergunta: 'O que priorizar agora?', resposta: dados.prioridadePrincipal },
    { pergunta: 'Como melhorar a previsão?', resposta: dados.melhoriaPrevisao },
    { pergunta: 'Qual centro exige atenção?', resposta: dados.centroCritico }
  ], [dados])

  return (
    <section className="no-print" style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <strong style={styles.title}>🤖 AI Financial Copilot 11.5</strong>
          <p style={styles.subtitle}>Leitura executiva, recomendações acionáveis e perguntas rápidas sobre o financeiro filtrado.</p>
        </div>
        <span style={{ ...styles.badge, borderColor: dados.cor, color: dados.cor }}>{dados.nivel}</span>
      </div>

      <div style={styles.grid}>
        <article style={styles.narrativeCard}>
          <span style={styles.kicker}>Executive AI Summary</span>
          <p style={styles.narrative}>{dados.narrativa}</p>
          <div style={styles.kpis}>
            <Mini label="Score" value={`${dados.score}/100`} />
            <Mini label="Risco 30d" value={formatarPercentual(dados.riscoProjetado)} />
            <Mini label="Forecast 90d" value={formatarValor(dados.forecast90)} />
          </div>
        </article>

        <article style={styles.card}>
          <span style={styles.kicker}>Smart Priority Engine</span>
          <ol style={styles.priorityList}>
            {dados.prioridades.map((item) => (
              <li key={item.titulo} style={styles.priorityItem}>
                <strong>{item.titulo}</strong>
                <small>{item.descricao}</small>
              </li>
            ))}
          </ol>
        </article>

        <article style={styles.card}>
          <span style={styles.kicker}>AI Recommendations</span>
          <div style={styles.recommendations}>
            {dados.recomendacoes.map((item) => (
              <div key={item} style={styles.recommendation}>✨ {item}</div>
            ))}
          </div>
        </article>
      </div>

      <button type="button" style={styles.floatingButton} onClick={() => setAberto(true)} aria-label="Abrir Copilot Financeiro">
        🤖
      </button>

      {aberto && (
        <div style={styles.drawerBackdrop} onClick={() => setAberto(false)}>
          <aside style={styles.drawer} onClick={(event) => event.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <div>
                <strong>Copilot Financeiro</strong>
                <small>Respostas rápidas baseadas nos filtros atuais</small>
              </div>
              <button type="button" style={styles.close} onClick={() => setAberto(false)}>×</button>
            </div>

            <div style={styles.chatList}>
              {perguntas.map((item) => (
                <div key={item.pergunta} style={styles.chatBlock}>
                  <strong>{item.pergunta}</strong>
                  <p>{item.resposta}</p>
                </div>
              ))}
            </div>

            <div style={styles.drawerFooter}>
              <button type="button" style={styles.actionButton} onClick={onGoToAccounts}>Ir para contas</button>
              <small>Copilot local: usa dados filtrados, sem chamada externa.</small>
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}

function Mini({ label, value }) {
  return (
    <div style={styles.mini}>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}

const styles = {
  wrapper: {
    background: 'linear-gradient(135deg, #f5f3ff 0%, #ecfeff 100%)',
    border: '1px solid #ddd6fe',
    borderRadius: 22,
    padding: 18,
    margin: '18px 0',
    boxShadow: '0 16px 38px rgba(15, 23, 42, 0.08)'
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 14
  },
  title: { fontSize: 18 },
  subtitle: { margin: '8px 0 0', color: '#475569' },
  badge: {
    border: '1px solid',
    borderRadius: 999,
    padding: '7px 12px',
    fontWeight: 800,
    background: '#fff'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.25fr 1fr 1fr',
    gap: 14
  },
  narrativeCard: {
    background: '#ffffff',
    border: '1px solid #e9d5ff',
    borderRadius: 18,
    padding: 16
  },
  card: {
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid #e5e7eb',
    borderRadius: 18,
    padding: 16
  },
  kicker: { display: 'block', color: '#7c3aed', fontWeight: 900, marginBottom: 8 },
  narrative: { fontSize: 16, lineHeight: 1.55, margin: 0, color: '#0f172a' },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 },
  mini: { background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 14, padding: 10 },
  priorityList: { margin: 0, paddingLeft: 18 },
  priorityItem: { marginBottom: 10 },
  recommendations: { display: 'grid', gap: 10 },
  recommendation: { background: '#f8fafc', borderRadius: 14, padding: 11, color: '#0f172a' },
  floatingButton: {
    position: 'fixed', right: 28, bottom: 92, zIndex: 50,
    width: 54, height: 54, borderRadius: 18, border: '0', cursor: 'pointer',
    background: '#7c3aed', color: '#fff', fontSize: 24, boxShadow: '0 16px 34px rgba(124, 58, 237, 0.35)'
  },
  drawerBackdrop: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.24)', zIndex: 80, display: 'flex', justifyContent: 'flex-end' },
  drawer: { width: 'min(420px, 92vw)', background: '#fff', height: '100%', padding: 18, boxShadow: '-20px 0 50px rgba(15,23,42,0.18)', overflowY: 'auto' },
  drawerHeader: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
  close: { border: 0, background: '#f1f5f9', borderRadius: 12, fontSize: 26, lineHeight: 1, width: 38, height: 38, cursor: 'pointer' },
  chatList: { display: 'grid', gap: 12 },
  chatBlock: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 13 },
  drawerFooter: { marginTop: 16, display: 'grid', gap: 8 },
  actionButton: { border: 0, borderRadius: 14, padding: '12px 14px', background: '#0d9488', color: '#fff', fontWeight: 900, cursor: 'pointer' }
}
