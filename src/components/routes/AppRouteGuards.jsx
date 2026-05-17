import Login from '../../pages/Login.jsx'
import GlobalToast from '../feedback/GlobalToast.jsx'

export default function AppRouteGuards({
  carregandoAuth,
  usuarioLogado,
  erroEmpresa,
  styles,
  setUsuarioLogado,
  globalToast,
  hideToast,
  sairDoSistema,
  children
}) {
  if (carregandoAuth) {
    return (
      <div style={styles.page}>
        <h2>Carregando...</h2>
      </div>
    )
  }

  if (!usuarioLogado) {
    return (
      <>
        <Login onLogin={setUsuarioLogado} />
        <GlobalToast toast={globalToast} onClose={hideToast} />
      </>
    )
  }

  if (erroEmpresa) {
    return (
      <div style={styles.page}>
        <h2>⚠️ Empresa não vinculada</h2>
        <p>{erroEmpresa}</p>
        <button style={styles.btnSair} onClick={sairDoSistema}>Sair</button>
      </div>
    )
  }

  return children
}
