export function FolhaSectionHeader({ kicker, titulo, descricao, resumo, aberto, onToggle, acao }) {
  return (
    <div className="folha-section-header">
      <div className="folha-section-title">
        {kicker && <span>{kicker}</span>}
        <strong>{titulo}</strong>
        {descricao && <small>{descricao}</small>}
        {!aberto && resumo && <em>{resumo}</em>}
      </div>
      <div className="folha-section-actions">
        {acao}
        <button
          className="folha-section-toggle"
          type="button"
          onClick={onToggle}
          aria-expanded={aberto}
          aria-label={aberto ? `Recolher ${titulo}` : `Expandir ${titulo}`}
        >
          {aberto ? '\u2212' : '+'}
        </button>
      </div>
    </div>
  )
}

export function FolhaSubsectionHeader({ titulo, descricao, aberto, onToggle }) {
  return (
    <button
      className="folha-subsection-toggle folha-form-subsection-header"
      type="button"
      onClick={onToggle}
      aria-expanded={aberto}
      aria-label={aberto ? `Recolher ${titulo}` : `Expandir ${titulo}`}
    >
      <span className="folha-form-subsection-copy">
        <strong>{titulo}</strong>
        {descricao && <small>{descricao}</small>}
      </span>
      <b className="folha-form-subsection-toggle">{aberto ? '\u2212' : '+'}</b>
    </button>
  )
}
