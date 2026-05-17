import { memo, useCallback, useMemo } from 'react'

function Topbar({
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
  nomeUsuarioAtual,
  abrirPerfilUsuario
}) {
  const exibirSeletorEmpresa = canSwitchCompany && empresasDisponiveis.length > 0
  const empresaAtual = useMemo(
    () => empresasDisponiveis.find((empresa) => empresa.id === empresaId),
    [empresaId, empresasDisponiveis]
  )

  const tituloPerfil = useMemo(() => {
    const nome = nomeUsuarioAtual || (typeof nomeUsuario === 'function' ? nomeUsuario() : '')
    return `Meu perfil${nome ? `: ${nome}` : ''}`
  }, [nomeUsuario, nomeUsuarioAtual])

  const abrirDashboard = useCallback(() => {
    navegarPara('dashboard')
  }, [navegarPara])

  const alternarMenuMobile = useCallback(() => {
    setMenuNavegacaoAberto((aberto) => !aberto)
  }, [setMenuNavegacaoAberto])

  const abrirPerfil = useCallback(() => {
    abrirPerfilUsuario?.()
  }, [abrirPerfilUsuario])

  return (
    <section className="no-print top-shell top-shell-clean" style={styles.usuarioTopo}>
      <div className="top-shell-context">
        <button className="top-shell-logo" style={styles.logoMarca} onClick={abrirDashboard} title="Ir para o dashboard">
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
          title={tituloPerfil}
          onClick={abrirPerfil}
          aria-label="Abrir meu perfil"
        >
          <span aria-hidden="true">👤</span>
        </button>
        <button className="mobile-menu-trigger" style={styles.btnMenuTopo} onClick={alternarMenuMobile} aria-expanded={menuNavegacaoAberto}>☰</button>
      </div>
    </section>
  )
}

export default memo(Topbar)
