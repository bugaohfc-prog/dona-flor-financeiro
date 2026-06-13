import { useEffect, useMemo, useState } from 'react'
import HeaderExpansivel from '../components/ui/HeaderExpansivel.jsx'
import { alternarStatusFilial, criarFilial, listarFiliaisPorEmpresa, renomearFilial } from '../services/filiaisService'
import { mensagemSeguraErro } from '../utils/session'

function formatarDataCurta(data) {
  if (!data) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(data))
  } catch {
    return '—'
  }
}

export default function FiliaisPage({
  styles,
  empresaId,
  empresaNome,
  mostrarAviso,
  voltarPainel
}) {
  const [filiais, setFiliais] = useState([])
  const [busca, setBusca] = useState('')
  const [nomeNovaFilial, setNomeNovaFilial] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [nomeEditando, setNomeEditando] = useState('')
  const [mostrarCriarFilial, setMostrarCriarFilial] = useState(true)
  const [mostrarListaFiliais, setMostrarListaFiliais] = useState(true)

  async function carregarFiliais() {
    if (!empresaId) {
      setFiliais([])
      setCarregando(false)
      return
    }

    setCarregando(true)
    try {
      const dados = await listarFiliaisPorEmpresa(empresaId)
      setFiliais(dados)
    } catch (error) {
      console.warn('Falha ao carregar filiais:', error)
      mostrarAviso?.(mensagemSeguraErro(error, 'Não foi possível carregar filiais.'), 'erro')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarFiliais()
  }, [empresaId])

  const filiaisFiltradas = useMemo(() => {
    const termo = String(busca || '').trim().toLowerCase()
    if (!termo) return filiais
    return filiais.filter((filial) => String(filial.nome || '').toLowerCase().includes(termo))
  }, [busca, filiais])

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
      console.warn('Falha ao criar filial:', error)
      mostrarAviso?.(mensagemSeguraErro(error, 'Não foi possível criar a filial.'), 'erro')
    } finally {
      setSalvando(false)
    }
  }

  async function salvarRenomeacao(filial) {
    if (!filial?.id || salvando) return

    setSalvando(true)
    try {
      await renomearFilial({ filialId: filial.id, nome: nomeEditando })
      setEditandoId(null)
      setNomeEditando('')
      await carregarFiliais()
      mostrarAviso?.('Filial atualizada com sucesso.', 'sucesso')
    } catch (error) {
      console.warn('Falha ao atualizar filial:', error)
      mostrarAviso?.(mensagemSeguraErro(error, 'Não foi possível atualizar a filial.'), 'erro')
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
      console.warn('Falha ao alterar filial:', error)
      mostrarAviso?.(mensagemSeguraErro(error, 'Não foi possível alterar a filial.'), 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="admin-page branches-settings-page">
      <div className="admin-page-hero">
        <div>
          <span className="admin-kicker">Configurações da empresa</span>
          <h1 style={styles.titulo}>Filiais / Unidades</h1>
          <p style={styles.textoNota}>Cadastre unidades operacionais dentro da empresa ativa para organizar melhor a gestão.</p>
          <small style={styles.textoAjuda}>Empresa ativa: <strong>{empresaNome || '—'}</strong></small>
        </div>
        <button className="admin-btn admin-btn-secondary" type="button" onClick={voltarPainel}>← Configurações</button>
      </div>

      <section style={styles.cardConfiguracao} className="admin-config-card master-create-card">
        <HeaderExpansivel
          styles={styles}
          titulo="➕ Criar filial"
          subtitulo="Nova unidade operacional"
          aberto={mostrarCriarFilial}
          onClick={() => setMostrarCriarFilial(!mostrarCriarFilial)}
        />

        {mostrarCriarFilial && (
          <div className="admin-section-body">
            <p style={styles.textoNota}>Use nomes como Loja Centro, Loja Shopping, Produção, Delivery ou Administração.</p>
            <form className="master-create-form admin-branch-create-form" onSubmit={criarNovaFilial}>
              <label>
                <span>Nome da filial</span>
                <input style={styles.input} value={nomeNovaFilial} onChange={(event) => setNomeNovaFilial(event.target.value)} disabled={!empresaId} />
              </label>
              <button className="admin-btn admin-btn-primary" type="submit" disabled={salvando || !empresaId}>{salvando ? 'Salvando...' : 'Criar filial'}</button>
            </form>
          </div>
        )}
      </section>

      <section style={styles.cardConfiguracao} className="admin-config-card">
        <HeaderExpansivel
          styles={styles}
          titulo="🏬 Filiais cadastradas"
          subtitulo="Busca, edição e status das unidades"
          meta={`${filiaisFiltradas.length} exibida(s)`}
          aberto={mostrarListaFiliais}
          onClick={() => setMostrarListaFiliais(!mostrarListaFiliais)}
        />

        {mostrarListaFiliais && (
          <div className="admin-section-body">
            <div className="master-list-header admin-list-toolbar">
              <div>
                <p style={styles.textoNota}>Cada empresa enxerga apenas suas próprias unidades.</p>
              </div>
              <input style={styles.input} className="master-search-input" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar filial" />
            </div>

            {carregando ? (
              <p style={styles.textoNota}>Carregando filiais...</p>
            ) : filiaisFiltradas.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-state-icon">🏬</div>
                <strong>Nenhuma filial encontrada</strong>
                <p>Crie unidades para organizar contas por local de operação.</p>
              </div>
            ) : (
              <div className="master-companies-list admin-branches-list">
                {filiaisFiltradas.map((filial) => {
                  const editando = editandoId === filial.id

                  return (
                    <article key={filial.id} className={`master-company-card admin-item-card ${filial.ativo ? 'active' : 'inactive'}`}>
                      <div className="master-company-main">
                        <span className="master-company-icon">🏬</span>
                        <div>
                          {editando ? (
                            <input style={styles.input} value={nomeEditando} onChange={(event) => setNomeEditando(event.target.value)} autoFocus />
                          ) : (
                            <h3>{filial.nome || 'Filial sem nome'}</h3>
                          )}
                          <small>ID: {filial.id}</small>
                        </div>
                      </div>

                      <div className="master-company-meta">
                        <span>Criada em {formatarDataCurta(filial.created_at)}</span>
                        <strong className={`admin-status-badge ${filial.ativo ? 'success' : 'muted'}`}>{filial.ativo ? 'Ativa' : 'Inativa'}</strong>
                      </div>

                      <div className="master-company-actions admin-actions-row">
                        {editando ? (
                          <>
                            <button className="admin-btn admin-btn-primary" type="button" disabled={salvando} onClick={() => salvarRenomeacao(filial)}>Salvar</button>
                            <button className="admin-btn admin-btn-secondary" type="button" onClick={() => { setEditandoId(null); setNomeEditando('') }}>Cancelar</button>
                          </>
                        ) : (
                          <>
                            <button className="admin-btn admin-btn-secondary" type="button" onClick={() => { setEditandoId(filial.id); setNomeEditando(filial.nome || '') }}>Editar</button>
                            <button className={`admin-btn ${filial.ativo ? 'admin-btn-danger' : 'admin-btn-primary'}`} type="button" disabled={salvando} onClick={() => alternarFilial(filial)}>
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
          </div>
        )}
      </section>
    </div>
  )
}
