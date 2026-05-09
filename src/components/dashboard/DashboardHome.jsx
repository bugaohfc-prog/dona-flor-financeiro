import OpenAccountsList from './OpenAccountsList.jsx'
import NotesPanel from './NotesPanel.jsx'
import { SummarySkeleton, AccountListSkeleton, NotesSkeleton } from '../feedback/Skeletons.jsx'

export default function DashboardHome({
  styles,
  formatarValor,
  total,
  pago,
  pendente,
  vencido,
  contas,
  diferencaDias,
  navegarPara,
  contasAbertasDashboard,
  mostrarContasDashboard,
  setMostrarContasDashboard,
  busca,
  setBusca,
  estaVencida,
  formatarData,
  abrirConfirmacao,
  marcarComoPago,
  notasPendentes,
  notasCriticas,
  notasUrgentes,
  mostrarNotas,
  setMostrarNotas,
  alternarNotaConcluida,
  abrirEdicaoNota,
  excluirNota,
  loading = false
}) {
  return (
    <>
      <section className="dashboard-title-row">
        <div className="dashboard-heading-actions">
          <h1 className="main-title" style={styles.titulo}>📊 Dashboard Financeiro</h1>
        </div>

        {loading ? (
          <SummarySkeleton items={4} />
        ) : (
          <div className="summary-grid" style={styles.resumo}>
            <div style={styles.boxTotal}>
              <span>Total</span>
              <strong>{formatarValor(total)}</strong>
            </div>

            <div style={styles.boxPago}>
              <span>Pago</span>
              <strong>{formatarValor(pago)}</strong>
            </div>

            <div style={styles.boxPendente}>
              <span>Pendente</span>
              <strong>{formatarValor(pendente)}</strong>
            </div>

            <div style={styles.boxVencido}>
              <span>Vencido</span>
              <strong>{formatarValor(vencido)}</strong>
            </div>
          </div>
        )}
      </section>

      <section className="no-print agenda-card-polished" style={styles.agendaResumoCard}>
        <div>
          <strong>📅 Próximos vencimentos</strong>
          <small>Resumo compacto da agenda financeira</small>
        </div>
        <div className="agenda-compact-items" style={styles.agendaResumoGrid}>
          <div className="agenda-pill"><small>Hoje</small><strong>{formatarValor(contas.filter((conta) => conta.status !== 'pago' && diferencaDias(conta.data_vencimento) === 0).reduce((acc, conta) => acc + Number(conta.valor || 0), 0))}</strong></div>
          <div className="agenda-pill"><small>7 dias</small><strong>{formatarValor(contas.filter((conta) => { const dias = diferencaDias(conta.data_vencimento); return conta.status !== 'pago' && dias > 0 && dias <= 7 }).reduce((acc, conta) => acc + Number(conta.valor || 0), 0))}</strong></div>
        </div>
        <button style={styles.btnAgendaCompleta} onClick={() => navegarPara('agenda')}>Abrir agenda</button>
      </section>

      {loading ? (
        <section className="content-block" style={styles.bloco}>
          <div className="dashboard-section-header-accounts">
            <div>
              <h2 style={styles.subtitulo}>💰 Contas em aberto</h2>
              <p style={styles.textoNota}>Carregando contas e vencimentos...</p>
            </div>
          </div>
          <AccountListSkeleton items={2} />
        </section>
      ) : (
      <OpenAccountsList
        styles={styles}
        formatarValor={formatarValor}
        navegarPara={navegarPara}
        contasAbertasDashboard={contasAbertasDashboard}
        mostrarContasDashboard={mostrarContasDashboard}
        setMostrarContasDashboard={setMostrarContasDashboard}
        busca={busca}
        setBusca={setBusca}
        estaVencida={estaVencida}
        formatarData={formatarData}
        abrirConfirmacao={abrirConfirmacao}
        marcarComoPago={marcarComoPago}
      />
      )}

      {loading ? (
        <section className="content-block" style={styles.bloco}>
          <div className="notes-header-clean">
            <div>
              <h2 style={styles.subtitulo}>📝 Notas</h2>
              <p style={styles.textoNota}>Carregando lembretes...</p>
            </div>
          </div>
          <NotesSkeleton items={2} />
        </section>
      ) : (
      <NotesPanel
        styles={styles}
        navegarPara={navegarPara}
        notasPendentes={notasPendentes}
        notasCriticas={notasCriticas}
        notasUrgentes={notasUrgentes}
        mostrarNotas={mostrarNotas}
        setMostrarNotas={setMostrarNotas}
        formatarData={formatarData}
        alternarNotaConcluida={alternarNotaConcluida}
        abrirEdicaoNota={abrirEdicaoNota}
        abrirConfirmacao={abrirConfirmacao}
        excluirNota={excluirNota}
      />
      )}
    </>
  )
}
