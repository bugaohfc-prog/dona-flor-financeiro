export default function CostCenterModal({
  styles,
  novoCentro,
  setNovoCentro,
  salvarCentro,
  centros,
  abrirConfirmacao,
  excluirCentro,
  fecharConta,
  fecharNota,
  setModalCentro,
  setMenuAberto,
  setMenuNavegacaoAberto
}) {
  function fecharTudo() {
    fecharConta()
    fecharNota()
    setModalCentro(false)
    setMenuAberto(false)
    setMenuNavegacaoAberto(false)
  }

  return (
    <div style={styles.overlay} onClick={fecharTudo}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Centros de Custo</h3>
        <input style={styles.inputModal} placeholder="Novo centro" value={novoCentro} onChange={(e) => setNovoCentro(e.target.value)} autoFocus />
        <button style={styles.btnSalvar} onClick={salvarCentro}>Salvar Centro</button>
        {centros.map((centro) => (
          <div key={centro.id} style={styles.itemCentro}>
            <span>{centro.nome}</span>
            <button
              style={styles.btnMiniExcluir}
              onClick={() => abrirConfirmacao({
                titulo: 'Excluir centro de custo',
                mensagem: `Deseja excluir o centro ${centro.nome}?`,
                textoConfirmar: 'Excluir',
                tipo: 'perigo',
                acao: () => excluirCentro(centro.id)
              })}
            >
              excluir
            </button>
          </div>
        ))}
        <button style={styles.btnCancelar} onClick={() => setModalCentro(false)}>Fechar</button>
      </div>
    </div>
  )
}
