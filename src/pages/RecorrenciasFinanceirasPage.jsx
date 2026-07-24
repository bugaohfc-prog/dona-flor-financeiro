import { useMemo, useState } from 'react'
import { useRecorrenciaCobertura } from '../hooks/useRecorrenciaCobertura.js'
import { filtrarCoberturaRecorrencias, resolverHorizonteCobertura } from '../utils/recorrenciaCobertura.js'
import './RecorrenciasFinanceirasPage.css'

const HORIZONTES = [
  ['mes_atual', 'Mês atual'],
  ['proximo_mes', 'Próximo mês'],
  ['30', '30 dias'],
  ['60', '60 dias'],
  ['90', '90 dias'],
  ['personalizado', 'Personalizado']
]

function normalizarTexto(valor) {
  return String(valor || '').trim().toLowerCase()
}

function chaveDuplicidadeSerie(serie) {
  return [
    normalizarTexto(serie.descricao),
    Number(serie.valor || 0).toFixed(2),
    String(serie.dia_vencimento || ''),
    serie.centro_custo_id || '',
    serie.filial_id || ''
  ].join('|')
}

function calcularProximaReferenciaSerie(serie) {
  if (serie?.ativo !== true || String(serie.tipo_recorrencia || 'mensal').toLowerCase() !== 'mensal') return ''
  const hoje = new Date()
  const dia = Math.min(Math.max(Number(serie.dia_vencimento || 1), 1), 31)
  let ano = hoje.getFullYear()
  let mes = hoje.getMonth()
  let data = new Date(ano, mes, Math.min(dia, new Date(ano, mes + 1, 0).getDate()))
  if (data < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) {
    mes += 1
    data = new Date(ano, mes, Math.min(dia, new Date(ano, mes + 1, 0).getDate()))
  }
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

function GestaoRecorrencias({
  fonte,
  centros,
  filiais,
  styles,
  formatarValor,
  formatarData,
  formatarTipoRecorrencia,
  abrirConfirmacao,
  desativarSerieRecorrente,
  reativarSerieRecorrente
}) {
  const [filtro, setFiltro] = useState('ativas')
  const [busca, setBusca] = useState('')
  const series = fonte.resultado?.series || []
  const contasPorRecorrencia = useMemo(() => (fonte.resultado?.ocorrencias || []).reduce((mapa, ocorrencia) => {
    mapa.set(ocorrencia.recorrenciaId, (mapa.get(ocorrencia.recorrenciaId) || 0) + ocorrencia.contasVinculadas.length)
    return mapa
  }, new Map()), [fonte.resultado])
  const duplicidades = useMemo(() => series.reduce((mapa, serie) => {
    const chave = chaveDuplicidadeSerie(serie)
    const grupo = mapa.get(chave) || { total: 0, ativas: 0, inativas: 0 }
    grupo.total += 1
    grupo[serie.ativo === true ? 'ativas' : 'inativas'] += 1
    mapa.set(chave, grupo)
    return mapa
  }, new Map()), [series])
  const resumo = useMemo(() => ({
    total: series.length,
    ativas: series.filter((serie) => serie.ativo === true).length,
    inativas: series.filter((serie) => serie.ativo !== true).length,
    duplicadasAtivas: Array.from(duplicidades.values()).filter((grupo) => grupo.ativas > 1).length,
    historicas: Array.from(duplicidades.values()).filter((grupo) => grupo.total > 1 && grupo.ativas === 1 && grupo.inativas > 0).length
  }), [duplicidades, series])
  const visiveis = useMemo(() => series.filter((serie) => {
    const grupo = duplicidades.get(chaveDuplicidadeSerie(serie))
    const statusDuplicidade = grupo?.ativas > 1 ? 'duplicadas' : grupo?.total > 1 && grupo.ativas === 1 && grupo.inativas > 0 ? 'historicas' : ''
    if (filtro === 'ativas' && serie.ativo !== true) return false
    if (filtro === 'inativas' && serie.ativo === true) return false
    if ((filtro === 'duplicadas' || filtro === 'historicas') && statusDuplicidade !== filtro) return false
    const termo = normalizarTexto(busca)
    if (!termo) return true
    return [
      serie.descricao,
      (centros || []).find((item) => item.id === serie.centro_custo_id)?.nome,
      (filiais || []).find((item) => item.id === serie.filial_id)?.nome
    ].some((valor) => normalizarTexto(valor).includes(termo))
  }), [busca, centros, duplicidades, filiais, filtro, series])

  function confirmarAlteracao(serie, reativar) {
    abrirConfirmacao?.({
      titulo: `${reativar ? 'Reativar' : 'Desativar'} série recorrente`,
      mensagem: reativar
        ? `Reativar a série "${serie.descricao || 'sem descrição'}"? A série será reativada, contas já existentes não serão alteradas, nenhuma conta será criada imediatamente e a série voltará a participar da geração automática conforme a regra atual do sistema.`
        : `Desativar a série "${serie.descricao || 'sem descrição'}"? A série será desativada, contas já geradas não serão apagadas e novas contas futuras dessa série não devem ser geradas automaticamente.`,
      textoConfirmar: reativar ? 'Reativar' : 'Desativar',
      tipo: 'aviso',
      acao: async () => {
        await (reativar ? reativarSerieRecorrente?.(serie.id) : desativarSerieRecorrente?.(serie.id))
        await fonte.consultar()
      }
    })
  }

  if (fonte.carregando) return <div className="recurring-coverage-state" role="status">Carregando recorrências...</div>
  if (fonte.erro) return <div className="recurring-coverage-state is-error" role="alert"><strong>Não foi possível carregar as recorrências.</strong><button type="button" onClick={fonte.consultar}>Tentar novamente</button></div>

  return <section className="content-block accounts-recurring-section recurring-management-panel" style={styles.bloco}>
    <div className="accounts-list-header"><div className="accounts-list-title"><span className="accounts-kicker">Gestão</span><strong>Séries recorrentes</strong><small>{resumo.total} cadastrada(s) · {resumo.ativas} ativa(s) · {resumo.inativas} inativa(s)</small></div></div>
    <div className="accounts-recurring-summary">
      <span><b>Total</b>{resumo.total}</span><span><b>Ativas</b>{resumo.ativas}</span><span><b>Inativas</b>{resumo.inativas}</span>
      <span className={resumo.duplicadasAtivas ? 'has-warning' : ''}><b>Duplicidades ativas</b>{resumo.duplicadasAtivas}</span>
      <span className={resumo.historicas ? 'has-info' : ''}><b>Pares históricos</b>{resumo.historicas}</span>
    </div>
    <div className="accounts-recurring-controls">
      <div className="accounts-status-tabs accounts-recurring-tabs" role="tablist" aria-label="Filtro de séries recorrentes">
        {[['ativas', 'Ativas'], ['inativas', 'Inativas'], ['duplicadas', 'Atenção'], ['historicas', 'Históricas'], ['todas', 'Todas']].map(([valor, label]) => <button key={valor} type="button" role="tab" aria-selected={filtro === valor} className={`accounts-status-tab ${filtro === valor ? 'is-active' : ''}`} onClick={() => setFiltro(valor)}>{label}</button>)}
      </div>
      <input className="accounts-recurring-search" style={styles.input} type="search" placeholder="Buscar série por descrição, centro ou filial" value={busca} onChange={(event) => setBusca(event.target.value)} />
    </div>
    {visiveis.length === 0 ? <div className="recurring-coverage-state">Nenhuma série encontrada.</div> : <div className="accounts-recurring-grid">
      {visiveis.map((serie) => {
        const grupo = duplicidades.get(chaveDuplicidadeSerie(serie))
        const proximaReferencia = calcularProximaReferenciaSerie(serie)
        return <article className={`accounts-recurring-card ${serie.ativo === true ? 'is-active' : 'is-inactive'} ${grupo?.ativas > 1 ? 'is-duplicate' : ''}`} key={serie.id}>
          <div className="accounts-recurring-card-head"><strong>{serie.descricao || 'Série sem descrição'}</strong><span className={`status-pill ${serie.ativo === true ? 'status-pago' : 'status-pendente'}`}>{serie.ativo === true ? 'Ativa' : 'Inativa'}</span></div>
          <div className="accounts-recurring-value">{formatarValor(Number(serie.valor || 0))}</div>
          <div className="accounts-recurring-meta"><span>{formatarTipoRecorrencia(serie.tipo_recorrencia || 'mensal')}</span><span>Dia {serie.dia_vencimento || '-'}</span><span>Início {serie.data_inicio ? formatarData(serie.data_inicio) : '-'}</span>{proximaReferencia && <span>Próxima referência {formatarData(proximaReferencia)}</span>}<span>{centros.find((item) => item.id === serie.centro_custo_id)?.nome || 'Sem centro'}</span><span>{filiais.find((item) => item.id === serie.filial_id)?.nome || 'Sem filial'}</span><span>{contasPorRecorrencia.get(serie.id) || 0} conta(s) vinculada(s) no horizonte</span></div>
          {grupo?.ativas > 1 && <div className="accounts-recurring-warning">Atenção: existe mais de uma série ativa semelhante.</div>}
          <div className="accounts-recurring-actions"><button type="button" className={serie.ativo === true ? 'accounts-recurring-disable' : 'accounts-recurring-enable'} onClick={() => confirmarAlteracao(serie, serie.ativo !== true)}>{serie.ativo === true ? 'Desativar' : 'Reativar'}</button></div>
        </article>
      })}
    </div>}
  </section>
}

export default function RecorrenciasFinanceirasPage({
  empresaId,
  empresaNome,
  styles,
  centros = [],
  filiais = [],
  formatarValor,
  formatarData,
  formatarTipoRecorrencia,
  navegarPara,
  navegarParaConta,
  abrirConfirmacao,
  desativarSerieRecorrente,
  reativarSerieRecorrente,
  podeVincularRecorrencia = false,
  vincularContaManualRecorrencia
}) {
  const [secao, setSecao] = useState('cobertura')
  const [tipoHorizonte, setTipoHorizonte] = useState('90')
  const [personalizado, setPersonalizado] = useState({ inicio: '', fim: '' })
  const [filtros, setFiltros] = useState({ filialId: '', centroId: '', cobertura: 'todas', busca: '' })
  const [expandidas, setExpandidas] = useState(() => new Set())
  const [vinculoEmAndamento, setVinculoEmAndamento] = useState('')
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

  function nomeCentro(id) {
    return centros.find((item) => item.id === id)?.nome || 'Sem centro'
  }

  function nomeFilial(id) {
    return filiais.find((item) => item.id === id)?.nome || 'Sem filial'
  }

  function confirmarVinculoManual(ocorrencia, conta) {
    if (!podeVincularRecorrencia || !vincularContaManualRecorrencia) return
    const chave = `${ocorrencia.identidade}:${conta.id}`
    abrirConfirmacao?.({
      titulo: 'Vincular conta manual',
      mensagem: [
        `Recorrência: ${ocorrencia.serie?.descricao || 'sem descrição'}`,
        `Conta: ${conta.descricao || 'sem descrição'}`,
        `Competência: ${ocorrencia.competencia ? formatarData(ocorrencia.competencia) : '-'}`,
        `Vencimento: ${formatarData(ocorrencia.dataVencimento)}`,
        `Valor: ${formatarValor(Number(conta.valor || 0))}`,
        `Empresa: ${empresaNome || empresaId || '-'}`,
        `Filial: ${nomeFilial(conta.filial_id)}`,
        `Centro: ${nomeCentro(conta.centro_custo_id)}`,
        'A conta será revalidada antes do vínculo. Nenhuma conta será gerada.'
      ].join('\n'),
      textoConfirmar: 'Confirmar vínculo',
      tipo: 'aviso',
      acao: async () => {
        if (vinculoEmAndamento) return
        setVinculoEmAndamento(chave)
        try {
          const resultadoVinculo = await vincularContaManualRecorrencia({
            contaId: conta.id,
            recorrenciaId: ocorrencia.recorrenciaId,
            dataVencimento: ocorrencia.dataVencimento,
            competencia: ocorrencia.competencia
          })
          if (!resultadoVinculo?.error && !resultadoVinculo?.bloqueado) await fonte.consultar()
        } finally {
          setVinculoEmAndamento('')
        }
      }
    })
  }

  return <main className="accounts-page recurring-coverage-page">
    <div className="page-title-actions accounts-page-header"><div className="accounts-page-header-copy"><span>Financeiro</span><h1>Recorrências financeiras</h1><p>Confira a cobertura por horizonte e gerencie séries sem gerar contas automaticamente.</p></div><button type="button" onClick={() => navegarPara?.('contas')}>Voltar para Contas</button></div>
    <div className="recurring-page-tabs" role="tablist" aria-label="Seções de recorrências">
      <button type="button" role="tab" aria-selected={secao === 'cobertura'} className={secao === 'cobertura' ? 'is-active' : ''} onClick={() => setSecao('cobertura')}>Cobertura</button>
      <button type="button" role="tab" aria-selected={secao === 'gestao'} className={secao === 'gestao' ? 'is-active' : ''} onClick={() => setSecao('gestao')}>Gerenciar recorrências</button>
    </div>
    {secao === 'gestao' ? <GestaoRecorrencias {...{ fonte, centros, filiais, styles, formatarValor, formatarData, formatarTipoRecorrencia, abrirConfirmacao, desativarSerieRecorrente, reativarSerieRecorrente }} /> : <section className="content-block recurring-coverage-panel">
      <div className="recurring-coverage-horizons" aria-label="Horizonte da cobertura">{HORIZONTES.map(([valor, rotulo]) => <button key={valor} type="button" className={tipoHorizonte === valor ? 'is-active' : ''} aria-pressed={tipoHorizonte === valor} onClick={() => setTipoHorizonte(valor)}>{rotulo}</button>)}</div>
      {tipoHorizonte === 'personalizado' && <div className="recurring-coverage-custom"><label>Início<input type="date" value={personalizado.inicio} onChange={(event) => setPersonalizado((atual) => ({ ...atual, inicio: event.target.value }))} /></label><label>Fim<input type="date" value={personalizado.fim} onChange={(event) => setPersonalizado((atual) => ({ ...atual, fim: event.target.value }))} /></label></div>}
      <div className="recurring-coverage-period">Período inclusivo: <strong>{horizonte.inicio ? formatarData(horizonte.inicio) : '-'} a {horizonte.fim ? formatarData(horizonte.fim) : '-'}</strong></div>
      <div className="recurring-coverage-filters"><select value={filtros.filialId} onChange={(event) => setFiltros((atual) => ({ ...atual, filialId: event.target.value }))} aria-label="Filtrar por filial"><option value="">Todas as filiais</option>{filiais.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select><select value={filtros.centroId} onChange={(event) => setFiltros((atual) => ({ ...atual, centroId: event.target.value }))} aria-label="Filtrar por centro"><option value="">Todos os centros</option>{centros.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select><select value={filtros.cobertura} onChange={(event) => setFiltros((atual) => ({ ...atual, cobertura: event.target.value }))} aria-label="Filtrar por cobertura"><option value="todas">Todas as coberturas</option><option value="coberta">Cobertas</option><option value="faltante">Faltantes</option><option value="possivel_manual">Possível manual</option><option value="duplicada">Duplicadas</option></select><input type="search" placeholder="Buscar recorrência" value={filtros.busca} onChange={(event) => setFiltros((atual) => ({ ...atual, busca: event.target.value }))} /></div>
      {fonte.carregando && <div className="recurring-coverage-state" role="status">Calculando cobertura...</div>}
      {!fonte.carregando && fonte.erro && <div className="recurring-coverage-state is-error" role="alert"><strong>Não foi possível consultar a cobertura.</strong><button type="button" onClick={fonte.consultar}>Tentar novamente</button></div>}
      {!fonte.carregando && !fonte.erro && fonte.carregado && fonte.resultado && <>
        <div className="recurring-coverage-summary recurring-coverage-summary-complete"><span><b>Recorrências ativas</b>{fonte.resultado.resumo.recorrenciasAtivas}</span><span><b>Esperadas</b>{fonte.resultado.resumo.esperadas}</span><span><b>Cobertas</b>{fonte.resultado.resumo.cobertas}</span><span><b>Faltantes</b>{fonte.resultado.resumo.faltantes}</span><span><b>Possível manual</b>{fonte.resultado.resumo.possiveisManuais}</span><span><b>Duplicadas</b>{fonte.resultado.resumo.duplicadas}</span><span><b>Valor fixo projetado</b>{formatarValor(fonte.resultado.resumo.valorFixoProjetado)}</span><span><b>Variáveis sem projeção</b>{fonte.resultado.resumo.variaveisSemProjecao}</span><span><b>Inconsistências</b>{fonte.resultado.resumo.inconsistencias}</span></div>
        {resultado.recorrencias.length === 0 ? <div className="recurring-coverage-state">Nenhuma ocorrência encontrada para os filtros selecionados.</div> : <div className="recurring-coverage-list">{resultado.recorrencias.map(({ serie, ocorrencias }) => {
          const aberta = expandidas.has(serie.id)
          const contagens = ocorrencias.reduce((acc, item) => ({ ...acc, [item.cobertura]: (acc[item.cobertura] || 0) + 1 }), {})
          return <article className="recurring-coverage-series" key={serie.id}><button type="button" className="recurring-coverage-series-toggle" aria-expanded={aberta} aria-controls={`coverage-${serie.id}`} onClick={() => alternarSerie(serie.id)}><span><strong>{serie.descricao || 'Recorrência sem descrição'}</strong><small>{ocorrencias.length} ocorrência(s) · {contagens.coberta || 0} coberta(s) · {contagens.faltante || 0} faltante(s) · {contagens.possivel_manual || 0} possível(is) manual(is) · {contagens.duplicada || 0} duplicada(s)</small></span><span aria-hidden="true">{aberta ? '−' : '+'}</span></button>{aberta && <div className="recurring-coverage-occurrences" id={`coverage-${serie.id}`}>{ocorrencias.map((item) => <div className={`recurring-coverage-occurrence is-${item.cobertura}`} key={item.identidade}><div><strong>{formatarData(item.dataVencimento)}</strong><span>{item.cobertura === 'coberta' ? 'Coberta' : item.cobertura === 'duplicada' ? 'Duplicidade' : item.cobertura === 'possivel_manual' ? 'Possível manual' : 'Faltante'}</span></div>{item.contasVinculadas.map((conta) => <button type="button" key={conta.id} onClick={() => navegarParaConta?.(conta.id)}>Abrir conta vinculada · {formatarValor(Number(conta.valor || 0))}</button>)}{item.sugestoes.map(({ conta, confianca, criterios }) => {
            const chaveVinculo = `${item.identidade}:${conta.id}`
            const bloqueado = !podeVincularRecorrencia || vinculoEmAndamento === chaveVinculo
            return <div className="recurring-coverage-suggestion" key={conta.id}><b>Possível conta manual · confiança {confianca}</b><span>{criterios.join(' · ')}</span><div className="recurring-coverage-suggestion-actions"><button type="button" onClick={() => navegarParaConta?.(conta.id)}>Abrir conta</button><button type="button" disabled={bloqueado} title={podeVincularRecorrencia ? 'Revalidar e confirmar o vínculo manual.' : 'Somente usuários autorizados podem vincular após revisão.'} onClick={() => confirmarVinculoManual(item, conta)}>{vinculoEmAndamento === chaveVinculo ? 'Vinculando...' : 'Vincular após revisão'}</button></div></div>
          })}{item.cobertura === 'faltante' && <button type="button" className="recurring-coverage-disabled-action" disabled title="A ação ainda não está liberada. A ocorrência deverá ser recalculada e confirmada antes da geração.">Gerar após revisão</button>}</div>)}</div>}</article>
        })}</div>}
      </>}
    </section>}
  </main>
}
