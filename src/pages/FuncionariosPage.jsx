import { useEffect, useMemo, useState } from 'react'
import { useFuncionariosExamesPeriodicos } from '../hooks/useFuncionariosExamesPeriodicos'
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

const MODAL_SECOES_INICIAIS = {
  dados: true,
  vinculo: true,
  datas: true,
  observacoes: false,
  exames: true
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

function obterIniciais(nome) {
  const partes = String(nome || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (partes.length === 0) return 'F'

  return partes.map((parte) => parte.charAt(0).toLocaleUpperCase('pt-BR')).join('')
}

function fazAniversarioNoMes(data, dataReferencia = new Date()) {
  if (!data) return false

  const partes = String(data).slice(0, 10).split('-')
  if (partes.length < 2) return false

  const mes = Number(partes[1])
  return mes === dataReferencia.getMonth() + 1
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
  const [mostrarExamesArquivados, setMostrarExamesArquivados] = useState(false)
  const [dataExamePeriodico, setDataExamePeriodico] = useState('')
  const [exameEditandoId, setExameEditandoId] = useState('')
  const [dataExameEditando, setDataExameEditando] = useState('')
  const [modalSecoesAbertas, setModalSecoesAbertas] = useState(MODAL_SECOES_INICIAIS)

  const {
    funcionarios,
    loading,
    salvando,
    erro,
    criarFuncionario,
    atualizarFuncionario,
    arquivarFuncionario,
    reativarFuncionario,
    obterFuncionarioPorId,
    carregarFuncionarios,
    limparErro
  } = useFuncionarios({
    empresaId,
    incluirArquivados
  })

  const {
    exames,
    loading: loadingExames,
    salvando: salvandoExames,
    erro: erroExames,
    criarExamePeriodico,
    atualizarExamePeriodico,
    arquivarExamePeriodico,
    reativarExamePeriodico,
    carregarExamesPeriodicos,
    calcularProximoPeriodico,
    limparErro: limparErroExames
  } = useFuncionariosExamesPeriodicos({
    empresaId,
    funcionarioId: funcionarioEditando?.id,
    incluirArquivados: mostrarExamesArquivados,
    autoCarregar: modalAberto && Boolean(funcionarioEditando?.id)
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
        filiaisPorId[funcionario.filial_id]
      ].map(normalizarTextoBusca)

      return camposBusca.some((campo) => campo.includes(termo))
    })
  }, [busca, filiaisPorId, funcionarios, statusFiltro])

  const resumoEquipe = useMemo(() => {
    const lista = funcionarios || []
    const ativos = lista.filter((funcionario) => !funcionario.arquivado && (funcionario.status || 'ativo') === 'ativo')
    const afastados = lista.filter((funcionario) => !funcionario.arquivado && funcionario.status === 'afastado')
    const inativos = lista.filter((funcionario) => funcionario.arquivado || funcionario.status === 'desligado')
    const aniversariantes = lista.filter((funcionario) => !funcionario.arquivado && fazAniversarioNoMes(funcionario.data_nascimento))

    return {
      ativos: ativos.length,
      afastados: afastados.length,
      inativos: inativos.length,
      aniversariantes: aniversariantes.length
    }
  }, [funcionarios])

  const examesAtivos = useMemo(() => {
    return (exames || [])
      .filter((exame) => !exame.arquivado)
      .sort((a, b) => String(b.data_exame || '').localeCompare(String(a.data_exame || '')))
  }, [exames])

  const dataBaseProximoPeriodico = examesAtivos[0]?.data_exame || formulario.data_exame_admissional
  const proximoPeriodicoPrevisto = dataBaseProximoPeriodico
    ? calcularProximoPeriodico(dataBaseProximoPeriodico)
    : null
  const origemProximoPeriodico = examesAtivos[0]?.data_exame
    ? 'último exame periódico registrado'
    : formulario.data_exame_admissional
      ? 'exame admissional'
      : ''

  useEffect(() => {
    setModalAberto(false)
    setFuncionarioEditando(null)
    setFormulario(FORMULARIO_INICIAL)
    setMostrarExamesArquivados(false)
    limparFormularioExamePeriodico()
    limparErro?.()
    limparErroExames?.()
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
    limparErroExames?.()
    setFuncionarioEditando(null)
    setFormulario(FORMULARIO_INICIAL)
    setMostrarExamesArquivados(false)
    limparFormularioExamePeriodico()
    setModalSecoesAbertas(MODAL_SECOES_INICIAIS)
    setModalAberto(true)
  }

  async function abrirEdicaoFuncionario(funcionario) {
    if (!funcionario?.id || !podeEditar) return
    limparErro?.()
    limparErroExames?.()

    const resposta = await obterFuncionarioPorId(funcionario.id)
    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'NÃ£o foi possÃ­vel carregar os dados completos do funcionÃ¡rio.'), 'erro')
      return
    }

    const funcionarioDetalhado = resposta?.data || funcionario
    setFuncionarioEditando(funcionarioDetalhado)
    setFormulario(montarFormulario(funcionarioDetalhado))
    setMostrarExamesArquivados(false)
    limparFormularioExamePeriodico()
    setModalSecoesAbertas(MODAL_SECOES_INICIAIS)
    setModalAberto(true)
  }

  function fecharFormulario() {
    setModalAberto(false)
    setFuncionarioEditando(null)
    setFormulario(FORMULARIO_INICIAL)
    setMostrarExamesArquivados(false)
    limparFormularioExamePeriodico()
    limparErroExames?.()
  }

  function alternarSecaoModal(secao) {
    setModalSecoesAbertas((atual) => ({
      ...atual,
      [secao]: !atual[secao]
    }))
  }

  function limparFormularioExamePeriodico() {
    setDataExamePeriodico('')
    setExameEditandoId('')
    setDataExameEditando('')
  }

  async function salvarFormulario(event) {
    event.preventDefault()
    if (!empresaId || !podeEditar || salvando) return

    if (!String(formulario.nome || '').trim()) {
      setModalSecoesAbertas((atual) => ({ ...atual, dados: true }))
      mostrarAviso?.('Informe o nome completo do funcionário.', 'erro')
      return
    }

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

    const nomeFuncionario = funcionario.nome || 'este funcionário'
    const mensagemConfirmacao = funcionario.arquivado
      ? `Reativar o cadastro de ${nomeFuncionario}? Ele voltará para a lista principal.`
      : `Arquivar o cadastro de ${nomeFuncionario}? Ele sairá da lista principal, mas poderá ser reativado em "Mostrar arquivados".`

    if (!window.confirm(mensagemConfirmacao)) return

    const resposta = funcionario.arquivado
      ? await reativarFuncionario(funcionario.id)
      : await arquivarFuncionario(funcionario.id)

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível atualizar o cadastro.'), 'erro')
      return
    }

    mostrarAviso?.(
      funcionario.arquivado
        ? 'Cadastro reativado e disponível na lista principal.'
        : 'Cadastro arquivado. Ative "Mostrar arquivados" para localizar e reativar.',
      'sucesso'
    )
  }

  async function adicionarExamePeriodico() {
    if (!empresaId || !funcionarioEditando?.id || !podeEditar || salvandoExames) return

    if (!dataExamePeriodico) {
      mostrarAviso?.('Informe a data do exame periódico.', 'erro')
      return
    }

    const resposta = await criarExamePeriodico(dataExamePeriodico, {
      funcionarioId: funcionarioEditando.id
    })

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível salvar o exame periódico.'), 'erro')
      return
    }

    setDataExamePeriodico('')
    mostrarAviso?.('Exame periódico registrado.', 'sucesso')
  }

  function iniciarEdicaoExame(exame) {
    if (!exame?.id || !podeEditar) return
    limparErroExames?.()
    setExameEditandoId(exame.id)
    setDataExameEditando(exame.data_exame || '')
  }

  function cancelarEdicaoExame() {
    setExameEditandoId('')
    setDataExameEditando('')
  }

  async function salvarEdicaoExame(exame) {
    if (!exame?.id || !empresaId || !podeEditar || salvandoExames) return

    if (!dataExameEditando) {
      mostrarAviso?.('Informe a data do exame periódico.', 'erro')
      return
    }

    const resposta = await atualizarExamePeriodico(exame.id, dataExameEditando)

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível atualizar o exame periódico.'), 'erro')
      return
    }

    cancelarEdicaoExame()
    mostrarAviso?.('Exame periódico atualizado.', 'sucesso')
  }

  async function alternarArquivamentoExame(exame) {
    if (!exame?.id || !empresaId || !podeEditar || salvandoExames) return

    const resposta = exame.arquivado
      ? await reativarExamePeriodico(exame.id)
      : await arquivarExamePeriodico(exame.id)

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível atualizar o exame periódico.'), 'erro')
      return
    }

    if (exameEditandoId === exame.id) cancelarEdicaoExame()
    mostrarAviso?.(exame.arquivado ? 'Exame periódico reativado.' : 'Exame periódico arquivado.', 'sucesso')
  }

  return (
    <div className="funcionarios-page">
      <div className="funcionarios-page-hero">
        <div className="funcionarios-hero-copy">
          <span className="funcionarios-kicker">Gestão de Pessoas</span>
          <h1>Funcionários</h1>
          <p>Cadastro operacional da equipe, vínculos e exames periódicos.</p>
          <small>Empresa ativa: <strong>{empresaNome || 'Empresa não identificada'}</strong></small>
        </div>
        <div className="funcionarios-hero-actions">
          <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={voltarPainel}>← Painel</button>
          {podeEditar && (
            <button className="funcionarios-btn funcionarios-btn-primary" type="button" disabled={!empresaId} onClick={abrirNovoFuncionario}>
              Novo funcionário
            </button>
          )}
        </div>
      </div>

      <section className="funcionarios-panel">
        <div className="funcionarios-section-header">
          <div>
            <span className="funcionarios-kicker">Equipe</span>
            <h2>Equipe cadastrada</h2>
            <p>Leitura rápida da equipe, sem expor CPF, documentos, salário ou dados clínicos.</p>
          </div>
        </div>

        <div className="funcionarios-control-card">
          <label className="funcionarios-field funcionarios-field-search">
            <span>Busca</span>
            <input
              style={styles.input}
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome, cargo ou filial"
              disabled={!empresaId}
            />
          </label>
          <label className="funcionarios-field">
            <span>Status</span>
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
          </label>
          <label className={`funcionarios-switch ${incluirArquivados ? 'ativo' : ''}`}>
            <input
              type="checkbox"
              checked={incluirArquivados}
              onChange={(event) => setIncluirArquivados(event.target.checked)}
              disabled={!empresaId}
            />
            <span className="funcionarios-switch-indicator" aria-hidden="true" />
            <span>Mostrar arquivados</span>
          </label>
        </div>

        <div className="funcionarios-summary" aria-label="Resumo da equipe">
          <div className="funcionarios-summary-card">
            <small>Equipe ativa</small>
            <strong>{resumoEquipe.ativos}</strong>
          </div>
          <div className="funcionarios-summary-card">
            <small>Afastados</small>
            <strong>{resumoEquipe.afastados}</strong>
          </div>
          <div className="funcionarios-summary-card">
            <small>Aniversariantes</small>
            <strong>{resumoEquipe.aniversariantes}</strong>
          </div>
          <div className="funcionarios-summary-card">
            <small>Inativos</small>
            <strong>{resumoEquipe.inativos}</strong>
          </div>
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
            <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={() => carregarFuncionarios()}>
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
              const filialNome = filiaisPorId[funcionario.filial_id] || 'Sem filial'

              return (
                <article key={funcionario.id} className={`funcionario-card funcionario-card-${status} ${funcionario.arquivado ? 'arquivado' : ''}`}>
                  <div className="funcionario-main">
                    <span className="funcionario-avatar" aria-hidden="true">{obterIniciais(funcionario.nome)}</span>
                    <div>
                      <h3>{funcionario.nome || 'Funcionário sem nome'}</h3>
                      <small>{funcionario.cargo || 'Cargo não informado'}</small>
                    </div>
                  </div>

                  <div className="funcionario-meta">
                    <span className={`funcionario-status ${status}`}>{funcionario.arquivado ? 'Arquivado' : STATUS_LABELS[status] || status}</span>
                    <small>Filial: {filialNome}</small>
                    <small>Admissão: {formatarDataCurta(funcionario.data_admissao)}</small>
                    {funcionario.telefone && <small>Telefone: {funcionario.telefone}</small>}
                    {funcionario.email && <small>E-mail: {funcionario.email}</small>}
                  </div>

                  <div className="funcionario-actions">
                    {podeEditar && (
                      <>
                        <button className="funcionarios-btn funcionarios-btn-secondary" type="button" disabled={salvando} onClick={() => abrirEdicaoFuncionario(funcionario)}>
                          Editar
                        </button>
                        <button
                          className={`funcionarios-btn ${funcionario.arquivado ? 'funcionarios-btn-primary' : 'funcionarios-btn-danger'}`}
                          type="button"
                          disabled={salvando}
                          onClick={() => alternarArquivamento(funcionario)}
                        >
                          {funcionario.arquivado ? 'Reativar cadastro' : 'Arquivar cadastro'}
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
            <div className="funcionario-modal-header">
              <div>
                <span className="funcionarios-kicker">{funcionarioEditando ? 'Editar cadastro' : 'Novo cadastro'}</span>
                <h2>{funcionarioEditando ? 'Editar funcionário' : 'Novo funcionário'}</h2>
                <p>Preencha somente dados operacionais necessários para organizar a equipe.</p>
              </div>
              <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={fecharFormulario}>Fechar</button>
            </div>

            <section className="funcionario-modal-section">
              <div className="funcionario-modal-section-toggle funcionario-modal-section-static">
                <span>
                  <strong>Dados básicos</strong>
                  <small>Identificação e contatos operacionais obrigatórios</small>
                </span>
                <b>Obrigatório</b>
              </div>
              <div className="funcionario-form-grid">
                <label>
                  Nome completo
                  <input
                    style={styles.input}
                    value={formulario.nome}
                    onChange={(event) => atualizarCampo('nome', event.target.value)}
                    onBlur={() => normalizarCampoCapitalizado('nome')}
                    placeholder="Ex.: Maria Souza"
                    required
                    autoFocus
                  />
                </label>
                <label>
                  Cargo ou função
                  <input
                    style={styles.input}
                    value={formulario.cargo}
                    onChange={(event) => atualizarCampo('cargo', event.target.value)}
                    onBlur={() => normalizarCampoCapitalizado('cargo')}
                    placeholder="Ex.: Atendente"
                  />
                </label>
                <label>
                  Telefone
                  <input
                    style={styles.input}
                    value={formulario.telefone}
                    onChange={(event) => atualizarCampo('telefone', event.target.value)}
                    inputMode="tel"
                    placeholder="Contato operacional"
                  />
                </label>
                <label>
                  E-mail
                  <input
                    style={styles.input}
                    value={formulario.email}
                    onChange={(event) => atualizarCampo('email', event.target.value)}
                    type="email"
                    placeholder="email@empresa.com"
                  />
                </label>
                <label>
                  CPF (opcional)
                  <input
                    style={styles.input}
                    value={formulario.cpf}
                    onChange={(event) => atualizarCampo('cpf', event.target.value)}
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="Somente números"
                  />
                  <small style={styles.textoAjuda}>Não aparece na listagem de funcionários.</small>
                </label>
              </div>
            </section>

            <section className="funcionario-modal-section">
              <button className="funcionario-modal-section-toggle" type="button" onClick={() => alternarSecaoModal('vinculo')}>
                <span>
                  <strong>Vínculo e empresa</strong>
                  <small>Status operacional e filial</small>
                </span>
                <b>{modalSecoesAbertas.vinculo ? '−' : '+'}</b>
              </button>
              {modalSecoesAbertas.vinculo && (
                <div className="funcionario-form-grid">
                  <label>
                    Status operacional
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
                </div>
              )}
            </section>

            <section className="funcionario-modal-section">
              <button className="funcionario-modal-section-toggle" type="button" onClick={() => alternarSecaoModal('datas')}>
                <span>
                  <strong>Datas</strong>
                  <small>Aniversário, admissão e exame admissional</small>
                </span>
                <b>{modalSecoesAbertas.datas ? '−' : '+'}</b>
              </button>
              {modalSecoesAbertas.datas && (
                <div className="funcionario-form-grid">
                  <label>
                    Data de nascimento
                    <input
                      style={styles.input}
                      value={formulario.data_nascimento}
                      onChange={(event) => atualizarCampo('data_nascimento', event.target.value)}
                      type="date"
                    />
                    <small style={styles.textoAjuda}>Usada apenas para contagem de aniversariantes.</small>
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
                    <small style={styles.textoAjuda}>Controle de periodicidade; salve somente a data, sem laudos ou resultados.</small>
                  </label>
                </div>
              )}
            </section>

            <section className="funcionario-modal-section">
              <button className="funcionario-modal-section-toggle" type="button" onClick={() => alternarSecaoModal('observacoes')}>
                <span>
                  <strong>Observações administrativas</strong>
                  <small>Uso interno sem dados clínicos</small>
                </span>
                <b>{modalSecoesAbertas.observacoes ? '−' : '+'}</b>
              </button>
              {modalSecoesAbertas.observacoes && (
                <div className="funcionario-form-grid">
                  <label className="span-2">
                    Observações
                    <textarea
                      style={{ ...styles.input, minHeight: 90, resize: 'vertical' }}
                      value={formulario.observacoes}
                      onChange={(event) => atualizarCampo('observacoes', event.target.value)}
                      placeholder="Ex.: informação administrativa interna. Não inserir dados médicos ou documentos."
                    />
                    <small style={styles.textoAjuda}>
                      Use apenas observações administrativas. Não registre laudos, diagnósticos,
                      resultados de exames, documentos ou informações clínicas.
                    </small>
                  </label>
                </div>
              )}
            </section>

            <section className="funcionario-modal-section">
              <button className="funcionario-modal-section-toggle" type="button" onClick={() => alternarSecaoModal('exames')}>
                <span>
                  <strong>Exames periódicos</strong>
                  <small>Controle visual de datas, sem laudos ou resultados</small>
                </span>
                <b>{modalSecoesAbertas.exames ? '−' : '+'}</b>
              </button>

              {modalSecoesAbertas.exames && (
                <div className="funcionario-exames-section">
                  <div className="funcionario-exames-header">
                    <p>Registre somente as datas dos exames periódicos realizados. Não registre laudos, resultados, documentos ou informações clínicas.</p>
                    {funcionarioEditando?.id && (
                      <label className={`funcionarios-switch ${mostrarExamesArquivados ? 'ativo' : ''}`}>
                        <input
                          type="checkbox"
                          checked={mostrarExamesArquivados}
                          onChange={(event) => {
                            setMostrarExamesArquivados(event.target.checked)
                            cancelarEdicaoExame()
                          }}
                          disabled={loadingExames || salvandoExames}
                        />
                        <span className="funcionarios-switch-indicator" aria-hidden="true" />
                        <span>Mostrar arquivados</span>
                      </label>
                    )}
                  </div>

                  {!funcionarioEditando?.id ? (
                    <div className="funcionario-exames-empty">
                      Salve o funcionário antes de registrar exames periódicos.
                    </div>
                  ) : (
                    <>
                  <div className="funcionario-exames-add">
                    <label>
                      Data do exame periódico
                      <input
                        style={styles.input}
                        value={dataExamePeriodico}
                        onChange={(event) => setDataExamePeriodico(event.target.value)}
                        type="date"
                        disabled={salvandoExames}
                      />
                    </label>
                    <button
                      className="funcionarios-btn funcionarios-btn-primary"
                      type="button"
                      disabled={salvandoExames || !dataExamePeriodico}
                      onClick={adicionarExamePeriodico}
                    >
                      Adicionar exame
                    </button>
                  </div>

                  <div className="funcionario-exames-empty">
                    <strong>Próximo periódico previsto: {proximoPeriodicoPrevisto ? formatarDataCurta(proximoPeriodicoPrevisto) : 'Não informado'}</strong>
                    <br />
                    <span>
                      {origemProximoPeriodico
                        ? `Cálculo visual baseado no ${origemProximoPeriodico}. Este valor não é salvo no banco.`
                        : 'Informe o exame admissional ou registre um periódico para calcular a previsão.'}
                    </span>
                  </div>

                  {loadingExames ? (
                    <p style={styles.textoNota}>Carregando exames periódicos...</p>
                  ) : erroExames ? (
                    <div className="funcionario-exames-empty">
                      <strong>Não foi possível carregar os exames.</strong>
                      <p>{erroExames}</p>
                      <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={() => carregarExamesPeriodicos()}>
                        Tentar novamente
                      </button>
                    </div>
                  ) : exames.length === 0 ? (
                    <div className="funcionario-exames-empty">
                      Nenhum exame periódico registrado para este funcionário.
                    </div>
                  ) : (
                    <div className="funcionario-exames-list">
                      {exames.map((exame) => (
                        <article key={exame.id} className="funcionario-exame-row">
                          <div className="funcionario-exame-main">
                            {exameEditandoId === exame.id ? (
                              <div className="funcionario-exame-edit">
                                <input
                                  style={styles.input}
                                  value={dataExameEditando}
                                  onChange={(event) => setDataExameEditando(event.target.value)}
                                  type="date"
                                  disabled={salvandoExames}
                                />
                                <button
                                  className="funcionarios-btn funcionarios-btn-primary"
                                  type="button"
                                  disabled={salvandoExames || !dataExameEditando}
                                  onClick={() => salvarEdicaoExame(exame)}
                                >
                                  Salvar
                                </button>
                                <button className="funcionarios-btn funcionarios-btn-secondary" type="button" disabled={salvandoExames} onClick={cancelarEdicaoExame}>
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <>
                                <strong>{formatarDataCurta(exame.data_exame)}</strong>
                                <small>Data do exame periódico realizado.</small>
                              </>
                            )}
                            <span className={`funcionario-exame-status ${exame.arquivado ? 'arquivado' : ''}`}>
                              {exame.arquivado ? 'Arquivado' : 'Ativo'}
                            </span>
                          </div>
                          <div className="funcionario-exame-actions">
                            {exameEditandoId !== exame.id && (
                              <button
                                className="funcionarios-btn funcionarios-btn-secondary"
                                type="button"
                                disabled={salvandoExames || exame.arquivado}
                                onClick={() => iniciarEdicaoExame(exame)}
                              >
                                Editar
                              </button>
                            )}
                            <button
                              className={`funcionarios-btn ${exame.arquivado ? 'funcionarios-btn-primary' : 'funcionarios-btn-danger'}`}
                              type="button"
                              disabled={salvandoExames}
                              onClick={() => alternarArquivamentoExame(exame)}
                            >
                              {exame.arquivado ? 'Reativar' : 'Arquivar'}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                    </>
                  )}
                </div>
              )}
            </section>

            <div className="funcionario-modal-actions">
              <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={fecharFormulario} disabled={salvando}>Cancelar</button>
              <button className="funcionarios-btn funcionarios-btn-primary" type="submit" disabled={salvando || !empresaId || !podeEditar}>
                {salvando ? 'Salvando...' : 'Salvar funcionário'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
