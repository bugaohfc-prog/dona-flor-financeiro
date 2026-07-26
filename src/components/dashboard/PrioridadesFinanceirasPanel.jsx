import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useRecorrenciaCobertura } from '../../hooks/useRecorrenciaCobertura.js'
import { resolverHorizonteCobertura } from '../../utils/recorrenciaCobertura.js'
import { montarCentralPrioridadesFinanceiras } from '../../utils/prioridadesFinanceiras.js'

function formatarData(data) {
  const partes = String(data || '').slice(0, 10).split('-')
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : 'Sem vencimento'
}

function formatarMes(chave) {
  const [ano, mes] = String(chave || '').split('-').map(Number)
  if (!ano || !mes) return chave
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })
    .format(new Date(ano, mes - 1, 1))
    .replace('.', '')
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
  const ranking = central.prioridades.slice(0, 8)
  const recorrencias = central.recorrenciasSemCobertura.slice(0, 5)
  const concentracoes = central.concentracoesMensais.slice(0, 3)

  return (
    <section className="dashboard-priorities dashboard-home-card" aria-labelledby="dashboard-priorities-title">
      <header className="dashboard-priorities-header">
        <div>
          <span className="dashboard-home-kicker">Central de prioridades financeiras</span>
          <h2 id="dashboard-priorities-title">Exige atenção</h2>
          <p>Ranking somente leitura por atraso, impacto financeiro, natureza da obrigação e qualidade cadastral.</p>
        </div>
        <div className="dashboard-priorities-summary" aria-label="Resumo das prioridades">
          <span className="is-critical">{central.resumo.criticas} críticas</span>
          <span>{central.resumo.atencao} em atenção</span>
          <span>{central.resumo.acompanhamento} em acompanhamento</span>
        </div>
      </header>

      <div className="dashboard-priorities-layout">
        <div className="dashboard-priorities-ranking">
          <div className="dashboard-priorities-subheader">
            <strong>Contas prioritárias</strong>
            <small>{central.prioridades.length} compromisso(s) analisado(s)</small>
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
          {(central.resumo.semFilial > 0 || central.resumo.semCentro > 0) && (
            <p className="dashboard-priorities-quality">
              Qualidade cadastral: {central.resumo.semFilial} sem filial e {central.resumo.semCentro} sem centro de custo.
            </p>
          )}
        </div>

        <aside className="dashboard-priorities-aside">
          <div className="dashboard-priorities-block">
            <div className="dashboard-priorities-subheader">
              <strong>Recorrências sem cobertura</strong>
              <small>Próximos 90 dias</small>
            </div>
            {(cobertura.carregando || !cobertura.carregado) && !cobertura.erro && (
              <p role="status">Verificando cobertura futura…</p>
            )}
            {cobertura.erro && (
              <div role="alert">
                <p>Não foi possível verificar a cobertura.</p>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => cobertura.consultar()}>
                  Tentar novamente
                </button>
              </div>
            )}
            {cobertura.carregado && !cobertura.carregando && !cobertura.erro && recorrencias.length === 0 && (
              <p>Nenhuma lacuna futura no escopo selecionado.</p>
            )}
            {cobertura.carregado && !cobertura.carregando && !cobertura.erro && recorrencias.length > 0 && (
              <ul>
                {recorrencias.map((item) => (
                  <li key={item.identidade}>
                    <button type="button" onClick={onAbrirRecorrencias}>
                      <span>{item.serie?.descricao || 'Recorrência'}</span>
                      <strong>{formatarData(item.dataVencimento)}</strong>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="dashboard-priorities-block">
            <div className="dashboard-priorities-subheader">
              <strong>Maiores concentrações</strong>
              <small>Saldo em aberto por mês</small>
            </div>
            {concentracoes.length === 0 ? (
              <p>Sem concentração financeira no período consultado.</p>
            ) : (
              <ul>
                {concentracoes.map((item) => (
                  <li key={item.chave}>
                    <span>{formatarMes(item.chave)}</span>
                    <strong>{formatarValor(item.saldo)}</strong>
                    <small>{item.quantidade} conta(s)</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
