import { useEffect, useMemo, useState } from 'react'
import HeaderExpansivel from '../components/ui/HeaderExpansivel.jsx'
import {
  alternarStatusFilial,
  atualizarCadastroFiscalFilial,
  criarFilial,
  listarFiliaisPorEmpresa,
  renomearFilial
} from '../services/filiaisService'
import { mensagemSeguraErro } from '../utils/session'

const CAMPOS_FISCAIS = [
  ['razao_social', 'Razão social'],
  ['nome_fantasia', 'Nome fantasia'],
  ['cnpj', 'CNPJ'],
  ['inscricao_estadual', 'Inscrição estadual'],
  ['cidade', 'Cidade'],
  ['uf', 'UF'],
  ['endereco', 'Endereço'],
  ['numero', 'Número'],
  ['bairro', 'Bairro'],
  ['complemento', 'Complemento'],
  ['cep', 'CEP'],
  ['telefone', 'Telefone'],
  ['email', 'E-mail']
]

function formatarDataCurta(data) {
  if (!data) return '-'
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(data))
  } catch {
    return '-'
  }
}

function criarFormularioFiscal(filial = {}) {
  return CAMPOS_FISCAIS.reduce((form, [campo]) => {
    form[campo] = filial?.[campo] || ''
    return form
  }, {})
}

function resumoFiscal(filial) {
  const partes = [
    filial?.razao_social,
    filial?.cnpj,
    [filial?.cidade, filial?.uf].filter(Boolean).join('/')
  ].filter(Boolean)

  return partes.length > 0 ? partes.join(' | ') : 'Cadastro fiscal pendente'
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
  const [fiscalEditandoId, setFiscalEditandoId] = useState(null)
  const [formFiscal, setFormFiscal] = useState(criarFormularioFiscal())
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
    return filiais.filter((filial) => {
      const texto = [
        filial.nome,
        filial.razao_social,
        filial.nome_fantasia,
        filial.cnpj,
        filial.cidade,
        filial.uf
      ].filter(Boolean).join(' ').toLowerCase()

      return texto.includes(termo)
    })
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

  async function salvarCadastroFiscal(filial) {
    if (!filial?.id || salvando) return

    setSalvando(true)
    try {
      await atualizarCadastroFiscalFilial({ filialId: filial.id, dados: formFiscal })
      setFiscalEditandoId(null)
      setFormFiscal(criarFormularioFiscal())
      await carregarFiliais()
      mostrarAviso?.('Cadastro fiscal atualizado com sucesso.', 'sucesso')
    } catch (error) {
      console.warn('Falha ao atualizar cadastro fiscal da filial:', error)
      mostrarAviso?.(mensagemSeguraErro(error, 'Não foi possível atualizar o cadastro fiscal.'), 'erro')
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

  function iniciarEdicaoFiscal(filial) {
    setFiscalEditandoId(filial.id)
    setFormFiscal(criarFormularioFiscal(filial))
  }

  function cancelarEdicaoFiscal() {
    setFiscalEditandoId(null)
    setFormFiscal(criarFormularioFiscal())
  }

  function atualizarCampoFiscal(campo, valor) {
    setFormFiscal((formAtual) => ({ ...formAtual, [campo]: valor }))
  }

  return (
    <div className="admin-page branches-settings-page">
      <div className="admin-page-hero">
        <div>
          <span className="admin-kicker">Configurações da empresa</span>
          <h1 style={styles.titulo}>Filiais / Unidades</h1>
          <p style={styles.textoNota}>Cadastre unidades operacionais e dados fiscais dentro da empresa ativa.</p>
          <small style={styles.textoAjuda}>Empresa ativa: <strong>{empresaNome || '-'}</strong></small>
        </div>
        <button className="admin-btn admin-btn-secondary" type="button" onClick={voltarPainel}>Configurações</button>
      </div>

      <section style={styles.cardConfiguracao} className="admin-config-card master-create-card">
        <HeaderExpansivel
          styles={styles}
          titulo="Criar filial"
          subtitulo="Nova unidade operacional"
          aberto={mostrarCriarFilial}
          onClick={() => setMostrarCriarFilial(!mostrarCriarFilial)}
        />

        {mostrarCriarFilial && (
          <div className="admin-section-body">
            <p style={styles.textoNota}>Use nomes como Dona Flor Andradina, Dona Flor Três Lagoas, Brilho Dourado ou Administração.</p>
            <form className="master-create-form admin-branch-create-form" onSubmit={criarNovaFilial}>
              <label>
                <span>Nome operacional da filial</span>
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
          titulo="Filiais cadastradas"
          subtitulo="Dados operacionais, fiscais e status das unidades"
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
              <input style={styles.input} className="master-search-input" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar filial, CNPJ ou cidade" />
            </div>

            {carregando ? (
              <p style={styles.textoNota}>Carregando filiais...</p>
            ) : filiaisFiltradas.length === 0 ? (
              <div className="empty-state-card">
                <strong>Nenhuma filial encontrada</strong>
                <p>Crie unidades para organizar contas por local de operação.</p>
              </div>
            ) : (
              <div className="master-companies-list admin-branches-list">
                {filiaisFiltradas.map((filial) => {
                  const editando = editandoId === filial.id
                  const editandoFiscal = fiscalEditandoId === filial.id

                  return (
                    <article key={filial.id} className={`master-company-card admin-item-card ${filial.ativo ? 'active' : 'inactive'}`}>
                      <div className="master-company-main">
                        <span className="master-company-icon">FIL</span>
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

                      <div className="admin-summary-strip">
                        <span>{resumoFiscal(filial)}</span>
                        {filial.endereco && <span>{[filial.endereco, filial.numero, filial.bairro].filter(Boolean).join(', ')}</span>}
                      </div>

                      {editandoFiscal && (
                        <div className="admin-form-grid">
                          {CAMPOS_FISCAIS.map(([campo, label]) => (
                            <label key={campo}>
                              <span>{label}</span>
                              <input
                                style={styles.input}
                                value={formFiscal[campo] || ''}
                                onChange={(event) => atualizarCampoFiscal(campo, event.target.value)}
                              />
                            </label>
                          ))}
                        </div>
                      )}

                      <div className="master-company-actions admin-actions-row">
                        {editando ? (
                          <>
                            <button className="admin-btn admin-btn-primary" type="button" disabled={salvando} onClick={() => salvarRenomeacao(filial)}>Salvar nome</button>
                            <button className="admin-btn admin-btn-secondary" type="button" onClick={() => { setEditandoId(null); setNomeEditando('') }}>Cancelar</button>
                          </>
                        ) : (
                          <>
                            <button className="admin-btn admin-btn-secondary" type="button" onClick={() => { setEditandoId(filial.id); setNomeEditando(filial.nome || '') }}>Editar nome</button>
                            {editandoFiscal ? (
                              <>
                                <button className="admin-btn admin-btn-primary" type="button" disabled={salvando} onClick={() => salvarCadastroFiscal(filial)}>Salvar fiscal</button>
                                <button className="admin-btn admin-btn-secondary" type="button" onClick={cancelarEdicaoFiscal}>Cancelar fiscal</button>
                              </>
                            ) : (
                              <button className="admin-btn admin-btn-secondary" type="button" onClick={() => iniciarEdicaoFiscal(filial)}>Editar fiscal</button>
                            )}
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
