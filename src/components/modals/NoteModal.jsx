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
    <div className="note-modal-backdrop" style={styles.overlay} onClick={fecharTudo}>
      <div className="note-modal-card" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className="note-modal-header">
          <span>Notas</span>
          <h3>{editandoNotaId ? 'Editar nota' : 'Nova nota'}</h3>
          <p>Registre pendências, lembretes e observações operacionais da empresa.</p>
        </header>

        <div className="note-modal-body">
          <section className="note-modal-section">
            <div className="note-modal-section-title">
              <strong>Dados da nota</strong>
              <small>Informe o assunto, prioridade e vínculo operacional.</small>
            </div>

            <div className="note-modal-grid">
              <label className="note-modal-field note-modal-field-wide">
                <span>Título</span>
                <input style={styles.inputModal} placeholder="Título" value={tituloNota} onChange={(e) => setTituloNota(primeiraLetraMaiuscula(e.target.value))} />
              </label>

              <label className="note-modal-field">
                <span>Prioridade</span>
                <select style={styles.inputModal} value={prioridadeNota} onChange={(e) => setPrioridadeNota(e.target.value)}>
                  <option value="normal">Prioridade normal</option>
                  <option value="urgente">Urgente</option>
                  <option value="critico">Crítico</option>
                </select>
              </label>

              <label className="note-modal-field">
                <span>Filial/Unidade</span>
                <select style={styles.inputModal} value={filialNotaId} onChange={(e) => setFilialNotaId(e.target.value)}>
                  <option value="">Todas as filiais</option>
                  {(filiais || []).map((filial) => (
                    <option key={filial.id} value={filial.id}>{filial.nome}</option>
                  ))}
                </select>
              </label>

              <label className="note-modal-field">
                <span>Data do evento</span>
                <input style={styles.inputModal} type="date" value={dataEventoNota} onChange={(e) => setDataEventoNota(limitarDataInput(e.target.value))} />
              </label>
            </div>
          </section>

          <section className="note-modal-section">
            <div className="note-modal-section-title">
              <strong>Conteúdo</strong>
              <small>Descreva o contexto da nota de forma objetiva.</small>
            </div>

            <label className="note-modal-field">
              <span>Conteúdo da nota</span>
              <textarea style={styles.textareaModal} placeholder="Conteúdo..." value={conteudoNota} onChange={(e) => setConteudoNota(e.target.value)} />
            </label>
          </section>
        </div>

        <footer className="note-modal-actions">
          <button className="note-modal-cancel" style={styles.btnCancelar} onClick={fecharNota}>Cancelar</button>
          <button className="note-modal-save" style={styles.btnSalvar} onClick={salvarNota}>Salvar</button>
        </footer>
      </div>
    </div>
  )
}
