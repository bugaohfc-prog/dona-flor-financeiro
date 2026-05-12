import { useEffect, useMemo, useState } from 'react'
import { criarEmpresaMaster, listarEmpresasMaster, renomearEmpresaMaster } from '../services/empresasService'
import { alternarStatusFilial, criarFilial, listarFiliaisPorEmpresa, renomearFilial } from '../services/filiaisService'

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
  voltarPainel,
  abaInicial = 'empresas'
}) {
  const [abaAtiva, setAbaAtiva] = useState(abaInicial === 'filiais' ? 'filiais' : 'empresas')
  const [empresas, setEmpresas] = useState([])
  const [busca, setBusca] = useState('')
  const [nomeNovaEmpresa, setNomeNovaEmpresa] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [editandoId, setEditandoId] = useState(null)
  const [nomeEditando, setNomeEditando] = useState('')

  const [filiais, setFiliais] = useState([])
  const [buscaFilial, setBuscaFilial] = useState('')
  const [nomeNovaFilial, setNomeNovaFilial] = useState('')
  const [carregandoFiliais, setCarregandoFiliais] = useState(false)
  const [editandoFilialId, setEditandoFilialId] = useState(null)
  const [nomeFilialEditando, setNomeFilialEditando] = useState('')

  const empresaAtiva = useMemo(() => {
    return empresasDisponiveis.find((empresa) => empresa.id === empresaId) || empresas.find((empresa) => empresa.id === empresaId) || null
  }, [empresaId, empresas, empresasDisponiveis])

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

  async function carregarFiliais() {
    if (!empresaId) {
      setFiliais([])
      return
    }

    setCarregandoFiliais(true)
    try {
      const dados = await listarFiliaisPorEmpresa(empresaId)
      setFiliais(dados)
    } catch (error) {
      mostrarAviso?.(error?.message || 'Não foi possível carregar filiais.', 'erro')
    } finally {
      setCarregandoFiliais(false)
    }
  }

  useEffect(() => {
    carregarEmpresas()
  }, [])

  useEffect(() => {
    if (abaAtiva === 'filiais') carregarFiliais()
  }, [abaAtiva, empresaId])

  const empresasFiltradas = useMemo(() => {
    const termo = String(busca || '').trim().toLowerCase()
    if (!termo) return empresas
    return empresas.filter((empresa) => String(empresa.nome || '').toLowerCase().includes(termo))
  }, [busca, empresas])

  const filiaisFiltradas = useMemo(() => {
    const termo = String(buscaFilial || '').trim().toLowerCase()
    if (!termo) return filiais
    return filiais.filter((filial) => String(filial.nome || '').toLowerCase().includes(termo))
  }, [buscaFilial, filiais])

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

  async function criarNovaFilial(event) {
    event.preventDefault()
    if (salvando) return

    setSalvando(true)
    try {
      await criarFilial({ empresaId, nome: nomeNovaFilial })
      setNomeNovaFilial('')
      await carregarFiliais()
      mostrarAviso?.('Filial criada com sucesso.', 'sucesso')
    } catch (error) {
      mostrarAviso?.(error?.message || 'Não foi possível criar a filial.', 'erro')
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

  async function salvarRenomeacaoFilial(filial) {
    if (!filial?.id || salvando) return

    setSalvando(true)
    try {
      await renomearFilial({ filialId: filial.id, nome: nomeFilialEditando })
      setEditandoFilialId(null)
      setNomeFilialEditando('')
      await carregarFiliais()
      mostrarAviso?.('Filial atualizada com sucesso.', 'sucesso')
    } catch (error) {
      mostrarAviso?.(error?.message || 'Não foi possível atualizar a filial.', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  async function alternarFilial(filial) {
    if (!filial?.id || salvando) return

    setSalvando(true)
    try {
      await alternarStatusFilial({ filialId: filial.id, ativo: !filial.ativo })
      await carregarFiliais()
      mostrarAviso?.(filial.ativo ? 'Filial desativada.' : 'Filial ativada.', 'sucesso')
    } catch (error) {
      mostrarAviso?.(error?.message || 'Não foi possível alterar a filial.', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  function renderEmpresas() {
    return (
      <>
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
      </>
    )
  }

  function renderFiliais() {
    return (
      <>
        <section style={styles.cardConfiguracao} className="master-create-card">
          <div>
            <h2 style={styles.subtitulo}>Nova filial</h2>
            <p style={styles.textoNota}>Cadastre unidades dentro da empresa ativa. Na próxima fase, contas poderão ser vinculadas a essas filiais.</p>
            <small style={styles.textoAjuda}>Empresa ativa: <strong>{empresaAtiva?.nome || '—'}</strong></small>
          </div>
          <form className="master-create-form" onSubmit={criarNovaFilial}>
            <input
              style={styles.input}
              value={nomeNovaFilial}
              onChange={(event) => setNomeNovaFilial(event.target.value)}
              placeholder="Ex.: Loja Centro, Fábrica, Delivery"
              disabled={!empresaId}
            />
            <button style={styles.btnSalvar} type="submit" disabled={salvando || !empresaId}>{salvando ? 'Salvando...' : 'Criar filial'}</button>
          </form>
        </section>

        <section style={styles.cardConfiguracao}>
          <div className="master-list-header">
            <div>
              <h2 style={styles.subtitulo}>Filiais da empresa ativa</h2>
              <p style={styles.textoNota}>Foundation multiunidade: empresa → filial → centro de custo → conta.</p>
            </div>
            <input
              style={styles.input}
              className="master-search-input"
              value={buscaFilial}
              onChange={(event) => setBuscaFilial(event.target.value)}
              placeholder="Buscar filial"
            />
          </div>

          {carregandoFiliais ? (
            <p style={styles.textoNota}>Carregando filiais...</p>
          ) : filiaisFiltradas.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-state-icon">🏬</div>
              <strong>Nenhuma filial encontrada</strong>
              <p>Crie unidades como Loja Centro, Loja Shopping, Produção ou Delivery.</p>
            </div>
          ) : (
            <div className="master-companies-list">
              {filiaisFiltradas.map((filial) => {
                const editando = editandoFilialId === filial.id

                return (
                  <article key={filial.id} className={`master-company-card ${filial.ativo ? 'active' : ''}`}>
                    <div className="master-company-main">
                      <span className="master-company-icon">🏬</span>
                      <div>
                        {editando ? (
                          <input
                            style={styles.input}
                            value={nomeFilialEditando}
                            onChange={(event) => setNomeFilialEditando(event.target.value)}
                            autoFocus
                          />
                        ) : (
                          <h3>{filial.nome || 'Filial sem nome'}</h3>
                        )}
                        <small>ID: {filial.id}</small>
                      </div>
                    </div>

                    <div className="master-company-meta">
                      <span>Criada em {formatarDataCurta(filial.created_at)}</span>
                      <strong>{filial.ativo ? 'Ativa' : 'Inativa'}</strong>
                    </div>

                    <div className="master-company-actions">
                      {editando ? (
                        <>
                          <button style={styles.btnSalvar} type="button" disabled={salvando} onClick={() => salvarRenomeacaoFilial(filial)}>Salvar</button>
                          <button style={styles.btnCinza} type="button" onClick={() => { setEditandoFilialId(null); setNomeFilialEditando('') }}>Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button style={styles.btnCinza} type="button" onClick={() => { setEditandoFilialId(filial.id); setNomeFilialEditando(filial.nome || '') }}>Editar</button>
                          <button style={filial.ativo ? styles.btnCinza : styles.btnSalvar} type="button" disabled={salvando} onClick={() => alternarFilial(filial)}>
                            {filial.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </>
    )
  }

  return (
    <div className="master-panel-page">
      <div className="master-page-hero">
        <div>
          <span className="master-kicker">Painel Master SaaS</span>
          <h1 style={styles.titulo}>🏢 Painel Master</h1>
          <p style={styles.textoNota}>Gerencie empresas e filiais da plataforma. Esta é a base para planos, billing e gestão multiunidade.</p>
        </div>
        <button style={styles.btnCinza} type="button" onClick={voltarPainel}>← Dashboard</button>
      </div>

      <div className="master-tabs" role="tablist" aria-label="Navegação do Painel Master">
        <button className={abaAtiva === 'empresas' ? 'active' : ''} type="button" onClick={() => setAbaAtiva('empresas')}>Empresas</button>
        <button className={abaAtiva === 'filiais' ? 'active' : ''} type="button" onClick={() => setAbaAtiva('filiais')}>Filiais</button>
      </div>

      <div className="master-stats-grid">
        <section className="master-stat-card">
          <small>Empresas cadastradas</small>
          <strong>{empresas.length}</strong>
        </section>
        <section className="master-stat-card">
          <small>Filiais da empresa ativa</small>
          <strong>{filiais.length}</strong>
        </section>
        <section className="master-stat-card">
          <small>Empresa ativa</small>
          <strong>{empresaAtiva?.nome || '—'}</strong>
        </section>
      </div>

      {abaAtiva === 'filiais' ? renderFiliais() : renderEmpresas()}
    </div>
  )
}
