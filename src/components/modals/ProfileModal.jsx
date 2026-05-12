export default function ProfileModal({
  nome,
  setNome,
  email,
  salvando,
  onClose,
  onSave
}) {
  return (
    <div className="profile-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="profile-modal-card" role="dialog" aria-modal="true" aria-label="Meu perfil" onClick={(event) => event.stopPropagation()}>
        <div className="profile-modal-header">
          <div>
            <span>Perfil</span>
            <h2>Meu perfil</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <label className="profile-modal-field">
          <span>Nome de exibição</span>
          <input
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Digite seu nome"
            autoFocus
            maxLength={80}
          />
        </label>

        <label className="profile-modal-field">
          <span>E-mail</span>
          <input value={email || ''} readOnly />
        </label>

        <div className="profile-modal-actions">
          <button type="button" className="profile-modal-cancel" onClick={onClose} disabled={salvando}>Cancelar</button>
          <button type="button" className="profile-modal-save" onClick={onSave} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </div>
      </div>
    </div>
  )
}
