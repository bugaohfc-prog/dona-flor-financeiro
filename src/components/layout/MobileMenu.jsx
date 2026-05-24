import { memo, useCallback, useMemo } from 'react'

const COMPANY_SWITCHER_STYLE = {
  margin: '12px 0 18px',
  padding: '12px 14px',
  border: '1px solid rgba(20, 184, 166, 0.22)',
  borderRadius: 18,
  background: 'rgba(240, 253, 250, 0.9)',
  display: 'grid',
  gap: 8
}

const COMPANY_LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 900,
  color: '#0f766e',
  textTransform: 'uppercase',
  letterSpacing: '.08em'
}

const COMPANY_SELECT_STYLE = {
  width: '100%',
  border: '0',
  background: 'transparent',
  color: '#111827',
  fontWeight: 900,
  fontSize: 15,
  outline: 'none'
}

const COMPANY_NAME_STYLE = {
  color: '#111827',
  fontSize: 15
}

const MobileMenuItem = memo(function MobileMenuItem({ item, styles, navegarPara, onPreloadRoute }) {
  const handleClick = useCallback(() => {
    navegarPara(item.tela)
  }, [item.tela, navegarPara])

  const handlePreload = useCallback(() => {
    onPreloadRoute?.(item.tela)
  }, [item.tela, onPreloadRoute])

  return (
    <button
      type="button"
      style={styles.menuNavItem}
      onPointerEnter={handlePreload}
      onFocus={handlePreload}
      onTouchStart={handlePreload}
      onClick={handleClick}
    >
      <span>{item.icon}</span>
      <div><strong>{item.label}</strong><small>{item.desc}</small></div>
    </button>
  )
})

function MobileMenu({
  visible,
  styles,
  setMenuNavegacaoAberto,
  nomeUsuario,
  nomeUsuarioAtual,
  normalizarPerfil,
  perfilUsuario,
  menuSections,
  navegarPara,
  sairDoSistema,
  canSwitchCompany = false,
  empresasDisponiveis = [],
  empresaId = '',
  trocarEmpresaAtiva,
  trocandoEmpresa = false,
  abrirPerfilUsuario,
  onPreloadRoute
}) {
  const exibirSeletorEmpresa = canSwitchCompany && empresasDisponiveis.length > 0
  const empresaAtual = useMemo(
    () => empresasDisponiveis.find((empresa) => empresa.id === empresaId),
    [empresaId, empresasDisponiveis]
  )

  const nomeExibicao = useMemo(() => {
    if (nomeUsuarioAtual) return nomeUsuarioAtual
    return (typeof nomeUsuario === 'function' ? nomeUsuario() : nomeUsuario) || 'usuário'
  }, [nomeUsuario, nomeUsuarioAtual])

  const perfilExibicao = useMemo(
    () => normalizarPerfil(perfilUsuario || 'usuário'),
    [normalizarPerfil, perfilUsuario]
  )

  const fecharMenu = useCallback(() => {
    setMenuNavegacaoAberto(false)
  }, [setMenuNavegacaoAberto])

  const abrirPerfil = useCallback(() => {
    fecharMenu()
    abrirPerfilUsuario?.()
  }, [abrirPerfilUsuario, fecharMenu])

  const trocarEmpresa = useCallback((event) => {
    trocarEmpresaAtiva?.(event.target.value)
    fecharMenu()
  }, [fecharMenu, trocarEmpresaAtiva])

  if (!visible) return null

  return (
    <div
      className="no-print mobile-menu-backdrop"
      style={styles.menuBackdrop}
      onClick={fecharMenu}
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
          <img src="/icon-192.png" alt="DNA Gestão" style={styles.menuPerfilIcone} />
          <div><strong>DNA Gestão</strong><small>{nomeExibicao} • {perfilExibicao}</small></div>
        </div>

        {exibirSeletorEmpresa && (
          <div
            className="mobile-company-switcher"
            style={COMPANY_SWITCHER_STYLE}
          >
            <span style={COMPANY_LABEL_STYLE}>Empresa ativa</span>
            {empresasDisponiveis.length > 1 ? (
              <select
                value={empresaId || ''}
                disabled={trocandoEmpresa}
                onChange={trocarEmpresa}
                aria-label="Empresa ativa"
                style={COMPANY_SELECT_STYLE}
              >
                {empresasDisponiveis.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>{empresa.nome || empresa.id}</option>
                ))}
              </select>
            ) : (
              <strong style={COMPANY_NAME_STYLE}>{empresaAtual?.nome || 'Empresa ativa'}</strong>
            )}
          </div>
        )}

        <button
          type="button"
          style={styles.menuNavItem}
          onClick={abrirPerfil}
        >
          <span>👤</span>
          <div><strong>Meu perfil</strong><small>Editar nome do usuário</small></div>
        </button>

        {menuSections.map((grupo, index) => (
          <details className="mobile-menu-group" key={grupo.id} open={index === 0}>
            <summary>{grupo.titulo}</summary>
            {grupo.items.map((navItem) => (
              <MobileMenuItem
                key={navItem.tela}
                item={navItem}
                styles={styles}
                navegarPara={navegarPara}
                onPreloadRoute={onPreloadRoute}
              />
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

export default memo(MobileMenu)
