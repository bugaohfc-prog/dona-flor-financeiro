import { useMemo, useState } from 'react'
import { useFolha } from '../hooks/useFolha'
import { useFuncionarios } from '../hooks/useFuncionarios'
import {
  CATEGORIAS_CREDITO_FOLHA,
  CATEGORIAS_DESCONTO_FOLHA,
  CATEGORIAS_FINANCEIRAS_COM_VALOR_OBRIGATORIO,
  CATEGORIAS_INFORMATIVO_FOLHA,
  STATUS_COMPETENCIA_FOLHA
} from '../services/folhaService'

const FORM_COMPETENCIA_INICIAL = {
  competencia: '',
  status: 'aberta',
  observacao_administrativa: ''
}

const FORM_LANCAMENTO_INICIAL = {
  funcionario_id: '',
  natureza: 'credito',
  categoria: 'premiacao',
  descricao: '',
  data_referencia: '',
  quantidade: '',
  percentual: '',
  valor: '',
  observacao_administrativa: ''
}

const LABELS_STATUS_COMPETENCIA = {
  aberta: 'Aberta',
  em_conferencia: 'Em conferência',
  validada: 'Validada',
  enviada_contabilidade: 'Enviada à contabilidade',
  fechada: 'Fechada',
  arquivada: 'Arquivada'
}

const LABELS_NATUREZA = {
  credito: 'Crédito',
  desconto: 'Desconto',
  informativo: 'Informativo'
}

const LABELS_CATEGORIA = {
  premiacao: 'Premiação',
  hora_extra_50: 'Hora extra 50%',
  hora_extra_60: 'Hora extra 60%',
  hora_extra_100: 'Hora extra 100%',
  outro_credito: 'Outro crédito',
  compras_vales: 'Compras internas / vales',
  plano_saude: 'Plano de saúde',
  falta_injustificada: 'Falta injustificada',
  pensao_alimenticia: 'Pensão alimentícia',
  outro_desconto: 'Outro desconto',
  observacao_administrativa: 'Observação administrativa',
  data_falta: 'Dia/data da falta',
  status_conferencia: 'Status de conferência',
  origem_lancamento: 'Origem do lançamento'
}

const CATEGORIAS_OPCOES = [
  { grupo: 'Créditos', itens: CATEGORIAS_CREDITO_FOLHA },
  { grupo: 'Descontos', itens: CATEGORIAS_DESCONTO_FOLHA },
  { grupo: 'Informativos', itens: CATEGORIAS_INFORMATIVO_FOLHA }
]

const estilosLocais = {
  pageActions: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 14
  },
  pageIntro: {
    display: 'grid',
    gap: 4,
    minWidth: 240
  },
  sectionHeader: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  sectionTitleBlock: {
    display: 'grid',
    gap: 4,
    minWidth: 220
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12
  },
  resumoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 8
  },
  resumoCard: {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 12,
    background: '#fff',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
  },
  lista: {
    display: 'grid',
    gap: 10,
    marginTop: 12
  },
  item: {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 12,
    background: '#fff'
  },
  itemSelecionado: {
    borderColor: '#2563eb',
    background: '#eff6ff'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 10
  },
  competenciaGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(180px, .8fr) minmax(180px, .8fr) minmax(220px, 1.4fr)',
    gap: 10,
    alignItems: 'start'
  },
  formPanel: {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 12,
    background: '#f9fafb',
    display: 'grid',
    gap: 10
  },
  formPanelSoft: {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 12,
    background: '#fff',
    display: 'grid',
    gap: 10
  },
  formSectionTitle: {
    margin: 0,
    fontSize: 13,
    color: '#111827'
  },
  formActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  formField: {
    display: 'grid',
    gap: 6
  },
  label: {
    fontWeight: 700,
    fontSize: 13,
    color: '#374151'
  },
  input: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '10px 12px',
    minHeight: 42,
    boxSizing: 'border-box',
    font: 'inherit',
    background: '#fff'
  },
  inputReadOnly: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '10px 12px',
    minHeight: 42,
    boxSizing: 'border-box',
    font: 'inherit',
    background: '#f3f4f6',
    color: '#374151'
  },
  textarea: {
    width: '100%',
    minHeight: 64,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '10px 12px',
    font: 'inherit',
    resize: 'vertical'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '3px 8px',
    fontSize: 12,
    fontWeight: 700,
    background: '#f3f4f6',
    color: '#374151'
  },
  warning: {
    border: '1px solid #facc15',
    background: '#fefce8',
    color: '#854d0e',
    borderRadius: 8,
    padding: 12,
    margin: '12px 0'
  },
  error: {
    border: '1px solid #fecaca',
    background: '#fef2f2',
    color: '#991b1b',
    borderRadius: 8,
    padding: 12,
    margin: '12px 0'
  },
  helperText: {
    margin: 0,
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 1.4
  },
  tableWrap: {
    overflowX: 'auto',
    marginTop: 12,
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    background: '#fff'
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    minWidth: 920
  },
  th: {
    textAlign: 'left',
    borderBottom: '1px solid #d1d5db',
    padding: '12px 10px',
    fontSize: 12,
    color: '#111827',
    background: '#f3f4f6',
    whiteSpace: 'nowrap'
  },
  td: {
    borderBottom: '1px solid #f3f4f6',
    padding: '10px',
    verticalAlign: 'top',
    color: '#1f2937',
    lineHeight: 1.35
  },
  tdTexto: {
    maxWidth: 240,
    whiteSpace: 'normal',
    overflowWrap: 'anywhere'
  },
  tdMuted: {
    color: '#64748b',
    fontSize: 13
  },
  tdValor: {
    color: '#475569',
    fontWeight: 700,
    whiteSpace: 'nowrap'
  },
  acoesTabela: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  mobileCards: {
    display: 'none'
  },
  mobileCard: {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 12,
    background: '#fff',
    display: 'grid',
    gap: 10
  },
  mobileCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10
  },
  mobileMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 8
  },
  mobileMetaItem: {
    border: '1px solid #eef2f7',
    borderRadius: 8,
    padding: 8,
    background: '#f8fafc',
    display: 'grid',
    gap: 3
  },
  mobileMetaLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase'
  }
}

function obterNaturezaPorCategoria(categoria) {
  if (CATEGORIAS_CREDITO_FOLHA.includes(categoria)) return 'credito'
  if (CATEGORIAS_DESCONTO_FOLHA.includes(categoria)) return 'desconto'
  return 'informativo'
}

function criarFormularioCompetenciaInicial() {
  return { ...FORM_COMPETENCIA_INICIAL }
}

function criarFormularioLancamentoInicial() {
  return { ...FORM_LANCAMENTO_INICIAL }
}

function formatarData(data) {
  const texto = String(data || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return 'Não informada'
  const [ano, mes, dia] = texto.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarDataHora(data) {
  if (!data) return 'Não informada'
  const valor = new Date(data)
  if (Number.isNaN(valor.getTime())) return 'Não informada'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(valor)
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(valor) || 0)
}

function formatarNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return '-'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number(valor) || 0)
}

function normalizarTexto(valor) {
  return String(valor || '').trim()
}

function montarPayloadLancamento(formulario) {
  const payload = {
    natureza: formulario.natureza,
    categoria: formulario.categoria,
    descricao: normalizarTexto(formulario.descricao) || null,
    data_referencia: normalizarTexto(formulario.data_referencia) || null,
    quantidade: formulario.quantidade === '' ? null : formulario.quantidade,
    percentual: formulario.percentual === '' ? null : formulario.percentual,
    valor: formulario.valor === '' ? null : formulario.valor,
    observacao_administrativa: normalizarTexto(formulario.observacao_administrativa) || null
  }

  return payload
}

function obterNomeFuncionario(funcionariosPorId, funcionarioId) {
  const funcionario = funcionariosPorId.get(funcionarioId)
  if (!funcionario) return 'Funcionário não encontrado'
  return [funcionario.nome, funcionario.cargo].filter(Boolean).join(' • ')
}

export default function FechamentoFolhaPage({
  styles,
  empresaId,
  empresaNome,
  podeEditar = true,
  voltarPainel
}) {
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false)
  const [mostrarLancamentosArquivados, setMostrarLancamentosArquivados] = useState(false)
  const [competenciaSelecionadaId, setCompetenciaSelecionadaId] = useState('')
  const [formCompetencia, setFormCompetencia] = useState(criarFormularioCompetenciaInicial)
  const [formLancamento, setFormLancamento] = useState(criarFormularioLancamentoInicial)
  const [lancamentoEditandoId, setLancamentoEditandoId] = useState('')
  const [erroFormulario, setErroFormulario] = useState('')

  const {
    competencias,
    lancamentos,
    loading,
    loadingLancamentos,
    salvando,
    erro,
    resumo,
    criarCompetencia,
    arquivarCompetencia,
    reativarCompetencia,
    criarLancamento,
    atualizarLancamento,
    arquivarLancamento,
    reativarLancamento,
    limparErro
  } = useFolha({
    empresaId,
    competenciaId: competenciaSelecionadaId,
    incluirArquivadas: mostrarArquivadas,
    incluirArquivados: mostrarLancamentosArquivados,
    autoCarregarCompetencias: Boolean(empresaId),
    autoCarregarLancamentos: Boolean(empresaId && competenciaSelecionadaId)
  })

  const {
    funcionarios,
    loading: loadingFuncionarios,
    erro: erroFuncionarios
  } = useFuncionarios({
    empresaId,
    incluirArquivados: false,
    autoCarregar: Boolean(empresaId)
  })

  const funcionariosOrdenados = useMemo(() => {
    return [...(funcionarios || [])]
      .filter((funcionario) => !funcionario.arquivado)
      .sort((a, b) => normalizarTexto(a.nome).localeCompare(normalizarTexto(b.nome), 'pt-BR'))
  }, [funcionarios])

  const funcionariosPorId = useMemo(() => {
    return new Map((funcionarios || []).map((funcionario) => [funcionario.id, funcionario]))
  }, [funcionarios])

  const competenciaSelecionada = useMemo(() => {
    return competencias.find((competencia) => competencia.id === competenciaSelecionadaId) || null
  }, [competenciaSelecionadaId, competencias])

  function definirCategoria(categoria) {
    setFormLancamento((atual) => ({
      ...atual,
      categoria,
      natureza: obterNaturezaPorCategoria(categoria)
    }))
  }

  function limparMensagens() {
    setErroFormulario('')
    limparErro()
  }

  function validarFormularioLancamento() {
    if (!empresaId) return 'Empresa ativa não identificada.'
    if (!competenciaSelecionadaId) return 'Selecione uma competência antes de lançar.'
    if (!lancamentoEditandoId && !formLancamento.funcionario_id) return 'Selecione um funcionário.'
    if (!formLancamento.natureza || !formLancamento.categoria) return 'Informe natureza e categoria.'
    if (Number(formLancamento.valor) < 0) return 'O valor não pode ser negativo.'

    if (
      CATEGORIAS_FINANCEIRAS_COM_VALOR_OBRIGATORIO.includes(formLancamento.categoria) &&
      formLancamento.valor === ''
    ) {
      return 'Informe o valor para esta categoria.'
    }

    if (
      (formLancamento.categoria === 'outro_credito' || formLancamento.categoria === 'outro_desconto') &&
      !normalizarTexto(formLancamento.descricao)
    ) {
      return 'Informe uma descrição para outro crédito/outro desconto.'
    }

    return ''
  }

  async function salvarCompetencia(event) {
    event.preventDefault()
    limparMensagens()

    if (!empresaId) {
      setErroFormulario('Empresa ativa não identificada.')
      return
    }

    const resposta = await criarCompetencia(formCompetencia)
    if (resposta.error) {
      setErroFormulario(resposta.error.message || 'Não foi possível criar a competência.')
      return
    }

    setFormCompetencia(criarFormularioCompetenciaInicial())
    if (resposta.data?.id) setCompetenciaSelecionadaId(resposta.data.id)
  }

  async function alternarArquivoCompetencia(competencia) {
    limparMensagens()
    const resposta = competencia.arquivado
      ? await reativarCompetencia(competencia.id)
      : await arquivarCompetencia(competencia.id)

    if (resposta.error) {
      setErroFormulario(resposta.error.message || 'Não foi possível atualizar a competência.')
    }
  }

  async function salvarLancamento(event) {
    event.preventDefault()
    limparMensagens()
    const erroValidacao = validarFormularioLancamento()

    if (erroValidacao) {
      setErroFormulario(erroValidacao)
      return
    }

    const payloadBase = montarPayloadLancamento(formLancamento)
    const resposta = lancamentoEditandoId
      ? await atualizarLancamento(lancamentoEditandoId, payloadBase)
      : await criarLancamento({
        ...payloadBase,
        competencia_id: competenciaSelecionadaId,
        funcionario_id: formLancamento.funcionario_id
      })

    if (resposta.error) {
      setErroFormulario(resposta.error.message || 'Não foi possível salvar o lançamento.')
      return
    }

    setLancamentoEditandoId('')
    setFormLancamento(criarFormularioLancamentoInicial())
  }

  function iniciarEdicaoLancamento(lancamento) {
    limparMensagens()
    setLancamentoEditandoId(lancamento.id)
    setFormLancamento({
      funcionario_id: lancamento.funcionario_id || '',
      natureza: lancamento.natureza || obterNaturezaPorCategoria(lancamento.categoria),
      categoria: lancamento.categoria || 'premiacao',
      descricao: lancamento.descricao || '',
      data_referencia: lancamento.data_referencia || '',
      quantidade: lancamento.quantidade ?? '',
      percentual: lancamento.percentual ?? '',
      valor: lancamento.valor ?? '',
      observacao_administrativa: lancamento.observacao_administrativa || ''
    })
  }

  function cancelarEdicaoLancamento() {
    setLancamentoEditandoId('')
    setFormLancamento(criarFormularioLancamentoInicial())
    setErroFormulario('')
  }

  async function alternarArquivoLancamento(lancamento) {
    limparMensagens()
    const resposta = lancamento.arquivado
      ? await reativarLancamento(lancamento.id)
      : await arquivarLancamento(lancamento.id)

    if (resposta.error) {
      setErroFormulario(resposta.error.message || 'Não foi possível atualizar o lançamento.')
    }
  }

  const mensagemErro = erroFormulario || erro || erroFuncionarios

  return (
    <>
      <style>{`
        .folha-page-shell {
          display: grid;
          gap: 14px;
        }
        .folha-section {
          scroll-margin-top: 18px;
        }
        .folha-section.compact {
          padding-top: 14px !important;
          padding-bottom: 14px !important;
        }
        .folha-resumo-card h3 {
          margin: 4px 0 0;
          color: #334155;
          font-size: 18px;
          line-height: 1.15;
        }
        .folha-resumo-card.is-money h3 {
          color: #475569;
          font-size: 16px;
        }
        .folha-table tbody tr:hover {
          background: #f8fafc;
        }
        .folha-table tbody tr:last-child td {
          border-bottom: 0;
        }
        .folha-money {
          color: #475569;
          font-weight: 700;
          white-space: nowrap;
        }
        .folha-card-description {
          margin: 0;
          color: #475569;
          font-size: 13px;
          line-height: 1.4;
        }
        .folha-mobile-note {
          display: none;
        }
        @media (max-width: 860px) {
          .folha-page-shell {
            gap: 12px;
          }
          .folha-desktop-list {
            display: none !important;
          }
          .folha-mobile-list {
            display: grid !important;
            gap: 10px;
            margin-top: 12px;
          }
          .folha-mobile-note {
            display: block;
          }
          .folha-competencia-grid {
            grid-template-columns: 1fr !important;
          }
          .folha-mobile-meta-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 560px) {
          .folha-mobile-meta-grid {
            grid-template-columns: 1fr;
          }
          .folha-card-actions {
            width: 100%;
          }
          .folha-card-actions button {
            flex: 1 1 130px;
          }
        }
      `}</style>
      <div className="folha-page-shell">
      <div style={estilosLocais.pageActions}>
        <div style={estilosLocais.pageIntro}>
          <h1 style={styles.titulo}>Fechamento de Folha</h1>
          <p style={styles.textoNota}>Controle inicial de competências e lançamentos mensais da folha.</p>
          {empresaNome && <p style={styles.textoNota}>Empresa ativa: <strong>{empresaNome}</strong></p>}
        </div>
        {voltarPainel && (
          <button type="button" style={styles.btnCinza} onClick={voltarPainel}>
            Voltar
          </button>
        )}
      </div>

      <section className="folha-section compact" style={styles.cardConfiguracao}>
        <strong>Atenção LGPD</strong>
        <p style={styles.textoNota}>
          Não registre dados médicos, CID, laudos, diagnósticos, documentos ou informações clínicas.
          Esta tela não cria exportações, anexos, integrações financeiras ou alterações em férias.
        </p>
      </section>

      {!empresaId && (
        <section className="folha-section compact" style={styles.cardConfiguracao}>
          <h2 style={styles.subtitulo}>Empresa ativa não identificada</h2>
          <p style={styles.textoNota}>Selecione uma empresa para carregar competências e lançamentos da folha.</p>
        </section>
      )}

      {mensagemErro && (
        <div style={estilosLocais.error}>
          {mensagemErro}
        </div>
      )}

      <section className="folha-section compact" style={styles.cardConfiguracao}>
        <h2 style={styles.subtitulo}>Competências</h2>
        <p style={styles.textoNota}>Crie e selecione uma competência mensal no formato AAAA-MM.</p>

        <form onSubmit={salvarCompetencia} style={estilosLocais.formPanel}>
          <div className="folha-competencia-grid" style={estilosLocais.competenciaGrid}>
            <label style={estilosLocais.formField}>
              <span style={estilosLocais.label}>Competência</span>
              <input
                type="month"
                value={formCompetencia.competencia}
                onChange={(event) => setFormCompetencia((atual) => ({ ...atual, competencia: event.target.value }))}
                style={estilosLocais.input}
                disabled={!empresaId || !podeEditar || salvando}
                placeholder="2026-05"
                required
              />
              <small style={estilosLocais.helperText}>
                Escolha o mês de referência. O sistema salva no formato AAAA-MM, por exemplo 2026-05.
              </small>
              {formCompetencia.competencia && (
                <span style={{ ...estilosLocais.badge, justifySelf: 'start' }}>
                  Valor selecionado: {formCompetencia.competencia}
                </span>
              )}
            </label>

            <label style={estilosLocais.formField}>
              <span style={estilosLocais.label}>Status inicial</span>
              <select
                value={formCompetencia.status}
                onChange={(event) => setFormCompetencia((atual) => ({ ...atual, status: event.target.value }))}
                style={estilosLocais.input}
                disabled={!empresaId || !podeEditar || salvando}
              >
                {STATUS_COMPETENCIA_FOLHA.map((status) => (
                  <option key={status} value={status}>{LABELS_STATUS_COMPETENCIA[status] || status}</option>
                ))}
              </select>
              <small style={estilosLocais.helperText}>
                Define o status inicial da competência criada.
              </small>
            </label>
          </div>

          <label style={{ ...estilosLocais.formField, gridColumn: '1 / -1' }}>
            <span style={estilosLocais.label}>Observação administrativa</span>
            <textarea
              value={formCompetencia.observacao_administrativa}
              onChange={(event) => setFormCompetencia((atual) => ({
                ...atual,
                observacao_administrativa: event.target.value
              }))}
              style={estilosLocais.textarea}
              disabled={!empresaId || !podeEditar || salvando}
              placeholder="Somente contexto administrativo. Não inclua documentos, saúde, CID ou dados clínicos."
            />
          </label>

          <div style={estilosLocais.formActions}>
            <button
              type="submit"
              style={styles.btnPrimario}
              disabled={!empresaId || !podeEditar || salvando}
            >
              {salvando ? 'Salvando...' : 'Criar competência'}
            </button>
            <label style={{ ...styles.textoNota, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={mostrarArquivadas}
                onChange={(event) => setMostrarArquivadas(event.target.checked)}
              />
              Mostrar arquivadas
            </label>
          </div>
        </form>

        {loading && !competencias.length ? (
          <p style={styles.textoNota}>Carregando competências...</p>
        ) : competencias.length === 0 ? (
          <p style={styles.textoNota}>Nenhuma competência encontrada para a empresa ativa.</p>
        ) : (
          <div style={estilosLocais.lista}>
            {competencias.map((competencia) => {
              const selecionada = competencia.id === competenciaSelecionadaId
              return (
                <article
                  key={competencia.id}
                  style={{
                    ...estilosLocais.item,
                    ...(selecionada ? estilosLocais.itemSelecionado : {})
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 190 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 18 }}>{competencia.competencia}</strong>
                        <span style={estilosLocais.badge}>
                          {LABELS_STATUS_COMPETENCIA[competencia.status] || competencia.status}
                        </span>
                      </div>
                      <p style={styles.textoNota}>
                        Atualizada em {formatarDataHora(competencia.atualizado_em)}
                      </p>
                    </div>
                    <div style={{ ...estilosLocais.formActions, justifyContent: 'flex-end' }}>
                      {competencia.arquivado && <span style={estilosLocais.badge}>Arquivada</span>}
                      {selecionada ? (
                        <span style={estilosLocais.badge}>Selecionada</span>
                      ) : (
                        <button
                          type="button"
                          style={styles.btnPrimario}
                          onClick={() => setCompetenciaSelecionadaId(competencia.id)}
                        >
                          Selecionar
                        </button>
                      )}
                      <button
                        type="button"
                        style={styles.btnCinza}
                        onClick={() => alternarArquivoCompetencia(competencia)}
                        disabled={!podeEditar || salvando}
                      >
                        {competencia.arquivado ? 'Reativar' : 'Arquivar'}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="folha-section compact" style={styles.cardConfiguracao}>
        <h2 style={styles.subtitulo}>Resumo da competência selecionada</h2>
        {!competenciaSelecionada ? (
          <p style={styles.textoNota}>Selecione uma competência para ver o resumo e os lançamentos.</p>
        ) : (
          <>
            <p style={styles.textoNota}>
              Competência <strong>{competenciaSelecionada.competencia}</strong> • {LABELS_STATUS_COMPETENCIA[competenciaSelecionada.status] || competenciaSelecionada.status}
            </p>
            <div style={estilosLocais.resumoGrid}>
              <div className="folha-resumo-card is-money" style={estilosLocais.resumoCard}>
                <span style={styles.textoNota}>Total de créditos</span>
                <h3>{formatarMoeda(resumo.totalCreditos)}</h3>
              </div>
              <div className="folha-resumo-card is-money" style={estilosLocais.resumoCard}>
                <span style={styles.textoNota}>Total de descontos</span>
                <h3>{formatarMoeda(resumo.totalDescontos)}</h3>
              </div>
              <div className="folha-resumo-card is-money" style={estilosLocais.resumoCard}>
                <span style={styles.textoNota}>Saldo informativo</span>
                <h3>{formatarMoeda(resumo.saldoInformativo)}</h3>
              </div>
              <div className="folha-resumo-card" style={estilosLocais.resumoCard}>
                <span style={styles.textoNota}>Lançamentos</span>
                <h3>{resumo.quantidadeLancamentos}</h3>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="folha-section compact" style={styles.cardConfiguracao}>
        <h2 style={styles.subtitulo}>{lancamentoEditandoId ? 'Editar lançamento' : 'Lançamento manual'}</h2>
        <p style={styles.textoNota}>
          O lançamento manual respeita a empresa ativa, a competência selecionada e a RLS do Supabase.
        </p>

        {!competenciaSelecionada ? (
          <p style={styles.textoNota}>Selecione uma competência antes de criar lançamentos.</p>
        ) : (
          <form onSubmit={salvarLancamento} style={{ display: 'grid', gap: 12 }}>
            <div style={estilosLocais.formPanelSoft}>
              <h3 style={estilosLocais.formSectionTitle}>Dados principais</h3>
              <div style={estilosLocais.formGrid}>
                <label style={estilosLocais.formField}>
                  <span style={estilosLocais.label}>Funcionário</span>
                  <select
                    value={formLancamento.funcionario_id}
                    onChange={(event) => setFormLancamento((atual) => ({ ...atual, funcionario_id: event.target.value }))}
                    style={estilosLocais.input}
                    disabled={!empresaId || !podeEditar || salvando || Boolean(lancamentoEditandoId)}
                    required={!lancamentoEditandoId}
                  >
                    <option value="">Selecione</option>
                    {funcionariosOrdenados.map((funcionario) => (
                      <option key={funcionario.id} value={funcionario.id}>
                        {[funcionario.nome, funcionario.cargo].filter(Boolean).join(' • ')}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={estilosLocais.formField}>
                  <span style={estilosLocais.label}>Categoria</span>
                  <select
                    value={formLancamento.categoria}
                    onChange={(event) => definirCategoria(event.target.value)}
                    style={estilosLocais.input}
                    disabled={!empresaId || !podeEditar || salvando}
                  >
                    {CATEGORIAS_OPCOES.map((grupo) => (
                      <optgroup key={grupo.grupo} label={grupo.grupo}>
                        {grupo.itens.map((categoria) => (
                          <option key={categoria} value={categoria}>
                            {LABELS_CATEGORIA[categoria] || categoria}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>

                <label style={estilosLocais.formField}>
                  <span style={estilosLocais.label}>Natureza</span>
                  <input
                    value={LABELS_NATUREZA[formLancamento.natureza] || formLancamento.natureza}
                    style={estilosLocais.inputReadOnly}
                    disabled
                    readOnly
                  />
                </label>
              </div>
            </div>

            <div style={estilosLocais.formPanelSoft}>
              <h3 style={estilosLocais.formSectionTitle}>Valores e referência</h3>
              <div style={estilosLocais.formGrid}>
                <label style={estilosLocais.formField}>
                  <span style={estilosLocais.label}>Data de referência</span>
                  <input
                    type="date"
                    value={formLancamento.data_referencia}
                    onChange={(event) => setFormLancamento((atual) => ({ ...atual, data_referencia: event.target.value }))}
                    style={estilosLocais.input}
                    disabled={!empresaId || !podeEditar || salvando}
                  />
                </label>

                <label style={estilosLocais.formField}>
                  <span style={estilosLocais.label}>Quantidade</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formLancamento.quantidade}
                    onChange={(event) => setFormLancamento((atual) => ({ ...atual, quantidade: event.target.value }))}
                    style={estilosLocais.input}
                    disabled={!empresaId || !podeEditar || salvando}
                  />
                </label>

                <label style={estilosLocais.formField}>
                  <span style={estilosLocais.label}>Percentual</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formLancamento.percentual}
                    onChange={(event) => setFormLancamento((atual) => ({ ...atual, percentual: event.target.value }))}
                    style={estilosLocais.input}
                    disabled={!empresaId || !podeEditar || salvando}
                  />
                </label>

                <label style={estilosLocais.formField}>
                  <span style={estilosLocais.label}>Valor</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formLancamento.valor}
                    onChange={(event) => setFormLancamento((atual) => ({ ...atual, valor: event.target.value }))}
                    style={estilosLocais.input}
                    disabled={!empresaId || !podeEditar || salvando}
                  />
                </label>
              </div>
            </div>

            <div style={estilosLocais.formPanelSoft}>
              <h3 style={estilosLocais.formSectionTitle}>Descrição e conferência</h3>
              <label style={estilosLocais.formField}>
                <span style={estilosLocais.label}>Descrição</span>
                <input
                  value={formLancamento.descricao}
                  onChange={(event) => setFormLancamento((atual) => ({ ...atual, descricao: event.target.value }))}
                  style={estilosLocais.input}
                  disabled={!empresaId || !podeEditar || salvando}
                  placeholder="Descrição administrativa obrigatória para outro crédito/outro desconto."
                />
              </label>

              <label style={estilosLocais.formField}>
                <span style={estilosLocais.label}>Observação administrativa</span>
                <textarea
                  value={formLancamento.observacao_administrativa}
                  onChange={(event) => setFormLancamento((atual) => ({
                    ...atual,
                    observacao_administrativa: event.target.value
                  }))}
                  style={estilosLocais.textarea}
                  disabled={!empresaId || !podeEditar || salvando}
                  placeholder="Somente contexto administrativo. Não inclua documentos, saúde, CID ou dados clínicos."
                />
                <small style={estilosLocais.helperText}>
                  Não registre dados médicos, CID, laudos, diagnósticos, documentos ou informações clínicas.
                </small>
              </label>
            </div>

            <div style={estilosLocais.formActions}>
              <button
                type="submit"
                style={styles.btnPrimario}
                disabled={!empresaId || !podeEditar || salvando || loadingFuncionarios}
              >
                {salvando ? 'Salvando...' : (lancamentoEditandoId ? 'Salvar edição' : 'Criar lançamento')}
              </button>
              {lancamentoEditandoId && (
                <button type="button" style={styles.btnCinza} onClick={cancelarEdicaoLancamento}>
                  Cancelar edição
                </button>
              )}
            </div>
          </form>
        )}
      </section>

      <section className="folha-section" style={styles.cardConfiguracao}>
        <div style={estilosLocais.pageActions}>
          <div>
            <h2 style={styles.subtitulo}>Lançamentos da competência</h2>
            <p style={styles.textoNota}>Lista interna sem CPF, exportação, documentos ou integração financeira.</p>
          </div>
          <label style={{ ...styles.textoNota, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={mostrarLancamentosArquivados}
              onChange={(event) => setMostrarLancamentosArquivados(event.target.checked)}
              disabled={!competenciaSelecionada}
            />
            Mostrar arquivados
          </label>
        </div>

        {!competenciaSelecionada ? (
          <p style={styles.textoNota}>Selecione uma competência para carregar lançamentos.</p>
        ) : loadingLancamentos ? (
          <p style={styles.textoNota}>Carregando lançamentos...</p>
        ) : lancamentos.length === 0 ? (
          <p style={styles.textoNota}>Nenhum lançamento encontrado para a competência selecionada.</p>
        ) : (
          <>
          <p className="folha-mobile-note" style={styles.textoNota}>
            No celular, os lançamentos aparecem em cards para facilitar leitura e conferência.
          </p>
          <div className="folha-desktop-list" style={estilosLocais.tableWrap}>
            <table className="folha-table" style={estilosLocais.table}>
              <thead>
                <tr>
                  <th style={estilosLocais.th}>Funcionário</th>
                  <th style={estilosLocais.th}>Natureza</th>
                  <th style={estilosLocais.th}>Categoria</th>
                  <th style={estilosLocais.th}>Descrição</th>
                  <th style={estilosLocais.th}>Data</th>
                  <th style={estilosLocais.th}>Qtd.</th>
                  <th style={estilosLocais.th}>%</th>
                  <th style={estilosLocais.th}>Valor</th>
                  <th style={estilosLocais.th}>Conferido</th>
                  <th style={estilosLocais.th}>Status</th>
                  <th style={estilosLocais.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((lancamento) => (
                  <tr key={lancamento.id}>
                    <td style={{ ...estilosLocais.td, ...estilosLocais.tdTexto }}>
                      {obterNomeFuncionario(funcionariosPorId, lancamento.funcionario_id)}
                    </td>
                    <td style={{ ...estilosLocais.td, ...estilosLocais.tdMuted }}>{LABELS_NATUREZA[lancamento.natureza] || lancamento.natureza}</td>
                    <td style={{ ...estilosLocais.td, ...estilosLocais.tdMuted }}>{LABELS_CATEGORIA[lancamento.categoria] || lancamento.categoria}</td>
                    <td style={{ ...estilosLocais.td, ...estilosLocais.tdTexto }}>{lancamento.descricao || '-'}</td>
                    <td style={{ ...estilosLocais.td, ...estilosLocais.tdMuted }}>{formatarData(lancamento.data_referencia)}</td>
                    <td style={{ ...estilosLocais.td, ...estilosLocais.tdMuted }}>{formatarNumero(lancamento.quantidade)}</td>
                    <td style={{ ...estilosLocais.td, ...estilosLocais.tdMuted }}>{formatarNumero(lancamento.percentual)}</td>
                    <td style={{ ...estilosLocais.td, ...estilosLocais.tdValor }}>{lancamento.valor === null ? '-' : formatarMoeda(lancamento.valor)}</td>
                    <td style={{ ...estilosLocais.td, ...estilosLocais.tdMuted }}>{lancamento.conferido ? 'Sim' : 'Não'}</td>
                    <td style={{ ...estilosLocais.td, ...estilosLocais.tdMuted }}>{lancamento.arquivado ? 'Arquivado' : 'Ativo'}</td>
                    <td style={estilosLocais.td}>
                      <div style={estilosLocais.acoesTabela}>
                        <button
                          type="button"
                          style={styles.btnCinza}
                          onClick={() => iniciarEdicaoLancamento(lancamento)}
                          disabled={!podeEditar || salvando || lancamento.arquivado}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          style={styles.btnCinza}
                          onClick={() => alternarArquivoLancamento(lancamento)}
                          disabled={!podeEditar || salvando}
                        >
                          {lancamento.arquivado ? 'Reativar' : 'Arquivar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="folha-mobile-list" style={estilosLocais.mobileCards}>
            {lancamentos.map((lancamento) => (
              <article key={`mobile-${lancamento.id}`} style={estilosLocais.mobileCard}>
                <div style={estilosLocais.mobileCardHeader}>
                  <div>
                    <strong>{obterNomeFuncionario(funcionariosPorId, lancamento.funcionario_id)}</strong>
                    <p className="folha-card-description">
                      {LABELS_CATEGORIA[lancamento.categoria] || lancamento.categoria} - {LABELS_NATUREZA[lancamento.natureza] || lancamento.natureza}
                    </p>
                  </div>
                  <span style={estilosLocais.badge}>{lancamento.arquivado ? 'Arquivado' : 'Ativo'}</span>
                </div>

                {lancamento.descricao && (
                  <p className="folha-card-description">{lancamento.descricao}</p>
                )}

                <div className="folha-mobile-meta-grid" style={estilosLocais.mobileMetaGrid}>
                  <div style={estilosLocais.mobileMetaItem}>
                    <span style={estilosLocais.mobileMetaLabel}>Data</span>
                    <strong>{formatarData(lancamento.data_referencia)}</strong>
                  </div>
                  <div style={estilosLocais.mobileMetaItem}>
                    <span style={estilosLocais.mobileMetaLabel}>Valor</span>
                    <strong className="folha-money">{lancamento.valor === null ? '-' : formatarMoeda(lancamento.valor)}</strong>
                  </div>
                  <div style={estilosLocais.mobileMetaItem}>
                    <span style={estilosLocais.mobileMetaLabel}>Qtd. / %</span>
                    <strong>{formatarNumero(lancamento.quantidade)} / {formatarNumero(lancamento.percentual)}</strong>
                  </div>
                  <div style={estilosLocais.mobileMetaItem}>
                    <span style={estilosLocais.mobileMetaLabel}>Conferido</span>
                    <strong>{lancamento.conferido ? 'Sim' : 'Não'}</strong>
                  </div>
                </div>

                <div className="folha-card-actions" style={estilosLocais.acoesTabela}>
                  <button
                    type="button"
                    style={styles.btnCinza}
                    onClick={() => iniciarEdicaoLancamento(lancamento)}
                    disabled={!podeEditar || salvando || lancamento.arquivado}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    style={styles.btnCinza}
                    onClick={() => alternarArquivoLancamento(lancamento)}
                    disabled={!podeEditar || salvando}
                  >
                    {lancamento.arquivado ? 'Reativar' : 'Arquivar'}
                  </button>
                </div>
              </article>
            ))}
          </div>
          </>
        )}
      </section>
      </div>
    </>
  )
}
