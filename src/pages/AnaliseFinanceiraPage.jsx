import { useMemo, useState } from 'react'
import { useAnaliseFinanceiraController, AGRUPAMENTOS_ANALISE } from '../hooks/useAnaliseFinanceiraController.js'
import {
  ExecutiveSummary,
  NarrativeIntelligenceCard,
  QuickQuestions,
  RecommendationsCard,
  SmartPriorityList,
} from '../components/copilot/widgets/CopilotWidgets.jsx'
import {
  exportarRelatorioContasCsv,
  exportarRelatorioContasExcel,
  imprimirRelatorioContas,
} from '../utils/relatoriosContasExport.js'
import { montarLinhasAnaliseFinanceira } from '../utils/analiseFinanceira.js'
import './AnaliseFinanceiraPage.css'
import './AnaliseFinanceiraTrends.css'

const formatarMoedaPadrao = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const formatarDataPadrao = (valor) => valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('pt-BR') : '-'

function Bloco({ titulo, descricao, children, className = '' }) {
  return <section className={`analise-card ${className}`}><header><div><h2>{titulo}</h2>{descricao ? <p>{descricao}</p> : null}</div></header>{children}</section>
}

export default function AnaliseFinanceiraPage({
  empresaId,
  empresaNome,
  centros = [],
  filiais = [],
  formatarValor = formatarMoedaPadrao,
  formatarData = formatarDataPadrao,
  navegarPara,
  podeExportarDados = true,
  mostrarAviso,
}) {
  const controller = useAnaliseFinanceiraController({ empresaId, empresaNome, centros, filiais })
  const [maisFiltros, setMaisFiltros] = useState(false)
  const [perguntaAtiva, setPerguntaAtiva] = useState('')
  const [limiteDetalhes, setLimiteDetalhes] = useState(30)
  const linhas = useMemo(() => montarLinhasAnaliseFinanceira(controller.registros, {
    base: controller.filtros.base,
    centros,
    filiais,
    formatarData,
    formatarValor,
  }), [centros, controller.filtros.base, controller.registros, filiais, formatarData, formatarValor])
  const linhasPorId = useMemo(() => new Map(linhas.map((linha) => [linha.conta, linha])), [linhas])
  const gruposExportacao = useMemo(() => controller.grupos.map((grupo) => ({
    titulo: grupo.titulo,
    linhas: grupo.contas.map((conta) => linhasPorId.get(conta)),
  })), [controller.grupos, linhasPorId])

  const podeExportar = podeExportarDados && controller.carregado && !controller.carregando && !controller.erro && linhas.length > 0
  function validarExportacao() {
    if (podeExportar) return true
    mostrarAviso?.('A exportação exige uma consulta completa e registros no filtro atual.', 'erro')
    return false
  }
  function exportarCsv() {
    if (validarExportacao()) exportarRelatorioContasCsv(linhas, controller.contextoExportacao)
  }
  function exportarExcel() {
    if (validarExportacao()) exportarRelatorioContasExcel(linhas, controller.contextoExportacao)
  }
  function imprimir(modo) {
    if (!validarExportacao()) return
    imprimirRelatorioContas({ linhas, grupos: gruposExportacao, contexto: controller.contextoExportacao, resumo: {
      quantidade: controller.indicadores.quantidade,
      previsto: controller.indicadores.previsto,
      pago: controller.indicadores.pago,
      saldo: controller.indicadores.saldo,
      vencido: controller.indicadores.vencido,
    }, modo })
  }

  const variacaoTexto = controller.comparacao.percentual == null
    ? 'Sem base anterior comparável'
    : `${controller.comparacao.percentual > 0 ? '+' : ''}${controller.comparacao.percentual}%`

  return (
    <main className="analise-financeira-page">
      <header className="analise-hero">
        <div>
          <span>Financeiro · contas, despesas e obrigações</span>
          <h1>Análise Financeira</h1>
          <p>Painel gerencial, indicadores e detalhamento de contas com uma única verdade financeira.</p>
          <small>{controller.contextoExportacao.periodo} · {controller.contextoExportacao.filialNome} · {controller.contextoExportacao.centroNome} · {controller.contextoExportacao.base}</small>
        </div>
        <div className="analise-actions">
          <button type="button" onClick={controller.atualizar} disabled={controller.carregando}>{controller.carregando ? 'Atualizando…' : 'Atualizar'}</button>
          <details className="analise-export">
            <summary aria-label="Abrir opções de exportação">Exportar</summary>
            <div className="analise-export-menu" role="group" aria-label="Formatos de exportação">
              <button type="button" onClick={exportarCsv} disabled={!podeExportar}>CSV</button>
              <button type="button" onClick={exportarExcel} disabled={!podeExportar}>Excel compatível (.xls)</button>
              <button type="button" onClick={() => imprimir('compacto')} disabled={!podeExportar}>PDF compacto</button>
              <button type="button" onClick={() => imprimir('gerencial')} disabled={!podeExportar}>PDF gerencial</button>
            </div>
          </details>
        </div>
      </header>

      <Bloco titulo="Filtros" descricao="O mesmo recorte alimenta painel, assistente, detalhamento e exportações." className="analise-filtros-card">
        <div className="analise-filtros">
          <label><span>Data inicial</span><input type="date" value={controller.filtros.dataInicial} onChange={(e) => controller.alterarFiltro('dataInicial', e.target.value)} /></label>
          <label><span>Data final</span><input type="date" value={controller.filtros.dataFinal} onChange={(e) => controller.alterarFiltro('dataFinal', e.target.value)} /></label>
          <label><span>Base da análise</span><select value={controller.filtros.base} onChange={(e) => controller.alterarFiltro('base', e.target.value)}><option value="vencimento">Vencimento</option><option value="pagamento">Pagamento</option></select></label>
          <label><span>Status</span><select value={controller.filtros.status} onChange={(e) => controller.alterarFiltro('status', e.target.value)}><option value="todas">Todos</option><option value="abertas">Abertas</option><option value="parciais">Parcialmente pagas</option><option value="vencidas">Vencidas</option><option value="pagas">Pagas/quitadas</option></select></label>
          <label><span>Filial</span><select value={controller.filtros.filialId} onChange={(e) => controller.alterarFiltro('filialId', e.target.value)}><option value="">Todas</option>{filiais.map((filial) => <option key={filial.id} value={filial.id}>{filial.nome}</option>)}</select></label>
          <button type="button" className="analise-more" aria-expanded={maisFiltros} onClick={() => setMaisFiltros((aberto) => !aberto)}>Mais filtros</button>
        </div>
        {maisFiltros ? <div className="analise-filtros analise-filtros-secundarios">
          <fieldset><legend>Centros de custo</legend><div className="analise-checks">{centros.map((centro) => <label key={centro.id}><input type="checkbox" checked={controller.filtros.centrosSelecionados.includes(centro.id)} onChange={() => controller.alterarFiltro('centrosSelecionados', controller.filtros.centrosSelecionados.includes(centro.id) ? controller.filtros.centrosSelecionados.filter((id) => id !== centro.id) : [...controller.filtros.centrosSelecionados, centro.id])} />{centro.nome}</label>)}</div></fieldset>
          <label><span>Origem</span><select value={controller.filtros.origem} onChange={(e) => controller.alterarFiltro('origem', e.target.value)}><option value="todas">Manual e recorrente</option><option value="manual">Manual</option><option value="recorrente">Recorrente</option></select></label>
          <label><span>Busca</span><input type="search" value={controller.filtros.busca} onChange={(e) => controller.alterarFiltro('busca', e.target.value)} placeholder="Descrição, observação, centro ou filial" /></label>
          <label><span>Agrupamento</span><select value={controller.filtros.agrupamento} onChange={(e) => controller.alterarFiltro('agrupamento', e.target.value)}>{AGRUPAMENTOS_ANALISE.map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}</select></label>
          <label><span>Meta mensal</span><input inputMode="decimal" value={controller.filtros.metaMensal} onChange={(e) => controller.alterarFiltro('metaMensal', e.target.value.replace(',', '.'))} placeholder="Opcional" /></label>
          <label className="analise-checkbox"><input type="checkbox" checked={controller.filtros.incluirOcultas} onChange={(e) => controller.alterarFiltro('incluirOcultas', e.target.checked)} />Incluir ocultas</label>
          <button type="button" className="analise-clear" onClick={controller.limparFiltros}>Limpar filtros</button>
        </div> : null}
      </Bloco>

      {controller.erro ? <section className="analise-state" role="alert"><h2>Análise indisponível</h2><p>Nenhum indicador foi apresentado como zero válido. Tente novamente.</p><button type="button" onClick={controller.atualizar}>Tentar novamente</button></section> : null}
      {controller.carregando && !controller.carregado ? <section className="analise-state" aria-busy="true"><h2>Carregando análise…</h2><p>Consultando o período completo e sua comparação.</p></section> : null}
      {!controller.erro && controller.carregado && !controller.registros.length ? <section className="analise-state"><h2>Nenhum registro no recorte</h2><p>Ajuste o período ou os filtros para compor a análise.</p></section> : null}

      {!controller.erro && controller.carregado && controller.registros.length ? <>
        <section className="analise-kpis" aria-label="Indicadores financeiros">
          <article><span>Valor previsto</span><strong>{formatarValor(controller.indicadores.previsto)}</strong><small>{controller.indicadores.quantidade} registro(s)</small></article>
          <article><span>Valor pago</span><strong>{formatarValor(controller.indicadores.pago)}</strong><small>{controller.indicadores.taxaPagamento}% do previsto</small></article>
          <article><span>Saldo em aberto</span><strong>{formatarValor(controller.indicadores.saldo)}</strong><small>Após pagamentos parciais</small></article>
          <article className="is-danger"><span>Valor vencido</span><strong>{formatarValor(controller.indicadores.vencido)}</strong><small>Somente saldo restante</small></article>
          <article><span>Taxa de pagamento</span><strong>{controller.indicadores.taxaPagamento}%</strong><small>Realizado / previsto</small></article>
          <article><span>Variação anterior</span><strong>{variacaoTexto}</strong><small>{formatarValor(controller.comparacao.diferenca)}</small></article>
        </section>

        <Bloco titulo="Inteligência gerencial" descricao="Assistente determinístico calculado exclusivamente sobre os registros filtrados." className="analise-inteligencia">
          <div className="analise-grid-2"><ExecutiveSummary intelligence={controller.copilot} /><NarrativeIntelligenceCard intelligence={controller.copilot} /><SmartPriorityList intelligence={controller.copilot} onNavigate={navegarPara} /><RecommendationsCard intelligence={controller.copilot} /></div>
          <QuickQuestions intelligence={controller.copilot} perguntaAtiva={perguntaAtiva} onQuestion={setPerguntaAtiva} />
        </Bloco>

        <div className="analise-grid-2">
          <Bloco titulo="Tendências e composição" descricao="Comparação e concentração do recorte atual.">
            <div className="analise-metric-list"><p><span>Período anterior</span><strong>{formatarValor(controller.indicadoresAnteriores.previsto)}</strong></p><p><span>Encargos</span><strong>{formatarValor(controller.indicadores.encargos)}</strong></p><p><span>Descontos</span><strong>{formatarValor(controller.indicadores.descontos)}</strong></p><p><span>Recorrentes</span><strong>{controller.registros.filter((conta) => conta.recorrencia_id).length}</strong></p></div>
            <div className="analise-trend" aria-label="Evolução temporal">{controller.copilot.tendenciaMensal.map((mes) => <article key={mes.mes}><strong>{mes.mes}</strong><span>Previsto {formatarValor(mes.total)}</span><span>Pago {formatarValor(mes.pago)}</span><span>Aberto {formatarValor(mes.pendente)}</span><span>Vencido {formatarValor(mes.vencido)}</span></article>)}</div>
            <div className="analise-bars">{controller.copilot.rankingCentros.map((centro) => <article key={centro.nome}><span>{centro.nome}</span><div><i style={{ width: `${Math.max(2, centro.peso)}%` }} /></div><strong>{centro.peso}% · {formatarValor(centro.total)}</strong></article>)}</div>
          </Bloco>
          <Bloco titulo="Projeções" descricao="Estimativas baseadas no histórico filtrado disponível; não representam DRE.">
            <div className="analise-projecoes">{[30, 60, 90].map((dias) => <article key={dias}><span>{dias} dias</span><strong>{formatarValor(controller.projecoes[`previsao${dias}`])}</strong></article>)}</div>
            <p className="analise-note">{controller.projecoes.tendencia} Risco projetado: {controller.projecoes.riscoProjetado}%.</p>
            {controller.projecoes.relacaoMeta != null ? <p className="analise-note">Projeção de 30 dias equivale a {controller.projecoes.relacaoMeta}% da meta informada.</p> : null}
          </Bloco>
        </div>

        <Bloco titulo="Exceções" descricao="Pontos que pedem conferência antes da decisão.">
          <div className="analise-excecoes">
            <article><strong>{controller.excecoes.vencidas.length}</strong><span>Vencidas</span></article>
            <article><strong>{controller.excecoes.proximas.length}</strong><span>Próximos 7 dias</span></article>
            <article><strong>{controller.excecoes.anormais.length}</strong><span>Valores anormais</span></article>
            <article><strong>{controller.excecoes.semCentro.length}</strong><span>Sem centro</span></article>
            <article><strong>{controller.excecoes.concentracoesExcessivas.length}</strong><span>Concentração excessiva</span></article>
            <article><strong>{controller.excecoes.pagamentosSemData.length}</strong><span>Pagamento sem data confiável</span></article>
          </div>
        </Bloco>

        <Bloco titulo="Detalhamento" descricao={`${controller.registros.length} registro(s); exportações usam exatamente este conjunto.`}>
          <p className="analise-scroll-hint">No celular, deslize somente o detalhamento para ver todas as colunas.</p>
          <div className="analise-table" role="region" aria-label="Detalhamento financeiro com rolagem horizontal" tabIndex="0">
            <div role="table" aria-label="Registros da análise financeira">
            <div className="analise-table-head" role="row"><span>Descrição</span><span>Previsto</span><span>Pago</span><span>Saldo</span><span>Data</span><span>Status</span><span>Centro / filial</span></div>
            {controller.grupos.flatMap((grupo) => [
              <div className="analise-group" key={`grupo-${grupo.titulo}`}>{grupo.titulo} · {grupo.contas.length}</div>,
              ...grupo.contas.slice(0, limiteDetalhes).map((conta) => {
                const linha = linhasPorId.get(conta)
                return <article role="row" key={`${grupo.titulo}-${conta.id}-${conta.pagamento_id_relatorio || ''}`}>
                  <strong>{linha.descricao}</strong>
                  <span>{linha.valorPrevistoFormatado}</span>
                  <span>{linha.valorPagoFormatado}</span>
                  <span>{linha.saldoRestanteFormatado}</span>
                  <span>{linha.dataReferenciaFormatada}</span>
                  <span>{linha.statusGerencial}</span>
                  <span>{linha.centroNome} · {linha.filialNome}</span>
                </article>
              }),
            ])}
            </div>
          </div>
          {controller.registros.length > limiteDetalhes ? <button type="button" className="analise-more-results" onClick={() => setLimiteDetalhes((limite) => limite + 30)}>Carregar mais 30</button> : null}
        </Bloco>
      </> : null}
    </main>
  )
}
