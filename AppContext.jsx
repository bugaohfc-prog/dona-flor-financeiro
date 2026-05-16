export default function NoteModal({
  styles,
  editandoNotaId,
  tituloNota,
  setTituloNota,
  prioridadeNota,
  setPrioridadeNota,
  dataEventoNota,
  setDataEventoNota,
  conteudoNota,
  setConteudoNota,
  filialNotaId,
  setFilialNotaId,
  filiais,
  salvarNota,
  fecharNota,
  fecharConta,
  setModalCentro,
  setMenuAberto,
  setMenuNavegacaoAberto,
  primeiraLetraMaiuscula,
  limitarDataInput
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
        <h3>{editandoNotaId ? 'Editar Nota' : 'Nova Nota'}</h3>
        <input style={styles.inputModal} placeholder="Título" value={tituloNota} onChange={(e) => setTituloNota(primeiraLetraMaiuscula(e.target.value))} />
        <select style={styles.inputModal} value={prioridadeNota} onChange={(e) => setPrioridadeNota(e.target.value)}>
          <option value="normal">Prioridade normal</option>
          <option value="urgente">Urgente</option>
          <option value="critico">Crítico</option>
        </select>
        <select style={styles.inputModal} value={filialNotaId} onChange={(e) => setFilialNotaId(e.target.value)}>
          <option value="">Todas as filiais</option>
          {(filiais || []).map((filial) => (
            <option key={filial.id} value={filial.id}>{filial.nome}</option>
          ))}
        </select>
        <input style={styles.inputModal} type="date" value={dataEventoNota} onChange={(e) => setDataEventoNota(limitarDataInput(e.target.value))} />
        <textarea style={styles.textareaModal} placeholder="Conteúdo..." value={conteudoNota} onChange={(e) => setConteudoNota(e.target.value)} />
        <button style={styles.btnSalvar} onClick={salvarNota}>Salvar</button>
        <button style={styles.btnCancelar} onClick={fecharNota}>Cancelar</button>
      </div>
    </div>
  )
}
