import { useEffect, useMemo, useRef, useState } from 'react'
import { useFuncionariosExamesOcupacionais } from '../hooks/useFuncionariosExamesOcupacionais'
import { useFuncionarios } from '../hooks/useFuncionarios'
import { useFuncionariosChecklistDesligamento } from '../hooks/useFuncionariosChecklistDesligamento'
import { useFuncionariosDesligamentos } from '../hooks/useFuncionariosDesligamentos'
import { FilterCard, FilterGrid, KpiCard, KpiGrid, PageHeader, PageState } from '../components/shared/PagePatterns.jsx'
import { mensagemSeguraErro } from '../utils/session'
import {
  admissaoFoiAlterada,
  impactoAdmissaoCorresponde,
  mensagemErroAdmissao,
  motivoAdmissaoValido,
  separarAdmissaoDoPayload
} from '../modules/funcionarios/domain/admissaoFuncionarioRules'
import {
  FORMULARIO_DEMISSIONAL_INICIAL,
  mensagemErroExameDemissional,
  podeRegistrarExameDemissional,
  possuiDemissionalPendenteAtivo
} from '../modules/funcionarios/domain/exameDemissionalRules'
import './FuncionariosPage.css'
const FORMULARIO_INICIAL = {
  nome: '',
  cargo: '',
  telefone: '',
  email: '',
  cpf: '',
  data_nascimento: '',
  data_admissao: '',
  status: 'ativo',
  filial_id: '',
  observacoes: ''
}

const STATUS_LABELS = {
  ativo: 'Ativo',
  afastado: 'Afastado',
  desligado: 'Desligado'
}

const EXAME_TIPO_LABELS = {
  ADMISSIONAL: 'Admissional',
  PERIODICO: 'Periódico',
  DEMISSIONAL: 'Demissional'
}

const EXAME_ESTADO_LABELS = {
  PENDENTE: 'Pendente',
  REALIZADO: 'Realizado',
  CANCELADO: 'Cancelado'
}

const FORMULARIO_EXAME_INICIAL = {
  tipo: 'PERIODICO',
  estado: 'REALIZADO',
  dataPrevista: '',
  dataRealizada: ''
}

const MODAL_SECOES_INICIAIS = {
  dados: true,
  vinculo: true,
  datas: true,
  observacoes: false,
  exames: true
}

const LIMITE_FUNCIONARIOS_INICIAL = 8
const FORMULARIO_DESLIGAMENTO_INICIAL = {
  motivo: '',
  dataEfetiva: '',
  dataAcerto: '',
  observacoes: '',
  motivoCancelamento: ''
}
const FORMULARIO_CORRECAO_INICIAL = {
  tipo: '',
  dataEfetiva: '',
  dataAcerto: '',
  motivo: '',
  observacoes: '',
  motivoCorrecao: ''
}
const FORMULARIO_CHECKLIST_INICIAL = {
  catalogoItemId: '',
  dataPrevista: '',
  observacaoAdministrativa: ''
}
const CHECKLIST_ESTADO_LABELS = {
  PENDENTE: 'Pendente',
  CONCLUIDO: 'Concluído',
  NAO_APLICAVEL: 'Não aplicável'
}
const DESLIGAMENTO_ESTADO_LABELS = {
  ABERTO: 'Em andamento',
  CANCELADO: 'Cancelado',
  CONCLUIDO: 'Vínculo encerrado'
}
const FORMULARIO_READMISSAO_INICIAL = {
  novaDataAdmissao: '',
  filialId: '',
  cargo: '',
  confirmouHistorico: false
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

function formatarDataAcerto(data) {
  return data ? formatarDataCurta(data) : 'Não informado'
}

function montarDadosExame(formularioExame) {
  const estado = formularioExame.estado
  return {
    tipo: formularioExame.tipo,
    estado,
    dataPrevista: estado === 'PENDENTE' ? formularioExame.dataPrevista : null,
    dataRealizada: estado === 'REALIZADO' ? formularioExame.dataRealizada : null
  }
}

function formularioExameValido(formularioExame) {
  if (formularioExame.estado === 'PENDENTE') return Boolean(formularioExame.dataPrevista)
  if (formularioExame.estado === 'REALIZADO') return Boolean(formularioExame.dataRealizada)
  return formularioExame.estado === 'CANCELADO'
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

function criarChaveReadmissao() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `readmissao-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function mensagemErroReadmissao(erro) {
  const mensagem = String(erro?.message || erro || '')
  const conhecidas = [
    ['NOVA_ADMISSAO_DEVE_SER_POSTERIOR_AO_DESLIGAMENTO', 'A nova admissão deve ser posterior à data efetiva do desligamento.'],
    ['PESSOA_JA_POSSUI_VINCULO_FUNCIONAL', 'Esta pessoa já possui um vínculo ativo ou afastado.'],
    ['DESLIGAMENTO_EFETIVO_NAO_ENCONTRADO', 'O vínculo anterior não possui desligamento efetivo vigente.'],
    ['VINCULO_ANTERIOR_NAO_DESLIGADO', 'O vínculo anterior precisa estar desligado.'],
    ['PESSOA_ARQUIVADA', 'A pessoa está arquivada e não pode ser readmitida.'],
    ['ADMISSAO_29FEV_REQUER_DECISAO', 'Admissão em 29/02 exige uma decisão específica antes de continuar.'],
    ['SEM_PERMISSAO', 'Você não tem permissão para concluir esta readmissão.']
  ]
  return conhecidas.find(([codigo]) => mensagem.includes(codigo))?.[1]
    || mensagemSeguraErro(erro, 'Não foi possível concluir a readmissão.')
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
    status: formulario.status,
    filial_id: formulario.filial_id,
    observacoes: formulario.observacoes
  }
}

export default function FuncionariosPage({
  empresaId,
  empresaNome,
  filiais = [],
  mostrarAviso,
  podeEditar = false,
  contextoNavegacao = null,
  voltarPainel
}) {
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [incluirArquivados, setIncluirArquivados] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [funcionarioEditando, setFuncionarioEditando] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL)
  const [mostrarExamesArquivados, setMostrarExamesArquivados] = useState(false)
  const [formularioNovoExame, setFormularioNovoExame] = useState(FORMULARIO_EXAME_INICIAL)
  const [exameEditandoId, setExameEditandoId] = useState('')
  const [formularioExameEditando, setFormularioExameEditando] = useState(FORMULARIO_EXAME_INICIAL)
  const [mostrarTodosFuncionarios, setMostrarTodosFuncionarios] = useState(false)
  const [modalSecoesAbertas, setModalSecoesAbertas] = useState(MODAL_SECOES_INICIAIS)
  const [impactoAdmissao, setImpactoAdmissao] = useState(null)
  const [motivoAdmissao, setMotivoAdmissao] = useState('')
  const [modalDesligamentoAberto, setModalDesligamentoAberto] = useState(false)
  const [funcionarioDesligamento, setFuncionarioDesligamento] = useState(null)
  const [formularioDesligamento, setFormularioDesligamento] = useState(FORMULARIO_DESLIGAMENTO_INICIAL)
  const [confirmacaoConclusaoAberta, setConfirmacaoConclusaoAberta] = useState(false)
  const [formularioCorrecao, setFormularioCorrecao] = useState(FORMULARIO_CORRECAO_INICIAL)
  const [checklistAberto, setChecklistAberto] = useState(false)
  const [formularioChecklist, setFormularioChecklist] = useState(FORMULARIO_CHECKLIST_INICIAL)
  const [formulariosItensChecklist, setFormulariosItensChecklist] = useState({})
  const [modalReadmissaoAberto, setModalReadmissaoAberto] = useState(false)
  const [funcionarioReadmissao, setFuncionarioReadmissao] = useState(null)
  const [formularioReadmissao, setFormularioReadmissao] = useState(FORMULARIO_READMISSAO_INICIAL)
  const [requestKeyReadmissao, setRequestKeyReadmissao] = useState('')
  const contextoAplicadoRef = useRef('')

  const {
    funcionarios,
    loading,
    salvando,
    erro,
    criarFuncionario,
    atualizarFuncionario,
    alterarAdmissaoFuncionario,
    readmitirPessoa,
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
    desligamentos,
    correcoes,
    loading: loadingDesligamentos,
    salvando: salvandoDesligamento,
    erro: erroDesligamentos,
    carregar: carregarDesligamentos,
    abrir: abrirDesligamento,
    atualizar: atualizarDesligamento,
    cancelar: cancelarDesligamento,
    concluir: concluirDesligamento,
    retificar: retificarDesligamento,
    reverterPorErro: reverterDesligamentoPorErro
  } = useFuncionariosDesligamentos({ empresaId })

  const {
    exames,
    loading: loadingExames,
    salvando: salvandoExames,
    erro: erroExames,
    registrar: registrarExameOcupacional,
    atualizar: atualizarExameOcupacional,
    arquivar: arquivarExameOcupacional,
    carregar: carregarExamesOcupacionais,
    limparErro: limparErroExames
  } = useFuncionariosExamesOcupacionais({
    empresaId,
    funcionarioId: funcionarioEditando?.id,
    incluirArquivados: mostrarExamesArquivados,
    autoCarregar: modalAberto && Boolean(funcionarioEditando?.id)
  })

  const filiaisPorId = useMemo(() => {
    return Object.fromEntries((filiais || []).map((filial) => [filial.id, filial.nome || 'Filial']))
  }, [filiais])

  const desligamentosPorFuncionario = useMemo(() => {
    const mapa = new Map()
    for (const desligamento of desligamentos || []) {
      const lista = mapa.get(desligamento.funcionario_id) || []
      lista.push(desligamento)
      mapa.set(desligamento.funcionario_id, lista)
    }
    return mapa
  }, [desligamentos])

  const historicoDesligamentoSelecionado = funcionarioDesligamento?.id
    ? desligamentosPorFuncionario.get(funcionarioDesligamento.id) || []
    : []
  const desligamentoAbertoSelecionado = historicoDesligamentoSelecionado.find((item) => item.estado === 'ABERTO') || null
  const desligamentoConcluidoSelecionado = historicoDesligamentoSelecionado.find((item) => item.estado === 'CONCLUIDO') || null
  const desligamentoConcluidoEfetivoSelecionado = historicoDesligamentoSelecionado.find((item) => item.estado === 'CONCLUIDO' && !item.efeito_revertido) || null
  const desligamentoOperacionalSelecionado = desligamentoAbertoSelecionado || desligamentoConcluidoEfetivoSelecionado
  const dataAcertoSelecionada = desligamentoOperacionalSelecionado?.data_acerto_efetiva || desligamentoOperacionalSelecionado?.data_acerto || ''
  const desligamentoChecklistSelecionado = desligamentoConcluidoEfetivoSelecionado || desligamentoConcluidoSelecionado
  const correcoesPorDesligamento = useMemo(() => {
    const mapa = new Map()
    for (const correcao of correcoes || []) {
      const lista = mapa.get(correcao.desligamento_id) || []
      lista.push(correcao)
      mapa.set(correcao.desligamento_id, lista)
    }
    return mapa
  }, [correcoes])
  const {
    catalogo: catalogoChecklist,
    itens: itensChecklist,
    loading: loadingChecklist,
    salvando: salvandoChecklist,
    erro: erroChecklist,
    carregar: carregarChecklist,
    criar: criarItemChecklist,
    atualizar: atualizarItemChecklist,
    alterarEstado: alterarEstadoItemChecklist
  } = useFuncionariosChecklistDesligamento({
    empresaId,
    desligamentoId: desligamentoChecklistSelecionado?.id,
    autoCarregar: modalDesligamentoAberto && Boolean(desligamentoChecklistSelecionado?.id)
  })
  const codigosChecklistAdicionados = useMemo(
    () => new Set((itensChecklist || []).map((item) => item.item_codigo)),
    [itensChecklist]
  )
  const catalogoChecklistDisponivel = useMemo(
    () => (catalogoChecklist || []).filter((item) => !codigosChecklistAdicionados.has(item.codigo)),
    [catalogoChecklist, codigosChecklistAdicionados]
  )
  const catalogoChecklistSelecionado = useMemo(
    () => catalogoChecklistDisponivel.find((item) => item.id === formularioChecklist.catalogoItemId) || null,
    [catalogoChecklistDisponivel, formularioChecklist.catalogoItemId]
  )
  const resumoChecklist = useMemo(() => {
    const contagens = (itensChecklist || []).reduce((acc, item) => {
      acc[item.estado] = (acc[item.estado] || 0) + 1
      return acc
    }, {})
    return Object.entries(CHECKLIST_ESTADO_LABELS)
      .filter(([estado]) => contagens[estado])
      .map(([estado, rotulo]) => `${contagens[estado]} ${rotulo.toLocaleLowerCase('pt-BR')}`)
      .join(' • ')
  }, [itensChecklist])
  const desligamentoEfetivoFuncionarioEditando = funcionarioEditando?.id
    ? desligamentoEfetivoDoVinculo(funcionarioEditando.id)
    : null
  const podeRegistrarDemissional = podeRegistrarExameDemissional(
    funcionarioEditando,
    desligamentoEfetivoFuncionarioEditando
  )
  const demissionalPendenteAtivo = possuiDemissionalPendenteAtivo(exames)

  useEffect(() => {
    setFormulariosItensChecklist(Object.fromEntries((itensChecklist || []).map((item) => [item.id, {
      dataPrevista: item.data_prevista || '',
      observacaoAdministrativa: item.observacao_administrativa || ''
    }])))
  }, [itensChecklist])

  const vinculosPorPessoa = useMemo(() => {
    const mapa = new Map()
    for (const funcionario of funcionarios || []) {
      const pessoaId = String(funcionario?.pessoa_id || '')
      if (!pessoaId) continue
      const lista = mapa.get(pessoaId) || []
      lista.push(funcionario)
      mapa.set(pessoaId, lista)
    }
    for (const lista of mapa.values()) {
      lista.sort((a, b) => String(b.data_admissao || '').localeCompare(String(a.data_admissao || '')) || String(b.id).localeCompare(String(a.id)))
    }
    return mapa
  }, [funcionarios])

  const vinculosPessoaSelecionada = funcionarioEditando?.pessoa_id
    ? vinculosPorPessoa.get(String(funcionarioEditando.pessoa_id)) || []
    : []

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

  const funcionariosRenderizados = useMemo(() => {
    if (mostrarTodosFuncionarios) return funcionariosFiltrados
    return funcionariosFiltrados.slice(0, LIMITE_FUNCIONARIOS_INICIAL)
  }, [funcionariosFiltrados, mostrarTodosFuncionarios])

  const resumoEquipe = useMemo(() => {
    const lista = funcionarios || []
    const ativos = lista.filter((funcionario) => !funcionario.arquivado && (funcionario.status || 'ativo') === 'ativo')
    const afastados = lista.filter((funcionario) => !funcionario.arquivado && funcionario.status === 'afastado')
    const inativos = lista.filter((funcionario) => funcionario.arquivado || funcionario.status === 'desligado')
    const pessoasAniversariantes = new Set(
      lista
        .filter((funcionario) => !funcionario.arquivado && funcionario.status === 'ativo' && fazAniversarioNoMes(funcionario.data_nascimento))
        .map((funcionario) => funcionario.pessoa_id || funcionario.id)
    )

    return {
      ativos: ativos.length,
      afastados: afastados.length,
      inativos: inativos.length,
      aniversariantes: pessoasAniversariantes.size
    }
  }, [funcionarios])

  useEffect(() => {
    contextoAplicadoRef.current = ''
    setModalAberto(false)
    setFuncionarioEditando(null)
    setFormulario(FORMULARIO_INICIAL)
    setImpactoAdmissao(null)
    setMotivoAdmissao('')
    setMostrarExamesArquivados(false)
    setModalReadmissaoAberto(false)
    setFuncionarioReadmissao(null)
    setFormularioReadmissao(FORMULARIO_READMISSAO_INICIAL)
    setRequestKeyReadmissao('')
    setChecklistAberto(false)
    setFormularioChecklist(FORMULARIO_CHECKLIST_INICIAL)
    setFormulariosItensChecklist({})
    limparFormularioExamePeriodico()
    limparErro?.()
    limparErroExames?.()
  }, [empresaId])

  function atualizarCampo(campo, valor) {
    if (campo === 'data_admissao') {
      setImpactoAdmissao(null)
      setMotivoAdmissao('')
    }
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
    setImpactoAdmissao(null)
    setMotivoAdmissao('')
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
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível carregar os dados completos do funcionário.'), 'erro')
      return
    }

    const funcionarioDetalhado = resposta?.data || funcionario
    setFuncionarioEditando(funcionarioDetalhado)
    setFormulario(montarFormulario(funcionarioDetalhado))
    setImpactoAdmissao(null)
    setMotivoAdmissao('')
    setMostrarExamesArquivados(false)
    limparFormularioExamePeriodico(funcionarioDetalhado)
    setModalSecoesAbertas(MODAL_SECOES_INICIAIS)
    setModalAberto(true)
  }

  function desligamentoEfetivoDoVinculo(funcionarioId) {
    return (desligamentosPorFuncionario.get(funcionarioId) || [])
      .find((item) => item.estado === 'CONCLUIDO' && !item.efeito_revertido) || null
  }

  function pessoaPossuiVinculoFuncional(funcionario) {
    return (vinculosPorPessoa.get(String(funcionario?.pessoa_id || '')) || []).some((vinculo) => (
      !vinculo.arquivado && ['ativo', 'afastado'].includes(vinculo.status)
    ))
  }

  function abrirReadmissao(funcionario) {
    if (!funcionario?.id || !podeEditar || funcionario.status !== 'desligado') return
    if (!desligamentoEfetivoDoVinculo(funcionario.id)) {
      mostrarAviso?.('Este vínculo não possui desligamento efetivo vigente para readmissão.', 'erro')
      return
    }
    if (pessoaPossuiVinculoFuncional(funcionario)) {
      mostrarAviso?.('Esta pessoa já possui um vínculo funcional ativo ou afastado.', 'erro')
      return
    }
    setFuncionarioReadmissao(funcionario)
    setFormularioReadmissao(FORMULARIO_READMISSAO_INICIAL)
    setRequestKeyReadmissao(criarChaveReadmissao())
    setModalReadmissaoAberto(true)
  }

  function fecharReadmissao({ forcar = false } = {}) {
    if (salvando && !forcar) return
    setModalReadmissaoAberto(false)
    setFuncionarioReadmissao(null)
    setFormularioReadmissao(FORMULARIO_READMISSAO_INICIAL)
    setRequestKeyReadmissao('')
  }

  async function confirmarReadmissao(event) {
    event.preventDefault()
    if (!funcionarioReadmissao?.id || salvando || !formularioReadmissao.confirmouHistorico) return
    if (!formularioReadmissao.novaDataAdmissao) {
      mostrarAviso?.('Informe a nova data de admissão.', 'erro')
      return
    }

    const resposta = await readmitirPessoa(funcionarioReadmissao.id, {
      requestKey: requestKeyReadmissao,
      novaDataAdmissao: formularioReadmissao.novaDataAdmissao,
      filialId: formularioReadmissao.filialId,
      cargo: formularioReadmissao.cargo,
      dataExameAdmissional: null,
      correlationId: requestKeyReadmissao
    })

    if (resposta?.error) {
      mostrarAviso?.(mensagemErroReadmissao(resposta.error), 'erro')
      return
    }

    mostrarAviso?.('Readmissão concluída com novo vínculo. O histórico anterior foi preservado.', 'sucesso')
    fecharReadmissao({ forcar: true })
  }

  useEffect(() => {
    const funcionarioId = String(contextoNavegacao?.funcionarioId || contextoNavegacao?.id || '')
    const desligamentoId = String(contextoNavegacao?.desligamentoId || '')
    const contextoDesligamento = contextoNavegacao?.tipo === 'acerto_desligamento' || Boolean(desligamentoId)
    const contextoChave = `${contextoNavegacao?.tipo || 'funcionario'}:${funcionarioId}:${desligamentoId}`
    if (!funcionarioId || contextoAplicadoRef.current === contextoChave || loading || (contextoDesligamento && loadingDesligamentos) || !podeEditar) return
    const funcionario = (funcionarios || []).find((item) => String(item?.id || '') === funcionarioId)
    if (!funcionario) return
    if (contextoDesligamento && !desligamentos.some((item) => String(item?.id || '') === desligamentoId && String(item?.funcionario_id || '') === funcionarioId)) return
    contextoAplicadoRef.current = contextoChave
    if (contextoDesligamento) abrirModalDesligamento(funcionario)
    else abrirEdicaoFuncionario(funcionario)
  }, [contextoNavegacao, desligamentos, funcionarios, loading, loadingDesligamentos, podeEditar])

  function fecharFormulario() {
    setModalAberto(false)
    setFuncionarioEditando(null)
    setFormulario(FORMULARIO_INICIAL)
    setImpactoAdmissao(null)
    setMotivoAdmissao('')
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

  function limparFormularioExamePeriodico(funcionario = null) {
    setFormularioNovoExame(
      podeRegistrarExameDemissional(
        funcionario,
        funcionario?.id ? desligamentoEfetivoDoVinculo(funcionario.id) : null
      )
        ? FORMULARIO_DEMISSIONAL_INICIAL
        : FORMULARIO_EXAME_INICIAL
    )
    setExameEditandoId('')
    setFormularioExameEditando(FORMULARIO_EXAME_INICIAL)
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
    let resposta

    if (!funcionarioEditando?.id) {
      resposta = await criarFuncionario(payload)
    } else {
      const alterouAdmissao = admissaoFoiAlterada(funcionarioEditando, payload.data_admissao)
      const { dataAdmissao, demaisCampos } = separarAdmissaoDoPayload(payload)

      if (alterouAdmissao && funcionarioEditando.status !== payload.status) {
        setModalSecoesAbertas((atual) => ({ ...atual, vinculo: true, datas: true }))
        mostrarAviso?.('Salve primeiro a alteração de status e depois altere a data de admissão.', 'erro')
        return
      }

      if (alterouAdmissao && !impactoAdmissaoCorresponde(impactoAdmissao, dataAdmissao)) {
        const preflight = await alterarAdmissaoFuncionario(funcionarioEditando.id, {
          novaDataAdmissao: dataAdmissao,
          somentePreflight: true
        })

        if (preflight?.error) {
          const fallback = mensagemSeguraErro(preflight.error, 'Não foi possível validar a alteração da admissão.')
          mostrarAviso?.(mensagemErroAdmissao(preflight.error, fallback), 'erro')
          return
        }

        setImpactoAdmissao(preflight?.data || null)
        setModalSecoesAbertas((atual) => ({ ...atual, datas: true }))
        mostrarAviso?.('Revise o impacto da admissão e salve novamente para confirmar.', 'info')
        return
      }

      if (alterouAdmissao && impactoAdmissao?.motivo_obrigatorio && !motivoAdmissaoValido(motivoAdmissao)) {
        mostrarAviso?.('Informe um motivo com pelo menos 5 caracteres para preservar os ciclos existentes.', 'erro')
        return
      }

      let resultadoAdmissao = null
      if (alterouAdmissao) {
        resposta = await alterarAdmissaoFuncionario(funcionarioEditando.id, {
          novaDataAdmissao: dataAdmissao,
          confirmarCiclosPreservados: Boolean(impactoAdmissao?.requer_confirmacao),
          motivo: motivoAdmissao
        })

        if (resposta?.error) {
          const fallback = mensagemSeguraErro(resposta.error, 'Não foi possível alterar a data de admissão.')
          mostrarAviso?.(mensagemErroAdmissao(resposta.error, fallback), 'erro')
          return
        }
        resultadoAdmissao = resposta?.data || null
        if (resultadoAdmissao?.requer_confirmacao && !resultadoAdmissao?.aplicado) {
          setImpactoAdmissao(resultadoAdmissao)
          mostrarAviso?.('Os ciclos foram alterados desde a validação. Revise o impacto e confirme novamente.', 'info')
          return
        }
      }

      resposta = await atualizarFuncionario(funcionarioEditando.id, demaisCampos)
      if (!resposta?.error && resultadoAdmissao?.ciclo_criado_id) {
        resposta.cicloCriadoId = resultadoAdmissao.ciclo_criado_id
      }
    }

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível salvar o funcionário.'), 'erro')
      return
    }

    mostrarAviso?.(
      resposta?.cicloCriadoId
        ? 'Funcionário atualizado e primeiro ciclo de férias criado.'
        : funcionarioEditando?.id ? 'Funcionário atualizado.' : 'Funcionário cadastrado.',
      'sucesso'
    )
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

  function abrirModalDesligamento(funcionario) {
    const historico = desligamentosPorFuncionario.get(funcionario?.id) || []
    if (!funcionario?.id || funcionario.arquivado || !podeEditar) return
    if (funcionario.status === 'desligado' && historico.length === 0) return
    const aberto = historico.find((item) => item.estado === 'ABERTO')
    setFuncionarioDesligamento(funcionario)
    setFormularioDesligamento(aberto ? {
      motivo: aberto.motivo || '',
      dataEfetiva: aberto.data_efetiva || '',
      dataAcerto: aberto.data_acerto || '',
      observacoes: aberto.observacoes || '',
      motivoCancelamento: ''
    } : FORMULARIO_DESLIGAMENTO_INICIAL)
    setChecklistAberto(false)
    setFormularioChecklist(FORMULARIO_CHECKLIST_INICIAL)
    setFormulariosItensChecklist({})
    setModalDesligamentoAberto(true)
  }

  function fecharModalDesligamento() {
    if (salvandoDesligamento) return
    setConfirmacaoConclusaoAberta(false)
    setFormularioCorrecao(FORMULARIO_CORRECAO_INICIAL)
    setChecklistAberto(false)
    setFormularioChecklist(FORMULARIO_CHECKLIST_INICIAL)
    setFormulariosItensChecklist({})
    setModalDesligamentoAberto(false)
    setFuncionarioDesligamento(null)
    setFormularioDesligamento(FORMULARIO_DESLIGAMENTO_INICIAL)
  }

  function atualizarCampoDesligamento(campo, valor) {
    setFormularioDesligamento((atual) => ({ ...atual, [campo]: valor }))
  }

  async function salvarWorkflowDesligamento(event) {
    event.preventDefault()
    if (!funcionarioDesligamento?.id || salvandoDesligamento) return
    const dados = {
      motivo: formularioDesligamento.motivo,
      dataEfetiva: formularioDesligamento.dataEfetiva,
      dataAcerto: formularioDesligamento.dataAcerto,
      observacoes: formularioDesligamento.observacoes
    }
    const resposta = desligamentoAbertoSelecionado
      ? await atualizarDesligamento(desligamentoAbertoSelecionado.id, dados)
      : await abrirDesligamento(funcionarioDesligamento.id, dados)

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível salvar o processo de desligamento.'), 'erro')
      return
    }
    mostrarAviso?.(
      desligamentoAbertoSelecionado ? 'Processo de desligamento atualizado.' : 'Processo de desligamento iniciado sem alterar o status da colaboradora.',
      'sucesso'
    )
  }

  async function cancelarWorkflowDesligamento() {
    if (!desligamentoAbertoSelecionado?.id || salvandoDesligamento) return
    if (String(formularioDesligamento.motivoCancelamento || '').trim().length < 3) {
      mostrarAviso?.('Informe o motivo do cancelamento.', 'erro')
      return
    }
    const resposta = await cancelarDesligamento(
      desligamentoAbertoSelecionado.id,
      formularioDesligamento.motivoCancelamento
    )
    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível cancelar o processo.'), 'erro')
      return
    }
    setFormularioDesligamento(FORMULARIO_DESLIGAMENTO_INICIAL)
    mostrarAviso?.('Processo cancelado. O status funcional permaneceu inalterado.', 'sucesso')
  }

  async function concluirWorkflowDesligamento() {
    if (!desligamentoAbertoSelecionado?.id || salvandoDesligamento) return
    const resposta = await concluirDesligamento(desligamentoAbertoSelecionado.id)
    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível concluir o desligamento.'), 'erro')
      return
    }
    await carregarFuncionarios()
    setFuncionarioDesligamento((atual) => atual ? { ...atual, status: 'desligado', arquivado: false } : atual)
    setConfirmacaoConclusaoAberta(false)
    mostrarAviso?.('Desligamento concluído. O cadastro permanece disponível e não foi arquivado.', 'sucesso')
  }

  function abrirRetificacao() {
    if (!desligamentoConcluidoEfetivoSelecionado) return
    setFormularioCorrecao({
      tipo: 'RETIFICACAO',
      dataEfetiva: desligamentoConcluidoEfetivoSelecionado.data_efetiva_efetiva || desligamentoConcluidoEfetivoSelecionado.data_efetiva || '',
      dataAcerto: desligamentoConcluidoEfetivoSelecionado.data_acerto_efetiva || desligamentoConcluidoEfetivoSelecionado.data_acerto || '',
      motivo: desligamentoConcluidoEfetivoSelecionado.motivo_efetivo || desligamentoConcluidoEfetivoSelecionado.motivo || '',
      observacoes: desligamentoConcluidoEfetivoSelecionado.observacoes_efetivas || '',
      motivoCorrecao: ''
    })
  }

  function abrirReversaoPorErro() {
    if (!desligamentoConcluidoEfetivoSelecionado) return
    setFormularioCorrecao({ ...FORMULARIO_CORRECAO_INICIAL, tipo: 'REVERSAO_ERRO' })
  }

  async function salvarCorrecaoDesligamento(event) {
    event.preventDefault()
    if (!desligamentoConcluidoEfetivoSelecionado?.id || salvandoDesligamento) return
    const resposta = formularioCorrecao.tipo === 'RETIFICACAO'
      ? await retificarDesligamento(desligamentoConcluidoEfetivoSelecionado.id, formularioCorrecao)
      : await reverterDesligamentoPorErro(desligamentoConcluidoEfetivoSelecionado.id, formularioCorrecao.motivoCorrecao)
    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível registrar a correção.'), 'erro')
      return
    }
    if (formularioCorrecao.tipo === 'REVERSAO_ERRO') {
      await carregarFuncionarios()
      setFuncionarioDesligamento((atual) => atual ? { ...atual, status: resposta.data?.status_funcional || 'ativo' } : atual)
      mostrarAviso?.('Conclusão revertida por erro. O registro original foi preservado.', 'sucesso')
    } else {
      mostrarAviso?.('Retificação registrada sem reativar o vínculo.', 'sucesso')
    }
    setFormularioCorrecao(FORMULARIO_CORRECAO_INICIAL)
  }

  async function adicionarItemChecklistAdministrativo() {
    if (!desligamentoConcluidoEfetivoSelecionado?.id || !formularioChecklist.catalogoItemId || salvandoChecklist) return
    const resposta = await criarItemChecklist({
      catalogoItemId: formularioChecklist.catalogoItemId,
      dataPrevista: formularioChecklist.dataPrevista,
      observacaoAdministrativa: formularioChecklist.observacaoAdministrativa
    })
    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível adicionar o item ao checklist.'), 'erro')
      return
    }
    setFormularioChecklist(FORMULARIO_CHECKLIST_INICIAL)
    mostrarAviso?.('Item adicionado ao checklist administrativo.', 'sucesso')
  }

  function atualizarFormularioItemChecklist(itemId, campo, valor) {
    setFormulariosItensChecklist((atual) => ({
      ...atual,
      [itemId]: { ...(atual[itemId] || {}), [campo]: valor }
    }))
  }

  async function salvarDetalhesItemChecklist(item) {
    if (!item?.id || salvandoChecklist || !desligamentoConcluidoEfetivoSelecionado) return
    const dados = formulariosItensChecklist[item.id] || {}
    const resposta = await atualizarItemChecklist(item.id, dados)
    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível atualizar o item.'), 'erro')
      return
    }
    mostrarAviso?.('Detalhes do checklist atualizados.', 'sucesso')
  }

  async function mudarEstadoItemChecklist(item, estado) {
    if (!item?.id || salvandoChecklist || !desligamentoConcluidoEfetivoSelecionado) return
    const resposta = await alterarEstadoItemChecklist(item.id, estado)
    if (resposta?.error) {
      await carregarChecklist()
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível alterar o estado do item.'), 'erro')
      return
    }
    mostrarAviso?.('Estado do checklist atualizado.', 'sucesso')
  }

  async function adicionarExameOcupacional() {
    if (!empresaId || !funcionarioEditando?.id || !podeEditar || salvandoExames) return

    if (formularioNovoExame.tipo === 'DEMISSIONAL' && !podeRegistrarDemissional) {
      mostrarAviso?.('O exame demissional só pode ser registrado para um vínculo efetivamente desligado.', 'erro')
      return
    }
    if (
      formularioNovoExame.tipo === 'DEMISSIONAL'
      && formularioNovoExame.estado === 'PENDENTE'
      && demissionalPendenteAtivo
    ) {
      mostrarAviso?.('Já existe um exame demissional pendente ativo para este vínculo.', 'erro')
      return
    }

    if (!formularioExameValido(formularioNovoExame)) {
      mostrarAviso?.(formularioNovoExame.estado === 'PENDENTE'
        ? 'Informe a data prevista do exame.'
        : 'Informe a data realizada do exame.', 'erro')
      return
    }

    const resposta = await registrarExameOcupacional({
      funcionarioId: funcionarioEditando.id,
      ...montarDadosExame(formularioNovoExame)
    })

    if (resposta?.error) {
      const fallback = mensagemSeguraErro(resposta.error, 'Não foi possível salvar o exame ocupacional.')
      mostrarAviso?.(mensagemErroExameDemissional(resposta.error, fallback), 'erro')
      return
    }

    setFormularioNovoExame(podeRegistrarDemissional ? FORMULARIO_DEMISSIONAL_INICIAL : FORMULARIO_EXAME_INICIAL)
    mostrarAviso?.('Exame ocupacional registrado.', 'sucesso')
  }

  function iniciarEdicaoExame(exame) {
    if (!exame?.id || !podeEditar || exame.origem === 'LEGADO' || exame.arquivado) return
    limparErroExames?.()
    setExameEditandoId(exame.id)
    setFormularioExameEditando({
      tipo: exame.tipo,
      estado: exame.estado,
      dataPrevista: exame.data_prevista || '',
      dataRealizada: exame.data_realizada || ''
    })
  }

  function cancelarEdicaoExame() {
    setExameEditandoId('')
    setFormularioExameEditando(FORMULARIO_EXAME_INICIAL)
  }

  async function salvarEdicaoExame(exame) {
    if (!exame?.id || !empresaId || !podeEditar || salvandoExames) return

    if (!formularioExameValido(formularioExameEditando)) {
      mostrarAviso?.(formularioExameEditando.estado === 'PENDENTE'
        ? 'Informe a data prevista do exame.'
        : 'Informe a data realizada do exame.', 'erro')
      return
    }

    const resposta = await atualizarExameOcupacional(exame.id, montarDadosExame(formularioExameEditando))

    if (resposta?.error) {
      const fallback = mensagemSeguraErro(resposta.error, 'Não foi possível atualizar o exame ocupacional.')
      mostrarAviso?.(mensagemErroExameDemissional(resposta.error, fallback), 'erro')
      return
    }

    cancelarEdicaoExame()
    mostrarAviso?.('Exame ocupacional atualizado.', 'sucesso')
  }

  async function arquivarExame(exame) {
    if (!exame?.id || !empresaId || !podeEditar || salvandoExames || exame.origem === 'LEGADO' || exame.arquivado) return
    const resposta = await arquivarExameOcupacional(exame.id)

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível arquivar o exame ocupacional.'), 'erro')
      return
    }

    if (exameEditandoId === exame.id) cancelarEdicaoExame()
    mostrarAviso?.('Exame ocupacional arquivado.', 'sucesso')
  }

  return (
    <div className="funcionarios-page">
      <PageHeader
        kicker="Gestão de Pessoas"
        title="Funcionários"
        description="Cadastro operacional da equipe, vínculos e exames ocupacionais."
        meta={<>Empresa ativa: <strong>{empresaNome || 'Empresa não identificada'}</strong></>}
        className="funcionarios-page-hero"
        actionsClassName="funcionarios-hero-actions"
        actions={<>
          <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={voltarPainel}>← Painel</button>
          {podeEditar && (
            <button className="funcionarios-btn funcionarios-btn-primary" type="button" disabled={!empresaId} onClick={abrirNovoFuncionario}>
              Novo funcionário
            </button>
          )}
        </>}
      />

      <section className="funcionarios-panel">
        <FilterCard className="funcionarios-filters" description="Busque a equipe sem expor CPF, documentos, salário ou dados clínicos.">
        <FilterGrid className="funcionarios-control-card">
          <label className="funcionarios-field funcionarios-field-search">
            <span>Busca</span>
            <input
              className="funcionarios-input"
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value)
                setMostrarTodosFuncionarios(false)
              }}
              placeholder="Buscar por nome, cargo ou filial"
              disabled={!empresaId}
            />
          </label>
          <label className="funcionarios-field">
            <span>Status</span>
            <select
              className="funcionarios-input"
              value={statusFiltro}
              onChange={(event) => {
                setStatusFiltro(event.target.value)
                setMostrarTodosFuncionarios(false)
              }}
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
              onChange={(event) => {
                setIncluirArquivados(event.target.checked)
                setMostrarTodosFuncionarios(false)
              }}
              disabled={!empresaId}
            />
            <span className="funcionarios-switch-indicator" aria-hidden="true" />
            <span>Mostrar arquivados</span>
          </label>
        </FilterGrid>
        </FilterCard>

        <KpiGrid className="funcionarios-summary" aria-label="Resumo da equipe">
          <KpiCard label="Equipe ativa" value={resumoEquipe.ativos} tone="success" />
          <KpiCard label="Afastados" value={resumoEquipe.afastados} tone="warning" />
          <KpiCard label="Aniversariantes" value={resumoEquipe.aniversariantes} />
          <KpiCard label="Inativos" value={resumoEquipe.inativos} />
        </KpiGrid>

        {!empresaId ? (
          <PageState title="Empresa ativa necessária" description="Selecione uma empresa para carregar os funcionários." />
        ) : loading ? (
          <PageState type="loading" title="Carregando funcionários…" description="Consultando a equipe da empresa ativa." />
        ) : erro ? (
          <PageState type="error" title="Não foi possível carregar" description={erro} actionLabel="Tentar novamente" onAction={() => carregarFuncionarios()} />
        ) : funcionariosFiltrados.length === 0 ? (
          <PageState title="Nenhum funcionário encontrado" description={podeEditar ? 'Cadastre o primeiro colaborador desta empresa.' : 'Não há colaboradores disponíveis para esta empresa.'} />
        ) : (
          <>
          <div className="funcionarios-results-strip">
            <span>{funcionariosFiltrados.length} colaborador(es) no recorte atual</span>
            {!mostrarTodosFuncionarios && funcionariosFiltrados.length > LIMITE_FUNCIONARIOS_INICIAL && (
              <small>Exibindo {LIMITE_FUNCIONARIOS_INICIAL} inicialmente para facilitar a leitura no mobile.</small>
            )}
          </div>

          <div className="funcionarios-list">
            {funcionariosRenderizados.map((funcionario) => {
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
                        {!funcionario.arquivado && (funcionario.status !== 'desligado' || (desligamentosPorFuncionario.get(funcionario.id) || []).length > 0) && (
                          <button
                            className="funcionarios-btn funcionarios-btn-secondary"
                            type="button"
                            disabled={salvando || loadingDesligamentos}
                            onClick={() => abrirModalDesligamento(funcionario)}
                          >
                            {funcionario.status === 'desligado'
                              ? 'Ver histórico'
                              : (desligamentosPorFuncionario.get(funcionario.id) || []).some((item) => item.estado === 'ABERTO')
                              ? 'Ver desligamento'
                              : 'Iniciar desligamento'}
                          </button>
                        )}
                        {!funcionario.arquivado && funcionario.status === 'desligado' && desligamentoEfetivoDoVinculo(funcionario.id) && (
                          <button
                            className="funcionarios-btn funcionarios-btn-primary"
                            type="button"
                            disabled={salvando || pessoaPossuiVinculoFuncional(funcionario)}
                            onClick={() => abrirReadmissao(funcionario)}
                            title={pessoaPossuiVinculoFuncional(funcionario) ? 'A pessoa já possui outro vínculo funcional.' : 'Criar novo vínculo para esta pessoa.'}
                          >
                            {pessoaPossuiVinculoFuncional(funcionario) ? 'Novo vínculo ativo' : 'Readmitir'}
                          </button>
                        )}
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
          {funcionariosFiltrados.length > LIMITE_FUNCIONARIOS_INICIAL && (
            <button
              className="funcionarios-inline-action"
              type="button"
              onClick={() => setMostrarTodosFuncionarios((atual) => !atual)}
            >
              {mostrarTodosFuncionarios ? 'Recolher lista' : `Ver todos os ${funcionariosFiltrados.length} colaboradores`}
            </button>
          )}
          </>
        )}
      </section>

      {modalDesligamentoAberto && funcionarioDesligamento && (
        <div className="funcionario-modal-backdrop" role="presentation" onClick={fecharModalDesligamento}>
          <form className="funcionario-modal funcionario-desligamento-modal" role="dialog" aria-modal="true" aria-labelledby="desligamento-modal-title" onSubmit={salvarWorkflowDesligamento} onClick={(event) => event.stopPropagation()}>
            <div className="funcionario-modal-header">
              <div>
                <span className="funcionarios-kicker">Gestão do vínculo</span>
                <h2 id="desligamento-modal-title">Desligamento de {funcionarioDesligamento.nome || 'colaborador'}</h2>
                <p>Acompanhe a etapa atual e a próxima ação do processo.</p>
              </div>
              <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={fecharModalDesligamento} disabled={salvandoDesligamento}>Fechar</button>
            </div>

            <div className={`funcionario-desligamento-alerta ${desligamentoConcluidoSelecionado ? 'is-concluido' : ''}`} role="status">
              {desligamentoConcluidoEfetivoSelecionado ? (
                <>
                  <strong>Situação: Vínculo encerrado</strong>
                  <span>O vínculo foi encerrado. {dataAcertoSelecionada ? `Acerto previsto para ${formatarDataCurta(dataAcertoSelecionada)}.` : 'Data prevista do acerto: Não informado.'}</span>
                </>
              ) : desligamentoConcluidoSelecionado?.efeito_revertido ? (
                <>
                  <strong>Situação: Conclusão revertida</strong>
                  <span>Esta reversão não representa readmissão. Um desligamento futuro deve usar um novo processo.</span>
                </>
              ) : desligamentoAbertoSelecionado ? (
                <>
                  <strong>Situação: Em andamento</strong>
                  <span>Revise os dados e conclua o vínculo quando estiver correto.</span>
                </>
              ) : (
                <>
                  <strong>Situação: Não iniciado</strong>
                  <span>Informe os dados e inicie o desligamento.</span>
                </>
              )}
            </div>

            <section className="funcionario-desligamento-etapas" aria-label="Etapas do desligamento">
              <ol>
                <li className={desligamentoConcluidoEfetivoSelecionado ? 'is-completa' : 'is-atual'}>
                  <span>1</span>
                  <div><strong>Dados do desligamento</strong><small>{desligamentoConcluidoEfetivoSelecionado ? 'Concluída' : 'Etapa atual'}</small></div>
                </li>
                <li className={dataAcertoSelecionada ? 'is-proxima' : 'is-futura'}>
                  <span>2</span>
                  <div><strong>Acerto</strong><small>{dataAcertoSelecionada ? `Previsto para ${formatarDataCurta(dataAcertoSelecionada)}` : 'Data não informada'}</small></div>
                </li>
                <li className="is-futura">
                  <span>3</span>
                  <div><strong>Conta do acerto</strong><small>Etapa posterior</small></div>
                </li>
              </ol>
              {!desligamentoConcluidoEfetivoSelecionado && (
                <p>{desligamentoAbertoSelecionado
                  ? 'Próxima ação: revise os dados e conclua o vínculo quando estiver correto.'
                  : 'Próxima ação: informe os dados e inicie o desligamento.'}</p>
              )}
            </section>

            {erroDesligamentos && (
              <div className="funcionario-exames-empty">
                <strong>Não foi possível carregar o histórico.</strong>
                <p>{erroDesligamentos}</p>
                <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={carregarDesligamentos}>Tentar novamente</button>
              </div>
            )}

            {funcionarioDesligamento.status !== 'desligado' && !desligamentoConcluidoEfetivoSelecionado && <section className="funcionario-modal-section">
              <div className="funcionario-modal-section-toggle funcionario-modal-section-static">
                <span>
                  <strong>Dados do desligamento</strong>
                  <small>Motivo, último dia trabalhado e data prevista do acerto são obrigatórios.</small>
                </span>
                <b>{desligamentoAbertoSelecionado ? 'Editar' : '1'}</b>
              </div>
              <div className="funcionario-form-grid">
                <label className="span-2">
                  Motivo (obrigatório)
                  <textarea className="funcionarios-input" value={formularioDesligamento.motivo} onChange={(event) => atualizarCampoDesligamento('motivo', event.target.value)} required />
                </label>
                <label>
                  Último dia trabalhado (obrigatório)
                  <input className="funcionarios-input" type="date" value={formularioDesligamento.dataEfetiva} onChange={(event) => atualizarCampoDesligamento('dataEfetiva', event.target.value)} required />
                </label>
                <label>
                  Data prevista do acerto (obrigatório)
                  <input className="funcionarios-input" type="date" value={formularioDesligamento.dataAcerto} onChange={(event) => atualizarCampoDesligamento('dataAcerto', event.target.value)} required />
                </label>
                <label className="span-2">
                  Observações (opcional)
                  <textarea className="funcionarios-input" value={formularioDesligamento.observacoes} onChange={(event) => atualizarCampoDesligamento('observacoes', event.target.value)} />
                </label>
                <p className="funcionarios-note span-2">Iniciar registra o processo e não encerra o vínculo. Você poderá revisar os dados antes da conclusão.</p>
                <p className="funcionarios-note span-2">A data prevista do acerto será acompanhada na Agenda.</p>
              </div>
            </section>}

            {desligamentoOperacionalSelecionado && (
              <dl className="funcionario-confirmacao-resumo" aria-label="Resumo do desligamento">
                <div><dt>Último dia trabalhado</dt><dd>{formatarDataCurta(desligamentoOperacionalSelecionado.data_efetiva_efetiva || desligamentoOperacionalSelecionado.data_efetiva)}</dd></div>
                <div><dt>Data prevista do acerto</dt><dd>{formatarDataAcerto(dataAcertoSelecionada)}</dd></div>
                <div><dt>Situação atual</dt><dd>{DESLIGAMENTO_ESTADO_LABELS[desligamentoOperacionalSelecionado.estado] || desligamentoOperacionalSelecionado.estado}</dd></div>
              </dl>
            )}

            {desligamentoAbertoSelecionado && (
              <section className="funcionario-modal-section funcionario-desligamento-conclusao">
                <div className="funcionario-modal-section-toggle funcionario-modal-section-static">
                  <span><strong>Concluir desligamento</strong><small>Altera o status funcional para desligado sem arquivar o cadastro.</small></span>
                  <b>✓</b>
                </div>
                <div className="funcionario-form-grid">
                  <p className="funcionarios-note span-2">Revise o colaborador, o último dia trabalhado, a data prevista do acerto e o motivo. Esta ação altera o status do vínculo para desligado.</p>
                  <button className="funcionarios-btn funcionarios-btn-danger" type="button" disabled={salvandoDesligamento} onClick={() => setConfirmacaoConclusaoAberta(true)}>Concluir desligamento</button>
                </div>
              </section>
            )}

            {desligamentoConcluidoEfetivoSelecionado && (
              <section className="funcionario-modal-section funcionario-desligamento-correcao">
                <div className="funcionario-modal-section-toggle funcionario-modal-section-static">
                  <span><strong>Correção administrativa</strong><small>O registro original da conclusão nunca é sobrescrito.</small></span>
                  <b>!</b>
                </div>
                <div className="funcionario-correcao-actions">
                  <button className="funcionarios-btn funcionarios-btn-secondary" type="button" disabled={salvandoDesligamento} onClick={abrirRetificacao}>Retificar</button>
                  <button className="funcionarios-btn funcionarios-btn-danger" type="button" disabled={salvandoDesligamento || !desligamentoConcluidoEfetivoSelecionado.status_anterior} onClick={abrirReversaoPorErro}>Reverter conclusão por erro</button>
                  {!desligamentoConcluidoEfetivoSelecionado.status_anterior && <small>A reversão está bloqueada porque o estado funcional anterior não pôde ser comprovado.</small>}
                </div>
              </section>
            )}

            {desligamentoChecklistSelecionado && (
              <section className="funcionario-modal-section funcionario-checklist-section">
                <button
                  className="funcionario-modal-section-toggle"
                  type="button"
                  aria-expanded={checklistAberto}
                  onClick={() => setChecklistAberto((atual) => !atual)}
                >
                  <span>
                    <strong>Outras tarefas administrativas <em className="funcionario-opcional-badge">Opcional</em></strong>
                    <small>{desligamentoChecklistSelecionado.efeito_revertido
                      ? 'Histórico preservado; a conclusão foi revertida por erro.'
                      : 'Use para acompanhar tarefas internas que não fazem parte das etapas principais do desligamento.'}</small>
                    {resumoChecklist && <small className="funcionario-checklist-resumo">{resumoChecklist}</small>}
                  </span>
                  <b>{checklistAberto ? '−' : '+'}</b>
                </button>

                {checklistAberto && (
                  <div className="funcionario-checklist-content">
                    {erroChecklist && (
                      <div className="funcionario-exames-empty">
                        <strong>Não foi possível carregar o checklist.</strong>
                        <p>{erroChecklist}</p>
                        <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={carregarChecklist}>Tentar novamente</button>
                      </div>
                    )}

                    {loadingChecklist ? (
                      <p className="funcionarios-note">Carregando checklist administrativo...</p>
                    ) : (
                      <>
                        {desligamentoChecklistSelecionado.efeito_revertido && (
                          <div className="funcionario-checklist-historico" role="status">
                            Este checklist é somente histórico. Novos itens e alterações estão bloqueados após a reversão.
                          </div>
                        )}

                        {!desligamentoChecklistSelecionado.efeito_revertido && podeEditar && (
                          catalogoChecklist.length === 0 ? (
                            <div className="funcionario-exames-empty">Nenhum item de checklist configurado.</div>
                          ) : catalogoChecklistDisponivel.length === 0 ? (
                            <div className="funcionario-exames-empty">Todos os itens configurados já foram adicionados.</div>
                          ) : (
                            <div className="funcionario-checklist-add">
                              <label>
                                Item configurado
                                <select
                                  className="funcionarios-input"
                                  value={formularioChecklist.catalogoItemId}
                                  onChange={(event) => setFormularioChecklist((atual) => ({ ...atual, catalogoItemId: event.target.value }))}
                                >
                                  <option value="">Selecione</option>
                                  {catalogoChecklistDisponivel.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}
                                </select>
                                {catalogoChecklistSelecionado?.descricao_operacional && (
                                  <p className="funcionario-checklist-descricao">
                                    {catalogoChecklistSelecionado.descricao_operacional}
                                  </p>
                                )}
                              </label>
                              <label>
                                Data prevista (opcional)
                                <input
                                  className="funcionarios-input"
                                  type="date"
                                  value={formularioChecklist.dataPrevista}
                                  onChange={(event) => setFormularioChecklist((atual) => ({ ...atual, dataPrevista: event.target.value }))}
                                />
                              </label>
                              <label className="span-2">
                                Observação administrativa
                                <textarea
                                  className="funcionarios-input"
                                  maxLength={500}
                                  value={formularioChecklist.observacaoAdministrativa}
                                  onChange={(event) => setFormularioChecklist((atual) => ({ ...atual, observacaoAdministrativa: event.target.value }))}
                                />
                              </label>
                              <button
                                className="funcionarios-btn funcionarios-btn-primary"
                                type="button"
                                disabled={salvandoChecklist || !formularioChecklist.catalogoItemId}
                                onClick={adicionarItemChecklistAdministrativo}
                              >
                                {salvandoChecklist ? 'Salvando...' : 'Adicionar item'}
                              </button>
                            </div>
                          )
                        )}

                        {itensChecklist.length === 0 ? (
                          <div className="funcionario-exames-empty">Nenhum item registrado neste desligamento.</div>
                        ) : (
                          <div className="funcionario-checklist-list">
                            {itensChecklist.map((item) => {
                              const formularioItem = formulariosItensChecklist[item.id] || {}
                              const somenteHistorico = desligamentoChecklistSelecionado.efeito_revertido || !podeEditar
                              return (
                                <article key={item.id} className="funcionario-checklist-item">
                                  <div className="funcionario-checklist-item-header">
                                    <div className="funcionario-checklist-item-identidade">
                                      <strong>{item.titulo_snapshot}</strong>
                                      {item.descricao_snapshot && <p className="funcionario-checklist-descricao">{item.descricao_snapshot}</p>}
                                    </div>
                                    <span className={`funcionario-exame-status ${String(item.estado || '').toLowerCase()}`}>
                                      {CHECKLIST_ESTADO_LABELS[item.estado] || item.estado}
                                    </span>
                                  </div>
                                  <div className="funcionario-checklist-fields">
                                    <label>
                                      Estado
                                      <select
                                        className="funcionarios-input"
                                        value={item.estado}
                                        disabled={somenteHistorico || salvandoChecklist}
                                        onChange={(event) => mudarEstadoItemChecklist(item, event.target.value)}
                                      >
                                        {Object.entries(CHECKLIST_ESTADO_LABELS).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
                                      </select>
                                    </label>
                                    <label>
                                      Data prevista (opcional)
                                      <input
                                        className="funcionarios-input"
                                        type="date"
                                        value={formularioItem.dataPrevista || ''}
                                        disabled={somenteHistorico || salvandoChecklist}
                                        onChange={(event) => atualizarFormularioItemChecklist(item.id, 'dataPrevista', event.target.value)}
                                      />
                                    </label>
                                    <label className="span-2">
                                      Observação administrativa
                                      <textarea
                                        className="funcionarios-input"
                                        maxLength={500}
                                        value={formularioItem.observacaoAdministrativa || ''}
                                        disabled={somenteHistorico || salvandoChecklist}
                                        onChange={(event) => atualizarFormularioItemChecklist(item.id, 'observacaoAdministrativa', event.target.value)}
                                      />
                                    </label>
                                  </div>
                                  {!somenteHistorico && (
                                    <button
                                      className="funcionarios-btn funcionarios-btn-secondary"
                                      type="button"
                                      disabled={salvandoChecklist}
                                      onClick={() => salvarDetalhesItemChecklist(item)}
                                    >
                                      Salvar detalhes
                                    </button>
                                  )}
                                  {item.estado === 'CONCLUIDO' && <small>Concluído em {formatarDataCurta(item.concluido_em)}</small>}
                                </article>
                              )
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </section>
            )}

            {desligamentoAbertoSelecionado && (
              <section className="funcionario-modal-section">
                <div className="funcionario-modal-section-toggle funcionario-modal-section-static">
                  <span><strong>Cancelar processo</strong><small>O cancelamento fica no histórico e não altera o status funcional.</small></span>
                  <b>×</b>
                </div>
                <div className="funcionario-form-grid">
                  <label className="span-2">
                    Motivo do cancelamento
                    <textarea className="funcionarios-input" value={formularioDesligamento.motivoCancelamento} onChange={(event) => atualizarCampoDesligamento('motivoCancelamento', event.target.value)} />
                  </label>
                  <button className="funcionarios-btn funcionarios-btn-danger" type="button" disabled={salvandoDesligamento} onClick={cancelarWorkflowDesligamento}>Cancelar processo</button>
                </div>
              </section>
            )}

            <section className="funcionario-modal-section">
              <div className="funcionario-modal-section-toggle funcionario-modal-section-static">
                <span><strong>Histórico</strong><small>Processos abertos, cancelados e concluídos desta colaboradora.</small></span>
                <b>{historicoDesligamentoSelecionado.length}</b>
              </div>
              <div className="funcionario-desligamento-historico">
                {loadingDesligamentos ? (
                  <p className="funcionarios-note">Carregando histórico...</p>
                ) : historicoDesligamentoSelecionado.length === 0 ? (
                  <div className="funcionario-exames-empty">Nenhum processo anterior.</div>
                ) : historicoDesligamentoSelecionado.map((item) => (
                  <article key={item.id} className="funcionario-desligamento-item">
                      <div><strong>{item.efeito_revertido ? 'Conclusão revertida' : (DESLIGAMENTO_ESTADO_LABELS[item.estado] || item.estado)}</strong><small>Iniciado em {formatarDataCurta(item.aberto_em)}</small></div>
                    <span>Último dia trabalhado: {formatarDataCurta(item.data_efetiva)}</span>
                    <span>Data prevista do acerto: {formatarDataAcerto(item.data_acerto_efetiva || item.data_acerto)}</span>
                    <span>Motivo: {item.motivo}</span>
                    {item.estado === 'CANCELADO' && <span>Cancelamento: {item.motivo_cancelamento}</span>}
                    {item.estado === 'CONCLUIDO' && <span>Concluído em: {formatarDataCurta(item.concluido_em)}</span>}
                    {item.estado === 'CONCLUIDO' && <span>Resultado atual: {item.efeito_revertido ? `revertido para ${STATUS_LABELS[item.status_funcional_efetivo] || item.status_funcional_efetivo}` : `desligado em ${formatarDataCurta(item.data_efetiva_efetiva)}`}</span>}
                    {(correcoesPorDesligamento.get(item.id) || []).map((correcao) => (
                      <div key={correcao.id} className="funcionario-desligamento-correcao-item">
                        <strong>{correcao.tipo === 'RETIFICACAO' ? 'Retificação' : 'Reversão por erro'}</strong>
                        <small>{formatarDataCurta(correcao.criado_em)}</small>
                        <span>{correcao.motivo_correcao}</span>
                        {correcao.tipo === 'RETIFICACAO' && <span>Último dia trabalhado: {formatarDataCurta(correcao.data_efetiva_antes)} → {formatarDataCurta(correcao.data_efetiva_depois)}</span>}
                        {correcao.tipo === 'RETIFICACAO' && <span>Data prevista do acerto: {formatarDataAcerto(correcao.data_acerto_antes)} → {formatarDataAcerto(correcao.data_acerto_depois)}</span>}
                      </div>
                    ))}
                  </article>
                ))}
              </div>
            </section>

            <div className="funcionario-modal-actions">
              <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={fecharModalDesligamento} disabled={salvandoDesligamento}>Fechar</button>
              {funcionarioDesligamento.status !== 'desligado' && !desligamentoConcluidoEfetivoSelecionado && (
                <button className="funcionarios-btn funcionarios-btn-primary" type="submit" disabled={salvandoDesligamento || !formularioDesligamento.motivo || !formularioDesligamento.dataEfetiva || !formularioDesligamento.dataAcerto}>
                  {salvandoDesligamento ? 'Salvando...' : desligamentoAbertoSelecionado ? 'Salvar alterações' : 'Iniciar desligamento'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {modalReadmissaoAberto && funcionarioReadmissao && (
        <div className="funcionario-modal-backdrop" role="presentation" onClick={fecharReadmissao}>
          <form className="funcionario-modal funcionario-readmissao-modal" role="dialog" aria-modal="true" aria-labelledby="readmissao-modal-title" onSubmit={confirmarReadmissao} onClick={(event) => event.stopPropagation()}>
            <div className="funcionario-modal-header">
              <div>
                <span className="funcionarios-kicker">Novo vínculo</span>
                <h2 id="readmissao-modal-title">Criar novo vínculo</h2>
                <p>{funcionarioReadmissao.nome || 'Pessoa selecionada'}</p>
              </div>
              <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={fecharReadmissao} disabled={salvando}>Fechar</button>
            </div>

            <div className="funcionario-readmissao-aviso" role="status">
              <strong>Será criado um novo vínculo.</strong>
              <span>O vínculo anterior continuará desligado e seu histórico de Férias, Folha, Exames e Desligamento permanecerá intacto.</span>
            </div>

            <div className="funcionario-form-grid">
              <label>
                Nova data de admissão
                <input className="funcionarios-input" type="date" required value={formularioReadmissao.novaDataAdmissao} onChange={(event) => setFormularioReadmissao((atual) => ({ ...atual, novaDataAdmissao: event.target.value }))} />
              </label>
              <label>
                Filial
                <select className="funcionarios-input" value={formularioReadmissao.filialId} onChange={(event) => setFormularioReadmissao((atual) => ({ ...atual, filialId: event.target.value }))}>
                  <option value="">Sem filial</option>
                  {(filiais || []).map((filial) => <option key={filial.id} value={filial.id}>{filial.nome || 'Filial'}</option>)}
                </select>
              </label>
              <label>
                Cargo ou função
                <input className="funcionarios-input" value={formularioReadmissao.cargo} onChange={(event) => setFormularioReadmissao((atual) => ({ ...atual, cargo: event.target.value }))} onBlur={() => setFormularioReadmissao((atual) => ({ ...atual, cargo: normalizarCapitalizacao(atual.cargo) }))} />
              </label>
              <div className="funcionario-exames-empty">
                O exame admissional deve ser registrado na seção de exames ocupacionais após a criação do novo vínculo.
              </div>
            </div>

            <label className="funcionario-readmissao-confirmacao">
              <input type="checkbox" checked={formularioReadmissao.confirmouHistorico} onChange={(event) => setFormularioReadmissao((atual) => ({ ...atual, confirmouHistorico: event.target.checked }))} />
              <span>Confirmo que é uma nova contratação e que o vínculo anterior não deve ser reativado.</span>
            </label>

            <div className="funcionario-modal-actions">
              <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={fecharReadmissao} disabled={salvando}>Cancelar</button>
              <button className="funcionarios-btn funcionarios-btn-primary" type="submit" disabled={salvando || !formularioReadmissao.confirmouHistorico || !formularioReadmissao.novaDataAdmissao}>
                {salvando ? 'Criando vínculo...' : 'Confirmar readmissão'}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmacaoConclusaoAberta && desligamentoAbertoSelecionado && funcionarioDesligamento && (
        <div className="funcionario-modal-backdrop funcionario-confirmacao-backdrop" role="presentation" onClick={() => !salvandoDesligamento && setConfirmacaoConclusaoAberta(false)}>
          <div className="funcionario-modal funcionario-confirmacao-modal" role="alertdialog" aria-modal="true" aria-labelledby="conclusao-desligamento-title" onClick={(event) => event.stopPropagation()}>
            <div className="funcionario-modal-header">
              <div>
                <span className="funcionarios-kicker">Confirmação obrigatória</span>
                <h2 id="conclusao-desligamento-title">Concluir desligamento</h2>
              </div>
            </div>
            <dl className="funcionario-confirmacao-resumo">
              <div><dt>Colaborador</dt><dd>{funcionarioDesligamento.nome || 'Não informado'}</dd></div>
              <div><dt>Último dia trabalhado</dt><dd>{formatarDataCurta(desligamentoAbertoSelecionado.data_efetiva)}</dd></div>
              <div><dt>Data prevista do acerto</dt><dd>{formatarDataAcerto(desligamentoAbertoSelecionado.data_acerto)}</dd></div>
              <div><dt>Motivo</dt><dd>{desligamentoAbertoSelecionado.motivo}</dd></div>
            </dl>
            <div className="funcionario-desligamento-alerta" role="note">
              <strong>O status funcional passará para desligado.</strong>
              <span>O cadastro NÃO será arquivado. Histórico de Férias, Folha e Exames será preservado.</span>
            </div>
            <div className="funcionario-modal-actions">
              <button className="funcionarios-btn funcionarios-btn-secondary" type="button" disabled={salvandoDesligamento} onClick={() => setConfirmacaoConclusaoAberta(false)}>Voltar</button>
              <button className="funcionarios-btn funcionarios-btn-danger" type="button" disabled={salvandoDesligamento} onClick={concluirWorkflowDesligamento}>{salvandoDesligamento ? 'Concluindo...' : 'Confirmar conclusão'}</button>
            </div>
          </div>
        </div>
      )}

      {formularioCorrecao.tipo && desligamentoConcluidoEfetivoSelecionado && funcionarioDesligamento && (
        <div className="funcionario-modal-backdrop funcionario-confirmacao-backdrop" role="presentation" onClick={() => !salvandoDesligamento && setFormularioCorrecao(FORMULARIO_CORRECAO_INICIAL)}>
          <form className="funcionario-modal funcionario-confirmacao-modal" role="dialog" aria-modal="true" aria-labelledby="correcao-desligamento-title" onSubmit={salvarCorrecaoDesligamento} onClick={(event) => event.stopPropagation()}>
            <div className="funcionario-modal-header">
              <div>
                <span className="funcionarios-kicker">Correção com histórico preservado</span>
                <h2 id="correcao-desligamento-title">{formularioCorrecao.tipo === 'RETIFICACAO' ? 'Retificar desligamento' : 'Reverter conclusão por erro'}</h2>
                <p>{funcionarioDesligamento.nome || 'Colaboradora selecionada'}</p>
              </div>
            </div>
            {formularioCorrecao.tipo === 'RETIFICACAO' ? (
              <div className="funcionario-form-grid funcionario-correcao-form">
                <label>Último dia trabalhado<input className="funcionarios-input" type="date" value={formularioCorrecao.dataEfetiva} onChange={(event) => setFormularioCorrecao((atual) => ({ ...atual, dataEfetiva: event.target.value }))} required /></label>
                <label>Data prevista do acerto<input className="funcionarios-input" type="date" value={formularioCorrecao.dataAcerto} onChange={(event) => setFormularioCorrecao((atual) => ({ ...atual, dataAcerto: event.target.value }))} required /></label>
                <label className="span-2">Motivo do desligamento<textarea className="funcionarios-input" value={formularioCorrecao.motivo} onChange={(event) => setFormularioCorrecao((atual) => ({ ...atual, motivo: event.target.value }))} required /></label>
                <label className="span-2">Observações<textarea className="funcionarios-input" value={formularioCorrecao.observacoes} onChange={(event) => setFormularioCorrecao((atual) => ({ ...atual, observacoes: event.target.value }))} /></label>
                <label className="span-2">Motivo da correção<textarea className="funcionarios-input" value={formularioCorrecao.motivoCorrecao} onChange={(event) => setFormularioCorrecao((atual) => ({ ...atual, motivoCorrecao: event.target.value }))} required /></label>
              </div>
            ) : (
              <>
                <div className="funcionario-desligamento-alerta" role="note">
                  <strong>Esta ação informa que o desligamento foi concluído por engano.</strong>
                  <span>Ela restaura o estado anterior comprovado ({STATUS_LABELS[desligamentoConcluidoEfetivoSelecionado.status_anterior] || desligamentoConcluidoEfetivoSelecionado.status_anterior}) e não representa readmissão.</span>
                </div>
                <div className="funcionario-form-grid funcionario-correcao-form">
                  <label className="span-2">Motivo obrigatório da reversão<textarea className="funcionarios-input" value={formularioCorrecao.motivoCorrecao} onChange={(event) => setFormularioCorrecao((atual) => ({ ...atual, motivoCorrecao: event.target.value }))} required /></label>
                </div>
              </>
            )}
            <div className="funcionario-modal-actions">
              <button className="funcionarios-btn funcionarios-btn-secondary" type="button" disabled={salvandoDesligamento} onClick={() => setFormularioCorrecao(FORMULARIO_CORRECAO_INICIAL)}>Voltar</button>
              <button className={`funcionarios-btn ${formularioCorrecao.tipo === 'REVERSAO_ERRO' ? 'funcionarios-btn-danger' : 'funcionarios-btn-primary'}`} type="submit" disabled={salvandoDesligamento || formularioCorrecao.motivoCorrecao.trim().length < 3}>{salvandoDesligamento ? 'Registrando...' : formularioCorrecao.tipo === 'RETIFICACAO' ? 'Registrar retificação' : 'Confirmar reversão por erro'}</button>
            </div>
          </form>
        </div>
      )}

      {modalAberto && (
        <div className="funcionario-modal-backdrop" role="presentation" onClick={fecharFormulario}>
          <form className="funcionario-modal" role="dialog" aria-modal="true" aria-labelledby="funcionario-modal-title" onSubmit={salvarFormulario} onClick={(event) => event.stopPropagation()}>
            <div className="funcionario-modal-header">
              <div>
                <span className="funcionarios-kicker">{funcionarioEditando ? 'Editar cadastro' : 'Novo cadastro'}</span>
                <h2 id="funcionario-modal-title">{funcionarioEditando ? 'Editar funcionário' : 'Novo funcionário'}</h2>
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
                    className="funcionarios-input"
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
                    className="funcionarios-input"
                    value={formulario.cargo}
                    onChange={(event) => atualizarCampo('cargo', event.target.value)}
                    onBlur={() => normalizarCampoCapitalizado('cargo')}
                    placeholder="Ex.: Atendente"
                  />
                </label>
                <label>
                  Telefone
                  <input
                    className="funcionarios-input"
                    value={formulario.telefone}
                    onChange={(event) => atualizarCampo('telefone', event.target.value)}
                    inputMode="tel"
                    placeholder="Contato operacional"
                  />
                </label>
                <label>
                  E-mail
                  <input
                    className="funcionarios-input"
                    value={formulario.email}
                    onChange={(event) => atualizarCampo('email', event.target.value)}
                    type="email"
                    placeholder="email@empresa.com"
                  />
                </label>
                <label>
                  CPF (opcional)
                  <input
                    className="funcionarios-input"
                    value={formulario.cpf}
                    onChange={(event) => atualizarCampo('cpf', event.target.value)}
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="Somente números"
                  />
                  <small className="funcionarios-help">Não aparece na listagem de funcionários.</small>
                </label>
              </div>
            </section>

            {funcionarioEditando?.id && vinculosPessoaSelecionada.length > 0 && (
              <section className="funcionario-modal-section">
                <div className="funcionario-modal-section-toggle funcionario-modal-section-static">
                  <span>
                    <strong>Histórico de vínculos</strong>
                    <small>{vinculosPessoaSelecionada.length} vínculo(s) desta pessoa</small>
                  </span>
                  <b>H</b>
                </div>
                <div className="funcionario-vinculos-lista">
                  {vinculosPessoaSelecionada.map((vinculo) => {
                    const desligamento = desligamentoEfetivoDoVinculo(vinculo.id)
                    return (
                      <article key={vinculo.id} className="funcionario-vinculo-row">
                        <div>
                          <strong>{vinculo.id === funcionarioEditando.id ? 'Vínculo selecionado' : 'Vínculo histórico'}</strong>
                          <small>Admissão: {formatarDataCurta(vinculo.data_admissao)} • {filiaisPorId[vinculo.filial_id] || 'Sem filial'}</small>
                        </div>
                        <div>
                          <span className={`funcionario-status ${vinculo.arquivado ? 'arquivado' : vinculo.status}`}>{vinculo.arquivado ? 'Arquivado' : STATUS_LABELS[vinculo.status] || vinculo.status}</span>
                          {desligamento && <small>Desligamento: {formatarDataCurta(desligamento.data_efetiva_efetiva)}</small>}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )}

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
                      className="funcionarios-input"
                      value={formulario.status}
                      onChange={(event) => atualizarCampo('status', event.target.value)}
                      disabled={funcionarioEditando?.status === 'desligado'}
                    >
                      <option value="ativo">Ativo</option>
                      <option value="afastado">Afastado</option>
                      {funcionarioEditando?.status === 'desligado' && (
                        <option value="desligado">Desligado (legado)</option>
                      )}
                    </select>
                    {funcionarioEditando?.status === 'desligado' && <small className="funcionarios-help">Este vínculo é histórico. Use a ação Readmitir para criar um novo vínculo sem alterar este cadastro.</small>}
                  </label>
                  <label>
                    Filial
                    <select
                      className="funcionarios-input"
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
                  <small>Aniversário e admissão do vínculo</small>
                </span>
                <b>{modalSecoesAbertas.datas ? '−' : '+'}</b>
              </button>
              {modalSecoesAbertas.datas && (
                <div className="funcionario-form-grid">
                  <label>
                    Data de nascimento
                    <input
                      className="funcionarios-input"
                      value={formulario.data_nascimento}
                      onChange={(event) => atualizarCampo('data_nascimento', event.target.value)}
                      type="date"
                    />
                    <small className="funcionarios-help">Usada apenas para contagem de aniversariantes.</small>
                  </label>
                  <label>
                    Data de admissão
                    <input
                      className="funcionarios-input"
                      value={formulario.data_admissao}
                      onChange={(event) => atualizarCampo('data_admissao', event.target.value)}
                      type="date"
                    />
                  </label>
                  {funcionarioEditando?.id && admissaoFoiAlterada(funcionarioEditando, formulario.data_admissao) && (
                    <div className="funcionarios-admissao-impacto span-2" role="status">
                      {!impactoAdmissao && (
                        <p>A alteração será validada pelo servidor antes de salvar.</p>
                      )}
                      {impactoAdmissao?.criara_primeiro_ciclo && (
                        <p>Este funcionário ainda não possui ciclos. O primeiro período aquisitivo será criado automaticamente.</p>
                      )}
                      {impactoAdmissao?.ciclos_preservados && (
                        <>
                          <p>
                            {impactoAdmissao.ciclos_existentes} ciclo(s) existente(s) serão preservados sem mudança de datas, saldos ou limites.
                          </p>
                          <label>
                            Motivo da alteração
                            <textarea
                              className="funcionarios-input"
                              value={motivoAdmissao}
                              onChange={(event) => setMotivoAdmissao(event.target.value)}
                              placeholder="Explique por que a data de admissão precisa ser alterada."
                              required
                            />
                          </label>
                        </>
                      )}
                    </div>
                  )}
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
                      className="funcionarios-input"
                      value={formulario.observacoes}
                      onChange={(event) => atualizarCampo('observacoes', event.target.value)}
                      placeholder="Ex.: informação administrativa interna. Não inserir dados médicos ou documentos."
                    />
                    <small className="funcionarios-help">
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
                  <strong>Exames ocupacionais</strong>
                  <small>Admissional, periódico e demissional, sem conteúdo clínico</small>
                </span>
                <b>{modalSecoesAbertas.exames ? '−' : '+'}</b>
              </button>

              {modalSecoesAbertas.exames && (
                <div className="funcionario-exames-section">
                  <div className="funcionario-exames-header">
                    <p>Registre somente tipo, estado e datas operacionais. Não registre laudos, resultados, documentos ou informações clínicas.</p>
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
                      Salve o funcionário antes de registrar exames ocupacionais.
                    </div>
                  ) : (
                    <>
                  {funcionarioEditando.status === 'desligado' && !podeRegistrarDemissional ? (
                    <div className="funcionario-exames-empty">
                      Este vínculo não possui um desligamento efetivo vigente. O histórico de exames permanece disponível, sem nova ação demissional.
                    </div>
                  ) : (
                  <div className="funcionario-exames-add funcionario-exames-add-ocupacional">
                    <label>
                      Tipo
                      {podeRegistrarDemissional ? (
                        <span className="funcionarios-input funcionario-exame-tipo-fixo">Demissional</span>
                      ) : (
                        <select
                          className="funcionarios-input"
                          value={formularioNovoExame.tipo}
                          onChange={(event) => setFormularioNovoExame((atual) => ({ ...atual, tipo: event.target.value }))}
                          disabled={salvandoExames}
                        >
                          <option value="ADMISSIONAL">Admissional</option>
                          <option value="PERIODICO">Periódico</option>
                        </select>
                      )}
                    </label>
                    <label>
                      Estado
                      <select
                        className="funcionarios-input"
                        value={formularioNovoExame.estado}
                        onChange={(event) => setFormularioNovoExame((atual) => ({
                          ...atual,
                          estado: event.target.value,
                          dataPrevista: '',
                          dataRealizada: ''
                        }))}
                        disabled={salvandoExames}
                      >
                        <option value="REALIZADO">Realizado</option>
                        <option value="PENDENTE">Pendente</option>
                      </select>
                    </label>
                    {formularioNovoExame.estado === 'PENDENTE' ? (
                      <label>
                        Data prevista
                        <input className="funcionarios-input" type="date" value={formularioNovoExame.dataPrevista} onChange={(event) => setFormularioNovoExame((atual) => ({ ...atual, dataPrevista: event.target.value }))} disabled={salvandoExames} />
                      </label>
                    ) : (
                      <label>
                        Data realizada
                        <input className="funcionarios-input" type="date" value={formularioNovoExame.dataRealizada} onChange={(event) => setFormularioNovoExame((atual) => ({ ...atual, dataRealizada: event.target.value }))} disabled={salvandoExames} />
                      </label>
                    )}
                    <button
                      className="funcionarios-btn funcionarios-btn-primary"
                      type="button"
                      disabled={
                        salvandoExames
                        || !formularioExameValido(formularioNovoExame)
                        || (podeRegistrarDemissional && formularioNovoExame.estado === 'PENDENTE' && demissionalPendenteAtivo)
                      }
                      onClick={adicionarExameOcupacional}
                    >
                      {podeRegistrarDemissional ? 'Registrar exame demissional' : 'Adicionar exame'}
                    </button>
                  </div>
                  )}

                  {podeRegistrarDemissional && demissionalPendenteAtivo && (
                    <div className="funcionario-exames-empty">
                      Já existe um exame demissional pendente ativo. Atualize o registro existente antes de criar outro pendente.
                    </div>
                  )}

                  <div className="funcionario-exames-empty">
                    A Agenda considera somente exames pendentes com data prevista registrada. Nenhuma periodicidade é calculada automaticamente.
                  </div>

                  {loadingExames ? (
                    <p className="funcionarios-note">Carregando exames ocupacionais...</p>
                  ) : erroExames ? (
                    <div className="funcionario-exames-empty">
                      <strong>Não foi possível carregar os exames.</strong>
                      <p>{erroExames}</p>
                      <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={() => carregarExamesOcupacionais()}>
                        Tentar novamente
                      </button>
                    </div>
                  ) : exames.length === 0 ? (
                    <div className="funcionario-exames-empty">
                      Nenhum exame ocupacional registrado para este funcionário.
                    </div>
                  ) : (
                    <div className="funcionario-exames-list">
                      {exames.map((exame) => (
                        <article key={exame.id} className="funcionario-exame-row">
                          <div className="funcionario-exame-main">
                            {exameEditandoId === exame.id ? (
                              <div className="funcionario-exame-edit">
                                <select className="funcionarios-input" value={formularioExameEditando.estado} onChange={(event) => setFormularioExameEditando((atual) => ({ ...atual, estado: event.target.value, dataPrevista: '', dataRealizada: '' }))} disabled={salvandoExames}>
                                  <option value="REALIZADO">Realizado</option>
                                  <option value="PENDENTE">Pendente</option>
                                  <option value="CANCELADO">Cancelado</option>
                                </select>
                                {formularioExameEditando.estado === 'PENDENTE' && (
                                  <input className="funcionarios-input" aria-label="Data prevista" value={formularioExameEditando.dataPrevista} onChange={(event) => setFormularioExameEditando((atual) => ({ ...atual, dataPrevista: event.target.value }))} type="date" disabled={salvandoExames} />
                                )}
                                {formularioExameEditando.estado === 'REALIZADO' && (
                                  <input className="funcionarios-input" aria-label="Data realizada" value={formularioExameEditando.dataRealizada} onChange={(event) => setFormularioExameEditando((atual) => ({ ...atual, dataRealizada: event.target.value }))} type="date" disabled={salvandoExames} />
                                )}
                                <button
                                  className="funcionarios-btn funcionarios-btn-primary"
                                  type="button"
                                  disabled={salvandoExames || !formularioExameValido(formularioExameEditando)}
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
                                <strong>{EXAME_TIPO_LABELS[exame.tipo] || 'Exame ocupacional'}</strong>
                                <small>
                                  {exame.estado === 'PENDENTE'
                                    ? `Previsto para ${formatarDataCurta(exame.data_prevista)}`
                                    : exame.estado === 'REALIZADO'
                                      ? `Realizado em ${formatarDataCurta(exame.data_realizada)}`
                                      : 'Registro cancelado'}
                                </small>
                                {exame.origem === 'LEGADO' && <small>Histórico preservado em modo somente leitura.</small>}
                              </>
                            )}
                            <span className={`funcionario-exame-status ${String(exame.estado || '').toLowerCase()} ${exame.arquivado ? 'arquivado' : ''}`}>
                              {exame.arquivado ? 'Arquivado' : EXAME_ESTADO_LABELS[exame.estado] || 'Não informado'}
                            </span>
                          </div>
                          <div className="funcionario-exame-actions">
                            {exameEditandoId !== exame.id && exame.origem !== 'LEGADO' && !exame.arquivado && (
                              <button
                                className="funcionarios-btn funcionarios-btn-secondary"
                                type="button"
                                disabled={salvandoExames || exame.arquivado}
                                onClick={() => iniciarEdicaoExame(exame)}
                              >
                                Editar
                              </button>
                            )}
                            {exame.origem !== 'LEGADO' && !exame.arquivado && (
                              <button className="funcionarios-btn funcionarios-btn-danger" type="button" disabled={salvandoExames} onClick={() => arquivarExame(exame)}>
                                Arquivar
                              </button>
                            )}
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
