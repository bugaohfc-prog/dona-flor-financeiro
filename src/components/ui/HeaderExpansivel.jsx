export default function HeaderExpansivel({ styles, titulo, aberto, onClick }) {
  const partesTitulo = String(titulo || '').split(' ')
  const iconeTitulo = partesTitulo[0] || ''
  const textoTitulo = partesTitulo.slice(1).join(' ') || titulo

  return (
    <button style={styles.headerExpansivel} onClick={onClick}>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: '#0f172a',
          fontWeight: 900,
          lineHeight: 1.1
        }}
      >
        <span style={{ fontSize: 24, lineHeight: 1 }}>{iconeTitulo}</span>
        <span>{textoTitulo}</span>
      </span>
      <strong style={{ color: '#0f172a' }}>{aberto ? '−' : '+'}</strong>
    </button>
  )
}
