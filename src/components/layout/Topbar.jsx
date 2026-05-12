export default function Topbar({
  styles,
  nomeEmpresa,
  navegarPara,
  menuNavegacaoAberto,
  setMenuNavegacaoAberto,
  canSwitchCompany = false,
  empresasDisponiveis = [],
  empresaId = '',
  trocarEmpresaAtiva,
  trocandoEmpresa = false,
  nomeUsuario,
  abrirPerfilUsuario,
  sairDoSistema
}) {
  const exibirSeletorEmpresa = canSwitchCompany && empresasDisponiveis.length > 0
  const empresaAtual = empresasDisponiveis.find((empresa) => empresa.id === empresaId)
  return (
    <section className="no-print top-shell top-shell-clean" style={styles.usuarioTopo}>
      <div className="top-shell-context">
        <button className="top-shell-logo" style={styles.logoMarca} onClick={() => navegarPara('dashboard')} title="Ir para o dashboard">
          <img src="/icon-192.png" alt="DF Gestão Financeira" style={styles.logoImagem} />
          <span>
            <strong>{nomeEmpresa || 'Dona Flor'}</strong>
            <small>Gestão Financeira</small>
          </span>
        </button>
      </div>

      <div className="top-shell-actions" style={styles.usuarioAcoes}>

        {exibirSeletorEmpresa && (
          empresasDisponiveis.length > 1 ? (
            <label className="company-switcher" title="Trocar empresa ativa">
              <span>Empresa</span>
              <select
                value={empresaId || ''}
                disabled={trocandoEmpresa}
                onChange={(event) => trocarEmpresaAtiva?.(event.target.value)}
                aria-label="Empresa ativa"
              >
                {empresasDisponiveis.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>{empresa.nome || empresa.id}</option>
                ))}
              </select>
            </label>
          ) : (
            <div className="company-switcher company-switcher-static" title="Empresa ativa">
              <span>Empresa</span>
              <strong>{empresaAtual?.nome || nomeEmpresa || 'Empresa ativa'}</strong>
            </div>
          )
        )}
        <button
          type="button"
          className="top-user-profile-button top-user-profile-icon"
          title={`Meu perfil${typeof nomeUsuario === 'function' ? `: ${nomeUsuario()}` : ''}`}
          onClick={() => abrirPerfilUsuario?.()}
          aria-label="Abrir meu perfil"
        >
          <span aria-hidden="true">👤</span>
        </button>
        <button className="mobile-menu-trigger" style={styles.btnMenuTopo} onClick={() => setMenuNavegacaoAberto(!menuNavegacaoAberto)}>☰</button>
      </div>
    </section>
  )
}
