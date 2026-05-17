export default function MobileMenu({
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
  if (!visible) return null

  const exibirSeletorEmpresa = canSwitchCompany && empresasDisponiveis.length > 0
  const empresaAtual = empresasDisponiveis.find((empresa) => empresa.id === empresaId)
  const nomeExibicao = nomeUsuarioAtual || (typeof nomeUsuario === 'function' ? nomeUsuario() : nomeUsuario) || 'usuário'

  const item = (icon, titulo, desc, acao, tela) => (
    <button
      type="button"
      style={styles.menuNavItem}
      onPointerEnter={() => onPreloadRoute?.(tela)}
      onFocus={() => onPreloadRoute?.(tela)}
      onTouchStart={() => onPreloadRoute?.(tela)}
      onClick={acao}
    >
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
          <div><strong>{nomeExibicao}</strong><small>{normalizarPerfil(perfilUsuario || 'usuário')}</small></div>
        </div>

        {exibirSeletorEmpresa && (
          <div
            className="mobile-company-switcher"
            style={{
              margin: '12px 0 18px',
              padding: '12px 14px',
              border: '1px solid rgba(20, 184, 166, 0.22)',
              borderRadius: 18,
              background: 'rgba(240, 253, 250, 0.9)',
              display: 'grid',
              gap: 8
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 900, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '.08em' }}>Empresa ativa</span>
            {empresasDisponiveis.length > 1 ? (
              <select
                value={empresaId || ''}
                disabled={trocandoEmpresa}
                onChange={(event) => {
                  trocarEmpresaAtiva?.(event.target.value)
                  setMenuNavegacaoAberto(false)
                }}
                aria-label="Empresa ativa"
                style={{
                  width: '100%',
                  border: '0',
                  background: 'transparent',
                  color: '#111827',
                  fontWeight: 900,
                  fontSize: 15,
                  outline: 'none'
                }}
              >
                {empresasDisponiveis.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>{empresa.nome || empresa.id}</option>
                ))}
              </select>
            ) : (
              <strong style={{ color: '#111827', fontSize: 15 }}>{empresaAtual?.nome || 'Empresa ativa'}</strong>
            )}
          </div>
        )}


        <button
          type="button"
          style={styles.menuNavItem}
          onClick={() => {
            setMenuNavegacaoAberto(false)
            abrirPerfilUsuario?.()
          }}
        >
          <span>👤</span>
          <div><strong>Meu perfil</strong><small>Editar nome do usuário</small></div>
        </button>

        {menuSections.map((grupo, index) => (
          <details className="mobile-menu-group" key={grupo.id} open={index === 0}>
            <summary>{grupo.titulo}</summary>
            {grupo.items.map((navItem) => (
              item(navItem.icon, navItem.label, navItem.desc, () => navegarPara(navItem.tela), navItem.tela)
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
