import { resolverEstadoFonteContextual } from '../../utils/contasConsultasOperacionais.js'

export default function ContasContextualGuard({
  carregando = false,
  carregada = false,
  erro = null,
  onRetry,
  children
}) {
  const estado = resolverEstadoFonteContextual({ carregando, carregada, erro })

  if (estado === 'carregando') {
    return (
      <div className="empty-state-card" role="status" aria-live="polite">
        <strong>Carregando histórico financeiro…</strong>
        <p>Aguarde enquanto os dados completos são consultados.</p>
      </div>
    )
  }

  if (estado === 'indisponivel') {
    return (
      <div className="empty-state-card" role="status">
        <strong>Histórico financeiro ainda não carregado</strong>
        <p>Carregue a fonte completa antes de consultar totais ou exportações.</p>
        {onRetry && (
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onRetry}>
            Carregar histórico
          </button>
        )}
      </div>
    )
  }
  if (estado === 'erro') {
    return (
      <div className="empty-state-card" role="alert">
        <strong>Não foi possível carregar o histórico financeiro</strong>
        <p>Os totais e exportações ficam indisponíveis até a consulta ser concluída.</p>
        {onRetry && (
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onRetry}>
            Tentar novamente
          </button>
        )}
      </div>
    )
  }

  return children
}
