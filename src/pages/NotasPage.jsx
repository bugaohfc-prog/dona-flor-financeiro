export default function NotasPage({
  styles, navegarPara, notasFiltradas, notasPendentes, notasCriticas, notasUrgentes,
  buscaNota, setBuscaNota, formatarData, alternarNotaConcluida, abrirEdicaoNota,
  abrirConfirmacao, excluirNota
}) {
  return (
    <>
      <div className="page-title-actions">
        <div>
          <h1 style={styles.titulo}>📝 Notas</h1>
          <p style={styles.textoNota}>Central de notas e lembretes da empresa, separada do painel financeiro para reduzir poluição visual.</p>
        </div>
        <div className="page-actions-row">
          <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>← Dashboard</button>
        </div>
      </div>

      <section style={styles.cardConfiguracao} className="notes-page-section">
        <div className="notes-page-header">
          <div>
            <h2 style={styles.subtitulo}>Todas as notas</h2>
            <p style={styles.textoNota}>{notasFiltradas.length} nota(s) encontrada(s) • {notasPendentes.length} pendente(s)</p>
          </div>
          <div className="notes-page-stats">
            <span className="note-stat note-stat-pendente">{notasPendentes.length} pendente(s)</span>
            <span className="note-stat note-stat-critico">{notasCriticas} crítica(s)</span>
            <span className="note-stat note-stat-urgente">{notasUrgentes} urgente(s)</span>
          </div>
        </div>

        <div className="notes-toolbar">
          <input
            style={styles.input}
            placeholder="Buscar por título, conteúdo ou prioridade..."
            value={buscaNota}
            onChange={(e) => setBuscaNota(e.target.value)}
          />
        </div>

        {notasFiltradas.length === 0 && (
          <p style={styles.mensagemVazia}>Nenhuma nota encontrada.</p>
        )}

        <div className="notes-page-grid">
          {notasFiltradas.map((nota) => {
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

                <div style={styles.acoes}>
                  <button style={styles.btnPago} onClick={() => alternarNotaConcluida(nota)}>{nota.concluida ? 'Reabrir' : 'Concluir'}</button>
                  <button style={styles.btnEditar} onClick={() => abrirEdicaoNota(nota)}>Editar</button>
                  <button style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Mover nota para lixeira', mensagem: `Deseja mover a nota ${nota.titulo} para a lixeira? Ela ficará em quarentena por 60 dias.`, textoConfirmar: 'Mover', tipo: 'perigo', acao: () => excluirNota(nota.id) })}>Excluir</button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}
