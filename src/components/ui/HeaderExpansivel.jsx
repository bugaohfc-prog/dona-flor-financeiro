export default function HeaderExpansivel({ styles, titulo, subtitulo, meta, aberto, onClick, className = '' }) {
  const partesTitulo = String(titulo || '').split(' ')
  const iconeTitulo = partesTitulo[0] || ''
  const textoTitulo = partesTitulo.slice(1).join(' ') || titulo

  return (
    <button type="button" style={styles.headerExpansivel} className={`admin-section-toggle ${className}`.trim()} onClick={onClick}>
      <span className="admin-section-title">
        <span className="admin-section-icon">{iconeTitulo}</span>
        <span>
          <span>{textoTitulo}</span>
          {subtitulo && <small>{subtitulo}</small>}
        </span>
      </span>

      <span className="admin-section-actions">
        {meta && <em>{meta}</em>}
        <strong>{aberto ? '−' : '+'}</strong>
      </span>
    </button>
  )
}
