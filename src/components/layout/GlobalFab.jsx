export default function GlobalFab({ styles, menuAberto, setMenuAberto, abrirNovaConta, abrirNovaNota }) {
  return (
    <>
      {menuAberto && (
        <div className="global-fab-menu" style={styles.menuFab} onClick={(event) => event.stopPropagation()}>
          <button
            style={styles.menuItem}
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              abrirNovaConta()
            }}
            aria-label="Nova conta"
          >
            <span style={styles.menuItemIcone}>💰</span>
            <span style={styles.menuItemTexto}>Nova conta</span>
          </button>

          <button
            style={styles.menuItem}
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              abrirNovaNota()
            }}
            aria-label="Nova nota"
          >
            <span style={styles.menuItemIcone}>📝</span>
            <span style={styles.menuItemTexto}>Nova nota</span>
          </button>
        </div>
      )}

      <button
        className="global-fab"
        style={styles.fab}
        onClick={(event) => {
          event.stopPropagation()
          setMenuAberto(!menuAberto)
        }}
      >
        {menuAberto ? '×' : '+'}
      </button>
    </>
  )
}
