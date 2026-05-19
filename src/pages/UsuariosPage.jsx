import UserSecurityCards from '../components/UserSecurityCards.jsx'

const PROFILE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'operacional', label: 'Operacional' },
  { value: 'visualizacao', label: 'Visualização' },
  { value: 'operador', label: 'Operador' }
]

export default function UsuariosPage({
  styles,
  EmptyState,
  podeAcessarConfiguracoes,
  podeAdministrarUsuarios,
  navegarPara,
  usuarioLogado,
  normalizarPerfil,
  perfilUsuario,
  permissoesUsuario,
  novoEmailUsuario,
  setNovoEmailUsuario,
  novaSenhaUsuario,
  setNovaSenhaUsuario,
  confirmarNovaSenhaUsuario,
  setConfirmarNovaSenhaUsuario,
  salvarMeuEmail,
  salvarMinhaSenha,
  empresasDisponiveis,
  empresaId,
  trocandoEmpresa,
  trocarEmpresaAtiva,
  buscarUsuariosEmpresa,
  primeiraLetraMaiuscula,
  nomeConviteUsuario,
  setNomeConviteUsuario,
  emailConviteUsuario,
  setEmailConviteUsuario,
  senhaConviteUsuario,
  setSenhaConviteUsuario,
  perfilConviteUsuario,
  setPerfilConviteUsuario,
  criandoUsuarioManual,
  adicionarUsuarioEmpresa,
  usuariosCarregando,
  usuariosInicializados,
  usuariosErro,
  usuariosEmpresa,
  filiais,
  filiaisUsuariosEmpresa,
  salvandoFilialUsuario,
  liberarTodasFiliaisUsuario,
  alternarFilialUsuario,
  atualizarPerfilUsuarioEmpresa,
  enviarAcessoUsuarioEmpresa,
  removerUsuarioEmpresa
}) {
  if (!podeAcessarConfiguracoes()) {
    return (
      <>
        <h1 style={styles.titulo}>👥 Usuários</h1>
        <section style={styles.cardConfiguracao}>
          <h2 style={styles.subtitulo}>Acesso restrito</h2>
          <p style={styles.textoNota}>Seu perfil atual não permite acessar a gestão de usuários.</p>
          <button style={styles.btnCinza} onClick={() => navegarPara('contas')}>← Voltar</button>
        </section>
      </>
    )
  }

  const usuarioAtualEmail = usuarioLogado?.email || ''
  const podeEditarUsuarios = podeAdministrarUsuarios()

  return (
    <>
      <h1 style={styles.titulo}>👥 Gestão de usuários</h1>

      <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
        ← Voltar
      </button>

      <section style={styles.cardConfiguracao} className="users-page-section">
        <h2 style={styles.subtitulo}>Minha conta</h2>
        <p style={styles.textoNota}>
          Usuário conectado: <strong>{usuarioAtualEmail}</strong> • Perfil: <strong>{normalizarPerfil(perfilUsuario)}</strong>{permissoesUsuario?.isMaster ? <> • Acesso: <strong>administrador geral</strong></> : null}
        </p>

        <UserSecurityCards
          novoEmailUsuario={novoEmailUsuario}
          setNovoEmailUsuario={setNovoEmailUsuario}
          novaSenhaUsuario={novaSenhaUsuario}
          setNovaSenhaUsuario={setNovaSenhaUsuario}
          confirmarNovaSenhaUsuario={confirmarNovaSenhaUsuario}
          setConfirmarNovaSenhaUsuario={setConfirmarNovaSenhaUsuario}
          salvarMeuEmail={salvarMeuEmail}
          salvarMinhaSenha={salvarMinhaSenha}
          styles={styles}
        />
      </section>

      {permissoesUsuario?.canSwitchCompany && empresasDisponiveis.length > 1 && (
        <section style={styles.cardConfiguracao} className="users-page-section">
          <div className="users-header-row">
            <div>
              <h2 style={styles.subtitulo}>🏢 Empresas disponíveis</h2>
              <p style={styles.textoNota}>Troque a empresa ativa para atualizar usuários e informações da empresa selecionada.</p>
            </div>
            <span className="roleBadge admin">master</span>
          </div>

          <select
            style={styles.input}
            value={empresaId || ''}
            disabled={trocandoEmpresa}
            onChange={(event) => trocarEmpresaAtiva(event.target.value)}
          >
            {empresasDisponiveis.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>{empresa.nome || empresa.id}</option>
            ))}
          </select>
        </section>
      )}

      <section style={styles.cardConfiguracao} className="users-page-section users-management-section">
        <div className="users-header-row users-management-header">
          <div>
            <h2 style={styles.subtitulo}>Usuários da empresa</h2>
            <p style={styles.textoNota}>Defina o perfil e as filiais permitidas. Sem filial marcada, o usuário acessa todas.</p>
          </div>
          <button style={styles.btnCinza} onClick={() => buscarUsuariosEmpresa()}>Atualizar</button>
        </div>

        <div className="users-permission-guide users-permission-guide-compact">
          <span><strong>Admin:</strong> acesso total</span>
          <span><strong>Gerente:</strong> gestão operacional</span>
          <span><strong>Financeiro:</strong> contas e relatórios</span>
          <span><strong>Operacional:</strong> contas e notas</span>
          <span><strong>Visualização:</strong> consulta</span>
          <span><strong>Filiais:</strong> escopo por unidade</span>
        </div>

        {podeEditarUsuarios && (
          <div className="users-add-card users-add-card-compact">
            <input
              style={styles.input}
              type="text"
              placeholder="Nome do usuário"
              value={nomeConviteUsuario}
              onChange={(event) => setNomeConviteUsuario(primeiraLetraMaiuscula(event.target.value))}
            />

            <input
              style={styles.input}
              type="email"
              placeholder="E-mail do usuário"
              value={emailConviteUsuario}
              onChange={(event) => setEmailConviteUsuario(event.target.value)}
            />

            <input
              style={styles.input}
              type="text"
              placeholder="Senha provisória"
              value={senhaConviteUsuario}
              onChange={(event) => setSenhaConviteUsuario(event.target.value)}
            />

            <select
              style={styles.input}
              value={perfilConviteUsuario}
              onChange={(event) => setPerfilConviteUsuario(event.target.value)}
            >
              {PROFILE_OPTIONS.slice().reverse().map((perfil) => (
                <option key={perfil.value} value={perfil.value}>{perfil.label}</option>
              ))}
            </select>

            <button style={styles.btnSalvar} onClick={adicionarUsuarioEmpresa} disabled={criandoUsuarioManual}>{criandoUsuarioManual ? 'Criando...' : 'Criar acesso'}</button>
            <small style={styles.textoNota}>Entregue o e-mail e a senha provisória ao usuário com segurança.</small>
          </div>
        )}

        <div className="users-list users-list-stable" aria-busy={usuariosCarregando}>
          {usuariosCarregando && !usuariosInicializados && (
            <EmptyState icon="⏳" title="Carregando usuários" description="Buscando acessos cadastrados nesta empresa." />
          )}

          {!usuariosCarregando && usuariosErro && (
            <EmptyState icon="⚠️" title="Não foi possível carregar usuários" description={usuariosErro} />
          )}

          {!usuariosCarregando && !usuariosErro && usuariosInicializados && usuariosEmpresa.length === 0 && (
            <EmptyState icon="👥" title="Nenhum usuário cadastrado" description="Adicione usuários para dividir a operação com segurança e níveis de acesso." />
          )}

          {usuariosEmpresa.map((usuario) => {
            const atual = usuario.user_id && usuarioLogado?.id && usuario.user_id === usuarioLogado.id
            const pendente = !usuario.user_id
            const perfilNormalizado = normalizarPerfil(usuario.perfil)
            const filiaisSelecionadas = filiaisUsuariosEmpresa[usuario.id] || []
            const acessoTotalFiliais = filiaisSelecionadas.length === 0

            return (
              <article key={usuario.id || usuario.user_id || usuario.email} className="user-card userCard users-user-card">
                <div className="users-user-card-header">
                  <div className="user-main-info userInfo users-user-identity">
                    <strong>{usuario.nome || usuario.email || 'Usuário sem nome'}</strong>
                    <small>{usuario.email || usuario.user_id || 'Sem e-mail vinculado'}</small>
                    <div className="users-user-status-row">
                      {atual && <span className="user-badge user-badge-self">Você</span>}
                      {pendente && <span className="user-badge user-badge-pending">Cadastro pendente</span>}
                    </div>
                  </div>

                  <div className="users-user-controls">
                    <span className={`roleBadge ${perfilNormalizado}`}>{perfilNormalizado}</span>
                    <select
                      className="user-role-select users-role-select"
                      style={styles.input}
                      value={perfilNormalizado}
                      disabled={!podeEditarUsuarios}
                      onChange={(event) => atualizarPerfilUsuarioEmpresa(usuario, event.target.value)}
                    >
                      {PROFILE_OPTIONS.map((perfil) => (
                        <option key={perfil.value} value={perfil.value}>{perfil.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="user-branch-scope users-branch-scope-compact">
                  <div className="user-branch-scope-header users-branch-header-compact">
                    <div>
                      <strong>Filiais permitidas</strong>
                      <small>{acessoTotalFiliais ? 'Acesso a todas as filiais da empresa.' : `${filiaisSelecionadas.length} filial(is) selecionada(s).`}</small>
                    </div>
                    <button
                      type="button"
                      className="user-branch-clear"
                      disabled={!podeEditarUsuarios || salvandoFilialUsuario === usuario.id}
                      onClick={() => liberarTodasFiliaisUsuario(usuario)}
                      title="Deixar o usuário com acesso a todas as filiais da empresa"
                    >
                      Todas
                    </button>
                  </div>

                  <div className="user-branch-list users-branch-chip-list">
                    {filiais.length === 0 ? (
                      <small>Nenhuma filial ativa cadastrada.</small>
                    ) : filiais.map((filial) => {
                      const selecionada = filiaisSelecionadas.includes(filial.id)
                      return (
                        <label key={filial.id} className={`user-branch-chip users-branch-chip ${selecionada ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selecionada}
                            disabled={!podeEditarUsuarios || salvandoFilialUsuario === usuario.id}
                            onChange={() => alternarFilialUsuario(usuario, filial.id)}
                          />
                          <span>{filial.nome || filial.nome_filial || filial.descricao || 'Filial'}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {podeEditarUsuarios && (
                  <div className="user-actions users-user-actions">
                    <button
                      style={styles.btnSecundario}
                      onClick={() => enviarAcessoUsuarioEmpresa(usuario)}
                      title="Enviar link de acesso por e-mail."
                    >
                      Enviar link
                    </button>

                    <button
                      style={styles.btnExcluir}
                      disabled={atual}
                      onClick={() => removerUsuarioEmpresa(usuario)}
                      title={atual ? 'Você não pode remover o próprio acesso.' : 'Remover usuário'}
                    >
                      Remover
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}
