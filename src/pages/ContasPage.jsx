import { AccountListSkeleton } from '../components/feedback/Skeletons.jsx'
import { ehContaRecorrente } from '../utils/recorrencia'
import { useMemo, useState } from 'react'
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
  minHeight: 32,
  minWidth: 68,
  padding: '6px 10px',
  borderRadius: 999,
  fontSize: 12
}

const ACCOUNT_SECONDARY_ACTION_STYLE = {
  minHeight: 30,
  minWidth: 0,
  padding: '5px 9px',
  borderRadius: 999,
  fontSize: 12,
  background: '#ffffff',
  color: '#475569',
  border: '1px solid #cbd5e1'
}

const ACCOUNT_DANGER_ACTION_STYLE = {
  ...ACCOUNT_SECONDARY_ACTION_STYLE,
  color: '#991b1b',
  border: '1px solid #fecaca',
  background: '#fffafa'
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

const CONTAS_EXPANDABLE_HEADER_STYLE = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#fff',
  border: '1px solid #e5e5e5',
  borderRadius: 14,
  padding: '12px 14px',
  margin: '12px 0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  textAlign: 'left',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
}

const CONTAS_EXPANDABLE_TITLE_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flex: '1 1 auto',
  minWidth: 0,
  color: '#0f172a',
  fontSize: 20,
  fontWeight: 900,
  lineHeight: 1.1
}

const CONTAS_EXPANDABLE_BUTTON_STYLE = {
  flex: '0 0 auto',
  marginLeft: 'auto',
  border: '1px solid rgba(15, 23, 42, 0.12)',
  borderRadius: 999,
  width: 32,
  height: 32,
  padding: 0,
  background: '#f8fafc',
  color: '#0f172a',
  fontSize: 16,
  fontWeight: 900,
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
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
  styles, busca, setBusca, mostrarFiltros, setMostrarFiltros, limparFiltros, imprimirPDF, exportarCSV,
  filtroStatus, setFiltroStatus, centros, filtroCentro, setFiltroCentro, filiais, filtroFilial, setFiltroFilial, filtroMes, setFiltroMes,
  dataInicial, setDataInicial, dataFinal, setDataFinal, limitarDataInput, contasFiltradas, total, formatarValor,
  loading, mostrarContas, setMostrarContas, estaVencida, formatarData, formatarTipoRecorrencia,
  obterTipoRecorrenciaConta, abrirConfirmacao, marcarComoPago, voltarParaPendente, abrirEdicaoConta, excluirConta,
  navegarPara, podeEditarFinanceiro = true, podeExportarDados = true
}) {
  const [ordenacaoContas, setOrdenacaoContas] = useState('vencimento_asc')
  const [contaEmBaixa, setContaEmBaixa] = useState(null)
  const contasOrdenadas = ordenarContasParaListagem(contasFiltradas, ordenacaoContas, filtroStatus, estaVencida)
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

  function renderListaContasConteudo() {
    return (
      <>
      <section className="no-print filters-desktop" style={styles.filtrosBox}>
        <input
          className="accounts-search-input"
          style={styles.input}
          placeholder="Buscar por conta, data, centro, observação ou status..."
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
              <button style={styles.btnRoxo} onClick={imprimirPDF}>PDF</button>
              <button style={styles.btnVerde} onClick={exportarCSV}>CSV</button>
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

      <section className="result-summary" style={styles.resumoFiltro}>
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

      <section className="content-block" style={styles.bloco}>
        {loading && <AccountListSkeleton items={3} />}

        <div style={CONTAS_EXPANDABLE_HEADER_STYLE}>
          <span style={CONTAS_EXPANDABLE_TITLE_STYLE}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>💰</span>
            <span>Contas</span>
          </span>
          <button
            type="button"
            style={CONTAS_EXPANDABLE_BUTTON_STYLE}
            onClick={() => setMostrarContas(!mostrarContas)}
            aria-expanded={mostrarContas}
            aria-label={mostrarContas ? 'Recolher seção de contas' : 'Expandir seção de contas'}
            title={mostrarContas ? 'Recolher' : 'Expandir'}
          >
            {mostrarContas ? '⌃' : '⌄'}
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
              className={`print-card account-card-desktop ${exibirBaixaReal ? 'account-card-payment-real' : ''} ${vencida ? 'account-card-vencida' : conta.status === 'pago' ? 'account-card-paga' : 'account-card-pendente'}`}
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
              <div style={styles.cardTopo}>
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
                  <button style={{ ...styles.btnPago, ...ACCOUNT_PRIMARY_ACTION_STYLE }} onClick={() => setContaEmBaixa(conta)}>
                    Baixar
                  </button>
                ) : (
                  <button style={{ ...styles.btnVoltar, ...ACCOUNT_SECONDARY_ACTION_STYLE }} onClick={() => abrirConfirmacao({ titulo: 'Voltar para pendente', mensagem: `Deseja voltar a conta ${conta.descricao} para pendente?`, textoConfirmar: 'Voltar', tipo: 'aviso', acao: () => voltarParaPendente(conta.id) })}>
                    Voltar
                  </button>
                )}

                <button style={{ ...styles.btnEditar, ...ACCOUNT_SECONDARY_ACTION_STYLE }} onClick={() => abrirEdicaoConta(conta)}>
                  Editar
                </button>

                <button style={{ ...styles.btnExcluir, ...ACCOUNT_DANGER_ACTION_STYLE }} onClick={() => abrirConfirmacao({ titulo: 'Mover para lixeira', mensagem: `Deseja mover a conta ${conta.descricao} para a lixeira? Ela ficará em quarentena por 60 dias.`, textoConfirmar: 'Mover', tipo: 'perigo', acao: () => excluirConta(conta.id) })}>
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
      <style>{`
        .filters-desktop {
          grid-template-columns: minmax(220px, 1fr) auto !important;
          align-items: start !important;
        }
        .filters-desktop .accounts-search-input {
          width: 100% !important;
          min-width: 0;
          order: 1;
        }
        .accounts-filter-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
          order: 2;
        }
        .filters-desktop .accounts-clear-button {
          width: auto !important;
          min-width: 0 !important;
          max-width: max-content !important;
          height: 42px !important;
          min-height: 36px !important;
          padding: 0 12px !important;
          border-radius: 999px !important;
          white-space: nowrap;
        }
        .accounts-export-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
          width: auto !important;
          margin: 0 !important;
        }
        .accounts-status-tabs {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
          width: 100%;
          order: 3;
        }
        .accounts-status-tab {
          min-height: 38px;
          border: 1px solid #dbe4ef;
          border-radius: 999px;
          background: #ffffff;
          color: #475569;
          font-weight: 800;
          cursor: pointer;
          padding: 7px 10px;
        }
        .accounts-status-tab.is-active {
          border-color: #0f766e;
          background: #0f766e;
          color: #ffffff;
          box-shadow: 0 6px 16px rgba(15, 118, 110, 0.18);
        }
        .accounts-sort-control-main {
          grid-column: 1 / -1;
          max-width: 320px;
          order: 4;
        }
        .filters-desktop .advanced-filters {
          grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          order: 5;
        }
        .accounts-page-header .page-actions-row button {
          width: auto !important;
          min-width: 0 !important;
          max-width: max-content !important;
          padding: 8px 12px !important;
          border-radius: 999px !important;
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .filters-desktop {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
            padding: 10px !important;
          }
          .filters-desktop .accounts-search-input {
            order: 1;
            height: 40px !important;
          }
          .accounts-status-tabs {
            order: 2;
            gap: 5px;
          }
          .accounts-filter-actions {
            order: 3;
            width: 100%;
            justify-content: flex-start;
            gap: 6px;
          }
          .accounts-filter-actions .filter-toggle-button {
            flex: 0 0 auto;
            height: 36px !important;
            min-height: 34px !important;
            padding: 0 12px !important;
          }
          .filters-desktop .accounts-clear-button {
            flex: 0 0 auto;
            height: 36px !important;
            min-height: 34px !important;
            padding: 0 11px !important;
          }
          .accounts-export-actions {
            order: 4;
            flex: 1 1 100%;
            justify-content: flex-start;
            gap: 5px;
          }
          .accounts-export-actions button {
            min-height: 32px !important;
            padding: 6px 10px !important;
            font-size: 12px !important;
            box-shadow: none !important;
          }
          .accounts-status-tabs {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .accounts-status-tab {
            min-height: 34px;
            padding: 6px 8px;
            font-size: 13px;
          }
          .accounts-sort-control-main {
            order: 5;
            max-width: none;
            width: 100%;
          }
          .accounts-sort-control-main select {
            height: 38px !important;
          }
          .filters-desktop .advanced-filters {
            order: 6;
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .accounts-page-header {
            align-items: flex-start !important;
            gap: 8px !important;
            margin-bottom: 10px !important;
          }
          .accounts-page-header h1 {
            margin-bottom: 2px !important;
          }
          .accounts-page-header p {
            display: none;
          }
          .accounts-page-header .page-actions-row {
            width: auto !important;
            align-self: flex-start;
          }
          .accounts-page-header .page-actions-row button {
            min-height: 32px !important;
            padding: 6px 10px !important;
            font-size: 12px !important;
          }
          .result-summary {
            margin-top: 8px !important;
            padding: 10px !important;
          }
          .account-actions {
            gap: 5px !important;
          }
        }
      `}</style>
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
