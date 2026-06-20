export default function AppRecoveryFallback({
  title = 'Nao foi possivel carregar esta tela',
  message = 'Encontramos uma falha temporaria na interface. Voce pode tentar novamente ou recarregar a pagina.',
  onRetry
}) {
  return (
    <main className="app-recovery-screen" role="alert" aria-live="assertive">
      <section className="app-recovery-card">
        <div className="app-recovery-kicker">DNA Gestão</div>
        <h1>{title}</h1>
        <p>{message}</p>
        <div className="app-recovery-actions">
          {onRetry && (
            <button type="button" className="app-recovery-secondary" onClick={onRetry}>
              Tentar novamente
            </button>
          )}
          <button type="button" className="app-recovery-primary" onClick={() => window.location.reload()}>
            Recarregar pagina
          </button>
        </div>
      </section>
    </main>
  )
}
