import { AccountListSkeleton } from '../components/feedback/Skeletons.jsx'
import { ehContaRecorrente } from '../utils/recorrencia'
import { useEffect, useMemo, useRef, useState } from 'react'
import AccountPaymentModal from '../components/modals/AccountPaymentModal.jsx'

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
  { valor: 'todas', label: 'Todas' }
]

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
  obterTipoRecorrenciaConta, abrirConfirmacao, marcarComoPago, voltarParaPendente, abrirEdicaoConta, excluirConta,
  navegarPara, podeEditarFinanceiro = true, podeExportarDados = true
}) {
  const [ordenacaoContas, setOrdenacaoContas] = useState('vencimento_asc')
  const [contaEmBaixa, setContaEmBaixa] = useState(null)
  const [contaDestacadaId, setContaDestacadaId] = useState('')
  const [mostrarExportacoes, setMostrarExportacoes] = useState(false)
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
    const jaEstaFiltrada = contasFiltradas.some((conta) => String(conta.id) === String(contaAlvoAgenda.id))
    return jaEstaFiltrada ? contasFiltradas : [contaAlvoAgenda, ...contasFiltradas]
  }, [contaAlvoAgenda, contasFiltradas])
  const contasOrdenadas = ordenarContasParaListagem(contasParaListagem, ordenacaoContas, filtroStatus, estaVencida)
  const resumoResultadoFiltrado = useMemo(
    () => calcularResumoResultadoFiltrado(contasFiltradas),
    [contasFiltradas]
  )
  const mostrarEncargosResultado = resumoResultadoFiltrado.encargos > 0
  const mostrarDescontosResultado = resumoResultadoFiltrado.descontos > 0

  async function confirmarBaixaConta(payload) {
    if (!contaEmBaixa?.id) return false
    return marcarComoPago(contaEmBaixa.id, payload)
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

  function renderListaContasConteudo() {
    return (
      <>
      <section className="no-print filters-desktop accounts-control-panel" style={styles.filtrosBox}>
        <input
          className="accounts-search-input"
          style={styles.input}
          placeholder="Buscar por conta, valor, data, centro, observação ou status..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

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
        <strong>Resultado filtrado</strong>
        <span>
          Contas: {contasFiltradas.length} • Previsto: {formatarValor(resumoResultadoFiltrado.previsto)} • Realizado: {formatarValor(resumoResultadoFiltrado.realizado)}
          {mostrarEncargosResultado && <> • Encargos: {formatarValor(resumoResultadoFiltrado.encargos)}</>}
          {mostrarDescontosResultado && <> • Descontos: {formatarValor(resumoResultadoFiltrado.descontos)}</>}
        </span>
        <small>
          Filial: {filtroFilial ? (filiais || []).find((filial) => filial.id === filtroFilial)?.nome || 'Selecionada' : 'Todas'} •
          Centro: {filtroCentro ? centros.find((centro) => centro.id === filtroCentro)?.nome || 'Selecionado' : 'Todos'} •
          Status: {filtroStatus} •
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
            title="Nenhuma conta encontrada"
            description="Ajuste os filtros ou cadastre uma nova conta para acompanhar os vencimentos da empresa."
          />
        )}

        {!loading && mostrarContas && contasOrdenadas.map((conta) => {
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

          return (
            <div
              ref={destacadaPelaAgenda ? contaDestacadaRef : null}
              className={`print-card account-card-desktop ${destacadaPelaAgenda ? 'account-card-agenda-focus' : ''} ${exibirBaixaReal ? 'account-card-payment-real' : ''} ${vencida ? 'account-card-vencida' : conta.status === 'pago' ? 'account-card-paga' : 'account-card-pendente'}`}
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
                  <span>{formatarValor(valorPrevisto)}</span>
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
                <span className="account-date-badge">📅 {formatarData(conta.data_vencimento)}</span>
                <span>{conta.df_filiais?.nome || 'Sem filial'}</span>
                <span>{conta.df_centros_custo?.nome || '-'}</span>
                {recorrente && (
                  <span className="account-recurring-badge">↻ {tipoRecorrencia}</span>
                )}
                <span className={`status-pill ${vencida ? 'status-vencido' : conta.status === 'pago' ? 'status-pago' : 'status-pendente'}`}>
                  {vencida ? 'Vencido' : conta.status === 'pago' ? 'Pago' : 'Pendente'}
                </span>
              </div>

              {observacao && (
                <div className="account-observation-preview" title={observacao}>
                  <span className="account-observation-text">
                    <span aria-hidden="true">📝</span> {observacao}
                  </span>
                </div>
              )}

              {podeEditarFinanceiro && (
                <div className="account-actions" style={{ ...styles.acoes, ...ACCOUNT_ACTIONS_STYLE }}>
                {conta.status !== 'pago' ? (
                  <button className="account-action-button account-action-primary" style={{ ...styles.btnPago, ...ACCOUNT_PRIMARY_ACTION_STYLE }} onClick={() => setContaEmBaixa(conta)}>
                    Baixar
                  </button>
                ) : (
                  <button className="account-action-button account-action-secondary" style={{ ...styles.btnVoltar, ...ACCOUNT_SECONDARY_ACTION_STYLE }} onClick={() => abrirConfirmacao({ titulo: 'Voltar para pendente', mensagem: `Deseja voltar a conta ${conta.descricao} para pendente?`, textoConfirmar: 'Voltar', tipo: 'aviso', acao: () => voltarParaPendente(conta.id) })}>
                    Voltar
                  </button>
                )}

                <button className="account-action-button account-action-secondary" style={{ ...styles.btnEditar, ...ACCOUNT_SECONDARY_ACTION_STYLE }} onClick={() => abrirEdicaoConta(conta)}>
                  Editar
                </button>

                <button className="account-action-button account-action-danger" style={{ ...styles.btnExcluir, ...ACCOUNT_DANGER_ACTION_STYLE }} onClick={() => abrirConfirmacao({ titulo: 'Mover para lixeira', mensagem: `Deseja mover a conta ${conta.descricao} para a lixeira? Ela ficará em quarentena por 60 dias.`, textoConfirmar: 'Mover', tipo: 'perigo', acao: () => excluirConta(conta.id) })}>
                  Excluir
                </button>
                </div>
              )}
            </div>
          )
        })}
      </section>

      </>
    )
  }

  return (
    <>
      <div className="page-title-actions accounts-page-header">
        <div>
          <h1 style={styles.titulo}>💳 Contas</h1>
          <p style={styles.textoNota}>Consulte, filtre, exporte e administre as contas da empresa em uma página dedicada.</p>
        </div>
        <div className="page-actions-row">
          <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>← Painel</button>
        </div>
      </div>
      {renderListaContasConteudo()}
      {contaEmBaixa && (
        <AccountPaymentModal
          styles={styles}
          conta={contaEmBaixa}
          formatarValor={formatarValor}
          limitarDataInput={limitarDataInput}
          onClose={() => setContaEmBaixa(null)}
          onConfirm={confirmarBaixaConta}
        />
      )}
    </>
  )
}
