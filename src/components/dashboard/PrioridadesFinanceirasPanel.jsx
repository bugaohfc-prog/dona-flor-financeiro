import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useRecorrenciaCobertura } from '../../hooks/useRecorrenciaCobertura.js'
import { resolverHorizonteCobertura } from '../../utils/recorrenciaCobertura.js'
import { montarCentralPrioridadesFinanceiras } from '../../utils/prioridadesFinanceiras.js'

function formatarData(data) {
  const partes = String(data || '').slice(0, 10).split('-')
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : 'Sem vencimento'
}

function rotuloNivel(nivel) {
  return nivel === 'critica' ? 'Crítica' : nivel === 'atencao' ? 'Atenção' : 'Acompanhamento'
}

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
    <section className="dashboard-priorities dashboard-home-card" aria-labelledby="dashboard-priorities-title">
      <header className="dashboard-priorities-header">
        <div>
          <span className="dashboard-home-kicker">Central de prioridades financeiras</span>
          <h2 id="dashboard-priorities-title">Exige atenção</h2>
          <p>As três contas mais críticas do escopo atual, com atalhos para aprofundamento.</p>
        </div>
        <button type="button" className="dashboard-home-action dashboard-home-action-secondary" onClick={onAbrirRelatorios}>
          Ver análise completa
        </button>
      </header>

      <div className="dashboard-priorities-layout">
        <div className="dashboard-priorities-ranking">
          <div className="dashboard-priorities-subheader">
            <strong>Top 3 prioridades</strong>
            <small>{central.prioridades.length} compromisso(s) no escopo</small>
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
                      <small>
                        {formatarData(item.conta.data_vencimento)}
                        {' · '}
                        {item.motivos.slice(0, 3).join(' · ') || 'Acompanhamento preventivo'}
                      </small>
                    </span>
                    <span className="dashboard-priorities-value">
                      <strong>{formatarValor(item.saldo)}</strong>
                      <small>{rotuloNivel(item.nivel)} · Score {item.score}</small>
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
            <small>{formatarValor(central.resumo.saldoImpostos)} em saldo</small>
          </button>

          {(cobertura.carregando || !cobertura.carregado) && !cobertura.erro ? (
            <div className="dashboard-priorities-indicator" role="status">
              <span>Recorrências</span>
              <strong>—</strong>
              <small>Verificando cobertura futura…</small>
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
              <small>Ocorrência(s) nos próximos 90 dias</small>
            </button>
          )}
        </aside>
      </div>
    </section>
  )
}
