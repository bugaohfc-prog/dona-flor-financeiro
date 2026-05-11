export default function Topbar({
  styles,
  nomeEmpresa,
  navegarPara,
  menuNavegacaoAberto,
  setMenuNavegacaoAberto
}) {
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
        <button className="mobile-menu-trigger" style={styles.btnMenuTopo} onClick={() => setMenuNavegacaoAberto(!menuNavegacaoAberto)}>☰</button>
      </div>
    </section>
  )
}
