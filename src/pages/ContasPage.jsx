import { AccountListSkeleton } from '../components/feedback/Skeletons.jsx'
import { ehContaRecorrente } from '../utils/recorrencia'
import { useState } from 'react'

const OPCOES_ORDENACAO_CONTAS = [
  { valor: 'vencimento_asc', label: 'Vencimento mais próximo' },
  { valor: 'vencimento_desc', label: 'Vencimento mais distante' },
  { valor: 'valor_desc', label: 'Maior valor' },
  { valor: 'valor_asc', label: 'Menor valor' },
  { valor: 'nome_asc', label: 'Nome A-Z' },
  { valor: 'status', label: 'Status' }
]

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
  padding: '8px 12px',
  background: '#f8fafc',
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 900,
  lineHeight: 1,
  whiteSpace: 'nowrap',
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
  const contasOrdenadas = ordenarContasParaListagem(contasFiltradas, ordenacaoContas, filtroStatus, estaVencida)

  function renderListaContasConteudo() {
    return (
      <>
      <section className="no-print filters-desktop" style={styles.filtrosBox}>
        <input
          style={styles.input}
          placeholder="Buscar por conta, data, centro, observação ou status..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <button className="filter-toggle-button" onClick={() => setMostrarFiltros(!mostrarFiltros)}>
          {mostrarFiltros ? 'Ocultar filtros' : 'Filtros'}
        </button>

        <div className="export-actions" style={styles.acoes}>
          <button style={styles.btnCinza} onClick={limparFiltros}>Limpar</button>
          {podeExportarDados && (
            <>
              <button style={styles.btnRoxo} onClick={imprimirPDF}>PDF</button>
              <button style={styles.btnVerde} onClick={exportarCSV}>CSV</button>
            </>
          )}
        </div>

        <label className="accounts-sort-control">
          <span>Ordenar por</span>
          <select style={styles.input} value={ordenacaoContas} onChange={(e) => setOrdenacaoContas(e.target.value)}>
            {OPCOES_ORDENACAO_CONTAS.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>{opcao.label}</option>
            ))}
          </select>
        </label>

        {mostrarFiltros && (
          <div className="advanced-filters">
            <div className="status-tabs filter-tabs-fixed" style={styles.filtros}>
              <button style={filtroStatus === 'todas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('todas')}>Todas</button>
              <button style={filtroStatus === 'pendentes' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('pendentes')}>Pendentes</button>
              <button style={filtroStatus === 'pagas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('pagas')}>Pagas</button>
              <button style={filtroStatus === 'vencidas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('vencidas')}>Vencidas</button>
            </div>

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
        <span>{contasFiltradas.length} conta(s) • Total {formatarValor(total)}</span>
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
          >
            {mostrarContas ? 'Recolher' : 'Expandir'}
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

          return (
            <div
              className={`print-card account-card-desktop ${vencida ? 'account-card-vencida' : conta.status === 'pago' ? 'account-card-paga' : 'account-card-pendente'}`}
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
                <span>{formatarValor(conta.valor)}</span>
              </div>

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
                <div className="account-actions" style={styles.acoes}>
                {conta.status !== 'pago' ? (
                  <button style={styles.btnPago} onClick={() => abrirConfirmacao({ titulo: 'Confirmar pagamento', mensagem: `Deseja marcar a conta ${conta.descricao} como paga?`, textoConfirmar: 'Marcar como pago', tipo: 'sucesso', acao: () => marcarComoPago(conta.id) })}>
                    Pago
                  </button>
                ) : (
                  <button style={styles.btnVoltar} onClick={() => abrirConfirmacao({ titulo: 'Voltar para pendente', mensagem: `Deseja voltar a conta ${conta.descricao} para pendente?`, textoConfirmar: 'Voltar', tipo: 'aviso', acao: () => voltarParaPendente(conta.id) })}>
                    Voltar
                  </button>
                )}

                <button style={styles.btnEditar} onClick={() => abrirEdicaoConta(conta)}>
                  Editar
                </button>

                <button style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Mover para lixeira', mensagem: `Deseja mover a conta ${conta.descricao} para a lixeira? Ela ficará em quarentena por 60 dias.`, textoConfirmar: 'Mover', tipo: 'perigo', acao: () => excluirConta(conta.id) })}>
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
      <div className="page-title-actions">
        <div>
          <h1 style={styles.titulo}>💳 Contas</h1>
          <p style={styles.textoNota}>Consulte, filtre, exporte e administre as contas da empresa em uma página dedicada.</p>
        </div>
        <div className="page-actions-row">
          <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>← Painel</button>
        </div>
      </div>
      {renderListaContasConteudo()}
    </>
  )
}
