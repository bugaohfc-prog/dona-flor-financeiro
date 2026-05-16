import UserSecurityCards from '../components/UserSecurityCards.jsx'

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

  return (
    <>
      <h1 style={styles.titulo}>👥 Gestão de usuários</h1>

      <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
        ← Voltar
      </button>

      <section style={styles.cardConfiguracao} className="users-page-section">
        <h2 style={styles.subtitulo}>Minha conta</h2>
        <p style={styles.textoNota}>
          Usuário conectado: <strong>{usuarioAtualEmail}</strong> • Perfil: <strong>{normalizarPerfil(perfilUsuario)}</strong>{permissoesUsuario?.isMaster ? <> • Global: <strong>master</strong></> : null}
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
              <p style={styles.textoNota}>Troque a empresa ativa para recarregar os usuários e dados do tenant selecionado.</p>
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

      <section style={styles.cardConfiguracao} className="users-page-section">
        <div className="users-header-row">
          <div>
            <h2 style={styles.subtitulo}>Usuários da empresa</h2>
            <p style={styles.textoNota}>Defina perfil e escopo por filial. Sem filial marcada = acesso a todas as filiais da empresa.</p>
          </div>
          <button style={styles.btnCinza} onClick={() => buscarUsuariosEmpresa()}>Atualizar</button>
        </div>

        <div className="users-permission-guide">
          <span><strong>Admin:</strong> acesso total</span>
          <span><strong>Gerente:</strong> contas, notas, relatórios e configurações operacionais</span>
          <span><strong>Financeiro:</strong> contas, notas e relatórios</span>
          <span><strong>Operacional:</strong> contas e notas operacionais</span>
          <span><strong>Visualização:</strong> somente consulta</span>
          <span><strong>Operador:</strong> compatibilidade com acessos antigos</span>
          <span><strong>Filiais:</strong> limita o usuário às unidades selecionadas</span>
        </div>

        {podeAdministrarUsuarios() && (
          <div className="users-add-card">
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
              placeholder="Senha provisória manual"
              value={senhaConviteUsuario}
              onChange={(event) => setSenhaConviteUsuario(event.target.value)}
            />

            <select
              style={styles.input}
              value={perfilConviteUsuario}
              onChange={(event) => setPerfilConviteUsuario(event.target.value)}
            >
              <option value="visualizacao">Visualização</option>
              <option value="operacional">Operacional</option>
              <option value="financeiro">Financeiro</option>
              <option value="operador">Operador</option>
              <option value="gerente">Gerente</option>
              <option value="admin">Admin</option>
            </select>

            <button style={styles.btnSalvar} onClick={adicionarUsuarioEmpresa} disabled={criandoUsuarioManual}>{criandoUsuarioManual ? 'Criando acesso...' : 'Criar acesso manual'}</button>
            <small style={styles.textoNota}>Sem envio de e-mail: o admin entrega o e-mail e a senha provisória manualmente.</small>
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

            return (
              <div key={usuario.id || usuario.user_id || usuario.email} className="user-card userCard">
                <div className="user-card-header">
                  <div className="user-main-info userInfo">
                    <strong>{usuario.nome || usuario.email || 'Usuário sem nome'}</strong>
                    <small>{usuario.email || usuario.user_id || 'Sem e-mail vinculado'}</small>
                    <div className="user-status-row">
                      {atual && <span className="user-badge user-badge-self">Você</span>}
                      {pendente && <span className="user-badge user-badge-pending">Pendente de vínculo</span>}
                    </div>
                  </div>

                  <div className="user-card-controls">
                    <span className={`roleBadge ${normalizarPerfil(usuario.perfil)}`}>{normalizarPerfil(usuario.perfil)}</span>

                    <select
                      className="user-role-select"
                      style={styles.input}
                      value={normalizarPerfil(usuario.perfil)}
                      disabled={!podeAdministrarUsuarios()}
                      onChange={(event) => atualizarPerfilUsuarioEmpresa(usuario, event.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="gerente">Gerente</option>
                      <option value="financeiro">Financeiro</option>
                      <option value="operacional">Operacional</option>
                      <option value="visualizacao">Visualização</option>
                      <option value="operador">Operador</option>
                    </select>
                  </div>
                </div>

                <div className="user-branch-scope">
                  <div className="user-branch-scope-header">
                    <strong>Filiais permitidas</strong>
                    <button
                      type="button"
                      className="user-branch-clear"
                      disabled={!podeAdministrarUsuarios() || salvandoFilialUsuario === usuario.id}
                      onClick={() => liberarTodasFiliaisUsuario(usuario)}
                      title="Deixar o usuário com acesso a todas as filiais da empresa"
                    >
                      Todas
                    </button>
                  </div>
                  <div className="user-branch-list">
                    {filiais.length === 0 ? (
                      <small>Nenhuma filial ativa cadastrada.</small>
                    ) : filiais.map((filial) => {
                      const selecionada = (filiaisUsuariosEmpresa[usuario.id] || []).includes(filial.id)
                      return (
                        <label key={filial.id} className={`user-branch-chip ${selecionada ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selecionada}
                            disabled={!podeAdministrarUsuarios() || salvandoFilialUsuario === usuario.id}
                            onChange={() => alternarFilialUsuario(usuario, filial.id)}
                          />
                          <span>{filial.nome || 'Filial'}</span>
                        </label>
                      )
                    })}
                  </div>
                  {(filiaisUsuariosEmpresa[usuario.id] || []).length === 0 && (
                    <small className="user-branch-all">Acesso a todas as filiais da empresa.</small>
                  )}
                </div>

                {podeAdministrarUsuarios() && (
                  <div className="user-actions">
                    <button
                      style={styles.btnSecundario}
                      onClick={() => enviarAcessoUsuarioEmpresa(usuario)}
                      title="Fallback por e-mail. O acesso principal agora é criação manual com senha provisória."
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
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}
