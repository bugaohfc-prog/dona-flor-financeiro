export default function NotesPanel({
  styles,
  navegarPara,
  notasPendentes,
  notasCriticas,
  notasUrgentes,
  mostrarNotas,
  setMostrarNotas,
  formatarData,
  alternarNotaConcluida,
  abrirEdicaoNota,
  abrirConfirmacao,
  excluirNota,
  podeEditarFinanceiro = true
}) {
  return (
    <section className={`no-print dashboard-notes-card ${mostrarNotas ? 'notes-expanded' : 'notes-collapsed'}`}>
      <div style={styles.notasHeaderNovo} className="notes-header-clean dashboard-notes-content">
        <div className="notes-title-wrap">
          <strong className="notes-title">📝 Notas</strong>
          <div className="notes-stats-row">
            <span className="note-stat note-stat-pendente">{notasPendentes.length} pendente(s)</span>
            <span className="note-stat note-stat-critico">{notasCriticas} crítica(s)</span>
            <span className="note-stat note-stat-urgente">{notasUrgentes} urgente(s)</span>
          </div>
        </div>
        <div className="notes-header-actions">
          <button className="dashboard-see-all-link" type="button" onClick={() => navegarPara('notas')}>Ver notas</button>
          <button
            className="note-toggle-small"
            onClick={() => setMostrarNotas(!mostrarNotas)}
            title={mostrarNotas ? 'Recolher bloco de notas' : 'Expandir bloco de notas'}
            aria-label={mostrarNotas ? 'Recolher bloco de notas' : 'Expandir bloco de notas'}
          >
            {mostrarNotas ? '−' : '+'}
          </button>
        </div>
      </div>

      {notasPendentes.length === 0 && (
        <p style={styles.mensagemVazia}>Nenhuma nota pendente no momento.</p>
      )}

      {mostrarNotas && (
        <div style={styles.notasListaNova} className="notes-list-dashboard">
          {notasPendentes.slice(0, 6).map((nota) => {
            const prioridade = nota.prioridade || 'normal'
            return (
              <div key={nota.id} className={`note-card-action note-card-${prioridade}`} style={{ ...styles.cardNotaAcao, ...(prioridade === 'critico' ? styles.cardNotaCritico : prioridade === 'urgente' ? styles.cardNotaUrgente : styles.cardNotaNormal), opacity: nota.concluida ? 0.65 : 1 }}>
                <div style={styles.cardTopo}>
                  <strong style={{ textDecoration: nota.concluida ? 'line-through' : 'none' }}>{nota.titulo}</strong>
                  <span className={`note-priority-badge note-priority-${prioridade}`} style={{ ...styles.badgePrioridade, ...(prioridade === 'critico' ? styles.badgeCritico : prioridade === 'urgente' ? styles.badgeUrgente : styles.badgeNormal) }}>
                    {prioridade === 'critico' ? 'Crítico' : prioridade === 'urgente' ? 'Urgente' : 'Normal'}
                  </span>
                </div>

                {nota.data_evento && <small className="note-event-date">📅 {formatarData(nota.data_evento)}</small>}

                {nota.conteudo && <p style={styles.textoNota}>{nota.conteudo}</p>}

                {podeEditarFinanceiro && (
                <div style={styles.acoes}>
                  <button style={styles.btnPago} onClick={() => alternarNotaConcluida(nota)}>{nota.concluida ? 'Reabrir' : 'Concluir'}</button>
                  <button style={styles.btnEditar} onClick={() => abrirEdicaoNota(nota)}>Editar</button>
                  <button style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Mover nota para lixeira', mensagem: `Deseja mover a nota ${nota.titulo} para a lixeira? Ela ficará em quarentena por 60 dias.`, textoConfirmar: 'Mover', tipo: 'perigo', acao: () => excluirNota(nota.id) })}>Excluir</button>
                </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
