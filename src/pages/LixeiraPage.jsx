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
  if (!podeGerenciarLixeira) {
    return (
      <>
        <h1 style={styles.titulo}>Lixeira</h1>
        <section style={styles.cardConfiguracao}>
          <h2 style={styles.subtitulo}>Acesso restrito</h2>
          <p style={styles.textoNota}>Seu perfil atual não permite acessar a lixeira.</p>
          <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>← Voltar</button>
        </section>
      </>
    )
  }

  return (
    <>
      <h1 style={styles.titulo}>🗑️ Lixeira</h1>

      <button className="btn-back-page" style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
        ← Voltar
      </button>

      <section className="trash-section trash-section-accounts" style={styles.bloco}>
        <h2 style={styles.subtitulo}>💰 Contas excluídas</h2>

        {contasLixeira.length === 0 && (
          <EmptyState icon="🧹" title="Nenhuma conta na lixeira" description="As contas excluídas aparecerão aqui durante o período de quarentena." />
        )}

        {contasLixeira.map((conta) => {
          const dias = diasNaLixeira(conta.excluido_em)
          const liberada = podeExcluirDefinitivo(conta.excluido_em)

          return (
            <div key={conta.id} className="trash-card trash-card-account" style={styles.cardLixeira}>
              <div style={styles.cardTopo}>
                <strong>{conta.descricao}</strong>
                <span>{formatarValor(conta.valor)}</span>
              </div>

              <div style={styles.cardInfo}>
                Venc.: {formatarData(conta.data_vencimento)} •
                Centro: {conta.df_centros_custo?.nome || 'Sem centro'} •
                Lixeira há {dias} dia(s)
              </div>

              <small style={liberada ? styles.textoLiberado : styles.textoQuarentena}>
                Excluída há {dias} dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente.
              </small>

              <div style={styles.acoes}>
                <button style={styles.btnPago} onClick={() => abrirConfirmacao({ titulo: 'Restaurar conta', mensagem: `Deseja restaurar a conta ${conta.descricao}?`, textoConfirmar: 'Restaurar', tipo: 'sucesso', acao: () => restaurarConta(conta.id) })}>
                  Restaurar
                </button>

                {podeExcluirDefinitivoFinanceiro && (
                  <button style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Excluir definitivamente', mensagem: `Excluir definitivamente a conta ${conta.descricao}? Essa ação não poderá ser desfeita.`, textoConfirmar: 'Excluir definitivo', tipo: 'perigo', acao: () => excluirContaDefinitivo(conta) })}>
                    Excluir definitivo
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </section>

      <section className="trash-section trash-section-notes" style={styles.bloco}>
        <h2 style={styles.subtitulo}>📝 Notas excluídas</h2>

        {notasLixeira.length === 0 && (
          <EmptyState icon="🗒️" title="Nenhuma nota na lixeira" description="As notas excluídas aparecerão aqui antes da remoção definitiva." />
        )}

        {notasLixeira.map((nota) => {
          const dias = diasNaLixeira(nota.excluido_em)
          const liberada = podeExcluirDefinitivo(nota.excluido_em)

          return (
            <div key={nota.id} className="trash-card trash-card-note" style={styles.cardLixeira}>
              <strong>{nota.titulo}</strong>

              {nota.conteudo && (
                <p style={styles.textoNota}>{nota.conteudo}</p>
              )}

              <small style={liberada ? styles.textoLiberado : styles.textoQuarentena}>
                Excluída há {dias} dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente.
              </small>

              <div style={styles.acoes}>
                <button style={styles.btnPago} onClick={() => abrirConfirmacao({ titulo: 'Restaurar nota', mensagem: `Deseja restaurar a nota ${nota.titulo}?`, textoConfirmar: 'Restaurar', tipo: 'sucesso', acao: () => restaurarNota(nota.id) })}>
                  Restaurar
                </button>

                {podeExcluirDefinitivoFinanceiro && (
                  <button style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Excluir definitivamente', mensagem: `Excluir definitivamente a nota ${nota.titulo}? Essa ação não poderá ser desfeita.`, textoConfirmar: 'Excluir definitivo', tipo: 'perigo', acao: () => excluirNotaDefinitivo(nota) })}>
                    Excluir definitivo
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </section>
    </>
  )
}
