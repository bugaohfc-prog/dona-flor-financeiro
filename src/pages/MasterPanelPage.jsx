import { useEffect, useMemo, useState } from 'react'
import { criarEmpresaMaster, listarEmpresasMaster, renomearEmpresaMaster } from '../services/empresasService'

function formatarDataCurta(data) {
  if (!data) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(data))
  } catch {
    return '—'
  }
}

export default function MasterPanelPage({
  styles,
  usuarioLogado,
  nomeUsuarioCompleto,
  empresaId,
  empresasDisponiveis = [],
  trocarEmpresaAtiva,
  trocandoEmpresa,
  mostrarAviso,
  onEmpresasAtualizadas,
  voltarPainel
}) {
  const [empresas, setEmpresas] = useState([])
  const [busca, setBusca] = useState('')
  const [nomeNovaEmpresa, setNomeNovaEmpresa] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [editandoId, setEditandoId] = useState(null)
  const [nomeEditando, setNomeEditando] = useState('')

  async function carregarEmpresas() {
    setCarregando(true)
    try {
      const dados = await listarEmpresasMaster()
      setEmpresas(dados)
    } catch (error) {
      mostrarAviso?.(error?.message || 'Não foi possível carregar empresas.', 'erro')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarEmpresas()
  }, [])

  const empresasFiltradas = useMemo(() => {
    const termo = String(busca || '').trim().toLowerCase()
    if (!termo) return empresas
    return empresas.filter((empresa) => String(empresa.nome || '').toLowerCase().includes(termo))
  }, [busca, empresas])

  async function criarEmpresa(event) {
    event.preventDefault()
    if (salvando) return

    setSalvando(true)
    try {
      await criarEmpresaMaster({
        nome: nomeNovaEmpresa,
        masterUserId: usuarioLogado?.id,
        masterEmail: usuarioLogado?.email,
        masterNome: nomeUsuarioCompleto?.()
      })
      setNomeNovaEmpresa('')
      await carregarEmpresas()
      await onEmpresasAtualizadas?.()
      mostrarAviso?.('Empresa criada com sucesso.', 'sucesso')
    } catch (error) {
      mostrarAviso?.(error?.message || 'Não foi possível criar a empresa.', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  async function salvarRenomeacao(empresa) {
    if (!empresa?.id || salvando) return

    setSalvando(true)
    try {
      await renomearEmpresaMaster({ empresaId: empresa.id, nome: nomeEditando })
      setEditandoId(null)
      setNomeEditando('')
      await carregarEmpresas()
      await onEmpresasAtualizadas?.()
      mostrarAviso?.('Empresa atualizada com sucesso.', 'sucesso')
    } catch (error) {
      mostrarAviso?.(error?.message || 'Não foi possível atualizar a empresa.', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="master-panel-page">
      <div className="master-page-hero">
        <div>
          <span className="master-kicker">Painel Master SaaS</span>
          <h1 style={styles.titulo}>🏢 Empresas</h1>
          <p style={styles.textoNota}>Gerencie os tenants da plataforma. Esta é a fundação do painel SaaS antes de filiais, planos e billing.</p>
        </div>
        <button style={styles.btnCinza} type="button" onClick={voltarPainel}>← Dashboard</button>
      </div>

      <div className="master-stats-grid">
        <section className="master-stat-card">
          <small>Empresas cadastradas</small>
          <strong>{empresas.length}</strong>
        </section>
        <section className="master-stat-card">
          <small>Usuários vinculados</small>
          <strong>{empresas.reduce((total, empresa) => total + (empresa.totalUsuarios || 0), 0)}</strong>
        </section>
        <section className="master-stat-card">
          <small>Empresa ativa</small>
          <strong>{empresasDisponiveis.find((empresa) => empresa.id === empresaId)?.nome || '—'}</strong>
        </section>
      </div>

      <section style={styles.cardConfiguracao} className="master-create-card">
        <div>
          <h2 style={styles.subtitulo}>Nova empresa</h2>
          <p style={styles.textoNota}>Crie um novo tenant e vincule automaticamente seu usuário master.</p>
        </div>
        <form className="master-create-form" onSubmit={criarEmpresa}>
          <input
            style={styles.input}
            value={nomeNovaEmpresa}
            onChange={(event) => setNomeNovaEmpresa(event.target.value)}
            placeholder="Nome da empresa"
          />
          <button style={styles.btnSalvar} type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Criar empresa'}</button>
        </form>
      </section>

      <section style={styles.cardConfiguracao}>
        <div className="master-list-header">
          <div>
            <h2 style={styles.subtitulo}>Empresas cadastradas</h2>
            <p style={styles.textoNota}>Controle inicial das empresas disponíveis no SaaS.</p>
          </div>
          <input
            style={styles.input}
            className="master-search-input"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar empresa"
          />
        </div>

        {carregando ? (
          <p style={styles.textoNota}>Carregando empresas...</p>
        ) : empresasFiltradas.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">🏢</div>
            <strong>Nenhuma empresa encontrada</strong>
            <p>Crie a primeira empresa ou ajuste a busca.</p>
          </div>
        ) : (
          <div className="master-companies-list">
            {empresasFiltradas.map((empresa) => {
              const ativa = empresa.id === empresaId
              const editando = editandoId === empresa.id

              return (
                <article key={empresa.id} className={`master-company-card ${ativa ? 'active' : ''}`}>
                  <div className="master-company-main">
                    <span className="master-company-icon">🏢</span>
                    <div>
                      {editando ? (
                        <input
                          style={styles.input}
                          value={nomeEditando}
                          onChange={(event) => setNomeEditando(event.target.value)}
                          autoFocus
                        />
                      ) : (
                        <h3>{empresa.nome || 'Empresa sem nome'}</h3>
                      )}
                      <small>ID: {empresa.id}</small>
                    </div>
                  </div>

                  <div className="master-company-meta">
                    <span>{empresa.totalUsuarios || 0} usuário(s)</span>
                    <span>Criada em {formatarDataCurta(empresa.created_at)}</span>
                    {ativa && <strong>Ativa</strong>}
                  </div>

                  <div className="master-company-actions">
                    {editando ? (
                      <>
                        <button style={styles.btnSalvar} type="button" disabled={salvando} onClick={() => salvarRenomeacao(empresa)}>Salvar</button>
                        <button style={styles.btnCinza} type="button" onClick={() => { setEditandoId(null); setNomeEditando('') }}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button style={styles.btnCinza} type="button" onClick={() => { setEditandoId(empresa.id); setNomeEditando(empresa.nome || '') }}>Editar</button>
                        {!ativa && (
                          <button style={styles.btnSalvar} type="button" disabled={trocandoEmpresa} onClick={() => trocarEmpresaAtiva?.(empresa.id)}>Ativar</button>
                        )}
                      </>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
