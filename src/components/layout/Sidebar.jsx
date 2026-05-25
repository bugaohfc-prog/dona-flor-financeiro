import { memo, useCallback, useMemo } from 'react'

const MenuItem = memo(function MenuItem({ tela, icon, label, telaAtual, sidebarCompacta, navegarPara, onPreloadRoute }) {
  const ativo = tela && telaAtual === tela

  return (
    <button
      className={ativo ? 'active' : ''}
      title={label}
      onPointerEnter={() => onPreloadRoute?.(tela)}
      onFocus={() => onPreloadRoute?.(tela)}
      onClick={() => navegarPara(tela)}
    >
      <span className="menu-icon">{icon}</span>
      {!sidebarCompacta && <span className="menu-text">{label}</span>}
    </button>
  )
})

const ActionItem = memo(function ActionItem({ icon, label, sidebarCompacta, onClick }) {
  return (
    <button type="button" title={label} onClick={onClick}>
      <span className="menu-icon">{icon}</span>
      {!sidebarCompacta && <span className="menu-text">{label}</span>}
    </button>
  )
})

const MenuGroup = memo(function MenuGroup({ id, titulo, children, sidebarCompacta, gruposMenu, toggleGrupoMenu }) {
  const aberto = sidebarCompacta || Boolean(gruposMenu[id])

  return (
    <div className="sidebar-group-clean">
      <button className="sidebar-group-toggle" onClick={() => toggleGrupoMenu(id)} title={titulo}>
        <span>{!sidebarCompacta ? titulo : '•'}</span>
        {!sidebarCompacta && <strong>{aberto ? '−' : '+'}</strong>}
      </button>
      {aberto && <nav className="desktop-sidebar-nav">{children}</nav>}
    </div>
  )
})

function Sidebar({
  sidebarCompacta,
  setSidebarCompacta,
  nomeUsuario,
  nomeUsuarioAtual,
  normalizarPerfil,
  perfilUsuario,
  menuSections,
  telaAtual,
  navegarPara,
  gruposMenu,
  toggleGrupoMenu,
  sairDoSistema,
  abrirPerfilUsuario,
  onPreloadRoute
}) {
  const nome = useMemo(() => {
    if (nomeUsuarioAtual) return nomeUsuarioAtual
    return typeof nomeUsuario === 'function' ? nomeUsuario() : nomeUsuario
  }, [nomeUsuario, nomeUsuarioAtual])

  const perfil = useMemo(() => normalizarPerfil(perfilUsuario || 'usuário'), [normalizarPerfil, perfilUsuario])

  const alternarSidebarCompacta = useCallback(() => {
    setSidebarCompacta((compacta) => !compacta)
  }, [setSidebarCompacta])

  const abrirPerfil = useCallback(() => {
    abrirPerfilUsuario?.()
  }, [abrirPerfilUsuario])

  return (
    <aside className={`desktop-sidebar no-print ${sidebarCompacta ? 'compacta' : ''}`}>
      <div className="desktop-sidebar-brand sidebar-brand-clean" title="DNA Gestão">
        <img src="/icon-192.png" alt="DNA Gestão" />
        {!sidebarCompacta && (
          <div>
            <strong>DNA Gestão</strong>
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

      <button className="sidebar-collapse-btn sidebar-collapse-icon" onClick={alternarSidebarCompacta} title={sidebarCompacta ? 'Expandir menu' : 'Recolher menu'} aria-label={sidebarCompacta ? 'Expandir menu' : 'Recolher menu'}>
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
                onPreloadRoute={onPreloadRoute}
              />
            ))}
          </MenuGroup>
        ))}
      </div>

      <div className="desktop-sidebar-spacer" />
      <MenuGroup
        id="conta"
        titulo="Conta"
        sidebarCompacta={sidebarCompacta}
        gruposMenu={gruposMenu}
        toggleGrupoMenu={toggleGrupoMenu}
      >
        <ActionItem icon="👤" label="Meu perfil" sidebarCompacta={sidebarCompacta} onClick={abrirPerfil} />
        <ActionItem icon="🚪" label="Sair" sidebarCompacta={sidebarCompacta} onClick={sairDoSistema} />
      </MenuGroup>
    </aside>
  )
}

export default memo(Sidebar)
