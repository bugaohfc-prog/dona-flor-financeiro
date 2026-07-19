import { useMemo, useState } from 'react'


function normalizarTextoSerie(valor) {
  return String(valor || '').trim().toLowerCase()
}

function obterChaveDuplicidadeSerie(serie) {
  return [
    normalizarTextoSerie(serie.descricao),
    Number(serie.valor || 0).toFixed(2),
    String(serie.dia_vencimento || ''),
    serie.centro_custo_id || '',
    serie.filial_id || ''
  ].join('|')
}

function obterStatusDuplicidadeSerie(serie, duplicidadesSeries) {
  const resumo = duplicidadesSeries.get(obterChaveDuplicidadeSerie(serie))
  if (!resumo || resumo.total <= 1) return 'nenhuma'
  if (resumo.ativas > 1) return 'ativa'
  if (resumo.ativas === 1 && resumo.inativas > 0) return 'historica'
  return 'inativa'
}

function calcularProximaReferenciaSerie(serie) {
  if (serie?.ativo !== true) return ''
  const tipo = String(serie.tipo_recorrencia || 'mensal').toLowerCase()
  if (tipo !== 'mensal') return ''

  const hoje = new Date()
  const dia = Math.min(Math.max(Number(serie.dia_vencimento || 1), 1), 31)
  let ano = hoje.getFullYear()
  let mes = hoje.getMonth()
  let ultimoDiaMes = new Date(ano, mes + 1, 0).getDate()
  let data = new Date(ano, mes, Math.min(dia, ultimoDiaMes))

  if (data < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) {
    mes += 1
    if (mes > 11) {
      mes = 0
      ano += 1
    }
    ultimoDiaMes = new Date(ano, mes + 1, 0).getDate()
    data = new Date(ano, mes, Math.min(dia, ultimoDiaMes))
  }

  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

export default function RecorrenciasFinanceirasPage({
  styles,
  contas = [],
  seriesRecorrentes = [],
  centros = [],
  filiais = [],
  formatarValor,
  formatarData,
  formatarTipoRecorrencia,
  navegarPara,
  abrirConfirmacao,
  desativarSerieRecorrente,
  reativarSerieRecorrente,
  simularPlanejamentoRecorrencias,
  executarPlanejamentoRecorrenciasManual
}) {
  const [filtroSeriesRecorrentes, setFiltroSeriesRecorrentes] = useState('ativas')
  const [buscaSeriesRecorrentes, setBuscaSeriesRecorrentes] = useState('')
  const [simulandoPlanejamento, setSimulandoPlanejamento] = useState(false)
  const [gerandoPlanejamento, setGerandoPlanejamento] = useState(false)
  const [simulacaoPlanejamento, setSimulacaoPlanejamento] = useState(null)
  const [autorizouPlanejamento, setAutorizouPlanejamento] = useState(false)
  const [mensagemPlanejamento, setMensagemPlanejamento] = useState('')

  const contasPorRecorrencia = useMemo(() => {
    return (contas || []).reduce((mapa, conta) => {
      if (!conta?.recorrencia_id) return mapa
      mapa.set(conta.recorrencia_id, (mapa.get(conta.recorrencia_id) || 0) + 1)
      return mapa
    }, new Map())
  }, [contas])

  const duplicidadesSeries = useMemo(() => {
    const mapa = new Map()
    ;(seriesRecorrentes || []).forEach((serie) => {
      const chave = obterChaveDuplicidadeSerie(serie)
      const resumo = mapa.get(chave) || { total: 0, ativas: 0, inativas: 0 }
      resumo.total += 1
      if (serie.ativo === true) {
        resumo.ativas += 1
      } else {
        resumo.inativas += 1
      }
      mapa.set(chave, resumo)
    })
    return mapa
  }, [seriesRecorrentes])

  const resumoSeriesRecorrentes = useMemo(() => {
    const lista = seriesRecorrentes || []
    const grupos = Array.from(duplicidadesSeries.values())
    return {
      total: lista.length,
      ativas: lista.filter((serie) => serie.ativo === true).length,
      inativas: lista.filter((serie) => serie.ativo !== true).length,
      duplicadasAtivas: grupos.filter((grupo) => grupo.ativas > 1).length,
      historicas: grupos.filter((grupo) => grupo.total > 1 && grupo.ativas === 1 && grupo.inativas > 0).length
    }
  }, [duplicidadesSeries, seriesRecorrentes])

  const seriesRecorrentesFiltradas = useMemo(() => {
    const termo = normalizarTextoSerie(buscaSeriesRecorrentes)
    return (seriesRecorrentes || [])
      .filter((serie) => {
        const statusDuplicidade = obterStatusDuplicidadeSerie(serie, duplicidadesSeries)
        if (filtroSeriesRecorrentes === 'ativas' && serie.ativo !== true) return false
        if (filtroSeriesRecorrentes === 'inativas' && serie.ativo === true) return false
        if (filtroSeriesRecorrentes === 'duplicadas' && statusDuplicidade !== 'ativa') return false
        if (filtroSeriesRecorrentes === 'historicas' && statusDuplicidade !== 'historica') return false
        if (!termo) return true
        return [
          serie.descricao,
          serie.valor,
          serie.dia_vencimento,
          (centros || []).find((centro) => centro.id === serie.centro_custo_id)?.nome,
          (filiais || []).find((filial) => filial.id === serie.filial_id)?.nome
        ].some((valor) => normalizarTextoSerie(valor).includes(termo))
      })
  }, [buscaSeriesRecorrentes, centros, duplicidadesSeries, filiais, filtroSeriesRecorrentes, seriesRecorrentes])

  const seriesRecorrentesVisiveis = seriesRecorrentesFiltradas

  async function simularPlanejamento({ preservarMensagem = false, permitirDuranteGeracao = false } = {}) {
    if (simulandoPlanejamento || (gerandoPlanejamento && !permitirDuranteGeracao)) return null
    setSimulandoPlanejamento(true)
    setAutorizouPlanejamento(false)
    if (!preservarMensagem) setMensagemPlanejamento('')
    try {
      const resultado = await simularPlanejamentoRecorrencias?.()
      if (resultado?.erro) {
        setMensagemPlanejamento('Não foi possível simular o planejamento. Tente novamente.')
        return resultado
      }
      setSimulacaoPlanejamento(resultado)
      return resultado
    } finally {
      setSimulandoPlanejamento(false)
    }
  }

  async function executarGeracaoConfirmada() {
    if (gerandoPlanejamento || !autorizouPlanejamento) return
    setGerandoPlanejamento(true)
    setMensagemPlanejamento('')
    try {
      const resultado = await executarPlanejamentoRecorrenciasManual?.()
      if (resultado?.erro) {
        setMensagemPlanejamento('Não foi possível concluir o planejamento. A simulação foi preservada para nova tentativa.')
        return
      }
      if (resultado?.parcial) {
        setMensagemPlanejamento('Planejamento concluído parcialmente. As contas existentes foram preservadas.')
      } else {
        setMensagemPlanejamento('Planejamento concluído: ' + (resultado?.criadas?.length || 0) + ' conta(s) criada(s) e ' + (resultado?.jaExistentes?.length || 0) + ' já existente(s).')
      }
      setAutorizouPlanejamento(false)
      await simularPlanejamento({ preservarMensagem: true, permitirDuranteGeracao: true })
    } finally {
      setGerandoPlanejamento(false)
    }
  }

  function confirmarGeracaoPlanejamento() {
    const resumo = simulacaoPlanejamento?.resumo
    if (!resumo?.total || !autorizouPlanejamento || gerandoPlanejamento) return
    abrirConfirmacao?.({
      titulo: 'Confirmar geração do planejamento',
      mensagem: 'Criar ' + resumo.total + ' conta(s) entre ' + formatarData(resumo.periodoInicio) + ' e ' + formatarData(resumo.periodoFim) + '? ' + resumo.quantidadeVariavel + ' conta(s) possuem valor variável. Valor-base estimado: ' + formatarValor(resumo.valorBaseTotal) + '.',
      textoConfirmar: 'Confirmar geração',
      tipo: 'aviso',
      acao: executarGeracaoConfirmada
    })
  }

  function confirmarDesativacaoSerie(serie) {
    if (!serie?.id) return

    abrirConfirmacao?.({
      titulo: 'Desativar série recorrente',
      mensagem: `Desativar a série "${serie.descricao || 'sem descrição'}"? A série será desativada, contas já geradas não serão apagadas e novas contas futuras dessa série não devem ser geradas automaticamente.`,
      textoConfirmar: 'Desativar',
      tipo: 'aviso',
      acao: () => desativarSerieRecorrente?.(serie.id)
    })
  }

  function confirmarReativacaoSerie(serie) {
    if (!serie?.id) return

    abrirConfirmacao?.({
      titulo: 'Reativar série recorrente',
      mensagem: `Reativar a série "${serie.descricao || 'sem descrição'}"? A série será reativada, contas já existentes não serão alteradas, nenhuma conta será criada imediatamente e a série voltará a participar da geração automática conforme a regra atual do sistema.`,
      textoConfirmar: 'Reativar',
      tipo: 'aviso',
      acao: () => reativarSerieRecorrente?.(serie.id)
    })
  }

  return (
    <main className="accounts-page recurring-page">
      <div className="page-title-actions accounts-page-header">
        <div className="accounts-page-header-copy">
          <span>Financeiro</span>
          <h1>Recorrências financeiras</h1>
          <p>Acompanhe séries recorrentes, duplicidades e contas vinculadas sem alterar a operação diária.</p>
        </div>
        <div className="page-actions-row">
          <button type="button" onClick={() => navegarPara?.('contas')}>
            Voltar para Contas
          </button>
        </div>
      </div>

      <section className="content-block accounts-planning-section" style={styles.bloco} aria-labelledby="planejamento-90-dias-titulo">
        <div className="accounts-list-header">
          <div className="accounts-list-title">
            <span className="accounts-kicker">Planejamento seguro</span>
            <strong id="planejamento-90-dias-titulo">Planejamento de 90 dias</strong>
            <small>Simule as contas recorrentes faltantes antes de gerar o planejamento.</small>
          </div>
          <button
            type="button"
            className="accounts-planning-simulate"
            disabled={simulandoPlanejamento || gerandoPlanejamento}
            onClick={() => simularPlanejamento()}
          >
            {simulandoPlanejamento ? 'Simulando...' : 'Simular 90 dias'}
          </button>
        </div>

        {simulacaoPlanejamento?.resumo && (
          <div className="accounts-planning-result" aria-live="polite">
            {simulacaoPlanejamento.resumo.total === 0 ? (
              <div className="accounts-recurring-info">Planejamento atualizado. Não há contas recorrentes faltantes nos próximos 90 dias.</div>
            ) : (
              <>
                <div className="accounts-planning-summary">
                  <span><b>Período</b>{formatarData(simulacaoPlanejamento.resumo.periodoInicio)} a {formatarData(simulacaoPlanejamento.resumo.periodoFim)}</span>
                  <span><b>Faltantes</b>{simulacaoPlanejamento.resumo.total}</span>
                  <span><b>Valor fixo</b>{simulacaoPlanejamento.resumo.quantidadeFixa}</span>
                  <span><b>Valor variável</b>{simulacaoPlanejamento.resumo.quantidadeVariavel}</span>
                  <span><b>Valor-base</b>{formatarValor(simulacaoPlanejamento.resumo.valorBaseTotal)}</span>
                </div>
                {simulacaoPlanejamento.resumo.quantidadeVariavel > 0 && (
                  <div className="accounts-recurring-warning">Contas de valor variável usarão o valor-base da recorrência e deverão ser revisadas antes do pagamento.</div>
                )}
                <div className="accounts-planning-months" aria-label="Resumo mensal do planejamento">
                  {simulacaoPlanejamento.resumo.porMes.map((mes) => (
                    <span key={mes.mes}><b>{mes.mes}</b>{mes.total} conta(s) · {formatarValor(mes.valorBaseTotal)}</span>
                  ))}
                </div>
                {simulacaoPlanejamento.inconsistencias?.length > 0 && (
                  <div className="accounts-recurring-warning">{simulacaoPlanejamento.inconsistencias.length} inconsistência(s) exigem revisão.</div>
                )}
                <div className="accounts-planning-sample">
                  <strong>Amostra das primeiras contas</strong>
                  <ul>
                    {simulacaoPlanejamento.ocorrencias.slice(0, 10).map((item) => (
                      <li key={item.identidade}>
                        <span>{item.recorrencia.descricao || 'Sem descrição'}</span>
                        <span>{formatarData(item.dataVencimento)}</span>
                        <span>{formatarValor(Number(item.recorrencia.valor || 0))}</span>
                        <span>{item.recorrencia.valor_variavel === true ? 'Variável' : 'Fixa'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <label className="accounts-planning-authorization">
                  <input
                    type="checkbox"
                    checked={autorizouPlanejamento}
                    disabled={gerandoPlanejamento}
                    onChange={(event) => setAutorizouPlanejamento(event.target.checked)}
                  />
                  <span>Revisei a simulação e autorizo a criação das contas faltantes.</span>
                </label>
                <button
                  type="button"
                  className="accounts-planning-generate"
                  disabled={!autorizouPlanejamento || gerandoPlanejamento}
                  onClick={confirmarGeracaoPlanejamento}
                >
                  {gerandoPlanejamento ? 'Gerando planejamento...' : 'Gerar ' + simulacaoPlanejamento.resumo.total + ' contas'}
                </button>
              </>
            )}
          </div>
        )}
        {mensagemPlanejamento && <div className="accounts-planning-message" role="status">{mensagemPlanejamento}</div>}
      </section>

      <section className="content-block accounts-recurring-section recurring-page-section" style={styles.bloco}>
        <div className="accounts-list-header">
          <div className="accounts-list-title">
            <span className="accounts-kicker">Auditoria financeira</span>
            <strong>Séries recorrentes</strong>
            <small>
              {resumoSeriesRecorrentes.total} série(s) cadastrada(s) • {resumoSeriesRecorrentes.ativas} ativa(s) • {resumoSeriesRecorrentes.inativas} inativa(s)
            </small>
          </div>
        </div>

        <div className="accounts-recurring-guidance" role="note">
          <span>Reativar uma série não cria contas imediatamente.</span>
          <span>A geração automática usa a série ativa, o mês atual e a trava por série + vencimento.</span>
          <span>O valor da série é usado como base; contas geradas podem ser ajustadas individualmente.</span>
          <span>Para despesas variáveis, confira o valor de cada competência antes de baixar a conta.</span>
        </div>

        <div className="accounts-recurring-summary">
          <span><b>Total</b>{resumoSeriesRecorrentes.total}</span>
          <span><b>Ativas</b>{resumoSeriesRecorrentes.ativas}</span>
          <span><b>Inativas</b>{resumoSeriesRecorrentes.inativas}</span>
          <span className={resumoSeriesRecorrentes.duplicadasAtivas ? 'has-warning' : ''}>
            <b>Duplicidades ativas</b>{resumoSeriesRecorrentes.duplicadasAtivas}
          </span>
          <span className={resumoSeriesRecorrentes.historicas ? 'has-info' : ''}>
            <b>Pares históricos</b>{resumoSeriesRecorrentes.historicas}
          </span>
        </div>

        <div className="accounts-recurring-controls">
          <div className="accounts-status-tabs accounts-recurring-tabs" role="tablist" aria-label="Filtro de séries recorrentes">
            {[
              ['ativas', 'Ativas'],
              ['inativas', 'Inativas'],
              ['duplicadas', 'Atenção'],
              ['historicas', 'Históricas'],
              ['todas', 'Todas']
            ].map(([valor, label]) => (
              <button
                key={valor}
                type="button"
                role="tab"
                aria-selected={filtroSeriesRecorrentes === valor}
                className={`accounts-status-tab ${filtroSeriesRecorrentes === valor ? 'is-active' : ''}`}
                onClick={() => setFiltroSeriesRecorrentes(valor)}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            className="accounts-recurring-search"
            style={styles.input}
            type="search"
            placeholder="Buscar série por descrição, centro ou filial"
            value={buscaSeriesRecorrentes}
            onChange={(event) => setBuscaSeriesRecorrentes(event.target.value)}
          />
        </div>

        {seriesRecorrentesFiltradas.length === 0 ? (
          <EmptyState
            icon="↻"
            title="Nenhuma série encontrada"
            description="Ajuste o filtro ou a busca para revisar as séries recorrentes cadastradas."
          />
        ) : (
          <div className="accounts-recurring-grid">
            {seriesRecorrentesVisiveis.map((serie) => {
              const centroNome = (centros || []).find((centro) => centro.id === serie.centro_custo_id)?.nome || 'Sem centro'
              const filialNome = (filiais || []).find((filial) => filial.id === serie.filial_id)?.nome || 'Sem filial'
              const quantidadeVinculada = contasPorRecorrencia.get(serie.id) || 0
              const statusDuplicidade = obterStatusDuplicidadeSerie(serie, duplicidadesSeries)
              const duplicadaAtiva = statusDuplicidade === 'ativa'
              const duplicidadeHistorica = statusDuplicidade === 'historica'
              const proximaReferencia = calcularProximaReferenciaSerie(serie)

              return (
                <article className={`accounts-recurring-card ${serie.ativo === true ? 'is-active' : 'is-inactive'} ${duplicadaAtiva ? 'is-duplicate' : ''} ${duplicidadeHistorica ? 'is-historical-duplicate' : ''}`} key={serie.id}>
                  <div className="accounts-recurring-card-head">
                    <strong>{serie.descricao || 'Série sem descrição'}</strong>
                    <span className={`status-pill ${serie.ativo === true ? 'status-pago' : 'status-pendente'}`}>
                      {serie.ativo === true ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <div className="accounts-recurring-value">{formatarValor(Number(serie.valor || 0))}</div>
                  <div className="accounts-recurring-meta">
                    <span>{formatarTipoRecorrencia(serie.tipo_recorrencia || 'mensal')}</span>
                    <span>Dia {serie.dia_vencimento || '-'}</span>
                    <span>Início {serie.data_inicio ? formatarData(serie.data_inicio) : '-'}</span>
                    {proximaReferencia && <span>Próxima referência {formatarData(proximaReferencia)}</span>}
                    <span>{centroNome}</span>
                    <span>{filialNome}</span>
                    <span>{quantidadeVinculada} conta(s) vinculada(s)</span>
                  </div>
                  {duplicadaAtiva && (
                    <div className="accounts-recurring-warning">
                      Atenção: existe mais de uma série ativa semelhante. Revise antes de gerar ou alterar recorrências.
                    </div>
                  )}
                  {duplicidadeHistorica && (
                    <div className="accounts-recurring-info">
                      Há séries semelhantes, mas apenas uma está ativa. Não há ação obrigatória; revise antes de reativar uma série inativa semelhante.
                    </div>
                  )}
                  <div className="accounts-recurring-actions">
                    {serie.ativo === true ? (
                      <button
                        type="button"
                        className="accounts-recurring-disable"
                        onClick={() => confirmarDesativacaoSerie(serie)}
                      >
                        Desativar
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="accounts-recurring-enable"
                        onClick={() => confirmarReativacaoSerie(serie)}
                      >
                        Reativar
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}

      </section>
    </main>
  )
}
