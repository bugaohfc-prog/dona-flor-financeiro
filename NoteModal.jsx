export default function MobileMenu({
  visible,
  styles,
  setMenuNavegacaoAberto,
  nomeUsuario,
  normalizarPerfil,
  perfilUsuario,
  menuSections,
  navegarPara,
  sairDoSistema
}) {
  if (!visible) return null

  const item = (icon, titulo, desc, acao) => (
    <button type="button" style={styles.menuNavItem} onClick={acao}>
      <span>{icon}</span>
      <div><strong>{titulo}</strong><small>{desc}</small></div>
    </button>
  )

  return (
    <div
      className="no-print mobile-menu-backdrop"
      style={styles.menuBackdrop}
      onClick={() => setMenuNavegacaoAberto(false)}
      onTouchMove={(e) => e.preventDefault()}
    >
      <div
        className="mobile-menu-panel"
        style={styles.menuNavegacao}
        role="dialog"
        aria-label="Menu de navegação"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div style={styles.menuPerfil}>
          <img src="/icon-192.png" alt="DF Gestão Financeira" style={styles.menuPerfilIcone} />
          <div><strong>{nomeUsuario()}</strong><small>{normalizarPerfil(perfilUsuario || 'usuário')}</small></div>
        </div>

        {menuSections.map((grupo, index) => (
          <details className="mobile-menu-group" key={grupo.id} open={index === 0}>
            <summary>{grupo.titulo}</summary>
            {grupo.items.map((navItem) => (
              item(navItem.icon, navItem.label, navItem.desc, () => navegarPara(navItem.tela))
            ))}
            {grupo.id === 'sistema' && (
              <button type="button" style={styles.menuSairItem} onClick={sairDoSistema}><span>🚪</span><div><strong>Sair</strong><small>Encerrar sessão</small></div></button>
            )}
          </details>
        ))}
      </div>
    </div>
  )
}
