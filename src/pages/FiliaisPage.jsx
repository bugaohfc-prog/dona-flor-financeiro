import { useEffect, useMemo, useState } from 'react'
import { alternarStatusFilial, criarFilial, listarFiliaisPorEmpresa, renomearFilial } from '../services/filiaisService'

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
      mostrarAviso?.(error?.message || 'Não foi possível carregar filiais.', 'erro')
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
      mostrarAviso?.(error?.message || 'Não foi possível criar a filial.', 'erro')
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

  return (
    <div className="branches-settings-page">
      <div className="master-page-hero">
        <div>
          <span className="master-kicker">Configurações da empresa</span>
          <h1 style={styles.titulo}>🏬 Filiais / Unidades</h1>
          <p style={styles.textoNota}>Cadastre unidades operacionais dentro da empresa ativa. As próximas fases ligarão contas e relatórios a essas filiais.</p>
          <small style={styles.textoAjuda}>Empresa ativa: <strong>{empresaNome || '—'}</strong></small>
        </div>
        <button style={styles.btnCinza} type="button" onClick={voltarPainel}>← Configurações</button>
      </div>

      <section style={styles.cardConfiguracao} className="master-create-card">
        <div>
          <h2 style={styles.subtitulo}>Nova filial</h2>
          <p style={styles.textoNota}>Use nomes como Loja Centro, Loja Shopping, Produção, Delivery ou Administração.</p>
        </div>
        <form className="master-create-form" onSubmit={criarNovaFilial}>
          <input
            style={styles.input}
            value={nomeNovaFilial}
            onChange={(event) => setNomeNovaFilial(event.target.value)}
            placeholder="Nome da filial"
            disabled={!empresaId}
          />
          <button style={styles.btnSalvar} type="submit" disabled={salvando || !empresaId}>{salvando ? 'Salvando...' : 'Criar filial'}</button>
        </form>
      </section>

      <section style={styles.cardConfiguracao}>
        <div className="master-list-header">
          <div>
            <h2 style={styles.subtitulo}>Filiais cadastradas</h2>
            <p style={styles.textoNota}>Cada empresa enxerga apenas suas próprias unidades.</p>
          </div>
          <input
            style={styles.input}
            className="master-search-input"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar filial"
          />
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
          <div className="master-companies-list">
            {filiaisFiltradas.map((filial) => {
              const editando = editandoId === filial.id

              return (
                <article key={filial.id} className={`master-company-card ${filial.ativo ? 'active' : ''}`}>
                  <div className="master-company-main">
                    <span className="master-company-icon">🏬</span>
                    <div>
                      {editando ? (
                        <input
                          style={styles.input}
                          value={nomeEditando}
                          onChange={(event) => setNomeEditando(event.target.value)}
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
                        <button style={styles.btnSalvar} type="button" disabled={salvando} onClick={() => salvarRenomeacao(filial)}>Salvar</button>
                        <button style={styles.btnCinza} type="button" onClick={() => { setEditandoId(null); setNomeEditando('') }}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button style={styles.btnCinza} type="button" onClick={() => { setEditandoId(filial.id); setNomeEditando(filial.nome || '') }}>Editar</button>
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
    </div>
  )
}
