function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

export default function LixeiraPage({
  styles,
  contasLixeira = [],
  notasLixeira = [],
  podeGerenciarLixeira = false,
  podeExcluirDefinitivoFinanceiro = false,
  navegarPara,
  abrirConfirmacao,
  restaurarConta,
  excluirContaDefinitivo,
  restaurarNota,
  excluirNotaDefinitivo,
  diasNaLixeira,
  podeExcluirDefinitivo,
  formatarValor,
  formatarData
}) {
  const totalItensLixeira = contasLixeira.length + notasLixeira.length

  if (!podeGerenciarLixeira) {
    return (
      <div className="trash-page">
        <div className="trash-page-header">
          <div>
            <h1 style={styles.titulo}>Lixeira</h1>
            <p style={styles.textoNota}>Área de recuperação e exclusão definitiva de registros.</p>
          </div>
        </div>

        <section style={styles.cardConfiguracao} className="trash-access-card">
          <span className="trash-type-badge trash-type-restricted">Restrito</span>
          <h2 style={styles.subtitulo}>Acesso restrito</h2>
          <p style={styles.textoNota}>Seu perfil atual não permite acessar a lixeira.</p>
          <button className="trash-back-button" style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>Voltar</button>
        </section>
      </div>
    )
  }

  return (
    <div className="trash-page">
      <div className="trash-page-header">
        <div>
          <h1 style={styles.titulo}>Lixeira</h1>
          <p style={styles.textoNota}>Recupere itens excluídos ou conclua a remoção definitiva com segurança.</p>
        </div>
        <button className="trash-back-button" style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
          Voltar ao painel
        </button>
      </div>

      <section className="trash-summary" aria-label="Resumo da lixeira">
        <div>
          <span>Total</span>
          <strong>{totalItensLixeira}</strong>
        </div>
        <div>
          <span>Contas</span>
          <strong>{contasLixeira.length}</strong>
        </div>
        <div>
          <span>Notas</span>
          <strong>{notasLixeira.length}</strong>
        </div>
      </section>

      <div className="trash-sections-grid">
        <section className="trash-section trash-section-accounts" style={styles.bloco}>
          <div className="trash-section-header">
            <div>
              <span className="trash-kicker">Recuperação financeira</span>
              <h2 style={styles.subtitulo}>Contas excluídas</h2>
              <p>Contas ficam em quarentena por até 60 dias antes da remoção definitiva.</p>
            </div>
            <span className="trash-count-badge">{contasLixeira.length}</span>
          </div>

          {contasLixeira.length === 0 && (
            <EmptyState icon="🧹" title="Nenhuma conta na lixeira" description="As contas excluídas aparecerão aqui durante o período de quarentena." />
          )}

          {contasLixeira.map((conta) => {
            const dias = diasNaLixeira(conta.excluido_em)
            const liberada = podeExcluirDefinitivo(conta.excluido_em)

            return (
              <div key={conta.id} className="trash-card trash-card-account" style={styles.cardLixeira}>
                <div className="trash-card-top" style={styles.cardTopo}>
                  <span className="trash-type-badge trash-type-account">Conta</span>
                  <strong>{conta.descricao}</strong>
                  <span className="trash-card-value">{formatarValor(conta.valor)}</span>
                </div>

                <div className="trash-card-meta" style={styles.cardInfo}>
                  <span>Venc.: {formatarData(conta.data_vencimento)}</span>
                  <span>Centro: {conta.df_centros_custo?.nome || 'Sem centro'}</span>
                  <span>Lixeira há {dias} dia(s)</span>
                </div>

                <small className={`trash-quarantine ${liberada ? 'trash-quarantine-ready' : 'trash-quarantine-safe'}`} style={liberada ? styles.textoLiberado : styles.textoQuarentena}>
                  Excluída há {dias} dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente.
                </small>

                <div className="trash-card-actions" style={styles.acoes}>
                  <button className="trash-action-restore" style={styles.btnPago} onClick={() => abrirConfirmacao({ titulo: 'Restaurar conta', mensagem: `Deseja restaurar a conta ${conta.descricao}?`, textoConfirmar: 'Restaurar', tipo: 'sucesso', acao: () => restaurarConta(conta.id) })}>
                    Restaurar
                  </button>

                  {podeExcluirDefinitivoFinanceiro && (
                    <button className="trash-action-danger" style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Excluir definitivamente', mensagem: `Excluir definitivamente a conta ${conta.descricao}? Essa ação não poderá ser desfeita.`, textoConfirmar: 'Excluir definitivo', tipo: 'perigo', acao: () => excluirContaDefinitivo(conta) })}>
                      Excluir definitivo
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </section>

        <section className="trash-section trash-section-notes" style={styles.bloco}>
          <div className="trash-section-header">
            <div>
              <span className="trash-kicker">Recuperação operacional</span>
              <h2 style={styles.subtitulo}>Notas excluídas</h2>
              <p>Notas removidas podem ser restauradas dentro do período de segurança.</p>
            </div>
            <span className="trash-count-badge">{notasLixeira.length}</span>
          </div>

          {notasLixeira.length === 0 && (
            <EmptyState icon="🗒️" title="Nenhuma nota na lixeira" description="As notas excluídas aparecerão aqui antes da remoção definitiva." />
          )}

          {notasLixeira.map((nota) => {
            const dias = diasNaLixeira(nota.excluido_em)
            const liberada = podeExcluirDefinitivo(nota.excluido_em)

            return (
              <div key={nota.id} className="trash-card trash-card-note" style={styles.cardLixeira}>
                <div className="trash-card-top">
                  <span className="trash-type-badge trash-type-note">Nota</span>
                  <strong>{nota.titulo}</strong>
                </div>

                {nota.conteudo && (
                  <p className="trash-note-preview" style={styles.textoNota}>{nota.conteudo}</p>
                )}

                <small className={`trash-quarantine ${liberada ? 'trash-quarantine-ready' : 'trash-quarantine-safe'}`} style={liberada ? styles.textoLiberado : styles.textoQuarentena}>
                  Excluída há {dias} dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente.
                </small>

                <div className="trash-card-actions" style={styles.acoes}>
                  <button className="trash-action-restore" style={styles.btnPago} onClick={() => abrirConfirmacao({ titulo: 'Restaurar nota', mensagem: `Deseja restaurar a nota ${nota.titulo}?`, textoConfirmar: 'Restaurar', tipo: 'sucesso', acao: () => restaurarNota(nota.id) })}>
                    Restaurar
                  </button>

                  {podeExcluirDefinitivoFinanceiro && (
                    <button className="trash-action-danger" style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Excluir definitivamente', mensagem: `Excluir definitivamente a nota ${nota.titulo}? Essa ação não poderá ser desfeita.`, textoConfirmar: 'Excluir definitivo', tipo: 'perigo', acao: () => excluirNotaDefinitivo(nota) })}>
                      Excluir definitivo
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}
