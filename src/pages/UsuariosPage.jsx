import { useState } from 'react'
import UserSecurityCards from '../components/UserSecurityCards.jsx'
import HeaderExpansivel from '../components/ui/HeaderExpansivel.jsx'
import { usuarioEhMasterProtegido } from '../services/usuariosService'

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
  const [mostrarMinhaConta, setMostrarMinhaConta] = useState(true)
  const [mostrarCriarUsuario, setMostrarCriarUsuario] = useState(true)
  const [mostrarUsuarios, setMostrarUsuarios] = useState(true)
  const [mostrarEmpresas, setMostrarEmpresas] = useState(false)

  if (!podeAcessarConfiguracoes()) {
    return (
      <div className="admin-page users-admin-page">
        <div className="admin-page-hero">
          <div>
            <span className="admin-kicker">Administração</span>
            <h1 style={styles.titulo}>Usuários</h1>
            <p style={styles.textoNota}>Seu perfil atual não permite acessar a gestão de usuários.</p>
          </div>
          <button className="admin-btn admin-btn-secondary" onClick={() => navegarPara('contas')}>← Voltar</button>
        </div>
      </div>
    )
  }

  const usuarioAtualEmail = usuarioLogado?.email || ''
  const podeEditarUsuarios = podeAdministrarUsuarios()

  return (
    <div className="admin-page users-admin-page">
      <div className="admin-page-hero">
        <div>
          <span className="admin-kicker">Administração de acesso</span>
          <h1 style={styles.titulo}>Gestão de usuários</h1>
          <p style={styles.textoNota}>Gerencie segurança da conta, perfis e escopo por filial.</p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={() => navegarPara('dashboard')}>← Painel</button>
      </div>

      <div className="users-admin-summary" aria-label="Resumo de usuários e empresa">
        <div>
          <span>Empresa ativa</span>
          <strong>{empresasDisponiveis.find((empresa) => empresa.id === empresaId)?.nome || 'Empresa atual'}</strong>
        </div>
        <div>
          <span>Usuários</span>
          <strong>{usuariosEmpresa.length}</strong>
        </div>
        <div>
          <span>Filiais</span>
          <strong>{filiais.length}</strong>
        </div>
        <div>
          <span>Seu perfil</span>
          <strong>{normalizarPerfil(perfilUsuario)}</strong>
        </div>
      </div>

      <section style={styles.cardConfiguracao} className="users-page-section admin-config-card">
        <HeaderExpansivel
          styles={styles}
          titulo="👤 Minha conta"
          subtitulo="E-mail e senha do usuário conectado"
          meta={normalizarPerfil(perfilUsuario)}
          aberto={mostrarMinhaConta}
          onClick={() => setMostrarMinhaConta(!mostrarMinhaConta)}
        />
        {mostrarMinhaConta && (
          <div className="admin-section-body">
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
          </div>
        )}
      </section>

      {permissoesUsuario?.canSwitchCompany && empresasDisponiveis.length > 1 && (
        <section style={styles.cardConfiguracao} className="users-page-section admin-config-card">
          <HeaderExpansivel
            styles={styles}
            titulo="🏢 Empresas disponíveis"
            subtitulo="Troca de empresa ativa"
            meta="master"
            aberto={mostrarEmpresas}
            onClick={() => setMostrarEmpresas(!mostrarEmpresas)}
          />
          {mostrarEmpresas && (
            <div className="admin-section-body admin-form-grid">
              <label>
                <span>Empresa ativa</span>
                <select style={styles.input} value={empresaId || ''} disabled={trocandoEmpresa} onChange={(event) => trocarEmpresaAtiva(event.target.value)}>
                  {empresasDisponiveis.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>{empresa.nome || empresa.id}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </section>
      )}

      {podeEditarUsuarios && (
        <section style={styles.cardConfiguracao} className="users-page-section admin-config-card">
          <HeaderExpansivel
            styles={styles}
            titulo="➕ Criar usuário"
            subtitulo="Convite manual com perfil inicial"
            aberto={mostrarCriarUsuario}
            onClick={() => setMostrarCriarUsuario(!mostrarCriarUsuario)}
          />
          {mostrarCriarUsuario && (
            <div className="admin-section-body">
              <div className="users-add-card users-add-card-compact admin-user-create-grid">
                <label>
                  <span>Nome</span>
                  <input style={styles.input} type="text" value={nomeConviteUsuario} onChange={(event) => setNomeConviteUsuario(primeiraLetraMaiuscula(event.target.value))} />
                </label>
                <label>
                  <span>E-mail</span>
                  <input style={styles.input} type="email" value={emailConviteUsuario} onChange={(event) => setEmailConviteUsuario(event.target.value)} />
                </label>
                <label>
                  <span>Senha provisória</span>
                  <input
                    style={styles.input}
                    type="password"
                    minLength={12}
                    autoComplete="new-password"
                    value={senhaConviteUsuario}
                    onChange={(event) => setSenhaConviteUsuario(event.target.value)}
                  />
                </label>
                <label>
                  <span>Perfil</span>
                  <select style={styles.input} value={perfilConviteUsuario} onChange={(event) => setPerfilConviteUsuario(event.target.value)}>
                    {PROFILE_OPTIONS.slice().reverse().map((perfil) => (
                      <option key={perfil.value} value={perfil.value}>{perfil.label}</option>
                    ))}
                  </select>
                </label>
                <button className="admin-btn admin-btn-primary" onClick={adicionarUsuarioEmpresa} disabled={criandoUsuarioManual}>{criandoUsuarioManual ? 'Criando...' : 'Criar acesso'}</button>
                <small style={styles.textoNota}>Use ao menos 12 caracteres e entregue a senha provisória ao usuário com segurança.</small>
              </div>
            </div>
          )}
        </section>
      )}

      <section style={styles.cardConfiguracao} className="users-page-section users-management-section admin-config-card">
        <HeaderExpansivel
          styles={styles}
          titulo="👥 Usuários cadastrados"
          subtitulo="Perfis e filiais permitidas"
          meta={`${usuariosEmpresa.length} usuário(s)`}
          aberto={mostrarUsuarios}
          onClick={() => setMostrarUsuarios(!mostrarUsuarios)}
        />
        {mostrarUsuarios && (
          <div className="admin-section-body">
            <div className="admin-actions-row admin-actions-right">
              <button className="admin-btn admin-btn-secondary" onClick={() => buscarUsuariosEmpresa()}>Atualizar</button>
            </div>

            <div className="users-permission-guide users-permission-guide-compact">
              <span><strong>Admin:</strong> acesso total</span>
              <span><strong>Gerente:</strong> gestão operacional</span>
              <span><strong>Financeiro:</strong> contas e relatórios</span>
              <span><strong>Operacional:</strong> contas e notas</span>
              <span><strong>Visualização:</strong> consulta</span>
              <span><strong>Filiais:</strong> escopo por unidade</span>
            </div>

            <div className="users-list users-list-stable" aria-busy={usuariosCarregando}>
              {usuariosCarregando && !usuariosInicializados && <EmptyState icon="⏳" title="Carregando usuários" description="Buscando acessos cadastrados nesta empresa." />}
              {!usuariosCarregando && usuariosErro && <EmptyState icon="⚠️" title="Não foi possível carregar usuários" description={usuariosErro} />}
              {!usuariosCarregando && !usuariosErro && usuariosInicializados && usuariosEmpresa.length === 0 && <EmptyState icon="👥" title="Nenhum usuário cadastrado" description="Adicione usuários para dividir a operação com segurança e níveis de acesso." />}

              {usuariosEmpresa.map((usuario) => {
                const atual = usuario.user_id && usuarioLogado?.id && usuario.user_id === usuarioLogado.id
                const pendente = !usuario.user_id
                const perfilNormalizado = normalizarPerfil(usuario.perfil)
                const masterProtegido = usuarioEhMasterProtegido(usuario)
                const masterBloqueadoParaAdmin = podeEditarUsuarios && !permissoesUsuario?.isMaster && masterProtegido
                const perfilExibido = masterProtegido ? 'master' : perfilNormalizado
                const filiaisSelecionadas = filiaisUsuariosEmpresa[usuario.id] || []
                const acessoTotalFiliais = filiaisSelecionadas.length === 0

                return (
                  <article key={usuario.id || usuario.user_id || usuario.email} className="user-card userCard users-user-card admin-item-card">
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
                        <span className={`roleBadge ${perfilNormalizado}`}>{perfilExibido}</span>
                        <select
                          className="user-role-select users-role-select"
                          style={styles.input}
                          value={perfilNormalizado}
                          disabled={!podeEditarUsuarios || masterBloqueadoParaAdmin}
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
                          disabled={!podeEditarUsuarios || masterBloqueadoParaAdmin || salvandoFilialUsuario === usuario.id}
                          onClick={() => liberarTodasFiliaisUsuario(usuario)}
                          title={masterBloqueadoParaAdmin ? 'Usuário master não pode ser alterado por admin comum.' : 'Deixar o usuário com acesso a todas as filiais da empresa'}
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
                              <input type="checkbox" checked={selecionada} disabled={!podeEditarUsuarios || masterBloqueadoParaAdmin || salvandoFilialUsuario === usuario.id} onChange={() => alternarFilialUsuario(usuario, filial.id)} />
                              <span>{filial.nome || filial.nome_filial || filial.descricao || 'Filial'}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    {podeEditarUsuarios && (
                      <div className="user-actions users-user-actions">
                        <button className="admin-btn admin-btn-secondary" disabled={masterBloqueadoParaAdmin} onClick={() => enviarAcessoUsuarioEmpresa(usuario)} title={masterBloqueadoParaAdmin ? 'Usuário master não pode ser alterado por admin comum.' : 'Enviar link de acesso por e-mail.'}>Enviar link</button>
                        <button className="admin-btn admin-btn-danger" disabled={atual || masterBloqueadoParaAdmin} onClick={() => removerUsuarioEmpresa(usuario)} title={masterBloqueadoParaAdmin ? 'Usuário master não pode ser alterado por admin comum.' : atual ? 'Você não pode remover o próprio acesso.' : 'Remover usuário'}>Remover</button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
