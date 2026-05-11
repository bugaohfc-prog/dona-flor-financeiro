export default function Topbar({
  styles,
  nomeEmpresa,
  navegarPara,
  menuNavegacaoAberto,
  setMenuNavegacaoAberto
}) {
  return (
    <section className="no-print top-shell top-shell-clean executive-command-bar" style={styles.usuarioTopo}>
      <div className="top-shell-context command-brand-area">
        <button className="top-shell-logo" style={styles.logoMarca} onClick={() => navegarPara('dashboard')} title="Ir para o dashboard">
          <img src="/icon-192.png" alt="DF Gestão Financeira" style={styles.logoImagem} />
          <span>
            <strong>{nomeEmpresa || 'Dona Flor'}</strong>
            <small>Gestão Financeira</small>
          </span>
        </button>
      </div>

      <div className="command-center" aria-label="Comando executivo">
        <button type="button" className="command-search" onClick={() => navegarPara('contas')} title="Ir para contas">
          <span>⌕</span>
          <strong>Buscar contas, datas e centros</strong>
        </button>
        <button type="button" className="command-chip" onClick={() => navegarPara('agenda')} title="Abrir agenda">
          <span>📅</span>
          <strong>Agenda</strong>
        </button>
        <button type="button" className="command-chip" onClick={() => navegarPara('relatorios')} title="Abrir relatórios">
          <span>📊</span>
          <strong>Relatórios</strong>
        </button>
      </div>

      <div className="top-shell-actions command-actions" style={styles.usuarioAcoes}>
        <div className="command-status" aria-label="Status do sistema">
          <span />
          <strong>Operacional</strong>
        </div>
        <button className="mobile-menu-trigger" style={styles.btnMenuTopo} onClick={() => setMenuNavegacaoAberto(!menuNavegacaoAberto)}>☰</button>
      </div>
    </section>
  )
}
