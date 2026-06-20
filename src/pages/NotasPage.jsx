import { useEffect, useMemo, useRef, useState } from 'react'

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
  styles, navegarPara, notas = [], notasFiltradas, agendaFocusTarget, onAgendaFocusHandled, notasPendentes, notasCriticas, notasUrgentes,
  buscaNota, setBuscaNota, formatarData, alternarNotaConcluida, abrirEdicaoNota,
  abrirConfirmacao, excluirNota, abrirNovaNota, filtroFilial, setFiltroFilial, filiais, podeEditarFinanceiro = true
}) {
  const [abaStatusNotas, setAbaStatusNotas] = useState('abertas')
  const [ordenacaoNotas, setOrdenacaoNotas] = useState('prioridade')
  const [notaDestacadaId, setNotaDestacadaId] = useState('')
  const notaDestacadaRef = useRef(null)
  const notaAlvoAgendaId = agendaFocusTarget?.tipo === 'nota' ? agendaFocusTarget.id : ''
  const notaAlvoAgenda = useMemo(() => {
    if (!notaAlvoAgendaId) return null
    return notas.find((nota) => String(nota.id) === String(notaAlvoAgendaId))
      || notasFiltradas.find((nota) => String(nota.id) === String(notaAlvoAgendaId))
      || null
  }, [notaAlvoAgendaId, notas, notasFiltradas])
  const notasParaFiltro = useMemo(() => {
    if (!notaAlvoAgenda) return notasFiltradas
    const jaEstaFiltrada = notasFiltradas.some((nota) => String(nota.id) === String(notaAlvoAgenda.id))
    return jaEstaFiltrada ? notasFiltradas : [notaAlvoAgenda, ...notasFiltradas]
  }, [notaAlvoAgenda, notasFiltradas])
  const notasAbertasFiltradas = useMemo(
    () => notasParaFiltro.filter((nota) => !nota.concluida),
    [notasParaFiltro]
  )
  const notasConcluidasFiltradas = useMemo(
    () => notasParaFiltro.filter((nota) => nota.concluida),
    [notasParaFiltro]
  )
  const notasDaAba = useMemo(() => {
    if (abaStatusNotas === 'concluidas') return notasConcluidasFiltradas
    if (abaStatusNotas === 'todas') return notasParaFiltro
    return notasAbertasFiltradas
  }, [abaStatusNotas, notasAbertasFiltradas, notasConcluidasFiltradas, notasParaFiltro])
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

  useEffect(() => {
    if (!notaAlvoAgendaId) return undefined

    setNotaDestacadaId(String(notaAlvoAgendaId))

    const scrollTimer = window.setTimeout(() => {
      notaDestacadaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)

    const clearTimer = window.setTimeout(() => {
      setNotaDestacadaId('')
      onAgendaFocusHandled?.()
    }, 4500)

    return () => {
      window.clearTimeout(scrollTimer)
      window.clearTimeout(clearTimer)
    }
  }, [notaAlvoAgendaId, onAgendaFocusHandled])

  return (
    <>
      <div className="page-title-actions notes-page-title notes-redesign-header">
        <div>
          <span className="notes-page-kicker">Operação</span>
          <h1 style={styles.titulo}>Notas</h1>
          <p style={styles.textoNota}>Acompanhamento de pendências, lembretes e observações operacionais.</p>
        </div>
        <div className="page-actions-row">
          <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>Voltar ao Painel</button>
          {podeEditarFinanceiro && (
            <button className="note-create-button" style={styles.btnSalvar} onClick={abrirNovaNota}>Nova nota</button>
          )}
        </div>
      </div>

      <section style={styles.cardConfiguracao} className="notes-page-section notes-redesign-section">
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

          <select className="notes-branch-filter" style={styles.input} value={filtroFilial} onChange={(e) => setFiltroFilial(e.target.value)}>
            <option value="">Todas as filiais</option>
            {(filiais || []).map((filial) => (<option key={filial.id} value={filial.id}>{filial.nome}</option>))}
          </select>
          <input
            className="notes-search-input"
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
            icon="Notas"
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
            const destacadaPelaAgenda = String(nota.id) === String(notaDestacadaId)
            const prioridade = nota.prioridade || 'normal'
            const conteudo = String(nota.conteudo || '').trim()
            return (
              <div
                key={nota.id}
                ref={destacadaPelaAgenda ? notaDestacadaRef : null}
                className={`note-card-action note-card-${prioridade} ${destacadaPelaAgenda ? 'note-card-agenda-focus' : ''} ${nota.concluida && abaStatusNotas === 'todas' ? 'note-card-completed-muted' : ''}`}
                style={{ ...styles.cardNotaAcao, ...(prioridade === 'critico' ? styles.cardNotaCritico : prioridade === 'urgente' ? styles.cardNotaUrgente : styles.cardNotaNormal), opacity: nota.concluida && abaStatusNotas === 'todas' ? 0.68 : 1 }}
              >
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

                {nota.data_evento && <small className="note-event-date">Data: {formatarData(nota.data_evento)}</small>}
                {nota.df_filiais?.nome && <small className="note-event-date">Filial: {nota.df_filiais.nome}</small>}
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
