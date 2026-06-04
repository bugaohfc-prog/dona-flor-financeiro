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
        funcionario.email,
        funcionario.telefone,
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
    setModalAberto(true)
  }

  function abrirEdicaoFuncionario(funcionario) {
    if (!funcionario?.id || !podeEditar) return
    limparErro?.()
    limparErroExames?.()
    setFuncionarioEditando(funcionario)
    setFormulario(montarFormulario(funcionario))
    setMostrarExamesArquivados(false)
    limparFormularioExamePeriodico()
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

  function limparFormularioExamePeriodico() {
    setDataExamePeriodico('')
    setExameEditandoId('')
    setDataExameEditando('')
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
      <style>{`
        .funcionarios-page { display: grid; gap: 18px; }
        .funcionarios-toolbar {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) minmax(150px, 180px) auto;
          gap: 12px;
          align-items: center;
        }
        .funcionarios-switch {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 0 12px;
          border: 1px solid #cbd5e1;
          border-radius: 999px;
          background: #ffffff;
          color: #475569;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
          cursor: pointer;
          transition: background .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease;
        }
        .funcionarios-switch:hover {
          border-color: #94a3b8;
          box-shadow: 0 8px 18px rgba(15, 23, 42, .06);
        }
        .funcionarios-switch input {
          position: absolute;
          inline-size: 1px;
          block-size: 1px;
          opacity: 0;
          pointer-events: none;
        }
        .funcionarios-switch-indicator {
          position: relative;
          width: 34px;
          height: 20px;
          border-radius: 999px;
          background: #e2e8f0;
          flex: 0 0 auto;
          transition: background .15s ease;
        }
        .funcionarios-switch-indicator::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(15, 23, 42, .22);
          transition: transform .15s ease;
        }
        .funcionarios-switch.ativo {
          background: #ecfdf5;
          border-color: #14b8a6;
          color: #0f766e;
        }
        .funcionarios-switch.ativo .funcionarios-switch-indicator {
          background: #14b8a6;
        }
        .funcionarios-switch.ativo .funcionarios-switch-indicator::after {
          transform: translateX(14px);
        }
        .funcionarios-switch:has(input:focus-visible) {
          outline: 3px solid rgba(20, 184, 166, .22);
          outline-offset: 2px;
        }
        .funcionarios-summary {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin: 14px 0;
        }
        .funcionarios-summary-card {
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 16px;
          background: #ffffff;
          padding: 12px;
          display: grid;
          gap: 4px;
          min-width: 0;
          box-shadow: 0 8px 20px rgba(15, 23, 42, .04);
        }
        .funcionarios-summary-card small {
          color: #64748b;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .03em;
        }
        .funcionarios-summary-card strong {
          color: #0f172a;
          font-size: 22px;
          line-height: 1;
        }
        .funcionarios-list { display: grid; gap: 12px; margin-top: 16px; }
        .funcionario-card {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          align-items: start;
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 16px;
          background: #ffffff;
          padding: 12px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, .05);
        }
        .funcionario-card.arquivado { background: #f8fafc; border-color: #cbd5e1; opacity: .82; }
        .funcionario-main { min-width: 0; display: flex; align-items: flex-start; gap: 12px; }
        .funcionario-avatar {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(20, 184, 166, .10);
          color: #0f766e;
          font-weight: 950;
          flex: 0 0 40px;
        }
        .funcionario-main h3 { margin: 0 0 4px; color: #0f172a; font-size: 16px; line-height: 1.2; }
        .funcionario-main small,
        .funcionario-meta small { display: block; color: #64748b; line-height: 1.35; }
        .funcionario-meta { display: flex; gap: 8px; color: #64748b; font-size: 12px; flex-wrap: wrap; align-items: center; }
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
        .funcionario-actions { display: flex; justify-content: flex-start; gap: 8px; flex-wrap: wrap; }
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
        .funcionario-exames-section {
          margin-top: 18px;
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 18px;
          background: #f8fafc;
          padding: 14px;
          display: grid;
          gap: 12px;
        }
        .funcionario-exames-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }
        .funcionario-exames-header h3 { margin: 0 0 5px; color: #0f172a; font-size: 16px; }
        .funcionario-exames-header p { margin: 0; color: #64748b; font-size: 12px; line-height: 1.45; }
        .funcionario-exames-add {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: end;
        }
        .funcionario-exames-add label { display: grid; gap: 6px; color: #475569; font-size: 12px; font-weight: 900; }
        .funcionario-exames-list { display: grid; gap: 10px; }
        .funcionario-exame-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          border: 1px solid rgba(15, 23, 42, .07);
          border-radius: 14px;
          background: #ffffff;
          padding: 10px;
        }
        .funcionario-exame-main { display: grid; gap: 5px; min-width: 0; }
        .funcionario-exame-main strong { color: #0f172a; font-size: 14px; }
        .funcionario-exame-main small { color: #64748b; line-height: 1.35; }
        .funcionario-exame-status {
          width: fit-content;
          border-radius: 999px;
          padding: 4px 8px;
          background: #ecfdf5;
          color: #0f766e;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .funcionario-exame-status.arquivado { background: #fee2e2; color: #b91c1c; }
        .funcionario-exame-actions { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
        .funcionario-exame-actions button,
        .funcionario-exames-add button { min-height: 34px !important; padding: 8px 11px !important; margin: 0 !important; }
        .funcionario-exame-edit {
          display: grid;
          grid-template-columns: minmax(0, 180px) auto auto;
          gap: 8px;
          align-items: center;
        }
        .funcionario-exames-empty {
          border: 1px dashed rgba(15, 23, 42, .14);
          border-radius: 14px;
          background: #ffffff;
          color: #64748b;
          padding: 12px;
          font-size: 13px;
          line-height: 1.4;
        }
        @media (min-width: 861px) {
          .funcionarios-summary { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .funcionario-card {
            grid-template-columns: minmax(0, 1.2fr) minmax(220px, .8fr) auto;
            align-items: center;
          }
          .funcionario-actions { justify-content: flex-end; }
        }
        @media (max-width: 860px) {
          .funcionarios-toolbar,
          .funcionario-form-grid,
          .funcionario-exames-add,
          .funcionario-exame-row,
          .funcionario-exame-edit {
            grid-template-columns: 1fr;
          }
          .funcionarios-toolbar { gap: 10px; }
          .funcionarios-switch {
            justify-content: space-between;
            width: 100%;
            padding: 0 12px;
          }
          .funcionario-exames-header { display: grid; }
          .funcionario-exame-actions { justify-content: flex-start; }
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
            <p style={styles.textoNota}>Leitura rápida da equipe, sem expor CPF, documentos, salário ou dados clínicos.</p>
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
            placeholder="Buscar por nome, cargo ou filial"
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
              const filialNome = filiaisPorId[funcionario.filial_id] || 'Sem filial'

              return (
                <article key={funcionario.id} className={`funcionario-card ${funcionario.arquivado ? 'arquivado' : ''}`}>
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
            <div className="master-list-header">
              <div>
                <span className="master-kicker">{funcionarioEditando ? 'Editar cadastro' : 'Novo cadastro'}</span>
                <h2 style={styles.subtitulo}>{funcionarioEditando ? 'Editar funcionário' : 'Novo funcionário'}</h2>
                <p style={styles.textoNota}>Preencha somente dados operacionais necessários para organizar a equipe.</p>
              </div>
              <button style={styles.btnCinza} type="button" onClick={fecharFormulario}>Fechar</button>
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
                  placeholder="Ex.: informação administrativa interna. Não inserir dados médicos ou documentos."
                />
                <small style={styles.textoAjuda}>
                  Use apenas observações administrativas. Não registre laudos, diagnósticos,
                  resultados de exames, documentos ou informações clínicas.
                </small>
              </label>
            </div>

            <section className="funcionario-exames-section">
              <div className="funcionario-exames-header">
                <div>
                  <h3>Exames periódicos</h3>
                  <p>Registre somente as datas dos exames periódicos realizados. Não registre laudos, resultados, documentos ou informações clínicas.</p>
                </div>
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
                      style={styles.btnSalvar}
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
                      <button style={styles.btnCinza} type="button" onClick={() => carregarExamesPeriodicos()}>
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
                                  style={styles.btnSalvar}
                                  type="button"
                                  disabled={salvandoExames || !dataExameEditando}
                                  onClick={() => salvarEdicaoExame(exame)}
                                >
                                  Salvar
                                </button>
                                <button style={styles.btnCinza} type="button" disabled={salvandoExames} onClick={cancelarEdicaoExame}>
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
                                style={styles.btnCinza}
                                type="button"
                                disabled={salvandoExames || exame.arquivado}
                                onClick={() => iniciarEdicaoExame(exame)}
                              >
                                Editar
                              </button>
                            )}
                            <button
                              style={exame.arquivado ? styles.btnSalvar : styles.btnCinza}
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
            </section>

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
