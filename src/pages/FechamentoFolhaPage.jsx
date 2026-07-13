import { useEffect, useMemo, useState } from 'react'
import { useFolha } from '../hooks/useFolha'
import { useFuncionarios } from '../hooks/useFuncionarios'
import FolhaContextoColaboradorAtivo from '../modules/folha/components/fechamento/FolhaContextoColaboradorAtivo'
import FolhaItensDetalhados from '../modules/folha/components/fechamento/FolhaItensDetalhados'
import FolhaLancamentoAcoes from '../modules/folha/components/fechamento/FolhaLancamentoAcoes'
import FolhaLancamentosLista from '../modules/folha/components/fechamento/FolhaLancamentosLista'
import FolhaResumoGrupo from '../modules/folha/components/fechamento/FolhaResumoGrupo'
import {
  FolhaSectionHeader,
  FolhaSubsectionHeader
} from '../modules/folha/components/fechamento/FolhaSectionHeader'
import {
  formatarData,
  formatarDataHora,
  formatarMoeda,
  formatarNumero,
  formatarValorFormulario,
  normalizarBusca,
  normalizarTexto,
  parseNumeroFormulario
} from '../modules/folha/utils/fechamento/folhaFormatters'
import {
  CATEGORIAS_CREDITO_FOLHA,
  CATEGORIAS_DESCONTO_FOLHA,
  CATEGORIAS_FINANCEIRAS_COM_VALOR_OBRIGATORIO,
  CATEGORIAS_INFORMATIVO_FOLHA,
  CATEGORIAS_ITENS_DETALHADOS_FOLHA,
  STATUS_COMPETENCIA_FOLHA
} from '../services/folhaService'
import { exportarControleCompras, exportarConsolidadoContabil } from '../modules/folha/utils/fechamento/folhaExport'

const FORM_COMPETENCIA_INICIAL = {
  competencia: '',
  status: 'aberta',
  observacao_administrativa: ''
}

const FORM_LANCAMENTO_INICIAL = {
  funcionario_id: '',
  filial_id: '',
  natureza: 'credito',
  categoria: 'premiacao',
  descricao: '',
  valor_venda: '',
  data_referencia: '',
  quantidade: '',
  percentual: '',
  valor: '',
  observacao_administrativa: ''
}

const FORM_ITEM_INICIAL = {
  descricao: '',
  data_referencia: '',
  quantidade: '',
  percentual: '',
  valor_base: '',
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

const CATEGORIAS_HORAS_EXTRAS = new Set([
  'hora_extra_50',
  'hora_extra_60',
  'hora_extra_100'
])

const CATEGORIAS_VALOR_ZERO_INFORMATIVO = new Set([
  'hora_extra_50',
  'hora_extra_60',
  'hora_extra_100',
  'falta_injustificada'
])

const CATEGORIAS_ITENS_DETALHADOS = new Set(CATEGORIAS_ITENS_DETALHADOS_FOLHA)
const MODO_FOLHA_CONFERENCIA = 'conferencia'
const MODO_FOLHA_EDICAO_COLABORADOR = 'edicao_colaborador'

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
    borderRadius: 14,
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
    borderRadius: 14,
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
    borderRadius: 16,
    padding: 12,
    background: '#f9fafb',
    display: 'grid',
    gap: 10
  },
  formPanelSoft: {
    border: '1px solid #e5e7eb',
    borderRadius: 14,
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
    borderRadius: 12,
    padding: '10px 12px',
    minHeight: 42,
    boxSizing: 'border-box',
    font: 'inherit',
    background: '#fff'
  },
  inputReadOnly: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: 12,
    padding: '10px 12px',
    minHeight: 42,
    boxSizing: 'border-box',
    font: 'inherit',
    background: '#f3f4f6',
    color: '#374151'
  },
  textarea: {
    width: '100%',
    minHeight: 88,
    border: '1px solid #d1d5db',
    borderRadius: 12,
    padding: '10px 12px',
    boxSizing: 'border-box',
    font: 'inherit',
    lineHeight: 1.45,
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
    borderRadius: 12,
    padding: 12,
    margin: '12px 0'
  },
  error: {
    border: '1px solid #fecaca',
    background: '#fef2f2',
    color: '#991b1b',
    borderRadius: 12,
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
    borderRadius: 14,
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
    borderRadius: 14,
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
  mobileGroup: {
    display: 'grid',
    gap: 10,
    padding: '10px 0 4px',
    borderTop: '1px solid #e5e7eb'
  },
  mobileMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 8
  },
  mobileMetaItem: {
    border: '1px solid #eef2f7',
    borderRadius: 12,
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
  },
  grupoLancamentosHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap'
  },
  grupoLancamentosNome: {
    display: 'grid',
    gap: 4,
    minWidth: 180
  },
  grupoResumoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(110px, 1fr))',
    gap: 8
  },
  grupoResumoItem: {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 8,
    background: '#f8fafc',
    display: 'grid',
    gap: 2
  },
  grupoResumoLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase'
  },
  grupoResumoValor: {
    color: '#334155',
    fontSize: 13,
    fontWeight: 800
  },
  grupoTableRow: {
    background: '#f8fafc'
  },
  contextoColaboradorPanel: {
    border: '1px solid #bfdbfe',
    borderRadius: 10,
    padding: 12,
    background: '#eff6ff',
    display: 'grid',
    gap: 10,
    marginBottom: 12
  },
  contextoColaboradorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap'
  },
  contextoColaboradorTitulo: {
    display: 'grid',
    gap: 4,
    minWidth: 220
  },
  contextoColaboradorNome: {
    margin: 0,
    color: '#0f172a',
    fontSize: 20,
    lineHeight: 1.15
  },
  contextoColaboradorMeta: {
    margin: 0,
    color: '#475569',
    fontSize: 13
  },
  contextoColaboradorAcoes: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  contextoResumoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 8
  },
  contextoResumoCard: {
    border: '1px solid rgba(37, 99, 235, 0.16)',
    borderRadius: 12,
    padding: 10,
    background: '#fff',
    display: 'grid',
    gap: 2
  },
  contextoResumoLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase'
  },
  contextoResumoValor: {
    color: '#1e3a8a',
    fontSize: 15,
    fontWeight: 800
  },
  itensPanel: {
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: 10,
    background: '#f8fafc',
    display: 'grid',
    gap: 10
  },
  itensPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  itensPanelIntro: {
    display: 'grid',
    gap: 3,
    minWidth: 190
  },
  itensLista: {
    display: 'grid',
    gap: 8
  },
  itemDetalhado: {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 10,
    background: '#fff',
    display: 'grid',
    gap: 8
  },
  itemDetalhadoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
    alignItems: 'flex-start'
  },
  itemFormularioCompacto: {
    border: '1px solid #cbd5e1',
    borderRadius: 12,
    padding: 10,
    background: '#fff',
    display: 'grid',
    gap: 10
  },
  itemFormularioHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
    alignItems: 'flex-start'
  },
  itemVazio: {
    border: '1px dashed #cbd5e1',
    borderRadius: 12,
    padding: 10,
    background: '#fff',
    color: '#64748b',
    fontSize: 13
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

function criarFormularioItemInicial(categoria = '') {
  const formulario = { ...FORM_ITEM_INICIAL }

  if (categoria === 'hora_extra_50') formulario.percentual = '50'
  if (categoria === 'hora_extra_60') formulario.percentual = '60'
  if (categoria === 'hora_extra_100') formulario.percentual = '100'
  if (CATEGORIAS_VALOR_ZERO_INFORMATIVO.has(categoria)) formulario.valor = '0'

  return formulario
}

function calcularValorPremiacaoFormulario(formulario) {
  if (formulario.categoria !== 'premiacao') return ''

  const valorVenda = parseNumeroFormulario(formulario.valor_venda)
  const percentual = parseNumeroFormulario(formulario.percentual)

  if (valorVenda === null || percentual === null) return ''
  return formatarValorFormulario((valorVenda * percentual) / 100)
}

function calcularValorItemPremiacaoFormulario(formulario) {
  const valorBase = parseNumeroFormulario(formulario.valor_base)
  const percentual = parseNumeroFormulario(formulario.percentual)

  if (valorBase === null || percentual === null) return ''
  return formatarValorFormulario((valorBase * percentual) / 100)
}

function percentualEsperadoItem(categoria) {
  if (categoria === 'hora_extra_50') return '50'
  if (categoria === 'hora_extra_60') return '60'
  if (categoria === 'hora_extra_100') return '100'
  return ''
}

function prepararFormularioLancamentoParaSalvar(formulario) {
  const proximoFormulario = { ...formulario }
  const valorPremiacao = calcularValorPremiacaoFormulario(proximoFormulario)

  if (valorPremiacao) {
    proximoFormulario.valor = valorPremiacao
  }

  if (
    CATEGORIAS_VALOR_ZERO_INFORMATIVO.has(proximoFormulario.categoria) &&
    normalizarTexto(proximoFormulario.valor) === ''
  ) {
    proximoFormulario.valor = '0'
  }

  return proximoFormulario
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

function obterFilialFuncionario(funcionariosPorId, funcionarioId) {
  const funcionario = funcionariosPorId.get(funcionarioId)
  return normalizarTexto(funcionario?.filial_id) || ''
}

function obterNomeFilial(filiaisPorId, filialId) {
  const id = normalizarTexto(filialId)
  if (!id) return ''
  return normalizarTexto(filiaisPorId.get(id)?.nome) || 'Filial vinculada nao encontrada'
}

function calcularResumoLancamentos(lista = []) {
  return (lista || []).reduce((resumo, lancamento) => {
    const valor = Number(lancamento?.valor) || 0

    resumo.quantidadeLancamentos += 1
    if (lancamento?.arquivado) resumo.quantidadeArquivados += 1

    if (!lancamento?.arquivado && lancamento?.natureza === 'credito') {
      resumo.totalCreditos += valor
    } else if (!lancamento?.arquivado && lancamento?.natureza === 'desconto') {
      resumo.totalDescontos += valor
    }

    resumo.saldoInformativo = resumo.totalCreditos - resumo.totalDescontos
    return resumo
  }, {
    totalCreditos: 0,
    totalDescontos: 0,
    saldoInformativo: 0,
    quantidadeLancamentos: 0,
    quantidadeArquivados: 0
  })
}

function calcularResumoOperacionalGrupo(grupo, itensPorLancamento) {
  return (grupo?.lancamentos || []).reduce((resumo, lancamento) => {
    if (lancamento?.arquivado) {
      resumo.arquivados += 1
      return resumo
    }

    const valor = Number(lancamento?.valor) || 0
    const itens = itensPorLancamento.get(lancamento.id) || []

    if (lancamento?.conferido) resumo.conferidos += 1
    else resumo.pendentes += 1

    if (lancamento?.categoria === 'compras_vales') resumo.totalComprasVales += valor
    if (lancamento?.categoria === 'falta_injustificada') resumo.faltas += Number(lancamento?.quantidade) || 0
    if (CATEGORIAS_HORAS_EXTRAS.has(lancamento?.categoria)) resumo.horasExtras += Number(lancamento?.quantidade) || 0
    if (CATEGORIAS_ITENS_DETALHADOS.has(lancamento?.categoria)) {
      resumo.itensDetalhados += itens.length
      if (itens.length === 0) resumo.lancamentosSemItens += 1
    }

    if (lancamento?.natureza === 'credito') resumo.creditos += valor
    if (lancamento?.natureza === 'desconto') resumo.descontos += valor

    resumo.totalAtual = resumo.creditos - resumo.descontos
    return resumo
  }, {
    creditos: 0,
    descontos: 0,
    totalAtual: 0,
    totalComprasVales: 0,
    horasExtras: 0,
    faltas: 0,
    itensDetalhados: 0,
    lancamentosSemItens: 0,
    conferidos: 0,
    pendentes: 0,
    arquivados: 0
  })
}

function agruparLancamentosPorFuncionario(lancamentos = [], funcionariosPorId) {
  const grupos = new Map()

  ;(lancamentos || []).forEach((lancamento) => {
    const funcionarioId = lancamento.funcionario_id || '__sem_funcionario'
    if (!grupos.has(funcionarioId)) {
      grupos.set(funcionarioId, {
        funcionarioId,
        nome: obterNomeFuncionario(funcionariosPorId, lancamento.funcionario_id),
        lancamentos: []
      })
    }

    grupos.get(funcionarioId).lancamentos.push(lancamento)
  })

  return Array.from(grupos.values())
    .map((grupo) => ({
      ...grupo,
      resumo: calcularResumoLancamentos(grupo.lancamentos)
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export default function FechamentoFolhaPage({
  styles,
  empresaId,
  empresaNome,
  podeEditar = true,
  voltarPainel,
  filiais = []
}) {
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false)
  const [mostrarLancamentosArquivados, setMostrarLancamentosArquivados] = useState(false)
  const [competenciaSelecionadaId, setCompetenciaSelecionadaId] = useState('')
  const [formCompetencia, setFormCompetencia] = useState(criarFormularioCompetenciaInicial)
  const [formLancamento, setFormLancamento] = useState(criarFormularioLancamentoInicial)
  const [lancamentoEditandoId, setLancamentoEditandoId] = useState('')
  const [lancamentoItensAbertoId, setLancamentoItensAbertoId] = useState('')
  const [itemFormularioAbertoId, setItemFormularioAbertoId] = useState('')
  const [itemEditandoId, setItemEditandoId] = useState('')
  const [formItem, setFormItem] = useState(criarFormularioItemInicial)
  const [buscaColaborador, setBuscaColaborador] = useState('')
  const [modoTelaFolha, setModoTelaFolha] = useState(MODO_FOLHA_CONFERENCIA)
  const [colaboradorEmEdicaoId, setColaboradorEmEdicaoId] = useState('')
  const [erroFormulario, setErroFormulario] = useState('')
  const [secoesAbertas, setSecoesAbertas] = useState({
    competencias: true,
    resumo: true,
    lancamento: true,
    lancamentos: true
  })
  const [secoesFormularioLancamento, setSecoesFormularioLancamento] = useState({
    principais: true,
    valores: true,
    descricao: true
  })

  const {
    competencias,
    lancamentos,
    itensLancamentos,
    loading,
    loadingLancamentos,
    loadingItensLancamentos,
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
    criarItemLancamento,
    atualizarItemLancamento,
    arquivarItemLancamento,
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

  const filiaisPorId = useMemo(() => {
    return new Map((filiais || []).map((filial) => [filial.id, filial]))
  }, [filiais])

  const competenciaSelecionada = useMemo(() => {
    return competencias.find((competencia) => competencia.id === competenciaSelecionadaId) || null
  }, [competenciaSelecionadaId, competencias])

  const gruposLancamentos = useMemo(() => {
    return agruparLancamentosPorFuncionario(lancamentos, funcionariosPorId)
  }, [funcionariosPorId, lancamentos])

  const gruposLancamentosFiltrados = useMemo(() => {
    const termo = normalizarBusca(buscaColaborador)
    if (!termo) return gruposLancamentos

    return gruposLancamentos.filter((grupo) => {
      const nomeGrupo = normalizarBusca(grupo.nome)
      const funcionario = funcionariosPorId.get(grupo.funcionarioId)
      const nomeFuncionario = normalizarBusca(funcionario?.nome)
      const cargoFuncionario = normalizarBusca(funcionario?.cargo)

      return nomeGrupo.includes(termo) ||
        nomeFuncionario.includes(termo) ||
        cargoFuncionario.includes(termo)
    })
  }, [buscaColaborador, funcionariosPorId, gruposLancamentos])

  const grupoColaboradorEmEdicao = useMemo(() => {
    if (!colaboradorEmEdicaoId) return null
    return gruposLancamentos.find((grupo) => grupo.funcionarioId === colaboradorEmEdicaoId) || null
  }, [colaboradorEmEdicaoId, gruposLancamentos])

  const gruposLancamentosConferencia = modoTelaFolha === MODO_FOLHA_EDICAO_COLABORADOR && grupoColaboradorEmEdicao
    ? [grupoColaboradorEmEdicao]
    : gruposLancamentosFiltrados

  const colaboradorEmEdicaoNome = grupoColaboradorEmEdicao?.nome ||
    obterNomeFuncionario(funcionariosPorId, colaboradorEmEdicaoId)

  const exibindoEdicaoColaborador = modoTelaFolha === MODO_FOLHA_EDICAO_COLABORADOR && Boolean(colaboradorEmEdicaoId)

  const parametrosExportacao = {
    empresaNome,
    competencia: competenciaSelecionada?.competencia,
    lancamentos,
    itensLancamentos,
    funcionarios: funcionarios || [],
    filiais: filiais || []
  }

  const itensPorLancamento = useMemo(() => {
    const mapa = new Map()

    ;(itensLancamentos || []).forEach((item) => {
      if (!item?.lancamento_id || item.arquivado) return
      if (!mapa.has(item.lancamento_id)) mapa.set(item.lancamento_id, [])
      mapa.get(item.lancamento_id).push(item)
    })

    return mapa
  }, [itensLancamentos])

  const funcionarioEmEdicao = useMemo(() => {
    if (!colaboradorEmEdicaoId) return null
    return funcionariosPorId.get(colaboradorEmEdicaoId) || null
  }, [colaboradorEmEdicaoId, funcionariosPorId])

  const resumoColaboradorEmEdicao = useMemo(() => {
    if (!grupoColaboradorEmEdicao) return null
    return calcularResumoOperacionalGrupo(grupoColaboradorEmEdicao, itensPorLancamento)
  }, [grupoColaboradorEmEdicao, itensPorLancamento])

  const resumoConferenciaOperacional = useMemo(() => {
    return gruposLancamentos.reduce((resumoAtual, grupo) => {
      const resumoGrupo = calcularResumoOperacionalGrupo(grupo, itensPorLancamento)
      resumoAtual.colaboradores += 1
      resumoAtual.creditos += resumoGrupo.creditos
      resumoAtual.descontos += resumoGrupo.descontos
      resumoAtual.totalAtual = resumoAtual.creditos - resumoAtual.descontos
      resumoAtual.pendentes += resumoGrupo.pendentes
      resumoAtual.conferidos += resumoGrupo.conferidos
      resumoAtual.comComprasVales += resumoGrupo.totalComprasVales > 0 ? 1 : 0
      resumoAtual.lancamentosSemItens += resumoGrupo.lancamentosSemItens
      return resumoAtual
    }, {
      colaboradores: 0,
      creditos: 0,
      descontos: 0,
      totalAtual: 0,
      pendentes: 0,
      conferidos: 0,
      comComprasVales: 0,
      lancamentosSemItens: 0
    })
  }, [gruposLancamentos, itensPorLancamento])

  const valorPremiacaoCalculado = useMemo(() => {
    return calcularValorPremiacaoFormulario(formLancamento)
  }, [formLancamento])

  const valorItemPremiacaoCalculado = useMemo(() => {
    return calcularValorItemPremiacaoFormulario(formItem)
  }, [formItem])

  const categoriaHorasExtras = CATEGORIAS_HORAS_EXTRAS.has(formLancamento.categoria)
  const categoriaFalta = formLancamento.categoria === 'falta_injustificada'

  useEffect(() => {
    setModoTelaFolha(MODO_FOLHA_CONFERENCIA)
    setColaboradorEmEdicaoId('')
    setLancamentoItensAbertoId('')
    setItemFormularioAbertoId('')
    setItemEditandoId('')
    setFormItem(criarFormularioItemInicial())
  }, [competenciaSelecionadaId, empresaId])

  function alternarSecao(chave) {
    setSecoesAbertas((atual) => ({
      ...atual,
      [chave]: !atual[chave]
    }))
  }

  function alternarSecaoFormularioLancamento(chave) {
    setSecoesFormularioLancamento((atual) => ({
      ...atual,
      [chave]: !atual[chave]
    }))
  }

  function definirCategoria(categoria) {
    setFormLancamento((atual) => ({
      ...atual,
      categoria,
      natureza: obterNaturezaPorCategoria(categoria),
      valor: CATEGORIAS_VALOR_ZERO_INFORMATIVO.has(categoria) && normalizarTexto(atual.valor) === ''
        ? '0'
        : atual.valor
    }))
  }

  function selecionarFuncionarioLancamento(funcionarioId) {
    const filialId = obterFilialFuncionario(funcionariosPorId, funcionarioId)

    setFormLancamento((atual) => ({
      ...atual,
      funcionario_id: funcionarioId,
      filial_id: filialId
    }))
  }

  function rolarParaElemento(id, atraso = 0) {
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }, atraso)
  }

  function rolarParaPainelItensLancamento(lancamentoId, atraso = 0) {
    window.setTimeout(() => {
      const paineis = Array.from(document.querySelectorAll(`[data-folha-itens-lancamento-id="${lancamentoId}"]`))
      const painelVisivel = paineis.find((painel) => painel.getClientRects().length > 0) || paineis[0]

      painelVisivel?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }, atraso)
  }

  function focarFormularioLancamento() {
    rolarParaElemento('folha-form-lancamento')
  }

  function iniciarNovoLancamentoFuncionario(funcionarioId) {
    limparMensagens()
    if (funcionarioId && funcionarioId !== '__sem_funcionario') {
      setModoTelaFolha(MODO_FOLHA_EDICAO_COLABORADOR)
      setColaboradorEmEdicaoId(funcionarioId)
    }
    setLancamentoEditandoId('')
    setSecoesAbertas((atual) => ({
      ...atual,
      lancamento: true,
      lancamentos: true
    }))
    setFormLancamento({
      ...criarFormularioLancamentoInicial(),
      funcionario_id: funcionarioId,
      filial_id: obterFilialFuncionario(funcionariosPorId, funcionarioId)
    })
    focarFormularioLancamento()
  }

  function abrirItensLancamento(lancamento) {
    limparMensagens()
    const funcionarioId = lancamento?.funcionario_id || '__sem_funcionario'
    if (funcionarioId !== '__sem_funcionario') {
      setModoTelaFolha(MODO_FOLHA_EDICAO_COLABORADOR)
      setColaboradorEmEdicaoId(funcionarioId)
    }

    setLancamentoItensAbertoId((atual) => {
      const proximo = atual === lancamento.id ? '' : lancamento.id
      setItemFormularioAbertoId('')
      setItemEditandoId('')
      setFormItem(criarFormularioItemInicial(lancamento.categoria))
      return proximo
    })
  }

  function voltarParaTodosColaboradores() {
    setModoTelaFolha(MODO_FOLHA_CONFERENCIA)
    setColaboradorEmEdicaoId('')
    setLancamentoItensAbertoId('')
    setItemFormularioAbertoId('')
    setItemEditandoId('')
    setFormItem(criarFormularioItemInicial())
    setErroFormulario('')
  }

  function limparMensagens() {
    setErroFormulario('')
    limparErro()
  }

  function validarFormularioLancamento(formulario = formLancamento) {
    if (!empresaId) return 'Empresa ativa não identificada.'
    if (!competenciaSelecionadaId) return 'Selecione uma competência antes de lançar.'
    if (!lancamentoEditandoId && !formulario.funcionario_id) return 'Selecione um funcionário.'
    if (!formulario.natureza || !formulario.categoria) return 'Informe natureza e categoria.'
    if (Number(formulario.valor) < 0) return 'O valor não pode ser negativo.'

    if (
      CATEGORIAS_FINANCEIRAS_COM_VALOR_OBRIGATORIO.includes(formulario.categoria) &&
      formulario.valor === ''
    ) {
      return 'Informe o valor para esta categoria.'
    }

    if (
      (formulario.categoria === 'outro_credito' || formulario.categoria === 'outro_desconto') &&
      !normalizarTexto(formulario.descricao)
    ) {
      return 'Informe uma descrição para outro crédito/outro desconto.'
    }

    return ''
  }

  function prepararFormularioItemParaSalvar(lancamento, formulario = formItem) {
    const categoria = lancamento?.categoria
    const proximoFormulario = { ...formulario }

    if (categoria === 'premiacao') {
      const valorPremiacao = calcularValorItemPremiacaoFormulario(proximoFormulario)
      if (valorPremiacao) proximoFormulario.valor = valorPremiacao
    }

    const percentualHora = percentualEsperadoItem(categoria)
    if (percentualHora) {
      proximoFormulario.percentual = percentualHora
      proximoFormulario.valor = '0'
    }

    if (categoria === 'falta_injustificada') {
      proximoFormulario.valor = '0'
    }

    return proximoFormulario
  }

  function validarFormularioItem(lancamento, formulario = formItem) {
    const categoria = lancamento?.categoria
    if (!lancamento?.id) return 'Lancamento de folha nao identificado.'
    if (!CATEGORIAS_ITENS_DETALHADOS.has(categoria)) return 'Esta categoria nao possui itens detalhados neste ciclo.'
    if (Number(formulario.valor) < 0) return 'O valor do item nao pode ser negativo.'

    if (categoria === 'compras_vales') {
      const valor = parseNumeroFormulario(formulario.valor)
      if (valor === null || valor <= 0) return 'Compra/vale exige valor maior que zero.'
    }

    if (categoria === 'falta_injustificada') {
      const quantidade = parseNumeroFormulario(formulario.quantidade)
      if (!formulario.data_referencia) return 'Falta exige data de referencia.'
      if (quantidade === null || quantidade <= 0) return 'Falta exige quantidade/dias maior que zero.'
    }

    if (CATEGORIAS_HORAS_EXTRAS.has(categoria)) {
      const quantidade = parseNumeroFormulario(formulario.quantidade)
      if (quantidade === null || quantidade <= 0) return 'Hora extra exige quantidade de horas maior que zero.'
    }

    if (categoria === 'premiacao') {
      const valorBase = parseNumeroFormulario(formulario.valor_base)
      const percentual = parseNumeroFormulario(formulario.percentual)
      if (valorBase === null || valorBase <= 0) return 'Premiacao exige valor base maior que zero.'
      if (percentual === null || percentual <= 0) return 'Premiacao exige percentual maior que zero.'
    }

    return ''
  }

  function montarPayloadItem(formulario) {
    return {
      descricao: normalizarTexto(formulario.descricao) || null,
      data_referencia: normalizarTexto(formulario.data_referencia) || null,
      quantidade: formulario.quantidade === '' ? null : formulario.quantidade,
      percentual: formulario.percentual === '' ? null : formulario.percentual,
      valor_base: formulario.valor_base === '' ? null : formulario.valor_base,
      valor: formulario.valor === '' ? null : formulario.valor,
      observacao_administrativa: normalizarTexto(formulario.observacao_administrativa) || null
    }
  }

  function formularioItemTemRascunho(formulario = formItem) {
    return Object.values(formulario || {}).some((valor) => normalizarTexto(valor) !== '')
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
    setSecoesFormularioLancamento({
      principais: true,
      valores: true,
      descricao: true
    })
    const formularioParaSalvar = prepararFormularioLancamentoParaSalvar(formLancamento)
    if (formularioParaSalvar.valor !== formLancamento.valor) {
      setFormLancamento(formularioParaSalvar)
    }

    const erroValidacao = validarFormularioLancamento(formularioParaSalvar)

    if (erroValidacao) {
      setErroFormulario(erroValidacao)
      return
    }

    const payloadBase = montarPayloadLancamento(formularioParaSalvar)
    const resposta = lancamentoEditandoId
      ? await atualizarLancamento(lancamentoEditandoId, payloadBase)
      : await criarLancamento({
        ...payloadBase,
        competencia_id: competenciaSelecionadaId,
        funcionario_id: formularioParaSalvar.funcionario_id,
        filial_id: formularioParaSalvar.filial_id || null
      })

    if (resposta.error) {
      setErroFormulario(resposta.error.message || 'Não foi possível salvar o lançamento.')
      return
    }

    setLancamentoEditandoId('')
    const funcionarioContexto = formularioParaSalvar.funcionario_id || colaboradorEmEdicaoId
    if (funcionarioContexto) {
      setModoTelaFolha(MODO_FOLHA_EDICAO_COLABORADOR)
      setColaboradorEmEdicaoId(funcionarioContexto)
      setFormLancamento({
        ...criarFormularioLancamentoInicial(),
        funcionario_id: funcionarioContexto,
        filial_id: obterFilialFuncionario(funcionariosPorId, funcionarioContexto)
      })
    } else {
      setFormLancamento(criarFormularioLancamentoInicial())
    }
  }

  async function salvarItemLancamento(event, lancamento) {
    event.preventDefault()
    limparMensagens()

    const formularioParaSalvar = prepararFormularioItemParaSalvar(lancamento, formItem)
    if (JSON.stringify(formularioParaSalvar) !== JSON.stringify(formItem)) {
      setFormItem(formularioParaSalvar)
    }

    const erroValidacao = validarFormularioItem(lancamento, formularioParaSalvar)
    if (erroValidacao) {
      setErroFormulario(erroValidacao)
      return
    }

    const payload = montarPayloadItem(formularioParaSalvar)
    const itemEditando = itemEditandoId
      ? (itensLancamentos || []).find((item) => item.id === itemEditandoId)
      : null

    const resposta = itemEditando
      ? await atualizarItemLancamento(itemEditando, payload)
      : await criarItemLancamento(lancamento, payload)

    if (resposta.error) {
      setErroFormulario(resposta.error.message || 'Nao foi possivel salvar o item detalhado.')
      return
    }

    setItemEditandoId('')
    setLancamentoItensAbertoId(lancamento.id)
    setItemFormularioAbertoId(lancamento.id)
    setFormItem(criarFormularioItemInicial(lancamento.categoria))
    rolarParaPainelItensLancamento(lancamento.id, 80)
  }

  function iniciarEdicaoLancamento(lancamento) {
    limparMensagens()
    setSecoesAbertas((atual) => ({
      ...atual,
      lancamento: true
    }))
    setSecoesFormularioLancamento({
      principais: true,
      valores: true,
      descricao: true
    })
    setLancamentoEditandoId(lancamento.id)
    setFormLancamento({
      funcionario_id: lancamento.funcionario_id || '',
      filial_id: lancamento.filial_id || obterFilialFuncionario(funcionariosPorId, lancamento.funcionario_id),
      natureza: lancamento.natureza || obterNaturezaPorCategoria(lancamento.categoria),
      categoria: lancamento.categoria || 'premiacao',
      descricao: lancamento.descricao || '',
      valor_venda: '',
      data_referencia: lancamento.data_referencia || '',
      quantidade: lancamento.quantidade ?? '',
      percentual: lancamento.percentual ?? '',
      valor: lancamento.valor ?? '',
      observacao_administrativa: lancamento.observacao_administrativa || ''
    })
    focarFormularioLancamento()
  }

  function iniciarNovoItemLancamento(lancamento) {
    limparMensagens()
    setLancamentoItensAbertoId(lancamento.id)
    setItemFormularioAbertoId(lancamento.id)
    setItemEditandoId('')
    setFormItem((atual) => {
      if (itemFormularioAbertoId === lancamento.id && !itemEditandoId && formularioItemTemRascunho(atual)) {
        return atual
      }

      return criarFormularioItemInicial(lancamento.categoria)
    })
  }

  function iniciarEdicaoItemLancamento(lancamento, item) {
    limparMensagens()
    setLancamentoItensAbertoId(lancamento.id)
    setItemFormularioAbertoId(lancamento.id)
    setItemEditandoId(item.id)
    setFormItem({
      descricao: item.descricao || '',
      data_referencia: item.data_referencia || '',
      quantidade: item.quantidade ?? '',
      percentual: item.percentual ?? percentualEsperadoItem(lancamento.categoria),
      valor_base: item.valor_base ?? '',
      valor: item.valor ?? '',
      observacao_administrativa: item.observacao_administrativa || ''
    })
    rolarParaElemento(`folha-form-item-${lancamento.id}`, 80)
  }

  function cancelarEdicaoItem(lancamento) {
    setItemFormularioAbertoId('')
    setItemEditandoId('')
    setFormItem(criarFormularioItemInicial(lancamento?.categoria))
    setErroFormulario('')
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

  async function alternarConferenciaLancamento(lancamento) {
    limparMensagens()
    const conferido = !lancamento.conferido
    const resposta = await atualizarLancamento(lancamento.id, {
      conferido,
      conferido_em: conferido ? new Date().toISOString() : null
    })

    if (resposta.error) {
      setErroFormulario(resposta.error.message || 'Nao foi possivel atualizar a conferencia do lancamento.')
    }
  }

  async function arquivarItemDetalhado(item) {
    limparMensagens()
    const resposta = await arquivarItemLancamento(item)

    if (resposta.error) {
      setErroFormulario(resposta.error.message || 'Nao foi possivel arquivar o item detalhado.')
    }
  }

  function renderResumoGrupo(resumo) {
    return (
      <FolhaResumoGrupo
        resumo={resumo}
        estilos={estilosLocais}
        formatarMoeda={formatarMoeda}
      />
    )
  }
  function renderItensLancamento(lancamento) {
    const itens = itensPorLancamento.get(lancamento.id) || []
    const podeDetalhar = CATEGORIAS_ITENS_DETALHADOS.has(lancamento.categoria)

    return (
      <FolhaItensDetalhados
        lancamento={lancamento}
        itens={itens}
        podeDetalhar={podeDetalhar}
        formularioAberto={lancamentoItensAbertoId === lancamento.id && itemFormularioAbertoId === lancamento.id}
        estilos={estilosLocais}
        styles={styles}
        podeEditar={podeEditar}
        salvando={salvando}
        loading={loadingItensLancamentos}
        formItem={formItem}
        setFormItem={setFormItem}
        itemEditandoId={itemEditandoId}
        valorItemPremiacaoCalculado={valorItemPremiacaoCalculado}
        labelsCategoria={LABELS_CATEGORIA}
        categoriasHorasExtras={CATEGORIAS_HORAS_EXTRAS}
        formatarData={formatarData}
        formatarNumero={formatarNumero}
        formatarMoeda={formatarMoeda}
        onNovoItem={iniciarNovoItemLancamento}
        onSalvarItem={salvarItemLancamento}
        onCancelarItem={cancelarEdicaoItem}
        onEditarItem={iniciarEdicaoItemLancamento}
        onArquivarItem={arquivarItemDetalhado}
      />
    )
  }
  function renderAcoesLancamento(lancamento) {
    return (
      <FolhaLancamentoAcoes
        lancamento={lancamento}
        estilos={estilosLocais}
        styles={styles}
        podeEditar={podeEditar}
        salvando={salvando}
        podeDetalhar={CATEGORIAS_ITENS_DETALHADOS.has(lancamento.categoria)}
        itensAberto={lancamentoItensAbertoId === lancamento.id}
        onAbrirItens={abrirItensLancamento}
        onEditar={iniciarEdicaoLancamento}
        onAlternarConferencia={alternarConferenciaLancamento}
        onAlternarArquivo={alternarArquivoLancamento}
      />
    )
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
        .folha-competencia-actions {
          justify-content: space-between;
        }
        .folha-switch {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 34px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 999px;
          padding: 5px 10px 5px 6px;
          background: #fff;
          color: #475569;
          font-size: 12px;
          font-weight: 800;
          line-height: 1;
          cursor: pointer;
          user-select: none;
        }
        .folha-switch input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }
        .folha-switch-indicator {
          position: relative;
          width: 30px;
          height: 18px;
          flex: 0 0 30px;
          border-radius: 999px;
          background: #cbd5e1;
          transition: background 0.18s ease;
        }
        .folha-switch-indicator::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.2);
          transition: transform 0.18s ease;
        }
        .folha-switch.ativo {
          border-color: rgba(13, 148, 136, 0.35);
          background: #f0fdfa;
          color: #0f766e;
        }
        .folha-switch.ativo .folha-switch-indicator {
          background: #0f766e;
        }
        .folha-switch.ativo .folha-switch-indicator::after {
          transform: translateX(12px);
        }
        .folha-switch.desabilitado {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .folha-switch.desabilitado input {
          cursor: not-allowed;
        }
        .folha-switch:has(input:focus-visible) {
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.16);
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
          .folha-competencia-actions {
            display: grid !important;
            grid-template-columns: 1fr;
            align-items: stretch !important;
          }
          .folha-competencia-actions button,
          .folha-switch {
            width: 100%;
            box-sizing: border-box;
          }
          .folha-switch {
            justify-content: center;
          }
          .folha-observacao-competencia textarea {
            min-height: 104px !important;
          }
          .folha-mobile-meta-grid {
            grid-template-columns: 1fr 1fr;
          }
          .folha-grupo-resumo {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 560px) {
          .folha-mobile-meta-grid {
            grid-template-columns: 1fr;
          }
          .folha-grupo-resumo {
            grid-template-columns: 1fr !important;
          }
          .folha-card-actions {
            width: 100%;
          }
          .folha-card-actions button {
            flex: 1 1 130px;
          }
        }
      `}</style>
      <div className="folha-page folha-page-shell">
      <div className="folha-page-hero">
        <div className="folha-page-intro">
          <span>Gestão de Pessoas</span>
          <h1>Folha / Fechamento</h1>
          <p>Prepare competencias mensais e registre lancamentos manuais quando a empresa for processar a folha.</p>
          {empresaNome && <small>Empresa ativa: <strong>{empresaNome}</strong></small>}
        </div>
        {voltarPainel && (
          <button className="folha-btn folha-btn-secondary" type="button" style={styles.btnCinza} onClick={voltarPainel}>
            Voltar
          </button>
        )}
      </div>

      <section className="folha-lgpd-card">
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

      <section className={`folha-section folha-card compact ${secoesAbertas.competencias ? 'is-open' : 'is-collapsed'}`} style={styles.cardConfiguracao}>
        <FolhaSectionHeader
          kicker="Competências"
          titulo="Competências da folha"
          descricao="Crie manualmente a competencia do mes antes de registrar lancamentos."
          resumo={`${competencias.length} competência(s) carregada(s)`}
          aberto={secoesAbertas.competencias}
          onToggle={() => alternarSecao('competencias')}
        />
        <h2 style={styles.subtitulo}>Competências</h2>
        <p style={styles.textoNota}>A folha comeca pela competencia mensal. Nada e criado automaticamente.</p>

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
                Escolha o mes de referencia. O sistema salva no formato AAAA-MM, por exemplo 2026-05.
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
                Define o status inicial da competencia criada manualmente.
              </small>
            </label>
          </div>

          <label className="folha-observacao-competencia" style={{ ...estilosLocais.formField, gridColumn: '1 / -1' }}>
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

          <div className="folha-competencia-actions" style={estilosLocais.formActions}>
            <button
              type="submit"
              style={styles.btnPrimario}
              disabled={!empresaId || !podeEditar || salvando}
            >
              {salvando ? 'Salvando...' : 'Criar competencia'}
            </button>
            <label className={`folha-switch ${mostrarArquivadas ? 'ativo' : ''}`}>
              <input
                type="checkbox"
                checked={mostrarArquivadas}
                onChange={(event) => setMostrarArquivadas(event.target.checked)}
              />
              <span className="folha-switch-indicator" aria-hidden="true" />
              <span>Mostrar arquivadas</span>
            </label>
          </div>
        </form>

        {loading && !competencias.length ? (
          <p style={styles.textoNota}>Carregando competências...</p>
        ) : competencias.length === 0 ? (
          <div className="folha-empty-state">
            <strong>Nenhuma competencia de folha cadastrada ainda.</strong>
            <p>Crie uma competencia manualmente quando a empresa for processar a folha. O sistema nao cria competencias ou lancamentos sozinho.</p>
          </div>
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

      <section className={`folha-section folha-card compact ${secoesAbertas.resumo ? 'is-open' : 'is-collapsed'}`} style={styles.cardConfiguracao}>
        <FolhaSectionHeader
          kicker="Resumo"
          titulo="Resumo da competência"
          descricao="Totais informativos da competência selecionada."
          resumo={competenciaSelecionada ? `${LABELS_STATUS_COMPETENCIA[competenciaSelecionada.status] || competenciaSelecionada.status} · ${resumo.quantidadeLancamentos} lançamento(s)` : 'Selecione uma competência'}
          aberto={secoesAbertas.resumo}
          onToggle={() => alternarSecao('resumo')}
        />
        <h2 style={styles.subtitulo}>Resumo da competência selecionada</h2>
        {!competenciaSelecionada ? (
          <div className="folha-empty-state is-muted">
            <strong>Nenhuma competencia selecionada.</strong>
            <p>Crie ou selecione uma competencia para ver totais, saldo e lancamentos.</p>
          </div>
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

      <section id="folha-form-lancamento" className={`folha-section folha-card compact ${secoesAbertas.lancamento ? 'is-open' : 'is-collapsed'}`} style={styles.cardConfiguracao}>
        <FolhaSectionHeader
          kicker="Lançamento"
          titulo={lancamentoEditandoId ? 'Editar lançamento' : 'Lançamento manual'}
          descricao="Registre créditos, descontos e informações administrativas."
          resumo={competenciaSelecionada ? `Competência ${competenciaSelecionada.competencia}` : 'Selecione uma competência'}
          aberto={secoesAbertas.lancamento}
          onToggle={() => alternarSecao('lancamento')}
        />
        <h2 style={styles.subtitulo}>{lancamentoEditandoId ? 'Editar lançamento' : 'Lançamento manual'}</h2>
        <p style={styles.textoNota}>
          O lançamento manual respeita a empresa ativa, a competência selecionada e a RLS do Supabase.
        </p>

        {!competenciaSelecionada ? (
          <div className="folha-empty-state is-muted">
            <strong>Selecione ou crie uma competencia antes de lancar.</strong>
            <p>O lancamento manual fica disponivel somente dentro de uma competencia mensal.</p>
          </div>
        ) : (
          <form onSubmit={salvarLancamento} style={{ display: 'grid', gap: 12 }} noValidate>
            <div className={`folha-form-subsection ${secoesFormularioLancamento.principais ? 'is-open' : 'is-collapsed'}`} style={estilosLocais.formPanelSoft}>
              <FolhaSubsectionHeader
                titulo="Dados principais"
                descricao="Funcionário, filial, categoria e natureza."
                aberto={secoesFormularioLancamento.principais}
                onToggle={() => alternarSecaoFormularioLancamento('principais')}
              />
              <h3 style={estilosLocais.formSectionTitle}>Dados principais</h3>
              <div style={estilosLocais.formGrid}>
                <label style={estilosLocais.formField}>
                  <span style={estilosLocais.label}>Funcionário</span>
                  <select
                    value={formLancamento.funcionario_id}
                    onChange={(event) => selecionarFuncionarioLancamento(event.target.value)}
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
                  <span style={estilosLocais.label}>Filial do lancamento</span>
                  <input
                    value={
                      formLancamento.filial_id
                        ? obterNomeFilial(filiaisPorId, formLancamento.filial_id)
                        : formLancamento.funcionario_id
                          ? 'Colaborador sem filial cadastrada'
                          : 'Selecione um colaborador'
                    }
                    style={estilosLocais.inputReadOnly}
                    disabled
                    readOnly
                  />
                  <small style={estilosLocais.helperText}>
                    A filial acompanha o cadastro do colaborador para evitar divergencia manual.
                  </small>
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

            <div className={`folha-form-subsection ${secoesFormularioLancamento.valores ? 'is-open' : 'is-collapsed'}`} style={estilosLocais.formPanelSoft}>
              <FolhaSubsectionHeader
                titulo="Valores / referência"
                descricao="Datas, quantidades, percentuais e valores."
                aberto={secoesFormularioLancamento.valores}
                onToggle={() => alternarSecaoFormularioLancamento('valores')}
              />
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

                {formLancamento.categoria === 'premiacao' && (
                  <label style={estilosLocais.formField}>
                    <span style={estilosLocais.label}>Valor de venda</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formLancamento.valor_venda}
                      onChange={(event) => setFormLancamento((atual) => ({ ...atual, valor_venda: event.target.value }))}
                      style={estilosLocais.input}
                      disabled={!empresaId || !podeEditar || salvando}
                      placeholder="Base para cálculo local"
                    />
                    <small style={estilosLocais.helperText}>
                      Auxiliar visual. O valor de venda não é salvo em campo próprio neste ciclo.
                    </small>
                  </label>
                )}

                <label style={estilosLocais.formField}>
                  <span style={estilosLocais.label}>
                    {categoriaHorasExtras ? 'Quantidade de horas' : categoriaFalta ? 'Quantidade/dias' : 'Quantidade'}
                  </span>
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
              {formLancamento.categoria === 'premiacao' && (
                <small style={estilosLocais.helperText}>
                  Cálculo local: valor de venda x percentual / 100
                  {valorPremiacaoCalculado ? ` = ${formatarMoeda(valorPremiacaoCalculado)}. O campo valor será preenchido antes de salvar.` : '.'}
                </small>
              )}
              {categoriaHorasExtras && (
                <small style={estilosLocais.helperText}>
                  Informe apenas a quantidade de horas para conferência da contabilidade. O sistema não calcula valor trabalhista; valor 0 é permitido.
                </small>
              )}
              {categoriaFalta && (
                <small style={estilosLocais.helperText}>
                  Informe a quantidade/dias para conferência da contabilidade. O sistema não calcula desconto trabalhista; valor 0 é permitido.
                </small>
              )}
            </div>

            <div className={`folha-form-subsection ${secoesFormularioLancamento.descricao ? 'is-open' : 'is-collapsed'}`} style={estilosLocais.formPanelSoft}>
              <FolhaSubsectionHeader
                titulo="Descrição / conferência"
                descricao="Contexto administrativo e observações sem dados sensíveis."
                aberto={secoesFormularioLancamento.descricao}
                onToggle={() => alternarSecaoFormularioLancamento('descricao')}
              />
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

      <section className={`folha-section folha-card ${secoesAbertas.lancamentos ? 'is-open' : 'is-collapsed'}`} style={styles.cardConfiguracao}>
        <FolhaSectionHeader
          kicker="Conferência"
          titulo="Lançamentos da competência"
          descricao="Lista interna sem CPF, exportação, documentos ou integração financeira."
          resumo={competenciaSelecionada ? `${lancamentos.length} lançamento(s)` : 'Selecione uma competência'}
          aberto={secoesAbertas.lancamentos}
          onToggle={() => alternarSecao('lancamentos')}
        />
        <div className="folha-section-toolbar" style={estilosLocais.pageActions}>
          <div>
            <h2 style={styles.subtitulo}>Lançamentos da competência</h2>
            <p style={styles.textoNota}>Lista interna sem CPF, exportação, documentos ou integração financeira.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <button
              type="button"
              style={styles.btnCinza}
              disabled={!competenciaSelecionada || loadingLancamentos}
              onClick={() => exportarControleCompras(parametrosExportacao)}
            >
              Exportar compras
            </button>
            <button
              type="button"
              style={styles.btnPrimario}
              disabled={!competenciaSelecionada || loadingLancamentos}
              onClick={() => exportarConsolidadoContabil(parametrosExportacao)}
            >
              Exportar contabilidade
            </button>
          </div>
          <label style={{ ...estilosLocais.formField, minWidth: 220, maxWidth: 360 }}>
            <span style={estilosLocais.label}>Buscar colaborador</span>
            <input
              value={buscaColaborador}
              onChange={(event) => setBuscaColaborador(event.target.value)}
              style={estilosLocais.input}
              placeholder="Buscar colaborador..."
              disabled={!competenciaSelecionada || loadingLancamentos || exibindoEdicaoColaborador}
            />
          </label>
          <label className={`folha-switch ${mostrarLancamentosArquivados ? 'ativo' : ''} ${!competenciaSelecionada ? 'desabilitado' : ''}`}>
            <input
              type="checkbox"
              checked={mostrarLancamentosArquivados}
              onChange={(event) => setMostrarLancamentosArquivados(event.target.checked)}
              disabled={!competenciaSelecionada}
            />
            <span className="folha-switch-indicator" aria-hidden="true" />
            <span>Mostrar arquivados</span>
          </label>
        </div>

        {!exibindoEdicaoColaborador && competenciaSelecionada && (
          <div style={{ ...estilosLocais.contextoResumoGrid, marginBottom: 12 }}>
            <div style={estilosLocais.contextoResumoCard}>
              <span style={estilosLocais.contextoResumoLabel}>Colaboradores</span>
              <strong style={estilosLocais.contextoResumoValor}>{resumoConferenciaOperacional.colaboradores}</strong>
            </div>
            <div style={estilosLocais.contextoResumoCard}>
              <span style={estilosLocais.contextoResumoLabel}>Pendentes</span>
              <strong style={estilosLocais.contextoResumoValor}>{resumoConferenciaOperacional.pendentes}</strong>
            </div>
            <div style={estilosLocais.contextoResumoCard}>
              <span style={estilosLocais.contextoResumoLabel}>Conferidos</span>
              <strong style={estilosLocais.contextoResumoValor}>{resumoConferenciaOperacional.conferidos}</strong>
            </div>
            <div style={estilosLocais.contextoResumoCard}>
              <span style={estilosLocais.contextoResumoLabel}>Com vales/compras</span>
              <strong style={estilosLocais.contextoResumoValor}>{resumoConferenciaOperacional.comComprasVales}</strong>
            </div>
            <div style={estilosLocais.contextoResumoCard}>
              <span style={estilosLocais.contextoResumoLabel}>Sem itens</span>
              <strong style={estilosLocais.contextoResumoValor}>{resumoConferenciaOperacional.lancamentosSemItens}</strong>
            </div>
            <div style={estilosLocais.contextoResumoCard}>
              <span style={estilosLocais.contextoResumoLabel}>Saldo atual</span>
              <strong style={estilosLocais.contextoResumoValor}>{formatarMoeda(resumoConferenciaOperacional.totalAtual)}</strong>
            </div>
          </div>
        )}

        <FolhaContextoColaboradorAtivo
          ativo={exibindoEdicaoColaborador}
          resumo={resumoColaboradorEmEdicao}
          nome={colaboradorEmEdicaoNome}
          cargo={funcionarioEmEdicao?.cargo}
          filialNome={obterNomeFilial(filiaisPorId, funcionarioEmEdicao?.filial_id)}
          competencia={competenciaSelecionada?.competencia}
          colaboradorId={colaboradorEmEdicaoId}
          estilos={estilosLocais}
          styles={styles}
          podeEditar={podeEditar}
          salvando={salvando}
          onNovoLancamento={iniciarNovoLancamentoFuncionario}
          onVoltar={voltarParaTodosColaboradores}
          formatarMoeda={formatarMoeda}
          formatarNumero={formatarNumero}
        />

        {!competenciaSelecionada ? (
          <div className="folha-empty-state is-muted">
            <strong>Selecione uma competencia para carregar lancamentos.</strong>
            <p>Depois de selecionar uma competencia, a lista mostra os lancamentos ativos e arquivados conforme o filtro.</p>
          </div>
        ) : loadingLancamentos ? (
          <p style={styles.textoNota}>Carregando lançamentos...</p>
        ) : lancamentos.length === 0 ? (
          <div className="folha-empty-state">
            <strong>Nenhum lancamento encontrado para a competencia selecionada.</strong>
            <p>Lancamentos de folha nao sao criados automaticamente. Registre apenas valores conferidos para esta competencia.</p>
          </div>
        ) : !exibindoEdicaoColaborador && gruposLancamentosFiltrados.length === 0 ? (
          <div className="folha-empty-state is-muted">
            <strong>Nenhum colaborador encontrado para essa busca.</strong>
            <p>Limpe ou ajuste o termo para voltar a exibir os lancamentos da competencia.</p>
          </div>
        ) : exibindoEdicaoColaborador && gruposLancamentosConferencia.length === 0 ? (
          <div className="folha-empty-state is-muted">
            <strong>Colaborador não encontrado nesta competência.</strong>
            <p>Volte para todos os colaboradores e selecione outro lançamento.</p>
          </div>
        ) : (
          <FolhaLancamentosLista
            grupos={gruposLancamentosConferencia}
            estilos={estilosLocais}
            styles={styles}
            podeEditar={podeEditar}
            salvando={salvando}
            lancamentoItensAbertoId={lancamentoItensAbertoId}
            labelsNatureza={LABELS_NATUREZA}
            labelsCategoria={LABELS_CATEGORIA}
            formatarData={formatarData}
            formatarNumero={formatarNumero}
            formatarMoeda={formatarMoeda}
            renderResumoGrupo={renderResumoGrupo}
            renderAcoesLancamento={renderAcoesLancamento}
            renderItensLancamento={renderItensLancamento}
            onNovoLancamento={iniciarNovoLancamentoFuncionario}
          />
        )}
      </section>
      </div>
    </>
  )
}
