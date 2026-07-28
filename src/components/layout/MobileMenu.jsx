import { memo, useCallback, useEffect, useMemo, useRef } from 'react'

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

const MobileMenuItem = memo(function MobileMenuItem({ item, styles, navegarPara, onPreloadRoute, telaAtual }) {
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
      aria-current={telaAtual === item.tela ? 'page' : undefined}
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
  onPreloadRoute,
  telaAtual,
  menuNavegacaoTriggerRef
}) {
  const painelRef = useRef(null)
  const botaoFecharRef = useRef(null)
  const elementoAtivadorRef = useRef(null)
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

  useEffect(() => {
    if (!visible) return undefined

    elementoAtivadorRef.current = menuNavegacaoTriggerRef?.current || document.activeElement
    botaoFecharRef.current?.focus()

    function aoPressionarTecla(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        fecharMenu()
        return
      }
      if (event.key !== 'Tab') return

      const elementos = [...(painelRef.current?.querySelectorAll(
        'button:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      ) || [])].filter((elemento) => elemento.getClientRects().length > 0)
      if (elementos.length === 0) {
        event.preventDefault()
        return
      }

      const primeiro = elementos[0]
      const ultimo = elementos[elementos.length - 1]
      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault()
        ultimo.focus()
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault()
        primeiro.focus()
      }
    }

    document.addEventListener('keydown', aoPressionarTecla)
    return () => {
      document.removeEventListener('keydown', aoPressionarTecla)
      const ativador = menuNavegacaoTriggerRef?.current || elementoAtivadorRef.current
      if (ativador && document.contains(ativador)) ativador.focus()
    }
  }, [fecharMenu, menuNavegacaoTriggerRef, visible])

  if (!visible) return null

  return (
    <div
      className="no-print mobile-menu-backdrop"
      style={styles.menuBackdrop}
      onClick={fecharMenu}
      onTouchMove={(e) => e.preventDefault()}
    >
      <div
        id="mobile-navigation-dialog"
        ref={painelRef}
        className="mobile-menu-panel"
        style={styles.menuNavegacao}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-navigation-title"
        aria-label="Menu de navegação"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div style={styles.menuPerfil}>
          <img src="/icon-192.png" alt="DNA Gestão" style={styles.menuPerfilIcone} />
          <div style={{ display: 'grid', gap: 2 }}>
            <strong id="mobile-navigation-title">DNA Gestão</strong>
            <small>{nomeExibicao} • {perfilExibicao}</small>
          </div>
          <button
            ref={botaoFecharRef}
            type="button"
            className="mobile-menu-close"
            onClick={fecharMenu}
            aria-label="Fechar menu de navegação"
          >
            ×
          </button>
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
                telaAtual={telaAtual}
              />
            ))}
          </details>
        ))}

        <details className="mobile-menu-group" open>
          <summary>Conta</summary>
          <button
            type="button"
            style={styles.menuNavItem}
            onClick={abrirPerfil}
          >
            <span>👤</span>
            <div><strong>Meu perfil</strong><small>Editar nome do usuário</small></div>
          </button>
          <button type="button" style={styles.menuSairItem} onClick={sairDoSistema}>
            <span>🚪</span>
            <div><strong>Sair</strong><small>Encerrar sessão</small></div>
          </button>
        </details>
      </div>
    </div>
  )
}

export default memo(MobileMenu)
