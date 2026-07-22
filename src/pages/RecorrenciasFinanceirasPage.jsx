import { useMemo, useState } from 'react'
import { useRecorrenciaCobertura } from '../hooks/useRecorrenciaCobertura.js'
import { filtrarCoberturaRecorrencias, resolverHorizonteCobertura } from '../utils/recorrenciaCobertura.js'
import './RecorrenciasFinanceirasPage.css'

const HORIZONTES = [
  ['mes_atual', 'Mês atual'], ['proximo_mes', 'Próximo mês'], ['30', '30 dias'],
  ['60', '60 dias'], ['90', '90 dias'], ['personalizado', 'Personalizado']
]

export default function RecorrenciasFinanceirasPage({ empresaId, centros = [], filiais = [], formatarValor, formatarData, navegarPara, navegarParaConta }) {
  const [tipoHorizonte, setTipoHorizonte] = useState('90')
  const [personalizado, setPersonalizado] = useState({ inicio: '', fim: '' })
  const [filtros, setFiltros] = useState({ filialId: '', centroId: '', cobertura: 'todas', busca: '' })
  const [expandidas, setExpandidas] = useState(() => new Set())
  const horizonte = useMemo(() => resolverHorizonteCobertura(tipoHorizonte, new Date(), personalizado), [personalizado, tipoHorizonte])
  const fonte = useRecorrenciaCobertura({ empresaId, horizonte })
  const resultado = useMemo(() => filtrarCoberturaRecorrencias(fonte.resultado, filtros), [filtros, fonte.resultado])

  function alternarSerie(id) {
    setExpandidas((atuais) => {
      const proximas = new Set(atuais)
      if (proximas.has(id)) proximas.delete(id)
      else proximas.add(id)
      return proximas
    })
  }

  return (
    <main className="accounts-page recurring-coverage-page">
      <div className="page-title-actions accounts-page-header">
        <div className="accounts-page-header-copy">
          <span>Financeiro</span>
          <h1>Cobertura de recorrências</h1>
          <p>Confira ocorrências esperadas, contas vinculadas e possíveis correspondências manuais. Esta central não gera nem altera contas.</p>
        </div>
        <button type="button" onClick={() => navegarPara?.('contas')}>Voltar para Contas</button>
      </div>

      <section className="content-block recurring-coverage-panel">
        <div className="recurring-coverage-horizons" aria-label="Horizonte da cobertura">
          {HORIZONTES.map(([valor, rotulo]) => (
            <button key={valor} type="button" className={tipoHorizonte === valor ? 'is-active' : ''} aria-pressed={tipoHorizonte === valor} onClick={() => setTipoHorizonte(valor)}>{rotulo}</button>
          ))}
        </div>
        {tipoHorizonte === 'personalizado' && (
          <div className="recurring-coverage-custom">
            <label>Início<input type="date" value={personalizado.inicio} onChange={(event) => setPersonalizado((atual) => ({ ...atual, inicio: event.target.value }))} /></label>
            <label>Fim<input type="date" value={personalizado.fim} onChange={(event) => setPersonalizado((atual) => ({ ...atual, fim: event.target.value }))} /></label>
          </div>
        )}
        <div className="recurring-coverage-period">Período inclusivo: <strong>{horizonte.inicio ? formatarData(horizonte.inicio) : '—'} a {horizonte.fim ? formatarData(horizonte.fim) : '—'}</strong></div>

        <div className="recurring-coverage-filters">
          <select value={filtros.filialId} onChange={(event) => setFiltros((atual) => ({ ...atual, filialId: event.target.value }))} aria-label="Filtrar por filial">
            <option value="">Todas as filiais</option>{filiais.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select>
          <select value={filtros.centroId} onChange={(event) => setFiltros((atual) => ({ ...atual, centroId: event.target.value }))} aria-label="Filtrar por centro de custo">
            <option value="">Todos os centros</option>{centros.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select>
          <select value={filtros.cobertura} onChange={(event) => setFiltros((atual) => ({ ...atual, cobertura: event.target.value }))} aria-label="Filtrar por cobertura">
            <option value="todas">Todas as coberturas</option><option value="coberta">Cobertas</option><option value="faltante">Faltantes</option><option value="duplicada">Duplicadas</option>
          </select>
          <input type="search" placeholder="Buscar recorrência" value={filtros.busca} onChange={(event) => setFiltros((atual) => ({ ...atual, busca: event.target.value }))} />
        </div>

        {fonte.carregando && <div className="recurring-coverage-state" role="status">Calculando cobertura…</div>}
        {!fonte.carregando && fonte.erro && <div className="recurring-coverage-state is-error" role="alert"><strong>Não foi possível consultar a cobertura.</strong><button type="button" onClick={fonte.consultar}>Tentar novamente</button></div>}
        {!fonte.carregando && !fonte.erro && fonte.carregado && fonte.resultado && (
          <>
            <div className="recurring-coverage-summary">
              <span><b>Esperadas</b>{fonte.resultado.resumo.esperadas}</span><span><b>Cobertas</b>{fonte.resultado.resumo.cobertas}</span>
              <span><b>Faltantes</b>{fonte.resultado.resumo.faltantes}</span><span><b>Duplicadas</b>{fonte.resultado.resumo.duplicadas}</span>
              <span><b>Inconsistências</b>{fonte.resultado.resumo.inconsistencias}</span>
            </div>
            {resultado.recorrencias.length === 0 ? <div className="recurring-coverage-state">Nenhuma ocorrência encontrada para os filtros selecionados.</div> : (
              <div className="recurring-coverage-list">
                {resultado.recorrencias.map(({ serie, ocorrencias }) => {
                  const aberta = expandidas.has(serie.id)
                  const contagens = ocorrencias.reduce((acc, item) => ({ ...acc, [item.cobertura]: (acc[item.cobertura] || 0) + 1 }), {})
                  return <article className="recurring-coverage-series" key={serie.id}>
                    <button type="button" className="recurring-coverage-series-toggle" aria-expanded={aberta} aria-controls={`coverage-${serie.id}`} onClick={() => alternarSerie(serie.id)}>
                      <span><strong>{serie.descricao || 'Recorrência sem descrição'}</strong><small>{ocorrencias.length} ocorrência(s) · {contagens.coberta || 0} coberta(s) · {contagens.faltante || 0} faltante(s) · {contagens.duplicada || 0} duplicada(s)</small></span>
                      <span aria-hidden="true">{aberta ? '−' : '+'}</span>
                    </button>
                    {aberta && <div className="recurring-coverage-occurrences" id={`coverage-${serie.id}`}>
                      {ocorrencias.map((item) => <div className={`recurring-coverage-occurrence is-${item.cobertura}`} key={item.identidade}>
                        <div><strong>{formatarData(item.dataVencimento)}</strong><span>{item.cobertura === 'coberta' ? 'Coberta' : item.cobertura === 'duplicada' ? 'Duplicidade' : 'Faltante'}</span></div>
                        {item.contasVinculadas.map((conta) => <button type="button" key={conta.id} onClick={() => navegarParaConta?.(conta.id)}>Abrir conta vinculada · {formatarValor(Number(conta.valor || 0))}</button>)}
                        {item.sugestoes.map(({ conta, confianca, criterios }) => <div className="recurring-coverage-suggestion" key={conta.id}><b>Possível conta manual · confiança {confianca}</b><span>{criterios.join(' · ')}</span><button type="button" onClick={() => navegarParaConta?.(conta.id)}>Abrir conta</button></div>)}
                      </div>)}
                    </div>}
                  </article>
                })}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
