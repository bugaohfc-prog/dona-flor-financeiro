import { memo, useCallback, useMemo } from 'react'

function Topbar({
  styles,
  nomeEmpresa,
  empresaAtivaNome,
  navegarPara,
  menuNavegacaoAberto,
  setMenuNavegacaoAberto,
  canSwitchCompany = false,
  empresasDisponiveis = [],
  empresaId = '',
  trocarEmpresaAtiva,
  trocandoEmpresa = false,
  contextoModulo = 'Área de trabalho'
}) {
  const exibirSeletorEmpresa = canSwitchCompany && empresasDisponiveis.length > 0
  const empresaAtual = useMemo(
    () => empresasDisponiveis.find((empresa) => empresa.id === empresaId),
    [empresaId, empresasDisponiveis]
  )
  const nomeEmpresaAtiva = useMemo(() => {
    const nome = String(empresaAtivaNome || empresaAtual?.nome || nomeEmpresa || '').trim()
    return nome || 'Empresa não identificada'
  }, [empresaAtivaNome, empresaAtual?.nome, nomeEmpresa])
  const contextoModuloAtual = useMemo(() => {
    const contexto = String(contextoModulo || '').trim()
    return contexto || 'Área de trabalho'
  }, [contextoModulo])

  const abrirDashboard = useCallback(() => {
    navegarPara('dashboard')
  }, [navegarPara])

  const alternarMenuMobile = useCallback(() => {
    setMenuNavegacaoAberto((aberto) => !aberto)
  }, [setMenuNavegacaoAberto])

  return (
    <section className="no-print top-shell top-shell-clean" style={styles.usuarioTopo}>
      <div className="top-shell-context">
        <button className="top-shell-logo" style={styles.logoMarca} onClick={abrirDashboard} title="Ir para o painel">
          <img src="/icon-192.png" alt="DNA Gestão" style={styles.logoImagem} />
          <span>
            <strong>DNA Gestão</strong>
            <small>{nomeEmpresaAtiva} &bull; {contextoModuloAtual}</small>
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
        <button className="mobile-menu-trigger" style={styles.btnMenuTopo} onClick={alternarMenuMobile} aria-expanded={menuNavegacaoAberto}>☰</button>
      </div>
    </section>
  )
}

export default memo(Topbar)
