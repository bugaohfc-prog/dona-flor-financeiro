import { useEffect, useMemo, useState } from 'react'
import { useFuncionarios } from '../hooks/useFuncionarios'
import { mensagemSeguraErro } from '../utils/session'

const FORMULARIO_INICIAL = {
  nome: '',
  cargo: '',
  telefone: '',
  email: '',
  cpf: '',
  data_nascimento: '',
  data_admissao: '',
  data_exame_admissional: '',
  status: 'ativo',
  filial_id: '',
  observacoes: ''
}

const STATUS_LABELS = {
  ativo: 'Ativo',
  afastado: 'Afastado',
  desligado: 'Desligado'
}

const CONECTIVOS_NOME_CARGO = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

function apenasDigitos(valor) {
  return String(valor || '').replace(/\D/g, '')
}

function normalizarCapitalizacao(valor) {
  return String(valor || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((palavra, indice) => {
      const palavraNormalizada = palavra.toLocaleLowerCase('pt-BR')
      if (indice > 0 && CONECTIVOS_NOME_CARGO.has(palavraNormalizada)) return palavraNormalizada
      return palavraNormalizada.charAt(0).toLocaleUpperCase('pt-BR') + palavraNormalizada.slice(1)
    })
    .join(' ')
}

function normalizarTextoBusca(valor) {
  return String(valor || '').trim().toLowerCase()
}

function formatarDataCurta(data) {
  if (!data) return 'Não informada'

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(`${String(data).slice(0, 10)}T00:00:00`))
  } catch {
    return 'Não informada'
  }
}

function montarFormulario(funcionario) {
  if (!funcionario) return FORMULARIO_INICIAL

  return {
    nome: funcionario.nome || '',
    cargo: funcionario.cargo || '',
    telefone: funcionario.telefone || '',
    email: funcionario.email || '',
    cpf: funcionario.cpf || '',
    data_nascimento: funcionario.data_nascimento || '',
    data_admissao: funcionario.data_admissao || '',
    data_exame_admissional: funcionario.data_exame_admissional || '',
    status: funcionario.status || 'ativo',
    filial_id: funcionario.filial_id || '',
    observacoes: funcionario.observacoes || ''
  }
}

function montarPayloadFormulario(formulario) {
  return {
    nome: normalizarCapitalizacao(formulario.nome),
    cargo: normalizarCapitalizacao(formulario.cargo),
    telefone: formulario.telefone,
    email: formulario.email,
    cpf: apenasDigitos(formulario.cpf),
    data_nascimento: formulario.data_nascimento,
    data_admissao: formulario.data_admissao,
    data_exame_admissional: formulario.data_exame_admissional,
    status: formulario.status,
    filial_id: formulario.filial_id,
    observacoes: formulario.observacoes
  }
}

export default function FuncionariosPage({
  styles,
  empresaId,
  empresaNome,
  filiais = [],
  mostrarAviso,
  podeEditar = false,
  voltarPainel
}) {
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [incluirArquivados, setIncluirArquivados] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [funcionarioEditando, setFuncionarioEditando] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL)

  const {
    funcionarios,
    loading,
    salvando,
    erro,
    criarFuncionario,
    atualizarFuncionario,
    arquivarFuncionario,
    reativarFuncionario,
    carregarFuncionarios,
    limparErro
  } = useFuncionarios({
    empresaId,
    incluirArquivados
  })

  const filiaisPorId = useMemo(() => {
    return Object.fromEntries((filiais || []).map((filial) => [filial.id, filial.nome || 'Filial']))
  }, [filiais])

  const funcionariosFiltrados = useMemo(() => {
    const termo = normalizarTextoBusca(busca)

    return (funcionarios || []).filter((funcionario) => {
      if (statusFiltro !== 'todos' && funcionario.status !== statusFiltro) return false

      if (!termo) return true

      const camposBusca = [
        funcionario.nome,
        funcionario.cargo,
        funcionario.email,
        funcionario.telefone,
        filiaisPorId[funcionario.filial_id]
      ].map(normalizarTextoBusca)

      return camposBusca.some((campo) => campo.includes(termo))
    })
  }, [busca, filiaisPorId, funcionarios, statusFiltro])

  useEffect(() => {
    setModalAberto(false)
    setFuncionarioEditando(null)
    setFormulario(FORMULARIO_INICIAL)
    limparErro?.()
  }, [empresaId])

  function atualizarCampo(campo, valor) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: campo === 'cpf' ? apenasDigitos(valor).slice(0, 11) : valor
    }))
  }

  function normalizarCampoCapitalizado(campo) {
    if (!['nome', 'cargo'].includes(campo)) return
    setFormulario((atual) => ({
      ...atual,
      [campo]: normalizarCapitalizacao(atual[campo])
    }))
  }

  function abrirNovoFuncionario() {
    if (!empresaId || !podeEditar) return
    limparErro?.()
    setFuncionarioEditando(null)
    setFormulario(FORMULARIO_INICIAL)
    setModalAberto(true)
  }

  function abrirEdicaoFuncionario(funcionario) {
    if (!funcionario?.id || !podeEditar) return
    limparErro?.()
    setFuncionarioEditando(funcionario)
    setFormulario(montarFormulario(funcionario))
    setModalAberto(true)
  }

  function fecharFormulario() {
    setModalAberto(false)
    setFuncionarioEditando(null)
    setFormulario(FORMULARIO_INICIAL)
  }

  async function salvarFormulario(event) {
    event.preventDefault()
    if (!empresaId || !podeEditar || salvando) return

    const payload = montarPayloadFormulario(formulario)
    const resposta = funcionarioEditando?.id
      ? await atualizarFuncionario(funcionarioEditando.id, payload)
      : await criarFuncionario(payload)

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível salvar o funcionário.'), 'erro')
      return
    }

    mostrarAviso?.(funcionarioEditando?.id ? 'Funcionário atualizado.' : 'Funcionário cadastrado.', 'sucesso')
    fecharFormulario()
  }

  async function alternarArquivamento(funcionario) {
    if (!funcionario?.id || !empresaId || !podeEditar || salvando) return

    const resposta = funcionario.arquivado
      ? await reativarFuncionario(funcionario.id)
      : await arquivarFuncionario(funcionario.id)

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível atualizar o cadastro.'), 'erro')
      return
    }

    mostrarAviso?.(funcionario.arquivado ? 'Funcionário reativado.' : 'Funcionário arquivado.', 'sucesso')
  }

  return (
    <div className="funcionarios-page">
      <style>{`
        .funcionarios-page { display: grid; gap: 18px; }
        .funcionarios-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) 180px auto;
          gap: 12px;
          align-items: center;
        }
        .funcionarios-switch {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          font-size: 13px;
          font-weight: 800;
        }
        .funcionarios-list { display: grid; gap: 12px; margin-top: 16px; }
        .funcionario-card {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(160px, .7fr) auto;
          gap: 14px;
          align-items: center;
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 20px;
          background: #ffffff;
          padding: 14px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, .05);
        }
        .funcionario-card.arquivado { background: #f8fafc; border-color: #cbd5e1; opacity: .82; }
        .funcionario-main { min-width: 0; display: flex; align-items: center; gap: 12px; }
        .funcionario-avatar {
          width: 42px;
          height: 42px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(20, 184, 166, .10);
          color: #0f766e;
          font-weight: 950;
          flex: 0 0 42px;
        }
        .funcionario-main h3 { margin: 0 0 4px; color: #0f172a; font-size: 16px; }
        .funcionario-main small,
        .funcionario-meta small { display: block; color: #64748b; line-height: 1.35; }
        .funcionario-meta { display: grid; gap: 5px; color: #64748b; font-size: 12px; }
        .funcionario-status {
          width: fit-content;
          border-radius: 999px;
          padding: 5px 9px;
          background: #ecfdf5;
          color: #0f766e;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .funcionario-status.afastado { background: #fff7ed; color: #c2410c; }
        .funcionario-status.desligado { background: #f1f5f9; color: #475569; }
        .funcionario-status.arquivado { background: #fee2e2; color: #b91c1c; }
        .funcionario-actions { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
        .funcionario-actions button { min-height: 36px !important; padding: 8px 12px !important; margin: 0 !important; }
        .funcionario-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 4200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(15, 23, 42, .42);
        }
        .funcionario-modal {
          width: min(760px, 100%);
          max-height: calc(100vh - 36px);
          overflow: auto;
          border-radius: 24px;
          border: 1px solid rgba(15, 23, 42, .08);
          background: #ffffff;
          padding: 22px;
          box-shadow: 0 24px 70px rgba(15, 23, 42, .28);
        }
        .funcionario-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }
        .funcionario-form-grid label { display: grid; gap: 6px; color: #475569; font-size: 12px; font-weight: 900; }
        .funcionario-form-grid .span-2 { grid-column: 1 / -1; }
        .funcionario-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
        @media (max-width: 860px) {
          .funcionarios-toolbar,
          .funcionario-card,
          .funcionario-form-grid {
            grid-template-columns: 1fr;
          }
          .funcionario-actions { justify-content: flex-start; }
          .funcionario-modal-backdrop { align-items: flex-end; padding: 10px; }
          .funcionario-modal { max-height: calc(100vh - 20px); border-radius: 22px; }
        }
      `}</style>

      <div className="master-page-hero">
        <div>
          <span className="master-kicker">Gestão de Pessoas</span>
          <h1 style={styles.titulo}>Funcionários</h1>
          <p style={styles.textoNota}>Cadastro operacional de colaboradores por empresa ativa.</p>
          <small style={styles.textoAjuda}>Empresa ativa: <strong>{empresaNome || 'Empresa não identificada'}</strong></small>
        </div>
        <button style={styles.btnCinza} type="button" onClick={voltarPainel}>← Painel</button>
      </div>

      <section style={styles.cardConfiguracao}>
        <div className="master-list-header">
          <div>
            <h2 style={styles.subtitulo}>Equipe cadastrada</h2>
            <p style={styles.textoNota}>A listagem usa sempre a empresa ativa e respeita a RLS validada.</p>
          </div>
          {podeEditar && (
            <button style={styles.btnSalvar} type="button" disabled={!empresaId} onClick={abrirNovoFuncionario}>
              Novo funcionário
            </button>
          )}
        </div>

        <div className="funcionarios-toolbar">
          <input
            style={styles.input}
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por nome, cargo, contato ou filial"
            disabled={!empresaId}
          />
          <select
            style={styles.input}
            value={statusFiltro}
            onChange={(event) => setStatusFiltro(event.target.value)}
            disabled={!empresaId}
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="afastado">Afastados</option>
            <option value="desligado">Desligados</option>
          </select>
          <label className="funcionarios-switch">
            <input
              type="checkbox"
              checked={incluirArquivados}
              onChange={(event) => setIncluirArquivados(event.target.checked)}
              disabled={!empresaId}
            />
            Mostrar arquivados
          </label>
        </div>

        {!empresaId ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">👥</div>
            <strong>Empresa ativa necessária</strong>
            <p>Selecione uma empresa para carregar os funcionários.</p>
          </div>
        ) : loading ? (
          <p style={styles.textoNota}>Carregando funcionários...</p>
        ) : erro ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">!</div>
            <strong>Não foi possível carregar</strong>
            <p>{erro}</p>
            <button style={styles.btnCinza} type="button" onClick={() => carregarFuncionarios()}>
              Tentar novamente
            </button>
          </div>
        ) : funcionariosFiltrados.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">👥</div>
            <strong>Nenhum funcionário encontrado</strong>
            <p>{podeEditar ? 'Cadastre o primeiro colaborador desta empresa.' : 'Não há colaboradores disponíveis para esta empresa.'}</p>
          </div>
        ) : (
          <div className="funcionarios-list">
            {funcionariosFiltrados.map((funcionario) => {
              const status = funcionario.arquivado ? 'arquivado' : (funcionario.status || 'ativo')
              const contato = funcionario.email || funcionario.telefone || 'Contato não informado'
              const filialNome = filiaisPorId[funcionario.filial_id] || 'Sem filial'

              return (
                <article key={funcionario.id} className={`funcionario-card ${funcionario.arquivado ? 'arquivado' : ''}`}>
                  <div className="funcionario-main">
                    <span className="funcionario-avatar">{String(funcionario.nome || 'F').slice(0, 1).toUpperCase()}</span>
                    <div>
                      <h3>{funcionario.nome || 'Funcionário sem nome'}</h3>
                      <small>{funcionario.cargo || 'Cargo não informado'}</small>
                      <small>{contato}</small>
                    </div>
                  </div>

                  <div className="funcionario-meta">
                    <span className={`funcionario-status ${status}`}>{funcionario.arquivado ? 'Arquivado' : STATUS_LABELS[status] || status}</span>
                    <small>Filial: {filialNome}</small>
                    <small>Admissão: {formatarDataCurta(funcionario.data_admissao)}</small>
                    {funcionario.data_exame_admissional && (
                      <small>Exame admissional: {formatarDataCurta(funcionario.data_exame_admissional)}</small>
                    )}
                  </div>

                  <div className="funcionario-actions">
                    {podeEditar && (
                      <>
                        <button style={styles.btnCinza} type="button" disabled={salvando} onClick={() => abrirEdicaoFuncionario(funcionario)}>
                          Editar
                        </button>
                        <button
                          style={funcionario.arquivado ? styles.btnSalvar : styles.btnCinza}
                          type="button"
                          disabled={salvando}
                          onClick={() => alternarArquivamento(funcionario)}
                        >
                          {funcionario.arquivado ? 'Reativar' : 'Arquivar'}
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

      {modalAberto && (
        <div className="funcionario-modal-backdrop" role="presentation" onClick={fecharFormulario}>
          <form className="funcionario-modal" onSubmit={salvarFormulario} onClick={(event) => event.stopPropagation()}>
            <div className="master-list-header">
              <div>
                <span className="master-kicker">{funcionarioEditando ? 'Editar cadastro' : 'Novo cadastro'}</span>
                <h2 style={styles.subtitulo}>{funcionarioEditando ? 'Editar funcionário' : 'Novo funcionário'}</h2>
                <p style={styles.textoNota}>Use apenas dados estruturados necessários para a gestão interna.</p>
              </div>
              <button style={styles.btnCinza} type="button" onClick={fecharFormulario}>Fechar</button>
            </div>

            <div className="funcionario-form-grid">
              <label>
                Nome
                <input
                  style={styles.input}
                  value={formulario.nome}
                  onChange={(event) => atualizarCampo('nome', event.target.value)}
                  onBlur={() => normalizarCampoCapitalizado('nome')}
                  required
                  autoFocus
                />
              </label>
              <label>
                Cargo
                <input
                  style={styles.input}
                  value={formulario.cargo}
                  onChange={(event) => atualizarCampo('cargo', event.target.value)}
                  onBlur={() => normalizarCampoCapitalizado('cargo')}
                />
              </label>
              <label>
                Telefone
                <input
                  style={styles.input}
                  value={formulario.telefone}
                  onChange={(event) => atualizarCampo('telefone', event.target.value)}
                  inputMode="tel"
                />
              </label>
              <label>
                E-mail
                <input
                  style={styles.input}
                  value={formulario.email}
                  onChange={(event) => atualizarCampo('email', event.target.value)}
                  type="email"
                />
              </label>
              <label>
                CPF opcional
                <input
                  style={styles.input}
                  value={formulario.cpf}
                  onChange={(event) => atualizarCampo('cpf', event.target.value)}
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="Somente dígitos"
                />
              </label>
              <label>
                Status
                <select
                  style={styles.input}
                  value={formulario.status}
                  onChange={(event) => atualizarCampo('status', event.target.value)}
                >
                  <option value="ativo">Ativo</option>
                  <option value="afastado">Afastado</option>
                  <option value="desligado">Desligado</option>
                </select>
              </label>
              <label>
                Data de nascimento
                <input
                  style={styles.input}
                  value={formulario.data_nascimento}
                  onChange={(event) => atualizarCampo('data_nascimento', event.target.value)}
                  type="date"
                />
              </label>
              <label>
                Data de admissão
                <input
                  style={styles.input}
                  value={formulario.data_admissao}
                  onChange={(event) => atualizarCampo('data_admissao', event.target.value)}
                  type="date"
                />
              </label>
              <label>
                Data do exame admissional
                <input
                  style={styles.input}
                  value={formulario.data_exame_admissional}
                  onChange={(event) => atualizarCampo('data_exame_admissional', event.target.value)}
                  type="date"
                />
                <small style={styles.textoAjuda}>Controle de periodicidade; salva somente a data.</small>
              </label>
              <label className="span-2">
                Filial
                <select
                  style={styles.input}
                  value={formulario.filial_id}
                  onChange={(event) => atualizarCampo('filial_id', event.target.value)}
                >
                  <option value="">Sem filial</option>
                  {(filiais || []).map((filial) => (
                    <option key={filial.id} value={filial.id}>{filial.nome || 'Filial'}</option>
                  ))}
                </select>
              </label>
              <label className="span-2">
                Observações
                <textarea
                  style={{ ...styles.input, minHeight: 90, resize: 'vertical' }}
                  value={formulario.observacoes}
                  onChange={(event) => atualizarCampo('observacoes', event.target.value)}
                />
              </label>
            </div>

            <div className="funcionario-modal-actions">
              <button style={styles.btnCinza} type="button" onClick={fecharFormulario} disabled={salvando}>Cancelar</button>
              <button style={styles.btnSalvar} type="submit" disabled={salvando || !empresaId || !podeEditar}>
                {salvando ? 'Salvando...' : 'Salvar funcionário'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
