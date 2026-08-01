import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useRecorrenciaCobertura } from '../../hooks/useRecorrenciaCobertura.js'
import { resolverHorizonteCobertura } from '../../utils/recorrenciaCobertura.js'
import { montarCentralPrioridadesFinanceiras } from '../../utils/prioridadesFinanceiras.js'

export default function PrioridadesFinanceirasPanel({
  contas = [],
  formatarValor,
  filialId = '',
  centroCustoId = '',
  onAbrirConta,
  onAbrirRelatorios,
  onAbrirImpostos,
  onAbrirRecorrencias
}) {
  const { empresaId } = useApp()
  const hoje = useMemo(() => {
    const data = new Date()
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
  }, [])
  const horizonte = useMemo(() => resolverHorizonteCobertura('90', hoje), [hoje])
  const cobertura = useRecorrenciaCobertura({ empresaId, horizonte })
  const central = useMemo(() => montarCentralPrioridadesFinanceiras({
    contas,
    ocorrenciasCobertura: cobertura.resultado?.ocorrencias || [],
    dataBase: hoje,
    empresaId,
    filialId,
    centroCustoId
  }), [centroCustoId, cobertura.resultado?.ocorrencias, contas, empresaId, filialId, hoje])
  const ranking = central.prioridades.slice(0, 3)

  return (
    <section className="dashboard-priorities dashboard-finance-card" aria-labelledby="dashboard-priorities-title">
      <header className="dashboard-priorities-header">
        <div>
          <span className="dashboard-finance-kicker">Central de prioridades financeiras</span>
          <h2 id="dashboard-priorities-title">Exige atenção</h2>
        </div>
        <button type="button" className="dashboard-finance-action dashboard-finance-action-secondary" onClick={onAbrirRelatorios}>
          Ver análise completa
        </button>
      </header>

      <div className="dashboard-priorities-layout">
        <div className="dashboard-priorities-ranking">
          <div className="dashboard-priorities-subheader">
            <strong>Top 3 prioridades</strong>
          </div>
          {ranking.length === 0 ? (
            <div className="dashboard-priorities-empty">Nenhuma conta em aberto no escopo selecionado.</div>
          ) : (
            <ol>
              {ranking.map((item, indice) => (
                <li className={`is-${item.nivel}`} key={item.id}>
                  <button type="button" onClick={() => onAbrirConta?.(item.id)}>
                    <span className="dashboard-priorities-rank">{indice + 1}</span>
                    <span className="dashboard-priorities-account">
                      <strong>{item.conta.descricao || 'Conta sem descrição'}</strong>
                    </span>
                    <span className="dashboard-priorities-value">
                      <strong>{formatarValor(item.saldo)}</strong>
                      <small>Score {item.score}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        <aside className="dashboard-priorities-indicators" aria-label="Indicadores financeiros resumidos">
          <button type="button" className="dashboard-priorities-indicator" onClick={onAbrirImpostos}>
            <span>Impostos em aberto</span>
            <strong>{central.resumo.impostosEmAberto}</strong>
          </button>

          {(cobertura.carregando || !cobertura.carregado) && !cobertura.erro ? (
            <div className="dashboard-priorities-indicator" role="status">
              <span>Recorrências</span>
              <strong>—</strong>
              <small>Carregando…</small>
            </div>
          ) : cobertura.erro ? (
            <div className="dashboard-priorities-indicator" role="alert">
              <span>Recorrências</span>
              <strong>Indisponível</strong>
              <button type="button" onClick={() => cobertura.consultar()}>Tentar novamente</button>
            </div>
          ) : (
            <button type="button" className="dashboard-priorities-indicator" onClick={onAbrirRecorrencias}>
              <span>Recorrências sem cobertura</span>
              <strong>{central.resumo.recorrenciasSemCobertura}</strong>
            </button>
          )}
        </aside>
      </div>
    </section>
  )
}
