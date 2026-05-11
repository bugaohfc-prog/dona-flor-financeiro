export default function Topbar({
  styles,
  nomeEmpresa,
  navegarPara,
  menuNavegacaoAberto,
  setMenuNavegacaoAberto
}) {
  return (
    <section className="no-print top-shell top-shell-clean top-shell-executive" style={styles.usuarioTopo}>
      <div className="top-shell-context">
        <button className="top-shell-logo" style={styles.logoMarca} onClick={() => navegarPara('dashboard')} title="Ir para o dashboard">
          <img src="/icon-192.png" alt="DF Gestão Financeira" style={styles.logoImagem} />
          <span>
            <strong>{nomeEmpresa || 'Dona Flor'}</strong>
            <small>Gestão Financeira</small>
          </span>
        </button>
      </div>

      <div className="top-shell-command" aria-label="Comando executivo">
        <div className="top-shell-search" role="search">
          <span aria-hidden="true">⌕</span>
          <small>Buscar conta, nota ou centro de custo</small>
        </div>
        <button type="button" onClick={() => navegarPara('agenda')}>Agenda</button>
        <button type="button" onClick={() => navegarPara('contas')}>Contas</button>
        <button type="button" onClick={() => navegarPara('relatorios')}>Relatórios</button>
      </div>

      <div className="top-shell-actions" style={styles.usuarioAcoes}>
        <div className="top-shell-status">
          <span>Empresa ativa</span>
          <strong>{nomeEmpresa || 'Dona Flor'}</strong>
        </div>
        <button className="top-shell-avatar" type="button" title="Perfil">DF</button>
        <button className="mobile-menu-trigger" style={styles.btnMenuTopo} onClick={() => setMenuNavegacaoAberto(!menuNavegacaoAberto)}>☰</button>
      </div>
    </section>
  )
}
