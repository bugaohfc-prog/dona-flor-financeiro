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
  excluirNota
}) {
  return (
    <>
      <section className="dashboard-title-row">
        <div className="dashboard-heading-actions">
          <h1 className="main-title" style={styles.titulo}>📊 Dashboard Financeiro</h1>
        </div>

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

      <section className={`dashboard-open-accounts content-block ${mostrarContasDashboard ? 'accounts-expanded' : 'accounts-collapsed'}`} style={styles.bloco}>
        <div className="dashboard-section-header dashboard-section-header-accounts">
          <div className="dashboard-section-title-wrap">
            <strong>💳 Contas em aberto</strong>
            <small>Mais novas primeiro • {contasAbertasDashboard.length} conta(s)</small>
          </div>
          <div className="dashboard-section-actions">
            <button className="dashboard-see-all-link" type="button" onClick={() => navegarPara('contas')}>Ver todas</button>
            <button
              className="note-toggle-small"
              type="button"
              onClick={() => setMostrarContasDashboard(!mostrarContasDashboard)}
              title={mostrarContasDashboard ? 'Recolher contas em aberto' : 'Expandir contas em aberto'}
              aria-label={mostrarContasDashboard ? 'Recolher contas em aberto' : 'Expandir contas em aberto'}
            >
              {mostrarContasDashboard ? '−' : '+'}
            </button>
          </div>
        </div>

        {mostrarContasDashboard && (
          <>
            <div className="dashboard-inline-filter">
              <input
                style={styles.input}
                placeholder="Buscar por conta, data, centro ou observação..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            {contasAbertasDashboard.length === 0 && (
              <p style={styles.mensagemVazia}>Nenhuma conta em aberto para os filtros atuais.</p>
            )}

            <div className="dashboard-open-list">
              {contasAbertasDashboard.slice(0, 8).map((conta) => {
                const vencida = estaVencida(conta.data_vencimento, conta.status)
                return (
                  <div key={conta.id} className={`dashboard-account-row ${vencida ? 'account-row-vencido' : 'account-row-pendente'}`}>
                    <div>
                      <strong>{conta.descricao}</strong>
                      <small>{formatarData(conta.data_vencimento)} • {conta.df_centros_custo?.nome || 'Sem centro'}</small>
                      {conta.observacao && <small className="account-note-preview">Obs: {conta.observacao}</small>}
                    </div>
                    <div className="dashboard-account-row-actions">
                      <span className="dashboard-account-value">{formatarValor(conta.valor)}</span>
                      <span className={`status-pill ${vencida ? 'status-vencido' : 'status-pendente'}`}>{vencida ? 'Vencido' : 'Pendente'}</span>
                      <button className="dashboard-paid-button" style={styles.btnPago} onClick={() => abrirConfirmacao({ titulo: 'Confirmar pagamento', mensagem: `Deseja marcar a conta ${conta.descricao} como paga?`, textoConfirmar: 'Marcar como pago', tipo: 'sucesso', acao: () => marcarComoPago(conta.id) })}>Pago</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      <section className={`no-print dashboard-notes-card ${mostrarNotas ? 'notes-expanded' : 'notes-collapsed'}`}>
        <div style={styles.notasHeaderNovo} className="notes-header-clean dashboard-notes-content">
          <div className="notes-title-wrap">
            <strong className="notes-title">📝 Bloco de Notas</strong>
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

                <div style={styles.acoes}>
                  <button style={styles.btnPago} onClick={() => alternarNotaConcluida(nota)}>{nota.concluida ? 'Reabrir' : 'Concluir'}</button>
                  <button style={styles.btnEditar} onClick={() => abrirEdicaoNota(nota)}>Editar</button>
                  <button style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Mover nota para lixeira', mensagem: `Deseja mover a nota ${nota.titulo} para a lixeira? Ela ficará em quarentena por 60 dias.`, textoConfirmar: 'Mover', tipo: 'perigo', acao: () => excluirNota(nota.id) })}>Excluir</button>
                </div>
              </div>
            )
          })}
        </div>
        )}
      </section>
    </>
  )
}
