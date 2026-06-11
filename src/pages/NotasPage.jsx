import { useMemo, useState } from 'react'

const OPCOES_ORDENACAO_NOTAS = [
  { valor: 'prioridade', label: 'Prioridade' },
  { valor: 'data_asc', label: 'Data mais próxima' },
  { valor: 'data_desc', label: 'Data mais distante' },
  { valor: 'titulo_asc', label: 'Título A-Z' },
  { valor: 'status', label: 'Status' }
]

const ABAS_STATUS_NOTAS = [
  { valor: 'abertas', label: 'Abertas' },
  { valor: 'concluidas', label: 'Concluídas' },
  { valor: 'todas', label: 'Todas' }
]

function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

export default function NotasPage({
  styles, navegarPara, notasFiltradas, notasPendentes, notasCriticas, notasUrgentes,
  buscaNota, setBuscaNota, formatarData, alternarNotaConcluida, abrirEdicaoNota,
  abrirConfirmacao, excluirNota, filtroFilial, setFiltroFilial, filiais, podeEditarFinanceiro = true
}) {
  const [abaStatusNotas, setAbaStatusNotas] = useState('abertas')
  const [ordenacaoNotas, setOrdenacaoNotas] = useState('prioridade')
  const notasAbertasFiltradas = useMemo(
    () => notasFiltradas.filter((nota) => !nota.concluida),
    [notasFiltradas]
  )
  const notasConcluidasFiltradas = useMemo(
    () => notasFiltradas.filter((nota) => nota.concluida),
    [notasFiltradas]
  )
  const notasDaAba = useMemo(() => {
    if (abaStatusNotas === 'concluidas') return notasConcluidasFiltradas
    if (abaStatusNotas === 'todas') return notasFiltradas
    return notasAbertasFiltradas
  }, [abaStatusNotas, notasAbertasFiltradas, notasConcluidasFiltradas, notasFiltradas])
  const tituloAbaNotas = abaStatusNotas === 'concluidas'
    ? 'Notas concluídas'
    : abaStatusNotas === 'todas'
      ? 'Todas as notas'
      : 'Notas abertas'

  const notasOrdenadas = useMemo(() => {
    const pesoPrioridade = { critico: 0, urgente: 1, normal: 2 }
    const obterStatus = (nota) => nota.concluida ? 1 : 0
    const obterData = (nota, fallback) => nota.data_evento || fallback

    return [...notasDaAba].sort((a, b) => {
      if (ordenacaoNotas === 'data_asc') {
        return String(obterData(a, '9999-12-31')).localeCompare(String(obterData(b, '9999-12-31')))
      }

      if (ordenacaoNotas === 'data_desc') {
        return String(obterData(b, '0000-00-00')).localeCompare(String(obterData(a, '0000-00-00')))
      }

      if (ordenacaoNotas === 'titulo_asc') {
        return String(a.titulo || '').localeCompare(String(b.titulo || ''), 'pt-BR', { sensitivity: 'base' })
      }

      if (ordenacaoNotas === 'status') {
        const status = obterStatus(a) - obterStatus(b)
        if (status !== 0) return status
      }

      const concluidaA = obterStatus(a)
      const concluidaB = obterStatus(b)
      if (concluidaA !== concluidaB) return concluidaA - concluidaB

      const prioridadeA = pesoPrioridade[a.prioridade || 'normal'] ?? 2
      const prioridadeB = pesoPrioridade[b.prioridade || 'normal'] ?? 2
      if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB

      return String(obterData(a, '9999-12-31')).localeCompare(String(obterData(b, '9999-12-31')))
    })
  }, [notasDaAba, ordenacaoNotas])

  return (
    <>
      <style>{`
        .notes-status-tabs {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
          width: 100%;
        }
        .notes-toolbar {
          gap: 10px;
        }
        .notes-status-tab {
          min-height: 36px;
          border: 1px solid #dbe4ef;
          border-radius: 999px;
          background: #ffffff;
          color: #475569;
          font-weight: 800;
          cursor: pointer;
          padding: 7px 10px;
        }
        .notes-status-tab.is-active {
          border-color: #0f766e;
          background: #0f766e;
          color: #ffffff;
          box-shadow: 0 6px 16px rgba(15, 118, 110, 0.16);
        }
        .notes-card-actions {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .notes-card-actions button {
          width: auto !important;
          min-width: 0 !important;
          min-height: 32px !important;
          padding: 6px 10px !important;
          border-radius: 999px !important;
          font-size: 12px !important;
          font-weight: 800 !important;
          box-shadow: none !important;
        }
        .notes-card-actions .note-action-secondary,
        .notes-card-actions .note-action-danger {
          opacity: 0.82;
        }
        @media (max-width: 640px) {
          .notes-status-tabs {
            gap: 5px;
          }
          .notes-status-tab {
            min-height: 34px;
            padding: 6px 8px;
            font-size: 13px;
          }
          .notes-card-actions {
            gap: 5px;
          }
          .notes-card-actions button {
            min-height: 30px !important;
            padding: 5px 9px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
      <div className="page-title-actions">
        <div>
          <h1 style={styles.titulo}>📝 Notas</h1>
          <p style={styles.textoNota}>Central de notas e lembretes da empresa, separada do painel financeiro para reduzir poluição visual.</p>
        </div>
        <div className="page-actions-row">
          <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>← Painel</button>
        </div>
      </div>

      <section style={styles.cardConfiguracao} className="notes-page-section">
        <div className="notes-page-header">
          <div>
            <h2 style={styles.subtitulo}>{tituloAbaNotas}</h2>
            <p style={styles.textoNota}>{notasOrdenadas.length} nota(s) na aba • {notasAbertasFiltradas.length} aberta(s) • {notasConcluidasFiltradas.length} concluída(s)</p>
          </div>
          <div className="notes-page-stats">
            <span className="note-stat note-stat-pendente">{notasPendentes.length} pendente(s)</span>
            <span className="note-stat note-stat-critico">{notasCriticas} crítica(s)</span>
            <span className="note-stat note-stat-urgente">{notasUrgentes} urgente(s)</span>
          </div>
        </div>

        <div className="notes-toolbar">
          <div className="notes-status-tabs" role="tablist" aria-label="Filtro principal de status das notas">
            {ABAS_STATUS_NOTAS.map((aba) => (
              <button
                key={aba.valor}
                type="button"
                role="tab"
                aria-selected={abaStatusNotas === aba.valor}
                className={`notes-status-tab ${abaStatusNotas === aba.valor ? 'is-active' : ''}`}
                onClick={() => setAbaStatusNotas(aba.valor)}
              >
                {aba.label}
              </button>
            ))}
          </div>

          <select style={styles.input} value={filtroFilial} onChange={(e) => setFiltroFilial(e.target.value)}>
            <option value="">Todas as filiais</option>
            {(filiais || []).map((filial) => (<option key={filial.id} value={filial.id}>{filial.nome}</option>))}
          </select>
          <input
            style={styles.input}
            placeholder="Buscar por título, conteúdo ou prioridade..."
            value={buscaNota}
            onChange={(e) => setBuscaNota(e.target.value)}
          />
          <label className="notes-sort-control">
            <span>Ordenar por</span>
            <select style={styles.input} value={ordenacaoNotas} onChange={(e) => setOrdenacaoNotas(e.target.value)}>
              {OPCOES_ORDENACAO_NOTAS.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>{opcao.label}</option>
              ))}
            </select>
          </label>
        </div>

        {notasOrdenadas.length === 0 && (
          <EmptyState
            icon="📝"
            title="Nenhuma nota encontrada"
            description={abaStatusNotas === 'abertas'
              ? 'Nenhuma nota aberta para os filtros selecionados.'
              : abaStatusNotas === 'concluidas'
                ? 'Nenhuma nota concluída para os filtros selecionados.'
                : 'Use as notas para registrar pendências, lembretes e prioridades da operação.'}
          />
        )}

        <div className="notes-page-grid">
          {notasOrdenadas.map((nota) => {
            const prioridade = nota.prioridade || 'normal'
            const conteudo = String(nota.conteudo || '').trim()
            return (
              <div key={nota.id} className={`note-card-action note-card-${prioridade}`} style={{ ...styles.cardNotaAcao, ...(prioridade === 'critico' ? styles.cardNotaCritico : prioridade === 'urgente' ? styles.cardNotaUrgente : styles.cardNotaNormal), opacity: nota.concluida && abaStatusNotas === 'todas' ? 0.72 : 1 }}>
                <div style={styles.cardTopo}>
                  <strong style={{ textDecoration: nota.concluida && abaStatusNotas === 'todas' ? 'line-through' : 'none' }}>{nota.titulo}</strong>
                  <div className="note-card-badges">
                    <span className={`note-priority-badge note-priority-${prioridade}`} style={{ ...styles.badgePrioridade, ...(prioridade === 'critico' ? styles.badgeCritico : prioridade === 'urgente' ? styles.badgeUrgente : styles.badgeNormal) }}>
                      {prioridade === 'critico' ? 'Crítico' : prioridade === 'urgente' ? 'Urgente' : 'Normal'}
                    </span>
                    <span className={`note-status-badge ${nota.concluida ? 'note-status-done' : 'note-status-open'}`}>
                      {nota.concluida ? 'Concluída' : 'Pendente'}
                    </span>
                  </div>
                </div>

                {nota.data_evento && <small className="note-event-date">📅 {formatarData(nota.data_evento)}</small>}
                {nota.df_filiais?.nome && <small className="note-event-date">🏢 {nota.df_filiais.nome}</small>}
                {conteudo && <p className="note-content-preview" title={conteudo}>{conteudo}</p>}

                {podeEditarFinanceiro && (
                <div className="notes-card-actions">
                  <button className="note-action-primary" style={styles.btnPago} onClick={() => alternarNotaConcluida(nota)}>{nota.concluida ? 'Reabrir' : 'Concluir'}</button>
                  <button className="note-action-secondary" style={styles.btnEditar} onClick={() => abrirEdicaoNota(nota)}>Editar</button>
                  <button className="note-action-danger" style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Mover nota para lixeira', mensagem: `Deseja mover a nota ${nota.titulo} para a lixeira? Ela ficará em quarentena por 60 dias.`, textoConfirmar: 'Mover', tipo: 'perigo', acao: () => excluirNota(nota.id) })}>Excluir</button>
                </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}
