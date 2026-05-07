function MenuItem({ tela, icon, label, telaAtual, sidebarCompacta, navegarPara }) {
  const ativo = tela && telaAtual === tela

  return (
    <button
      className={ativo ? 'active' : ''}
      title={label}
      onClick={() => navegarPara(tela)}
    >
      <span className="menu-icon">{icon}</span>
      {!sidebarCompacta && <span className="menu-text">{label}</span>}
    </button>
  )
}

function MenuGroup({ id, titulo, children, sidebarCompacta, gruposMenu, toggleGrupoMenu }) {
  return (
    <div className="sidebar-group-clean">
      <button className="sidebar-group-toggle" onClick={() => toggleGrupoMenu(id)} title={titulo}>
        <span>{!sidebarCompacta ? titulo : '•'}</span>
        {!sidebarCompacta && <strong>{gruposMenu[id] ? '−' : '+'}</strong>}
      </button>
      {(sidebarCompacta || gruposMenu[id]) && <nav className="desktop-sidebar-nav">{children}</nav>}
    </div>
  )
}

export default function Sidebar({
  sidebarCompacta,
  setSidebarCompacta,
  nomeUsuario,
  normalizarPerfil,
  perfilUsuario,
  menuSections,
  telaAtual,
  navegarPara,
  gruposMenu,
  toggleGrupoMenu,
  sairDoSistema
}) {
  const nome = nomeUsuario()
  const perfil = normalizarPerfil(perfilUsuario || 'usuário')

  return (
    <aside className={`desktop-sidebar no-print ${sidebarCompacta ? 'compacta' : ''}`}>
      <div className="desktop-sidebar-brand sidebar-brand-clean" title="DF Gestão Financeira">
        <img src="/icon-192.png" alt="DF Gestão Financeira" />
        {!sidebarCompacta && (
          <div>
            <strong>DF Gestão</strong>
            <small>Painel financeiro</small>
          </div>
        )}
      </div>

      <div className="desktop-sidebar-user sidebar-user-clean" title={`${nome} • ${perfil}`}>
        <span className="sidebar-user-avatar">{String(nome || 'U').slice(0, 1).toUpperCase()}</span>
        {!sidebarCompacta && (
          <div>
            <strong>{nome}</strong>
            <small>{perfil}</small>
          </div>
        )}
      </div>

      <button className="sidebar-collapse-btn sidebar-collapse-icon" onClick={() => setSidebarCompacta(!sidebarCompacta)} title={sidebarCompacta ? 'Expandir menu' : 'Recolher menu'} aria-label={sidebarCompacta ? 'Expandir menu' : 'Recolher menu'}>
        <span className="sidebar-collapse-arrow">{sidebarCompacta ? '→' : '←'}</span>
      </button>

      <div className="desktop-sidebar-scroll">
        {menuSections.map((grupo) => (
          <MenuGroup
            key={grupo.id}
            id={grupo.id}
            titulo={grupo.titulo}
            sidebarCompacta={sidebarCompacta}
            gruposMenu={gruposMenu}
            toggleGrupoMenu={toggleGrupoMenu}
          >
            {grupo.items.map((navItem) => (
              <MenuItem
                key={navItem.tela}
                tela={navItem.tela}
                icon={navItem.icon}
                label={navItem.label}
                telaAtual={telaAtual}
                sidebarCompacta={sidebarCompacta}
                navegarPara={navegarPara}
              />
            ))}
          </MenuGroup>
        ))}
      </div>

      <div className="desktop-sidebar-spacer" />
      <nav className="desktop-sidebar-nav sidebar-exit">
        <button onClick={sairDoSistema} title="Sair"><span className="menu-icon">🚪</span>{!sidebarCompacta && <span>Sair</span>}</button>
      </nav>
    </aside>
  )
}
