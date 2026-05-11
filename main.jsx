export default function ConfirmModal({ styles, confirmacao, fecharConfirmacao, executarConfirmacao }) {
  if (!confirmacao?.aberto) return null

  return (
    <div style={styles.overlayConfirmacao}>
      <div style={styles.modalConfirmacao}>
        <div style={styles.confirmacaoIcone}>
          {confirmacao.tipo === 'perigo' ? '⚠️' : confirmacao.tipo === 'sucesso' ? '✅' : 'ℹ️'}
        </div>

        <h3 style={styles.confirmacaoTitulo}>{confirmacao.titulo}</h3>
        <p style={styles.confirmacaoTexto}>{confirmacao.mensagem}</p>

        <div style={styles.confirmacaoAcoes}>
          <button style={styles.btnConfirmarCancelar} onClick={fecharConfirmacao}>
            Cancelar
          </button>

          <button
            style={{
              ...styles.btnConfirmarAcao,
              background: confirmacao.tipo === 'perigo' ? '#dc3545' : confirmacao.tipo === 'sucesso' ? '#14b8a6' : '#0d6efd'
            }}
            onClick={executarConfirmacao}
          >
            {confirmacao.textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
