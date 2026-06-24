import { AccountListSkeleton } from '../components/feedback/Skeletons.jsx'
import { ehContaRecorrente } from '../utils/recorrencia'
import { useEffect, useMemo, useRef, useState } from 'react'
import AccountPaymentModal from '../components/modals/AccountPaymentModal.jsx'
import AccountPartialPaymentModal from '../components/modals/AccountPartialPaymentModal.jsx'

const OPCOES_ORDENACAO_CONTAS = [
  { valor: 'vencimento_asc', label: 'Vencimento mais próximo' },
  { valor: 'vencimento_desc', label: 'Vencimento mais distante' },
  { valor: 'valor_desc', label: 'Maior valor' },
  { valor: 'valor_asc', label: 'Menor valor' },
  { valor: 'nome_asc', label: 'Nome A-Z' },
  { valor: 'status', label: 'Status' }
]

const ABAS_STATUS_CONTAS = [
  { valor: 'pendentes', label: 'Abertas' },
  { valor: 'vencidas', label: 'Vencidas' },
  { valor: 'pagas', label: 'Pagas' },
  { valor: 'ocultas', label: 'Ocultas' },
  { valor: 'todas', label: 'Todas' }
]

const MESES_PT_BR = [
  'Janeiro',
  'Fevereiro',
  'Mar\u00e7o',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
]

const LIMITE_CONTAS_POR_GRUPO = 10

const ACCOUNT_ACTIONS_STYLE = {
  marginTop: 10,
  gap: 6,
  alignItems: 'center'
}

const ACCOUNT_PRIMARY_ACTION_STYLE = {
  minHeight: 30,
  minWidth: 64,
  padding: '6px 10px',
  borderRadius: 999,
  fontSize: 12,
  boxShadow: 'none'
}

const ACCOUNT_SECONDARY_ACTION_STYLE = {
  minHeight: 28,
  minWidth: 0,
  padding: '5px 8px',
  borderRadius: 999,
  fontSize: 12,
  background: '#ffffff',
  color: '#475569',
  border: '1px solid #cbd5e1',
  boxShadow: 'none'
}

const ACCOUNT_DANGER_ACTION_STYLE = {
  ...ACCOUNT_SECONDARY_ACTION_STYLE,
  color: '#991b1b',
  border: '1px solid #fecaca',
  background: '#fffafa',
  opacity: 0.78
}

const ACCOUNT_HIDE_ACTION_STYLE = {
  ...ACCOUNT_SECONDARY_ACTION_STYLE,
  color: '#0f766e',
  border: '1px solid #99f6e4',
  background: '#ecfdf5'
}

function obterTimestampVencimento(conta, fallback) {
  const valor = String(conta?.data_vencimento || '').trim()
  const partesDataBanco = valor.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const partesDataBrasil = valor.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/)

  if (partesDataBanco) {
    const [, ano, mes, dia] = partesDataBanco
    return new Date(Number(ano), Number(mes) - 1, Number(dia)).getTime()
  }

  if (partesDataBrasil) {
    const [, dia, mes, ano] = partesDataBrasil
    return new Date(Number(ano), Number(mes) - 1, Number(dia)).getTime()
  }

  const timestamp = Date.parse(valor)
  return Number.isNaN(timestamp) ? fallback : timestamp
}

function obterChavePeriodoConta(conta) {
  const data = String(conta?.data_vencimento || '').trim()
  const partes = data.match(/^(\d{4})-(\d{2})/)
  if (!partes) return 'sem-data'
  return `${partes[1]}-${partes[2]}`
}

function obterRotuloPeriodo(chave) {
  if (chave === 'sem-data') return 'Sem data'
  const [ano, mes] = chave.split('-')
  const indiceMes = Number(mes) - 1
  const nomeMes = MESES_PT_BR[indiceMes]
  return nomeMes && ano ? `${nomeMes}/${ano}` : 'Sem data'
}

function agruparContasPorPeriodo(contas) {
  const mapa = new Map()

  contas.forEach((conta) => {
    const chave = obterChavePeriodoConta(conta)
    if (!mapa.has(chave)) {
      mapa.set(chave, {
        chave,
        rotulo: obterRotuloPeriodo(chave),
        contas: [],
        totalPrevisto: 0
      })
    }

    const grupo = mapa.get(chave)
    grupo.contas.push(conta)
    grupo.totalPrevisto += Number(conta.valor || 0)
  })

  return Array.from(mapa.values())
}

function ordenarContasParaListagem(contas, ordenacao, filtroStatus, estaVencida) {
  const compararVencimentoAsc = (a, b) =>
    obterTimestampVencimento(a, Number.MAX_SAFE_INTEGER) - obterTimestampVencimento(b, Number.MAX_SAFE_INTEGER)

  const compararVencimentoDesc = (a, b) =>
    obterTimestampVencimento(b, Number.MIN_SAFE_INTEGER) - obterTimestampVencimento(a, Number.MIN_SAFE_INTEGER)

  const compararId = (a, b) =>
    String(a.id || '').localeCompare(String(b.id || ''))

  const compararAbertasAntesDePagas = (a, b) => {
    if (filtroStatus === 'pagas') return 0

    const aPaga = a.status === 'pago' ? 1 : 0
    const bPaga = b.status === 'pago' ? 1 : 0
    return aPaga - bPaga
  }

  const obterStatusOrdenacao = (conta) => {
    if (estaVencida(conta.data_vencimento, conta.status)) return 0
    if (conta.status !== 'pago') return 1
    return 2
  }

  return [...contas].sort((a, b) => {
    if (ordenacao === 'vencimento_asc') {
      const grupo = compararAbertasAntesDePagas(a, b)
      if (grupo !== 0) return grupo
      const vencimento = compararVencimentoAsc(a, b)
      return vencimento || compararId(a, b)
    }

    if (ordenacao === 'vencimento_desc') {
      const grupo = compararAbertasAntesDePagas(a, b)
      if (grupo !== 0) return grupo
      const vencimento = compararVencimentoDesc(a, b)
      return vencimento || compararId(a, b)
    }

    if (ordenacao === 'valor_desc') {
      return Number(b.valor || 0) - Number(a.valor || 0)
    }

    if (ordenacao === 'valor_asc') {
      return Number(a.valor || 0) - Number(b.valor || 0)
    }

    if (ordenacao === 'nome_asc') {
      return String(a.descricao || '').localeCompare(String(b.descricao || ''), 'pt-BR', { sensitivity: 'base' })
    }

    if (ordenacao === 'status') {
      const status = obterStatusOrdenacao(a) - obterStatusOrdenacao(b)
      if (status !== 0) return status
      const vencimento = compararVencimentoAsc(a, b)
      return vencimento || compararId(a, b)
    }

    const vencimento = compararVencimentoAsc(a, b)
    return vencimento || compararId(a, b)
  })
}

function calcularResumoResultadoFiltrado(contas) {
  return contas.reduce((resumo, conta) => {
    const valorPrevisto = Number(conta.valor || 0)
    const valorPago = conta.valor_pago == null ? valorPrevisto : Number(conta.valor_pago || 0)

    resumo.previsto += valorPrevisto
    resumo.encargos += Number(conta.juros_multa || 0)
    resumo.descontos += Number(conta.desconto || 0)

    if (conta.status === 'pago') {
      resumo.realizado += valorPago
    }

    return resumo
  }, {
    previsto: 0,
    realizado: 0,
    encargos: 0,
    descontos: 0
  })
}

function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button className="empty-state-action" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  )
}
export default function ContasPage({
  styles, busca, setBusca, mostrarFiltros, setMostrarFiltros, limparFiltros, imprimirPDF, exportarCSV, exportarExcel,
  filtroStatus, setFiltroStatus, centros, filtroCentro, setFiltroCentro, filiais, filtroFilial, setFiltroFilial, filtroMes, setFiltroMes,
  dataInicial, setDataInicial, dataFinal, setDataFinal, limitarDataInput, contas = [], contasFiltradas, agendaFocusTarget, onAgendaFocusHandled, total, formatarValor,
  loading, mostrarContas, setMostrarContas, estaVencida, formatarData, formatarTipoRecorrencia,
  obterTipoRecorrenciaConta, abrirConfirmacao, marcarComoPago, corrigirPagamento, voltarParaPendente, abrirEdicaoConta, excluirConta, ocultarConta, reexibirConta,
  registrarPagamentoParcial,
  navegarPara, podeEditarFinanceiro = true, podeExportarDados = true
}) {
  const [ordenacaoContas, setOrdenacaoContas] = useState('vencimento_asc')
  const [contaEmBaixa, setContaEmBaixa] = useState(null)
  const [contaEmPagamentoParcial, setContaEmPagamentoParcial] = useState(null)
  const [modoPagamento, setModoPagamento] = useState('baixa')
  const [contaDestacadaId, setContaDestacadaId] = useState('')
  const [mostrarExportacoes, setMostrarExportacoes] = useState(false)
  const [gruposPeriodoAbertos, setGruposPeriodoAbertos] = useState({})
  const [limitesPorGrupoPeriodo, setLimitesPorGrupoPeriodo] = useState({})
  const contaDestacadaRef = useRef(null)
  const contaAlvoAgendaId = agendaFocusTarget?.tipo === 'conta' ? agendaFocusTarget.id : ''
  const contaAlvoAgenda = useMemo(() => {
    if (!contaAlvoAgendaId) return null
    return contas.find((conta) => String(conta.id) === String(contaAlvoAgendaId))
      || contasFiltradas.find((conta) => String(conta.id) === String(contaAlvoAgendaId))
      || null
  }, [contaAlvoAgendaId, contas, contasFiltradas])
  const contasParaListagem = useMemo(() => {
    if (!contaAlvoAgenda) return contasFiltradas
    if (contaAlvoAgenda.oculto === true && filtroStatus !== 'ocultas') return contasFiltradas
    const jaEstaFiltrada = contasFiltradas.some((conta) => String(conta.id) === String(contaAlvoAgenda.id))
    return jaEstaFiltrada ? contasFiltradas : [contaAlvoAgenda, ...contasFiltradas]
  }, [contaAlvoAgenda, contasFiltradas, filtroStatus])
  const contasOrdenadas = ordenarContasParaListagem(contasParaListagem, ordenacaoContas, filtroStatus, estaVencida)
  const gruposPorPeriodo = useMemo(
    () => agruparContasPorPeriodo(contasOrdenadas),
    [contasOrdenadas]
  )
  const assinaturaGruposPeriodo = useMemo(
    () => [
      filtroStatus,
      busca,
      filtroFilial,
      filtroCentro,
      filtroMes,
      dataInicial,
      dataFinal,
      gruposPorPeriodo.map((grupo) => grupo.chave).join(',')
    ].join('|'),
    [busca, dataFinal, dataInicial, filtroCentro, filtroFilial, filtroMes, filtroStatus, gruposPorPeriodo]
  )
  const statusAtualLabel = ABAS_STATUS_CONTAS.find((aba) => aba.valor === filtroStatus)?.label || filtroStatus
  const resumoResultadoFiltrado = useMemo(
    () => calcularResumoResultadoFiltrado(contasFiltradas),
    [contasFiltradas]
  )
  const mostrarEncargosResultado = resumoResultadoFiltrado.encargos > 0
  const mostrarDescontosResultado = resumoResultadoFiltrado.descontos > 0

  async function confirmarBaixaConta(payload) {
    if (!contaEmBaixa?.id) return false
    if (modoPagamento === 'corrigir') return corrigirPagamento(contaEmBaixa.id, payload)
    return marcarComoPago(contaEmBaixa.id, payload)
  }

  function abrirBaixaConta(conta) {
    setModoPagamento('baixa')
    setContaEmBaixa(conta)
  }

  function abrirCorrecaoPagamento(conta) {
    setModoPagamento('corrigir')
    setContaEmBaixa(conta)
  }

  function fecharModalPagamento() {
    setContaEmBaixa(null)
    setModoPagamento('baixa')
  }

  async function confirmarPagamentoParcial(payload) {
    if (!contaEmPagamentoParcial?.id) return false
    return registrarPagamentoParcial(contaEmPagamentoParcial.id, payload)
  }

  function grupoPeriodoAberto(grupo) {
    return gruposPeriodoAbertos[grupo.chave] === true
  }

  function alternarGrupoPeriodo(grupo) {
    const abertoAgora = grupoPeriodoAberto(grupo)
    setGruposPeriodoAbertos((atuais) => ({
      ...atuais,
      [grupo.chave]: !abertoAgora
    }))
    if (!abertoAgora && !limitesPorGrupoPeriodo[grupo.chave]) {
      setLimitesPorGrupoPeriodo((atuais) => ({
        ...atuais,
        [grupo.chave]: LIMITE_CONTAS_POR_GRUPO
      }))
    }
  }

  function obterLimiteGrupoPeriodo(grupo) {
    return limitesPorGrupoPeriodo[grupo.chave] || LIMITE_CONTAS_POR_GRUPO
  }

  function mostrarMaisContasDoGrupo(grupo) {
    setLimitesPorGrupoPeriodo((atuais) => ({
      ...atuais,
      [grupo.chave]: Math.min(
        (atuais[grupo.chave] || LIMITE_CONTAS_POR_GRUPO) + LIMITE_CONTAS_POR_GRUPO,
        grupo.contas.length
      )
    }))
  }

  useEffect(() => {
    if (!contaAlvoAgendaId) return undefined

    setMostrarContas(true)
    setContaDestacadaId(String(contaAlvoAgendaId))

    const scrollTimer = window.setTimeout(() => {
      contaDestacadaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)

    const clearTimer = window.setTimeout(() => {
      setContaDestacadaId('')
      onAgendaFocusHandled?.()
    }, 4500)

    return () => {
      window.clearTimeout(scrollTimer)
      window.clearTimeout(clearTimer)
    }
  }, [contaAlvoAgendaId, setMostrarContas, onAgendaFocusHandled])

  useEffect(() => {
    setGruposPeriodoAbertos({})
    setLimitesPorGrupoPeriodo({})
  }, [assinaturaGruposPeriodo])

  function renderContaCard(conta) {
    const destacadaPelaAgenda = String(conta.id) === String(contaDestacadaId)
    const vencida = estaVencida(conta.data_vencimento, conta.status)
    const recorrente = ehContaRecorrente(conta)
    const tipoRecorrencia = recorrente ? formatarTipoRecorrencia(obterTipoRecorrenciaConta(conta)) : ''
    const observacao = String(conta.observacao || '').trim()
    const valorPrevisto = Number(conta.valor || 0)
    const valorPago = Number(conta.valor_pago || 0)
    const jurosMulta = Number(conta.juros_multa || 0)
    const desconto = Number(conta.desconto || 0)
    const exibirBaixaReal = conta.status === 'pago' && conta.valor_pago !== null && conta.valor_pago !== undefined
    const valorPrincipal = exibirBaixaReal ? valorPago : valorPrevisto
    const oculta = conta.oculto === true
    const pagamentosParciaisTotal = Number(conta.pagamentosParciaisTotal || 0)
    const saldoPendenteParcial = Number(conta.saldoPendenteParcial || 0)
    const quantidadePagamentosParciais = Number(conta.quantidadePagamentosParciais || 0)
    const possuiPagamentosParciais = quantidadePagamentosParciais > 0 || pagamentosParciaisTotal > 0
    const pagamentoParcialQuitado = conta.status === 'pago' && saldoPendenteParcial <= 0
    const exibirPagamentoParcial = possuiPagamentosParciais && !pagamentoParcialQuitado
    const saldoDisponivelParcial = possuiPagamentosParciais ? saldoPendenteParcial : valorPrevisto
    const podeRegistrarPagamentoParcial = (
      conta.status !== 'pago'
      && !oculta
      && conta.excluido !== true
      && conta.deletado !== true
      && saldoDisponivelParcial > 0
    )

    return (
      <div
        ref={destacadaPelaAgenda ? contaDestacadaRef : null}
        className={`print-card account-card-desktop ${destacadaPelaAgenda ? 'account-card-agenda-focus' : ''} ${exibirBaixaReal ? 'account-card-payment-real' : ''} ${oculta ? 'account-card-hidden' : ''} ${vencida ? 'account-card-vencida' : conta.status === 'pago' ? 'account-card-paga' : 'account-card-pendente'}`}
        key={conta.id}
        style={{
          ...styles.cardConta,
          background:
            conta.status === 'pago'
              ? '#d4edda'
              : vencida
                ? '#ffb3b3'
                : '#fff3cd'
        }}
      >
        <div style={styles.cardTopo} className="account-card-head">
          <div className="account-title-wrap">
            <strong>{conta.descricao}</strong>
            {recorrente && (
              <span className="account-recurring-badge account-recurring-title-badge" title={`Conta recorrente ${tipoRecorrencia}`}>
                ↻ Recorrente
              </span>
            )}
          </div>
          {!exibirBaixaReal && (
            <span className="account-card-value">{formatarValor(valorPrevisto)}</span>
          )}
        </div>

        {exibirBaixaReal && (
          <div className="account-payment-real-panel">
            <strong className="account-payment-paid-value">{formatarValor(valorPrincipal)}</strong>
            <span className="account-payment-expected-value">Previsto: {formatarValor(valorPrevisto)}</span>
            {jurosMulta > 0 && (
              <span className="account-payment-adjustment account-payment-fee">
                Encargos: {formatarValor(jurosMulta)}
              </span>
            )}
            {desconto > 0 && (
              <span className="account-payment-adjustment account-payment-discount">
                Desconto: {formatarValor(desconto)}
              </span>
            )}
            {jurosMulta <= 0 && desconto <= 0 && (
              <span className="account-payment-adjustment account-payment-neutral">
                Pago sem ajuste
              </span>
            )}
          </div>
        )}

        <div style={styles.cardInfo} className="account-meta-line">
          <div className="account-meta-main">
            <span className="account-date-badge">📅 {formatarData(conta.data_vencimento)}</span>
            <span>{conta.df_filiais?.nome || 'Sem filial'}</span>
            <span>{conta.df_centros_custo?.nome || '-'}</span>
          </div>
          <div className="account-meta-badges">
            {recorrente && (
              <span className="account-recurring-badge">↻ {tipoRecorrencia}</span>
            )}
            <span className={`status-pill ${vencida ? 'status-vencido' : conta.status === 'pago' ? 'status-pago' : 'status-pendente'}`}>
              {vencida ? 'Vencido' : conta.status === 'pago' ? 'Pago' : 'Pendente'}
            </span>
            {oculta && <span className="status-pill status-oculto">Oculta</span>}
          </div>
        </div>

        {exibirPagamentoParcial && (
          <div className="account-partial-payment-panel">
            <span className="status-pill account-partial-payment-badge">Pagamento parcial</span>
            <dl className="account-partial-payment-details">
              <div>
                <dt>Pago</dt>
                <dd>{formatarValor(pagamentosParciaisTotal)}</dd>
              </div>
              <div>
                <dt>Saldo</dt>
                <dd>{formatarValor(saldoPendenteParcial)}</dd>
              </div>
              <div>
                <dt>Pagamentos</dt>
                <dd>{quantidadePagamentosParciais}</dd>
              </div>
              {conta.ultimoPagamentoParcialEm && (
                <div>
                  <dt>Último</dt>
                  <dd>{formatarData(conta.ultimoPagamentoParcialEm)}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {observacao && (
          <div className="account-observation-preview" title={observacao}>
            <span className="account-observation-text">
              <span aria-hidden="true">📝</span> {observacao}
            </span>
          </div>
        )}

        {podeEditarFinanceiro && (
          <div className={`account-actions ${conta.status === 'pago' ? 'account-actions-paid' : ''} ${podeRegistrarPagamentoParcial ? 'account-actions-with-partial' : ''}`} style={{ ...styles.acoes, ...ACCOUNT_ACTIONS_STYLE }}>
          {conta.status !== 'pago' ? (
            <button className="account-action-button account-action-primary" style={{ ...styles.btnPago, ...ACCOUNT_PRIMARY_ACTION_STYLE }} onClick={() => abrirBaixaConta(conta)}>
              Baixar
            </button>
          ) : (
            <>
              <button className="account-action-button account-action-secondary" style={{ ...styles.btnVoltar, ...ACCOUNT_SECONDARY_ACTION_STYLE }} onClick={() => abrirConfirmacao({ titulo: 'Estornar baixa desta conta?', mensagem: `A conta ${conta.descricao} deixará de constar como paga e os dados do pagamento serão removidos. A conta não será excluída e continuará com descrição, vencimento, valor, filial, centro e recorrência intactos.`, textoConfirmar: 'Estornar baixa', tipo: 'aviso', acao: () => voltarParaPendente(conta.id) })}>
                Estornar
              </button>
              <button className="account-action-button account-action-secondary" style={{ ...styles.btnEditar, ...ACCOUNT_SECONDARY_ACTION_STYLE }} onClick={() => abrirCorrecaoPagamento(conta)}>
                Corrigir
              </button>
            </>
          )}

          {podeRegistrarPagamentoParcial && (
            <button
              className="account-action-button account-action-partial"
              style={ACCOUNT_SECONDARY_ACTION_STYLE}
              onClick={() => setContaEmPagamentoParcial(conta)}
              title="Registrar pagamento parcial"
            >
              Parcial
            </button>
          )}

          <button className="account-action-button account-action-secondary" style={{ ...styles.btnEditar, ...ACCOUNT_SECONDARY_ACTION_STYLE }} onClick={() => abrirEdicaoConta(conta)}>
            Editar
          </button>

          {oculta ? (
            <button className="account-action-button account-action-restore" style={ACCOUNT_HIDE_ACTION_STYLE} onClick={() => abrirConfirmacao({ titulo: 'Reexibir conta', mensagem: `Deseja reexibir a conta ${conta.descricao} na visão principal?`, textoConfirmar: 'Reexibir', tipo: 'aviso', acao: () => reexibirConta(conta.id) })}>
              Reexibir
            </button>
          ) : (
            <button className="account-action-button account-action-hide" style={ACCOUNT_HIDE_ACTION_STYLE} onClick={() => abrirConfirmacao({ titulo: 'Ocultar conta', mensagem: `Ocultar esta conta da visão principal? A conta ${conta.descricao} não será excluída e poderá ser reexibida depois.`, textoConfirmar: 'Ocultar', tipo: 'aviso', acao: () => ocultarConta(conta.id) })}>
              Ocultar
            </button>
          )}

          <button className="account-action-button account-action-danger" style={{ ...styles.btnExcluir, ...ACCOUNT_DANGER_ACTION_STYLE }} onClick={() => abrirConfirmacao({ titulo: 'Mover para lixeira', mensagem: `Deseja mover a conta ${conta.descricao} para a lixeira? Ela ficará em quarentena por 60 dias.`, textoConfirmar: 'Mover', tipo: 'perigo', acao: () => excluirConta(conta.id) })}>
            Excluir
          </button>
          </div>
        )}
      </div>
    )
  }

  function renderListaContasConteudo() {
    return (
      <>
      <section className="no-print filters-desktop accounts-control-panel" style={styles.filtrosBox}>
        <div className="accounts-search-row">
          <input
            className="accounts-search-input"
            style={styles.input}
            placeholder="Buscar por conta, valor, data, centro, observação ou status..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="accounts-filter-actions">
          <button className="filter-toggle-button" onClick={() => setMostrarFiltros(!mostrarFiltros)}>
            {mostrarFiltros ? 'Ocultar filtros' : 'Filtros'}
          </button>

          <button className="accounts-clear-button" style={styles.btnCinza} onClick={limparFiltros}>Limpar</button>

          {podeExportarDados && (
            <div className="export-actions accounts-export-actions" style={styles.acoes}>
              <button
                className="accounts-export-toggle"
                type="button"
                onClick={() => setMostrarExportacoes((atual) => !atual)}
                aria-expanded={mostrarExportacoes}
              >
                Exportar
              </button>
              {mostrarExportacoes && (
                <div className="accounts-export-menu">
                  <button type="button" onClick={imprimirPDF}>PDF</button>
                  <button type="button" onClick={exportarExcel}>Excel</button>
                  <button type="button" onClick={exportarCSV}>CSV</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="accounts-status-tabs" role="tablist" aria-label="Filtro principal de status das contas">
          {ABAS_STATUS_CONTAS.map((aba) => (
            <button
              key={aba.valor}
              type="button"
              role="tab"
              aria-selected={filtroStatus === aba.valor}
              className={`accounts-status-tab ${filtroStatus === aba.valor ? 'is-active' : ''}`}
              onClick={() => setFiltroStatus(aba.valor)}
            >
              {aba.label}
            </button>
          ))}
        </div>

        <label className="accounts-sort-control accounts-sort-control-main">
          <span>Ordenar por</span>
          <select style={styles.input} value={ordenacaoContas} onChange={(e) => setOrdenacaoContas(e.target.value)}>
            {OPCOES_ORDENACAO_CONTAS.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>{opcao.label}</option>
            ))}
          </select>
        </label>

        {mostrarFiltros && (
          <div className="advanced-filters">
            <select style={styles.input} value={filtroFilial} onChange={(e) => setFiltroFilial(e.target.value)}>
              <option value="">Todas as filiais</option>
              {(filiais || []).map((filial) => (<option key={filial.id} value={filial.id}>{filial.nome}</option>))}
            </select>

            <select style={styles.input} value={filtroCentro} onChange={(e) => setFiltroCentro(e.target.value)}>
              <option value="">Todos os centros</option>
              {centros.map((centro) => (<option key={centro.id} value={centro.id}>{centro.nome}</option>))}
            </select>

            <input style={styles.input} type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} />

            <input style={styles.input} type="date" value={dataInicial} onChange={(e) => setDataInicial(limitarDataInput(e.target.value))} />
            <input style={styles.input} type="date" value={dataFinal} onChange={(e) => setDataFinal(limitarDataInput(e.target.value))} />
          </div>
        )}
      </section>

      <section className="result-summary accounts-result-summary" style={styles.resumoFiltro}>
        <div className="accounts-result-heading">
          <strong>Resultado filtrado</strong>
          <small>{contasFiltradas.length} conta(s)</small>
        </div>
        <div className="accounts-result-metrics">
          <span><b>Previsto</b>{formatarValor(resumoResultadoFiltrado.previsto)}</span>
          <span><b>Realizado</b>{formatarValor(resumoResultadoFiltrado.realizado)}</span>
          {mostrarEncargosResultado && <span><b>Encargos</b>{formatarValor(resumoResultadoFiltrado.encargos)}</span>}
          {mostrarDescontosResultado && <span><b>Descontos</b>{formatarValor(resumoResultadoFiltrado.descontos)}</span>}
        </div>
        <small className="accounts-result-context">
          Filial: {filtroFilial ? (filiais || []).find((filial) => filial.id === filtroFilial)?.nome || 'Selecionada' : 'Todas'} •
          Centro: {filtroCentro ? centros.find((centro) => centro.id === filtroCentro)?.nome || 'Selecionado' : 'Todos'} •
          Status: {statusAtualLabel} •
          Mês: {filtroMes || 'Todos'}
        </small>
      </section>

      <section className="content-block accounts-list-section" style={styles.bloco}>
        {loading && <AccountListSkeleton items={3} />}

        <div className="accounts-list-header">
          <div className="accounts-list-title">
            <span className="accounts-kicker">Lista financeira</span>
            <strong>Contas</strong>
            <small>{contasOrdenadas.length} conta(s) na visualização atual</small>
          </div>
          <button
            type="button"
            className="accounts-collapse-button"
            onClick={() => setMostrarContas(!mostrarContas)}
            aria-expanded={mostrarContas}
            aria-label={mostrarContas ? 'Recolher seção de contas' : 'Expandir seção de contas'}
            title={mostrarContas ? 'Recolher' : 'Expandir'}
          >
            {mostrarContas ? '\u2212' : '+'}
          </button>
        </div>
        {!loading && mostrarContas && contasOrdenadas.length === 0 && (
          <EmptyState
            icon="💳"
            title={filtroStatus === 'ocultas' ? 'Nenhuma conta oculta' : 'Nenhuma conta encontrada'}
            description={filtroStatus === 'ocultas'
              ? 'As contas ocultas aparecerão aqui quando forem retiradas da visão principal.'
              : 'Ajuste os filtros ou cadastre uma nova conta para acompanhar os vencimentos da empresa.'}
          />
        )}

        {!loading && mostrarContas && gruposPorPeriodo.map((grupo) => {
          const aberto = grupoPeriodoAberto(grupo)
          const textoAlternar = aberto ? 'Recolher grupo' : 'Expandir grupo'
          const limiteVisivel = obterLimiteGrupoPeriodo(grupo)
          const contasVisiveis = grupo.contas.slice(0, limiteVisivel)
          const contasRestantes = Math.max(grupo.contas.length - contasVisiveis.length, 0)
          const proximoLote = Math.min(contasRestantes, LIMITE_CONTAS_POR_GRUPO)

          return (
            <section className="accounts-period-group" key={grupo.chave}>
              <div className="accounts-period-header">
                <div className="accounts-period-copy">
                  <strong>{grupo.rotulo}</strong>
                  <span>{grupo.contas.length} conta(s) - {formatarValor(grupo.totalPrevisto)}</span>
                </div>
                <button
                  type="button"
                  className="accounts-period-toggle"
                  onClick={() => alternarGrupoPeriodo(grupo)}
                  aria-expanded={aberto}
                  aria-label={`${textoAlternar}: ${grupo.rotulo}`}
                  title={textoAlternar}
                >
                  {aberto ? '\u2212' : '+'}
                </button>
              </div>
              {aberto && (
                <div className="accounts-period-list">
                  {contasVisiveis.map((conta) => renderContaCard(conta))}
                  {contasRestantes > 0 && (
                    <button
                      type="button"
                      className="accounts-period-more"
                      onClick={() => mostrarMaisContasDoGrupo(grupo)}
                    >
                      Ver mais {proximoLote} conta(s)
                    </button>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </section>

      </>
    )
  }

  return (
    <>
      <div className="page-title-actions accounts-page-header">
        <div className="accounts-page-header-copy">
          <span>Financeiro</span>
          <h1 style={styles.titulo}>Contas</h1>
          <p style={styles.textoNota}>Controle vencimentos, baixas e contas por filial, centro de custo e período.</p>
        </div>
        <div className="page-actions-row">
          <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>Voltar ao Painel</button>
        </div>
      </div>
      {renderListaContasConteudo()}
      {contaEmBaixa && (
        <AccountPaymentModal
          styles={styles}
          conta={contaEmBaixa}
          formatarValor={formatarValor}
          formatarData={formatarData}
          limitarDataInput={limitarDataInput}
          modo={modoPagamento}
          onClose={fecharModalPagamento}
          onConfirm={confirmarBaixaConta}
        />
      )}
      {contaEmPagamentoParcial && (
        <AccountPartialPaymentModal
          styles={styles}
          conta={contaEmPagamentoParcial}
          formatarValor={formatarValor}
          limitarDataInput={limitarDataInput}
          onClose={() => setContaEmPagamentoParcial(null)}
          onConfirm={confirmarPagamentoParcial}
        />
      )}
    </>
  )
}
