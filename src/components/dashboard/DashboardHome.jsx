import { SummarySkeleton, NotesSkeleton } from '../feedback/Skeletons.jsx'
import { useEffect } from 'react'

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
  formatarData,
  abrirConfirmacao,
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
  filiais = [],
  filtroFilial = '',
  setFiltroFilial = () => {},
}) {
  const valorSeguro = (valor) => Number(valor || 0)
  const filialSelecionada = (filiais || []).find((filial) => filial.id === filtroFilial)
  const LIMITE_NOTAS_PAINEL = 5

  useEffect(() => {
    setMostrarNotas(true)
  }, [setMostrarNotas])

  function criarDataLocal(data) {
    const texto = String(data || '').slice(0, 10)
    if (!texto) return null
    const dataLocal = new Date(`${texto}T00:00:00`)
    return Number.isNaN(dataLocal.getTime()) ? null : dataLocal
  }

  function diferencaDiasNota(data) {
    const dataLocal = criarDataLocal(data)
    if (!dataLocal) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    dataLocal.setHours(0, 0, 0, 0)
    return Math.round((dataLocal.getTime() - hoje.getTime()) / 86400000)
  }

  function dataRecenteNota(nota) {
    return criarDataLocal(nota.atualizado_em || nota.updated_at || nota.criado_em || nota.created_at)
  }

  function prioridadeNotaPainel(nota, indice) {
    const prioridade = nota.prioridade || 'normal'
    const dias = diferencaDiasNota(nota.data_evento)
    const recente = dataRecenteNota(nota)?.getTime() || 0

    let grupo = 6
    if (prioridade === 'critico') grupo = 1
    else if (prioridade === 'urgente') grupo = 2
    else if (dias !== null && dias < 0) grupo = 3
    else if (dias === 0) grupo = 4
    else if (dias !== null && dias > 0 && dias <= 7) grupo = 5

    return {
      nota,
      grupo,
      dias: dias ?? 9999,
      recente,
      indice
    }
  }

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
  const notasPainel = notasPendentes
    .map(prioridadeNotaPainel)
    .sort((a, b) => {
      if (a.grupo !== b.grupo) return a.grupo - b.grupo
      if (a.grupo <= 5 && a.dias !== b.dias) return a.dias - b.dias
      if (a.recente !== b.recente) return b.recente - a.recente
      return a.indice - b.indice
    })
    .slice(0, LIMITE_NOTAS_PAINEL)
    .map((item) => item.nota)

  return (
    <>
      <section className="dashboard-branch-filter no-print" aria-label="Filtro de filial do painel">
        <div className="dashboard-branch-filter-card">
          <div>
            <span className="analytics-kicker">Visão por filial</span>
            <strong>{filialSelecionada ? filialSelecionada.nome : 'Todas as filiais'}</strong>
            <small>O resumo e os próximos vencimentos respeitam a filial selecionada.</small>
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
        <section className="dashboard-analytics-grid no-print">
          <div className="dashboard-analytics-card executive-agenda-widget">
            <div className="analytics-card-header">
              <div>
                <span className="analytics-kicker">Agenda</span>
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

            <button className="executive-agenda-cta" onClick={() => navegarPara('contas')}>Ver contas</button>
          </div>
        </section>
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
        <section className={`no-print dashboard-notes-card ${mostrarNotas ? 'notes-expanded' : 'notes-collapsed'}`}>
          <div style={styles.notasHeaderNovo} className="notes-header-clean dashboard-notes-content">
            <div className="notes-title-wrap">
              <strong className="notes-title">{'Notas e pend\u00eancias'}</strong>
              <div className="notes-stats-row">
                <span className="note-stat note-stat-pendente">{notasPendentes.length} pendente(s)</span>
                <span className="note-stat note-stat-critico">{notasCriticas} {'cr\u00edtica(s)'}</span>
                <span className="note-stat note-stat-urgente">{notasUrgentes} urgente(s)</span>
              </div>
            </div>
            <div className="notes-header-actions">
              <button className="dashboard-see-all-link" type="button" onClick={() => navegarPara('notas')}>Ver notas</button>
              <button
                className="note-toggle-small"
                type="button"
                onClick={() => setMostrarNotas(!mostrarNotas)}
                title={mostrarNotas ? 'Recolher bloco de notas' : 'Expandir bloco de notas'}
                aria-label={mostrarNotas ? 'Recolher bloco de notas' : 'Expandir bloco de notas'}
              >
                {mostrarNotas ? '-' : '+'}
              </button>
            </div>
          </div>

          {mostrarNotas && notasPainel.length === 0 && (
            <p style={styles.mensagemVazia}>{'Nenhuma nota cr\u00edtica ou urgente nos pr\u00f3ximos dias.'}</p>
          )}

          {mostrarNotas && notasPainel.length > 0 && (
            <div style={styles.notasListaNova} className="notes-list-dashboard">
              {notasPainel.map((nota) => {
                const prioridade = nota.prioridade || 'normal'
                return (
                  <div key={nota.id} className={`note-card-action note-card-${prioridade}`} style={{ ...styles.cardNotaAcao, ...(prioridade === 'critico' ? styles.cardNotaCritico : prioridade === 'urgente' ? styles.cardNotaUrgente : styles.cardNotaNormal), opacity: nota.concluida ? 0.65 : 1 }}>
                    <div style={styles.cardTopo}>
                      <strong style={{ textDecoration: nota.concluida ? 'line-through' : 'none' }}>{nota.titulo}</strong>
                      <span className={`note-priority-badge note-priority-${prioridade}`} style={{ ...styles.badgePrioridade, ...(prioridade === 'critico' ? styles.badgeCritico : prioridade === 'urgente' ? styles.badgeUrgente : styles.badgeNormal) }}>
                        {prioridade === 'critico' ? 'Cr\u00edtico' : prioridade === 'urgente' ? 'Urgente' : 'Normal'}
                      </span>
                    </div>

                    {nota.data_evento && <small className="note-event-date">Data: {formatarData(nota.data_evento)}</small>}

                    {nota.conteudo && <p style={styles.textoNota}>{nota.conteudo}</p>}

                    {podeEditarFinanceiro && (
                      <div style={styles.acoes}>
                        <button style={styles.btnPago} onClick={() => alternarNotaConcluida(nota)}>{nota.concluida ? 'Reabrir' : 'Concluir'}</button>
                        <button style={styles.btnEditar} onClick={() => abrirEdicaoNota(nota)}>Editar</button>
                        <button style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Mover nota para lixeira', mensagem: `Deseja mover a nota ${nota.titulo} para a lixeira? Ela ficar\u00e1 em quarentena por 60 dias.`, textoConfirmar: 'Mover', tipo: 'perigo', acao: () => excluirNota(nota.id) })}>Excluir</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </>
  )
}
