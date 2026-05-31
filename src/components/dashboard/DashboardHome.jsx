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
  podeEditarFinanceiro = true,
  notasPendentes,
  notasCriticas,
  notasUrgentes,
  mostrarNotas,
  setMostrarNotas,
  alternarNotaConcluida,
  abrirEdicaoNota,
  excluirNota,
  loading = false,
  nomeUsuario = 'usuário',
  filiais = [],
  filtroFilial = '',
  setFiltroFilial = () => {},
  contasOperacionaisFiliais = []
}) {
  const valorSeguro = (valor) => Number(valor || 0)
  const filialSelecionada = (filiais || []).find((filial) => filial.id === filtroFilial)
  const contasPagas = contas.filter((conta) => conta.status === 'pago')
  const contasPendentes = contas.filter((conta) => conta.status !== 'pago')
  const baseOperacionalFiliais = (contasOperacionaisFiliais && contasOperacionaisFiliais.length > 0)
    ? contasOperacionaisFiliais
    : contas

  const resumoFiliais = (filiais || [])
    .map((filial) => {
      const contasFilial = baseOperacionalFiliais.filter((conta) => conta.filial_id === filial.id)
      const totalFilial = contasFilial.reduce((acc, conta) => acc + valorSeguro(conta.valor), 0)
      const pagoFilial = contasFilial
        .filter((conta) => conta.status === 'pago')
        .reduce((acc, conta) => acc + valorSeguro(conta.valor), 0)
      const vencidoFilial = contasFilial
        .filter((conta) => estaVencida(conta.data_vencimento, conta.status))
        .reduce((acc, conta) => acc + valorSeguro(conta.valor), 0)
      const pendenteFilial = totalFilial - pagoFilial

      return {
        id: filial.id,
        nome: filial.nome || 'Filial sem nome',
        total: totalFilial,
        pago: pagoFilial,
        pendente: pendenteFilial,
        vencido: vencidoFilial,
        contas: contasFilial.length
      }
    })
    .filter((filial) => filial.total > 0 || filial.contas > 0)
    .sort((a, b) => b.total - a.total)

  const filialMaiorVolume = resumoFiliais[0]
  const filialMaiorPendente = [...resumoFiliais].sort((a, b) => b.pendente - a.pendente)[0]
  const filialMaiorRisco = [...resumoFiliais].sort((a, b) => b.vencido - a.vencido)[0]

  const contasAgenda = contas
    .filter((conta) => conta.status !== 'pago')
    .sort((a, b) => diferencaDias(a.data_vencimento) - diferencaDias(b.data_vencimento))

  const contasHoje = contasAgenda.filter((conta) => diferencaDias(conta.data_vencimento) === 0)
  const contasSemana = contasAgenda.filter((conta) => {
    const dias = diferencaDias(conta.data_vencimento)
    return dias > 0 && dias <= 7
  })
  const proximaConta = contasAgenda.find((conta) => diferencaDias(conta.data_vencimento) >= 0) || contasAgenda[0]
  const totalHoje = contasHoje.reduce((acc, conta) => acc + valorSeguro(conta.valor), 0)
  const totalSemana = contasSemana.reduce((acc, conta) => acc + valorSeguro(conta.valor), 0)

  return (
    <>
      <section className="dashboard-branch-filter no-print" aria-label="Filtro de filial do painel">
        <div className="dashboard-branch-filter-card">
          <div>
            <span className="analytics-kicker">Visão por filial</span>
            <strong>{filialSelecionada ? filialSelecionada.nome : 'Todas as filiais'}</strong>
            <small>Os indicadores, gráficos e contas em aberto respeitam a filial selecionada.</small>
          </div>

          <select
            style={styles.input}
            value={filtroFilial}
            onChange={(e) => setFiltroFilial(e.target.value)}
            aria-label="Filtrar painel por filial"
          >
            <option value="">Todas as filiais</option>
            {(filiais || []).map((filial) => (
              <option key={filial.id} value={filial.id}>{filial.nome}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="dashboard-kpi-row" aria-label="Resumo financeiro rápido">
        {loading ? (
          <SummarySkeleton items={4} />
        ) : (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #dbe7e3',
              borderRadius: 18,
              padding: 14,
              marginBottom: 12,
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              <span style={{ color: '#0f766e', fontSize: 12, fontWeight: 800, letterSpacing: 0, textTransform: 'uppercase' }}>Resumo financeiro rápido</span>
              <button
                type="button"
                onClick={() => navegarPara('relatorios')}
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #bbf7d0',
                  borderRadius: 999,
                  color: '#0f766e',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '6px 10px'
                }}
              >
                Ver Análise Financeira
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 8
              }}
            >
              <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 12, padding: '9px 10px', minWidth: 0 }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>Total</span>
                <strong style={{ color: '#111827', display: 'block', fontSize: 15, lineHeight: 1.25, marginTop: 3 }}>{formatarValor(total)}</strong>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 12, padding: '9px 10px', minWidth: 0 }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>Pago</span>
                <strong style={{ color: '#166534', display: 'block', fontSize: 15, lineHeight: 1.25, marginTop: 3 }}>{formatarValor(pago)}</strong>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 12, padding: '9px 10px', minWidth: 0 }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>Pendente</span>
                <strong style={{ color: '#92400e', display: 'block', fontSize: 15, lineHeight: 1.25, marginTop: 3 }}>{formatarValor(pendente)}</strong>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 12, padding: '9px 10px', minWidth: 0 }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>Vencido</span>
                <strong style={{ color: '#991b1b', display: 'block', fontSize: 15, lineHeight: 1.25, marginTop: 3 }}>{formatarValor(vencido)}</strong>
              </div>
            </div>
          </div>
        )}
      </section>

      {!loading && (
        <section className="dashboard-operational-grid no-print" aria-label="Painel operacional por filial">
          <article className="dashboard-operational-card highlight">
            <span className="analytics-kicker">Ranking de unidades</span>
            <strong>{filialMaiorVolume ? filialMaiorVolume.nome : 'Sem movimento'}</strong>
            <small>{filialMaiorVolume ? `${formatarValor(filialMaiorVolume.total)} em volume financeiro` : 'Cadastre contas vinculadas às filiais.'}</small>
          </article>

          <article className="dashboard-operational-card">
            <span className="analytics-kicker">Maior pendência</span>
            <strong>{filialMaiorPendente ? filialMaiorPendente.nome : 'Sem pendências'}</strong>
            <small>{filialMaiorPendente ? formatarValor(filialMaiorPendente.pendente) : 'Nenhuma conta pendente encontrada.'}</small>
          </article>

          <article className="dashboard-operational-card">
            <span className="analytics-kicker">Risco vencido</span>
            <strong>{filialMaiorRisco && filialMaiorRisco.vencido > 0 ? filialMaiorRisco.nome : 'Sem vencidos'}</strong>
            <small>{filialMaiorRisco && filialMaiorRisco.vencido > 0 ? formatarValor(filialMaiorRisco.vencido) : 'Operação sem vencidos no filtro atual.'}</small>
          </article>

          <article className="dashboard-operational-card" style={{ padding: 16, gap: 12 }}>
            <div className="analytics-card-header compact" style={{ alignItems: 'flex-start', gap: 12 }}>
              <div>
                <span className="analytics-kicker">Análise Financeira</span>
                <strong>Indicadores e comparativos</strong>
                <small style={{ color: '#64748b', display: 'block', lineHeight: 1.45, marginTop: 4 }}>
                  Gráficos, rankings, centros de custo e leitura gerencial estão disponíveis na área financeira.
                </small>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navegarPara('relatorios')}
              style={{
                alignSelf: 'flex-start',
                background: '#ecfdf5',
                border: '1px solid #bbf7d0',
                borderRadius: 999,
                color: '#0f766e',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                padding: '7px 12px'
              }}
            >
              Ver Análise Financeira
            </button>
          </article>
        </section>
      )}

      {!loading && (
        <section className="dashboard-analytics-grid no-print">
          <div className="dashboard-analytics-card executive-agenda-widget">
            <div className="analytics-card-header">
              <div>
          <span className="analytics-kicker">Agenda financeira</span>
                <strong>Próximos vencimentos</strong>
              </div>
              <span className="analytics-badge neutral">{contasAgenda.length} abertas</span>
            </div>

            <div className="executive-agenda-metrics">
              <div>
                <small>Hoje</small>
                <strong>{formatarValor(totalHoje)}</strong>
              </div>
              <div>
                <small>7 dias</small>
                <strong>{formatarValor(totalSemana)}</strong>
              </div>
            </div>

            {proximaConta ? (
              <div className="executive-agenda-next">
                <span>Próximo compromisso</span>
                <strong>{proximaConta.descricao}</strong>
                <small>{formatarData(proximaConta.data_vencimento)} • {formatarValor(proximaConta.valor)}</small>
              </div>
            ) : (
              <div className="analytics-empty executive-agenda-empty">Agenda financeira limpa.</div>
            )}

            <button className="executive-agenda-cta" onClick={() => navegarPara('agenda')}>Abrir agenda completa</button>
          </div>
        </section>
      )}

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
        podeEditarFinanceiro={podeEditarFinanceiro}
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
        podeEditarFinanceiro={podeEditarFinanceiro}
      />
      )}
    </>
  )
}
