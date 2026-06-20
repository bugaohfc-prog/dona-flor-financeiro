export default function GlobalFab({ styles, menuAberto, setMenuAberto, abrirNovaConta, abrirNovaNota }) {
  return (
    <div className="global-fab-actions" aria-label="Ações rápidas">
      {menuAberto && (
        <div
          className="global-fab-menu"
          style={styles.menuFab}
          role="menu"
          aria-label="Ações rápidas"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className="global-fab-menu-item"
            style={styles.menuItem}
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              abrirNovaConta()
            }}
            aria-label="Nova conta"
            role="menuitem"
          >
            <span className="global-fab-menu-icon" style={styles.menuItemIcone} aria-hidden="true">C</span>
            <span className="global-fab-menu-copy" style={styles.menuItemTexto}>
              <strong>Nova conta</strong>
              <small>Registrar lançamento financeiro</small>
            </span>
          </button>

          <button
            className="global-fab-menu-item"
            style={styles.menuItem}
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              abrirNovaNota()
            }}
            aria-label="Nova nota"
            role="menuitem"
          >
            <span className="global-fab-menu-icon" style={styles.menuItemIcone} aria-hidden="true">N</span>
            <span className="global-fab-menu-copy" style={styles.menuItemTexto}>
              <strong>Nova nota</strong>
              <small>Criar lembrete operacional</small>
            </span>
          </button>
        </div>
      )}

      <button
        className="global-fab"
        style={styles.fab}
        type="button"
        aria-label={menuAberto ? 'Fechar ações rápidas' : 'Abrir ações rápidas'}
        aria-expanded={menuAberto}
        onClick={(event) => {
          event.stopPropagation()
          setMenuAberto(!menuAberto)
        }}
      >
        <span aria-hidden="true">{menuAberto ? '×' : '+'}</span>
      </button>
    </div>
  )
}
