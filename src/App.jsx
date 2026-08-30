import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import {
  adicionarUsuarioEmpresa as adicionarUsuarioEmpresaService,
  atualizarPerfilUsuarioEmpresa as atualizarPerfilUsuarioEmpresaService,
  enviarAcessoUsuarioEmpresa as enviarAcessoUsuarioEmpresaService,
  listarUsuariosEmpresa,
  normalizarPerfilUsuario,
  removerUsuarioEmpresa as removerUsuarioEmpresaService,
  usuarioEhMasterProtegido,
  atualizarNomeUsuarioLogado,
  listarFiliaisUsuariosEmpresa,
  atualizarFiliaisUsuarioEmpresa,
  senhaProvisoriaValida,
  TAMANHO_MINIMO_SENHA_PROVISORIA
} from './services/usuariosService'
import Topbar from './components/layout/Topbar.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import MobileMenu from './components/layout/MobileMenu.jsx'
import GlobalFab from './components/layout/GlobalFab.jsx'
import HeaderExpansivel from './components/ui/HeaderExpansivel.jsx'
import AppRouteGuards from './components/routes/AppRouteGuards.jsx'
import ContasContextualGuard from './components/feedback/ContasContextualGuard.jsx'
import AccessDeniedPage from './components/feedback/AccessDeniedPage.jsx'
import AppModalsLayer from './components/render/AppModalsLayer.jsx'
import AppOverlaysLayer from './components/render/AppOverlaysLayer.jsx'
import AppShell from './components/shell/AppShell.jsx'
import { useApp } from './context/AppContext.jsx'
import { useContas } from './hooks/useContas'
import { useNotas } from './hooks/useNotas'
import { useAuthSession } from './hooks/useAuthSession'
import { useUiState } from './hooks/useUiState'
import { useAppNavigation } from './hooks/useAppNavigation'
import { useEmpresaContext } from './hooks/useEmpresaContext'
import { useDestinatariosAlertas } from './hooks/useDestinatariosAlertas'
import { converterValor, formatarData, formatarDataParaBanco, formatarValor, limitarDataInput, primeiraLetraMaiuscula } from './utils/format'
import { diferencaDias } from './utils/dates'
import { formatarTipoRecorrencia, obterTipoRecorrenciaConta } from './utils/recorrencia'
import { estaVencida, pegarMes } from './utils/contasStatus'
import { atualizarAposMutacaoContas, calcularResumoFinanceiroContas, carregarFonteContextualContas, consumidorRequerHistoricoCompleto, criarAlvoContaParaNavegacao, filtrarContasPorHorizonte, formatarDataBancoLocal, obterPeriodoConsultaPagas, selecionarFonteContas } from './utils/contasConsultasOperacionais.js'
import { atualizarListaLixeiraEstavel, diasNaLixeira, obterEstadoRetencaoLixeira, podeExcluirDefinitivo } from './utils/lixeira'
import { erroEhSessaoExpirada, mensagemSeguraErro, telaRetornoSessaoSegura } from './utils/session'
import { resolverEstadoEntradaContas, sincronizarContextoContas } from './utils/navigation.js'
import {
  resolverAcoesFlutuantesAppShell,
  resolverLayoutAppShell,
} from './utils/appShellLayout.js'
import {
  avaliarAcessoTela,
  construirPermissoesAcessoTelas,
  filtrarMenuPorAcesso
} from './utils/routeAccess.js'
import { buscarNomePerfilUsuario, buscarVinculoEmpresaDoUsuario, sincronizarUsuarioLogadoComEmpresa, TENANT_ERRORS } from './services/tenantService'
import { buscarPermissoesUsuario, criarPermissoesUsuario, listarEmpresasDisponiveisParaUsuario, podeEditarBilling } from './services/permissoesService'
import { listarFiliaisPorEmpresa } from './services/filiaisService'
import { excluirContaPermanentemente, verificarUsoCentroCusto } from './services/contasService'
import {
  gerarOcorrenciaRecorrencia as gerarOcorrenciaRecorrenciaService,
  vincularContaManualRecorrencia as vincularContaManualRecorrenciaService
} from './services/recorrenciaCoberturaService.js'
import { registrarEventoAuditoriaSeguro } from './services/auditoriaService'
import {
  montarPayloadAuditoriaGeracaoControlada,
  montarPayloadAuditoriaVinculoManual
} from './utils/recorrenciaAcoesControladas.js'
import { clearChunkReloadAttempt } from './utils/chunkRecovery.js'
import './styles/tokens.css'
import './styles/base.css'
import './components/shared/PagePatterns.css'
import './styles.css'
import styles from './styles/appStyles.js'
import menuSections, { MODULOS_TOPBAR, resolverContextoModulo } from './config/menuSections.js'
import {
  limparSessaoSegura
} from './services/sessionSecurityService.js'
import {
  LazyAgendaPage,
  LazyBillingPage,
  LazyConfiguracoesPage,
  LazyContasPage,
  LazyControleImpostosPage,
  LazyAnaliseFinanceiraPage,
  LazyDashboardRouteComposition,
  LazyFechamentoFolhaPage,
  LazyFiliaisPage,
  LazyFluxoCaixaPage,
  LazyFeriasPage,
  LazyFuncionariosPage,
  LazyImportarPage,
  LazyLixeiraPage,
  LazyMasterPanelPage,
  LazyNotasPage,
  LazyOnboardingPage,
  LazyReceitasPage,
  LazyRecorrenciasFinanceirasPage,
  LazyRelatoriosGestaoPessoasPage,
  LazyRelatoriosFeriasPage,
  LazyRelatoriosPessoasPage,
  LazyUsuariosPage,
  LazyAuditoriaPage,
  getLazyRouteName,
  preloadRoute,
} from './routes/lazyRoutes.js'

const DESTINATARIO_ALERTA_FORM_INICIAL = {
  nome: '',
  email: '',
  recebe_contas: true,
  recebe_notas: true,
  recebe_resumo: true,
  observacao: '',
  ativo: true
}

const SESSION_RETURN_SCREEN_KEY = 'dna_gestao_session_return_screen'

function normalizarValorBuscaContas(busca) {
  const texto = String(busca || '')
    .toLowerCase()
    .replace(/r\$/g, '')
    .replace(/\s/g, '')
    .replace(/[^\d,.-]/g, '')

  if (!/\d/.test(texto)) return null

  const ultimaVirgula = texto.lastIndexOf(',')
  const ultimoPonto = texto.lastIndexOf('.')
  let normalizado = texto

  if (ultimaVirgula >= 0 && ultimoPonto >= 0) {
    normalizado = ultimaVirgula > ultimoPonto
      ? texto.replace(/\./g, '').replace(',', '.')
      : texto.replace(/,/g, '')
  } else if (ultimaVirgula >= 0) {
    normalizado = texto.replace(/\./g, '').replace(',', '.')
  } else if (ultimoPonto >= 0) {
    const casasDecimais = texto.length - ultimoPonto - 1
    normalizado = casasDecimais === 2
      ? texto.replace(/,/g, '')
      : texto.replace(/\./g, '')
  }

  const valor = Number(normalizado)
  return Number.isFinite(valor) && valor > 0 ? Math.round(valor * 100) : null
}

function normalizarDigitosValorBuscaContas(busca) {
  const texto = String(busca || '')
    .toLowerCase()
    .replace(/r\$/g, '')

  if (!/\d/.test(texto)) return ''
  return texto.replace(/\D/g, '')
}

function valorParaDigitosBusca(valor) {
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero <= 0) return ''
  return String(Math.round(numero * 100))
}

function valorContaCorrespondeBusca(conta, valorBuscaCentavos, digitosBuscaValor) {
  if (valorBuscaCentavos === null && !digitosBuscaValor) return false

  return [
    conta.valor,
    conta.valor_pago,
    conta.juros_multa,
    conta.desconto
  ].some((valor) => {
    const numero = Number(valor)
    if (!Number.isFinite(numero) || numero <= 0) return false

    const centavos = Math.round(numero * 100)
    if (valorBuscaCentavos !== null && centavos === valorBuscaCentavos) return true

    const digitosValor = valorParaDigitosBusca(numero)
    return digitosBuscaValor.length >= 2 && digitosValor.includes(digitosBuscaValor)
  })
}

export default function App() {
  const sincronizacaoTenantRef = useRef(null)
  const sessaoEncerradaRef = useRef(true)
  const telaAtualRef = useRef('dashboard')
  const logoutExplicitoRef = useRef(false)
  const sincronizacaoContextoContasSuspensaRef = useRef(false)
  const { globalLoading, toast: globalToast, showToast, hideToast, empresaAtiva, setEmpresaAtiva, limparEmpresaAtiva, empresasDisponiveis, setEmpresasDisponiveis } = useApp()
  // =========================
  // BLOCO 0 — UTILITÁRIOS
  // =========================
  // Utilitários compartilhados foram movidos para src/utils.

  // =========================
  // BLOCO 1 — STATES CONTAS
  // =========================
  const {
    contasOperacionais,
    setContasOperacionais,
    contasContextuais,
    loadingContasContextuais,
    contasContextuaisCarregadas,
    erroContasContextuais,
    contasPagas,
    contasOcultas,
    contasExcluidas,
    resultadosBuscaContas,
    loadingConsultaContas,
    haMaisContasConsulta,
    contasLixeira,
    setContasLixeira,
    seriesRecorrentes,
    busca,
    setBusca,
    filtroStatus,
    setFiltroStatus,
    filtroHorizonte,
    setFiltroHorizonte,
    periodoPagas,
    setPeriodoPagas,
    anoPagas,
    setAnoPagas,
    dataInicialPagas,
    setDataInicialPagas,
    dataFinalPagas,
    setDataFinalPagas,
    filtroCentro,
    setFiltroCentro,
    filtroFilial,
    setFiltroFilial,
    filtroMes,
    setFiltroMes,
    dataInicial,
    setDataInicial,
    dataFinal,
    setDataFinal,
    loading,
    setLoading,
    salvandoConta,
    modalConta,
    setModalConta,
    editandoContaId,
    setEditandoContaId,
    descricao,
    setDescricao,
    valor,
    setValor,
    dataVencimento,
    setDataVencimento,
    centroCustoId,
    setCentroCustoId,
    filialId,
    setFilialId,
    observacaoConta,
    setObservacaoConta,
    impostoTipoConta,
    setImpostoTipoConta,
    competenciaConta,
    setCompetenciaConta,
    contaWhatsapp,
    setContaWhatsapp,
    contaEmail,
    setContaEmail,
    contaPush,
    setContaPush,
    contaDiasAviso,
    setContaDiasAviso,
    contaRecorrente,
    setContaRecorrente,
    contaParcelada,
    setContaParcelada,
    parcelamentoTotal,
    setParcelamentoTotal,
    parcelamentoQuantidade,
    setParcelamentoQuantidade,
    parcelamentoPrimeiroVencimento,
    setParcelamentoPrimeiroVencimento,
    tipoRecorrencia,
    setTipoRecorrencia,
    diaVencimentoRecorrencia,
    setDiaVencimentoRecorrencia,
    valorVariavelRecorrencia,
    setValorVariavelRecorrencia,
    recorrenciaContaId,
    setRecorrenciaContaId,
    escopoEdicaoRecorrencia,
    recorrenciaEdicaoCarregada,
    parcelamentoGrupoConta,
    parcelamentoGrupoParcelas,
    carregandoParcelamentoGrupo,
    erroParcelamentoGrupo,
    alterarEscopoEdicaoRecorrencia,
    buscarContas: buscarContasHook,
    executarConsultaSecundaria: executarConsultaSecundariaHook,
    carregarContasContextuais: carregarContasContextuaisHook,
    limparContasContextuais,
    limparConsultasSecundarias,
    abrirNovaConta: abrirNovaContaHook,
    abrirEdicaoConta: abrirEdicaoContaHook,
    fecharConta: fecharContaHook,
    salvarConta: salvarContaHook,
    marcarComoPago: marcarComoPagoHook,
    corrigirPagamento: corrigirPagamentoHook,
    registrarPagamentoParcial: registrarPagamentoParcialHook,
    listarPagamentosParciaisConta: listarPagamentosParciaisContaHook,
    estornarPagamentoParcial: estornarPagamentoParcialHook,
    baixarContaQuitadaPorParciais: baixarContaQuitadaPorParciaisHook,
    voltarParaPendente: voltarParaPendenteHook,
    excluirConta: excluirContaHook,
    ocultarConta: ocultarContaHook,
    reexibirConta: reexibirContaHook,
    cancelarGrupoParcelamento: cancelarGrupoParcelamentoHook,
    desativarSerieRecorrente: desativarSerieRecorrenteHook,
    reativarSerieRecorrente: reativarSerieRecorrenteHook
  } = useContas()

  // =========================
  // BLOCO 2 — HOOK NOTAS
  // =========================
  const {
    notas,
    setNotas,
    notasLixeira,
    setNotasLixeira,
    buscaNota,
    setBuscaNota,
    modalNota,
    setModalNota,
    editandoNotaId,
    setEditandoNotaId,
    tituloNota,
    setTituloNota,
    conteudoNota,
    setConteudoNota,
    prioridadeNota,
    setPrioridadeNota,
    dataEventoNota,
    setDataEventoNota,
    filialNotaId,
    setFilialNotaId,
    buscarNotas: buscarNotasHook,
    buscarNotasLixeira: buscarNotasLixeiraHook,
    abrirNovaNota: abrirNovaNotaHook,
    abrirEdicaoNota: abrirEdicaoNotaHook,
    fecharNota: fecharNotaHook,
    salvarNota: salvarNotaHook,
    excluirNota: excluirNotaHook,
    alternarNotaConcluida: alternarNotaConcluidaHook,
    restaurarNota: restaurarNotaHook,
    excluirNotaDefinitivo: excluirNotaDefinitivoHook
  } = useNotas()

  // =========================
  // BLOCO 3 — STATES CENTROS
  // =========================
  const [centros, setCentros] = useState([])
  const [filiais, setFiliais] = useState([])
  const [modalCentro, setModalCentro] = useState(false)
  const [novoCentro, setNovoCentro] = useState('')

  // =========================
  // BLOCO 4 — NAVEGAÇÃO
  // =========================
  const {
    menuAberto,
    setMenuAberto,
    menuNavegacaoAberto,
    setMenuNavegacaoAberto,
    sidebarCompacta,
    setSidebarCompacta,
    gruposMenu,
    setGruposMenu,
    telaAtual,
    contextoNavegacao,
    origemNavegacao,
    revisaoNavegacao,
    telaInformadaNaUrl,
    atualizarContextoAtual,
    consumirDestaqueContexto,
    menuNavegacaoTriggerRef,
    navegarPara
  } = useAppNavigation()
  const {
    empresaId,
    setEmpresaId,
    trocandoEmpresa,
    setTrocandoEmpresa,
    perfilUsuario,
    setPerfilUsuario,
    permissoesUsuario,
    setPermissoesUsuario,
    erroEmpresa,
    setErroEmpresa
  } = useEmpresaContext()
  const [nomeUsuarioPerfil, setNomeUsuarioPerfil] = useState('')
  const vinculoManualRecorrenciaEmAndamentoRef = useRef(new Set())
  const geracaoControladaRecorrenciaEmAndamentoRef = useRef(new Set())
  const [empresaCarregando, setEmpresaCarregando] = useState(false)
  const [empresaSessaoInicializada, setEmpresaSessaoInicializada] = useState(false)
  const {
    modalPerfilUsuario,
    setModalPerfilUsuario,
    nomePerfilEditando,
    setNomePerfilEditando,
    salvandoPerfilUsuario,
    setSalvandoPerfilUsuario,
    mostrarFiltros,
    setMostrarFiltros,
    mostrarContas,
    setMostrarContas,
    mostrarConfigNegocio,
    setMostrarConfigNegocio,
    mostrarConfigNotificacoes,
    setMostrarConfigNotificacoes,
    mostrarConfigCentros,
    setMostrarConfigCentros,
    mostrarConfigRecorrencias,
    setMostrarConfigRecorrencias,
    confirmacao,
    setConfirmacao,
    arquivoImportacao,
    setArquivoImportacao,
    linhasImportacao,
    setLinhasImportacao,
    statusImportacao,
    setStatusImportacao
  } = useUiState()
  const [usuariosEmpresa, setUsuariosEmpresa] = useState([])
  const [usuariosCarregando, setUsuariosCarregando] = useState(false)
  const [usuariosInicializados, setUsuariosInicializados] = useState(false)
  const [usuariosErro, setUsuariosErro] = useState('')
  const [criandoUsuarioManual, setCriandoUsuarioManual] = useState(false)
  const [filiaisUsuariosEmpresa, setFiliaisUsuariosEmpresa] = useState({})
  const [salvandoFilialUsuario, setSalvandoFilialUsuario] = useState('')
  const [emailConviteUsuario, setEmailConviteUsuario] = useState('')
  const [nomeConviteUsuario, setNomeConviteUsuario] = useState('')
  const [perfilConviteUsuario, setPerfilConviteUsuario] = useState('operador')
  const [senhaConviteUsuario, setSenhaConviteUsuario] = useState('')
  const [novoEmailUsuario, setNovoEmailUsuario] = useState('')
  const [novaSenhaUsuario, setNovaSenhaUsuario] = useState('')
  const [confirmarNovaSenhaUsuario, setConfirmarNovaSenhaUsuario] = useState('')
  const [configuracoes, setConfiguracoes] = useState(null)
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true)
  const [configWhatsapp, setConfigWhatsapp] = useState(true)
  const [configEmail, setConfigEmail] = useState(true)
  const [configPush, setConfigPush] = useState(false)
  const [diasAvisoPadrao, setDiasAvisoPadrao] = useState('1')
  const [diasAlertaContas, setDiasAlertaContas] = useState('1')
  const [alertarContasVencidas, setAlertarContasVencidas] = useState(true)
  const [destacarContasCriticas, setDestacarContasCriticas] = useState(true)
  const [diasAlertaNotas, setDiasAlertaNotas] = useState('3')
  const [destacarNotasUrgentes, setDestacarNotasUrgentes] = useState(true)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [whatsappPadrao, setWhatsappPadrao] = useState('')
  const [emailPadrao, setEmailPadrao] = useState('')
  const [mostrarConfigDestinatarios, setMostrarConfigDestinatarios] = useState(true)
  const [mostrarDestinatariosInativos, setMostrarDestinatariosInativos] = useState(false)
  const [destinatarioEditandoId, setDestinatarioEditandoId] = useState('')
  const [formDestinatarioAlerta, setFormDestinatarioAlerta] = useState(DESTINATARIO_ALERTA_FORM_INICIAL)
  const [agendaFocusTarget, setAgendaFocusTarget] = useState(null)
  const [contaFocusTarget, setContaFocusTarget] = useState(null)
  const [telaRetornoContas, setTelaRetornoContas] = useState('')
  function mostrarAviso(mensagem, tipo = 'info') {
    showToast(mensagem, tipo)
  }

  function avisarErro(erro, fallback = 'Não foi possível concluir a operação.') {
    if (erroEhSessaoExpirada(erro)) {
      encerrarSessao('Sua sessão expirou. Faça login novamente.')
      return
    }

    console.warn('Erro técnico capturado:', erro)
    mostrarAviso(mensagemSeguraErro(erro, fallback), 'erro')
  }

  const navegarParaOrigemAgenda = useCallback((tipo, id) => {
    if (!tipo || !id) return
    if (tipo === 'conta') {
      setContaFocusTarget(criarAlvoContaParaNavegacao(id, 'agenda'))
      navegarPara('contas', {
        origem: telaAtual,
        contexto: {
          contaId: id,
          contaOrigem: 'agenda',
          telaRetorno: telaAtual,
        },
      })
      return
    }
    setAgendaFocusTarget({ tipo, id, nonce: Date.now() })
    navegarPara('notas', { origem: telaAtual })
  }, [navegarPara, telaAtual])

  const navegarParaContaControleImpostos = useCallback((conta) => {
    const alvo = criarAlvoContaParaNavegacao(conta, 'controle-impostos')
    if (!alvo) return
    const statusFinanceiro = String(conta?.status_relatorio || conta?.status || '')
    const filtroDestino = conta?.oculto === true
      ? 'ocultas'
      : (conta?.excluido === true
          ? 'excluidas'
          : (['pago', 'paga', 'quitada_por_parciais'].includes(statusFinanceiro) ? 'pagas' : 'todas'))
    setBusca('')
    setFiltroStatus(filtroDestino)
    setFiltroHorizonte('todos')
    setFiltroCentro('')
    setFiltroFilial('')
    setFiltroMes('')
    setDataInicial('')
    setDataFinal('')
    setTelaRetornoContas('controle-impostos')
    setContaFocusTarget(alvo)
    navegarPara('contas', {
      origem: 'controle-impostos',
      contexto: {
        filtroStatus: filtroDestino,
        filtroHorizonte: 'todos',
        dataInicial: '',
        dataFinal: '',
        filial: '',
        centroCusto: '',
        conta: alvo,
        contaId: alvo.id,
        contaOrigem: 'controle-impostos',
        telaRetorno: 'controle-impostos',
      },
    })
  }, [
    navegarPara,
    setBusca,
    setDataFinal,
    setDataInicial,
    setFiltroCentro,
    setFiltroFilial,
    setFiltroHorizonte,
    setFiltroMes,
    setFiltroStatus,
  ])

  useEffect(() => {
    if (telaAtual !== 'contas') {
      sincronizacaoContextoContasSuspensaRef.current = false
      return undefined
    }

    sincronizacaoContextoContasSuspensaRef.current = true

    if (Object.prototype.hasOwnProperty.call(contextoNavegacao || {}, 'filtroStatus')) {
      setFiltroStatus(contextoNavegacao.filtroStatus)
    }
    if (Object.prototype.hasOwnProperty.call(contextoNavegacao || {}, 'filtroHorizonte')) {
      setFiltroHorizonte(contextoNavegacao.filtroHorizonte)
    }
    if (Object.prototype.hasOwnProperty.call(contextoNavegacao || {}, 'dataInicial')) {
      setDataInicial(contextoNavegacao.dataInicial)
    }
    if (Object.prototype.hasOwnProperty.call(contextoNavegacao || {}, 'dataFinal')) {
      setDataFinal(contextoNavegacao.dataFinal)
    }
    if (Object.prototype.hasOwnProperty.call(contextoNavegacao || {}, 'filial')) {
      setFiltroFilial(contextoNavegacao.filial)
    }
    if (Object.prototype.hasOwnProperty.call(contextoNavegacao || {}, 'centroCusto')) {
      setFiltroCentro(contextoNavegacao.centroCusto)
    }

    const estadoEntrada = resolverEstadoEntradaContas(contextoNavegacao, origemNavegacao)
    const alvoConta = estadoEntrada.alvoConta
    if (alvoConta) {
      setContaFocusTarget(criarAlvoContaParaNavegacao(
        alvoConta,
        estadoEntrada.origemAlvo
      ))
    } else {
      setContaFocusTarget(null)
    }
    setTelaRetornoContas(estadoEntrada.telaRetorno)

    const liberarSincronizacao = window.requestAnimationFrame(() => {
      sincronizacaoContextoContasSuspensaRef.current = false
    })
    return () => window.cancelAnimationFrame(liberarSincronizacao)
  }, [
    revisaoNavegacao,
    setDataFinal,
    setDataInicial,
    setFiltroCentro,
    setFiltroFilial,
    setFiltroHorizonte,
    setFiltroStatus,
    telaAtual,
  ])

  useEffect(() => {
    if (telaAtual !== 'contas' || sincronizacaoContextoContasSuspensaRef.current) return

    atualizarContextoAtual((contextoAtual) => sincronizarContextoContas(contextoAtual, {
      filtroStatus,
      filtroHorizonte,
      dataInicial,
      dataFinal,
      filial: filtroFilial,
      centroCusto: filtroCentro,
      telaRetorno: telaRetornoContas,
    }))
  }, [
    atualizarContextoAtual,
    dataFinal,
    dataInicial,
    filtroCentro,
    filtroFilial,
    filtroHorizonte,
    filtroStatus,
    telaAtual,
    telaRetornoContas,
  ])

  function limparDadosTenant() {
    setContasOperacionais([])
    limparContasContextuais()
    limparConsultasSecundarias()
    setNotas([])
    setCentros([])
    setFiliais([])
    setContasLixeira([])
    setNotasLixeira([])
    setUsuariosEmpresa([])
    setUsuariosErro('')
    setUsuariosInicializados(false)
    setConfiguracoes(null)
    setModalConta(false)
    setModalNota(false)
    setModalCentro(false)
    setMenuAberto(false)
    setMenuNavegacaoAberto(false)
    setBusca('')
    setBuscaNota('')
    setFiltroStatus('pendentes')
    setFiltroCentro('')
    setFiltroFilial('')
    setFiltroMes('')
    setDataInicial('')
    setDataFinal('')
    setTelaRetornoContas('')
    setArquivoImportacao(null)
    setLinhasImportacao([])
    setStatusImportacao('')
  }

  function limparLixeiraLocal() {
    setContasLixeira([])
    setNotasLixeira([])
  }

  function limparEstadoAutenticacao() {
    sessaoEncerradaRef.current = true
    limparDadosTenant()
    setEmpresasDisponiveis([])
    setEmpresaId(null)
    limparEmpresaAtiva()
    setPerfilUsuario('')
    setFiliaisUsuariosEmpresa({})
    setNomeUsuarioPerfil('')
    setErroEmpresa('')
    setEmpresaCarregando(false)
    setEmpresaSessaoInicializada(false)
    setLoading(false)
    limparSessaoSegura()
    setConfirmacao({
      aberto: false,
      titulo: '',
      mensagem: '',
      textoConfirmar: 'Confirmar',
      tipo: 'padrao',
      acao: null
    })
  }

  const limparEstadoAutenticacaoCallback = useCallback(() => {
    limparEstadoAutenticacao()
  }, [])

  const navegarParaLoginCallback = useCallback(() => {
    if (logoutExplicitoRef.current) {
      try {
        window.sessionStorage.removeItem(SESSION_RETURN_SCREEN_KEY)
      } catch (error) {
        console.warn('Nao foi possivel limpar a tela de retorno no logout:', error?.message || error)
      }
      return
    }
    try {
      window.sessionStorage.setItem(SESSION_RETURN_SCREEN_KEY, telaRetornoSessaoSegura(telaAtualRef.current))
    } catch (error) {
      console.warn('Nao foi possivel salvar tela de retorno da sessao:', error?.message || error)
    }
  }, [])

  const mostrarAvisoCallback = useCallback((mensagem, tipo = 'info') => {
    mostrarAviso(mensagem, tipo)
  }, [showToast])

  const avisarSessaoQuaseExpirada = useCallback((continuarSessao) => {
    abrirConfirmacao({
      titulo: 'Sessão quase expirada',
      mensagem: 'Sua sessão vai expirar por segurança. Deseja continuar conectado?',
      textoConfirmar: 'Continuar conectado',
      tipo: 'padrao',
      acao: async () => continuarSessao()
    })
  }, [])

  const {
    usuarioLogado,
    setUsuarioLogado,
    carregandoAuth,
    setCarregandoAuth,
    encerrarSessao
  } = useAuthSession({
    onClearAuthData: limparEstadoAutenticacaoCallback,
    onNavigateHome: navegarParaLoginCallback,
    onShowMessage: mostrarAvisoCallback,
    onSessionWarning: avisarSessaoQuaseExpirada
  })


  useEffect(() => {
    telaAtualRef.current = telaAtual
  }, [telaAtual])

  useEffect(() => {
    sessaoEncerradaRef.current = !usuarioLogado?.id

    if (!usuarioLogado?.id) return

    clearChunkReloadAttempt()

    let telaRetorno = ''
    try {
      telaRetorno = window.sessionStorage.getItem(SESSION_RETURN_SCREEN_KEY) || ''
      window.sessionStorage.removeItem(SESSION_RETURN_SCREEN_KEY)
    } catch (error) {
      console.warn('Nao foi possivel recuperar tela de retorno da sessao:', error?.message || error)
    }

    const proximaTela = telaRetornoSessaoSegura(telaRetorno)
    if (telaRetorno && !telaInformadaNaUrl && telaAtualRef.current !== proximaTela) {
      navegarPara(proximaTela, { origem: telaAtualRef.current, replace: true })
    }
  }, [navegarPara, telaInformadaNaUrl, usuarioLogado?.id])

  async function podeContinuarOperacaoTenant(empresaAtual = empresaId) {
    if (!empresaAtual || sessaoEncerradaRef.current) return false

    try {
      const { data } = await supabase.auth.getSession()
      return Boolean(data?.session?.user?.id && !sessaoEncerradaRef.current)
    } catch (error) {
      console.warn('Não foi possível validar a sessão ativa:', error?.message || error)
      return false
    }
  }

  async function sincronizarNomeUsuarioPerfil() {
    if (!usuarioLogado?.id) return

    try {
      const nomePerfil = await buscarNomePerfilUsuario(usuarioLogado.id)
      const nomeResolvido = nomePerfil || usuarioLogado?.user_metadata?.name || usuarioLogado?.user_metadata?.full_name || ''
      if (nomeResolvido && nomeResolvido !== nomeUsuarioPerfil) {
        setNomeUsuarioPerfil(nomeResolvido)
      }
    } catch (error) {
      console.warn('Falha ao sincronizar nome do perfil:', error?.message || error)
    }
  }

  useEffect(() => {
    if (!usuarioLogado) {
      setEmpresaCarregando(false)
      setLoading(false)
      return
    }

    carregarEmpresaDoUsuario(usuarioLogado)
  }, [usuarioLogado?.id])


  useEffect(() => {
    if (!usuarioLogado?.id || !empresaId) return

    let cancelado = false

    async function sincronizarTenantAtual() {
      if (cancelado) return

      try {
        const permitirCarregarLixeira = podeGerenciarLixeira()
        const tarefas = [
          buscarContas(empresaId, { silencioso: true, permitirGerarRecorrencias: false }),
          buscarCentros(empresaId),
          buscarFiliais(empresaId)
        ]

        if (permitirCarregarLixeira) {
          tarefas.push(buscarLixeira(empresaId, { permitirCarregarLixeira: true }))
        } else {
          limparLixeiraLocal()
        }

        await Promise.allSettled(tarefas)
      } catch (error) {
        console.warn('Falha ao sincronizar dados do tenant:', error?.message || error)
      }
    }

    function agendarSincronizacaoTenant() {
      window.clearTimeout(sincronizacaoTenantRef.current)
      sincronizacaoTenantRef.current = window.setTimeout(sincronizarTenantAtual, 350)
    }

    function sincronizarAoVoltarParaAba() {
      if (document.visibilityState === 'visible') agendarSincronizacaoTenant()
    }

    window.addEventListener('focus', agendarSincronizacaoTenant)
    document.addEventListener('visibilitychange', sincronizarAoVoltarParaAba)

    const canal = supabase
      .channel(`tenant-sync-${empresaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'df_centros_custo', filter: `empresa_id=eq.${empresaId}` }, agendarSincronizacaoTenant)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'df_filiais', filter: `empresa_id=eq.${empresaId}` }, agendarSincronizacaoTenant)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'df_contas', filter: `empresa_id=eq.${empresaId}` }, agendarSincronizacaoTenant)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'df_contas_recorrentes', filter: `empresa_id=eq.${empresaId}` }, agendarSincronizacaoTenant)
      .subscribe()

    return () => {
      cancelado = true
      window.clearTimeout(sincronizacaoTenantRef.current)
      window.removeEventListener('focus', agendarSincronizacaoTenant)
      document.removeEventListener('visibilitychange', sincronizarAoVoltarParaAba)
      supabase.removeChannel(canal)
    }
  }, [usuarioLogado?.id, empresaId])

  useEffect(() => {
    if (!menuNavegacaoAberto || !usuarioLogado?.id) return
    sincronizarNomeUsuarioPerfil()
  }, [menuNavegacaoAberto, usuarioLogado?.id])


  useEffect(() => {
    function fecharComEsc(event) {
      if (event.key !== 'Escape') return

      if (confirmacao.aberto) {
        fecharConfirmacao()
        return
      }

      if (modalConta) fecharConta()
      if (modalNota) fecharNota()
      if (modalCentro) setModalCentro(false)
      if (menuAberto) setMenuAberto(false)
      if (menuNavegacaoAberto) setMenuNavegacaoAberto(false)
    }

    window.addEventListener('keydown', fecharComEsc)
    return () => window.removeEventListener('keydown', fecharComEsc)
  }, [confirmacao.aberto, modalConta, modalNota, modalCentro, menuAberto, menuNavegacaoAberto])
  async function carregarEmpresaDoUsuario(usuarioAtual = usuarioLogado) {
    const userId = usuarioAtual?.id

    if (!userId) {
      setEmpresaCarregando(false)
      setEmpresaSessaoInicializada(false)
      setLoading(false)
      return
    }

    setEmpresaCarregando(true)
    setEmpresaSessaoInicializada(false)
    setLoading(true)
    setErroEmpresa('')

    try {
      await sincronizarUsuarioLogadoComEmpresa()
      const vinculo = await buscarVinculoEmpresaDoUsuario(userId)
      const nomePerfil = await buscarNomePerfilUsuario(userId)

      const permissoesBase = await buscarPermissoesUsuario({
        userId,
        email: usuarioAtual?.email,
        perfilEmpresa: vinculo?.perfil || 'operador'
      })

      const empresasSessao = await listarEmpresasDisponiveisParaUsuario({
        userId,
        email: usuarioAtual?.email,
        isMaster: permissoesBase.isMaster
      })

      if (!vinculo?.empresaId && !permissoesBase.isMaster) {
        setEmpresaId(null)
        limparEmpresaAtiva()
        setPerfilUsuario('')
        setPermissoesUsuario(criarPermissoesUsuario())
        setNomeUsuarioPerfil('')
        setErroEmpresa(TENANT_ERRORS.semEmpresa)
        return
      }

      if (permissoesBase.isMaster && empresasSessao.length === 0) {
        setEmpresaId(null)
        limparEmpresaAtiva()
        setPerfilUsuario('master')
        setPermissoesUsuario({ ...permissoesBase, canSwitchCompany: true })
        setNomeUsuarioPerfil(nomePerfil || usuarioAtual?.user_metadata?.name || usuarioAtual?.user_metadata?.full_name || '')
        setErroEmpresa('Nenhuma empresa cadastrada em df_empresas para o usuário master.')
        return
      }

      const empresaSalvaValida = empresasSessao.find((empresa) => empresa.id === empresaAtiva?.id)
      const empresaSelecionada = empresaSalvaValida || empresasSessao.find((empresa) => empresa.id === vinculo?.empresaId) || empresasSessao[0] || {
        id: vinculo?.empresaId,
        nome: vinculo?.nomeEmpresa || 'Rede Dona Flor',
        perfil: vinculo?.perfil || 'operador'
      }

      const perfilSelecionado = empresaSelecionada.perfil || vinculo?.perfil || (permissoesBase.isMaster ? 'master' : 'operador')
      const permissoes = permissoesBase.isMaster
        ? { ...permissoesBase, perfilEmpresa: normalizarPerfil(perfilSelecionado), canSwitchCompany: true }
        : await buscarPermissoesUsuario({
            userId,
            email: usuarioAtual?.email,
            perfilEmpresa: perfilSelecionado
          })

      setEmpresasDisponiveis(empresasSessao.length > 0 ? empresasSessao : [empresaSelecionada])
      setEmpresaId(empresaSelecionada.id)
      setEmpresaAtiva({
        id: empresaSelecionada.id,
        nome: empresaSelecionada.nome || vinculo?.nomeEmpresa || 'Rede Dona Flor',
        perfil: perfilSelecionado
      })
      setPerfilUsuario(perfilSelecionado)
      setPermissoesUsuario(permissoes)
      setNomeUsuarioPerfil(nomePerfil || usuarioAtual?.user_metadata?.name || usuarioAtual?.user_metadata?.full_name || '')
      const permissoesCarregamento = construirPermissoesAcessoTelas(permissoes, {
        perfil: normalizarPerfil(perfilSelecionado)
      })
      await carregarTudo(empresaSelecionada.id, {
        permissoesAcessoTelas: permissoesCarregamento
      })
      setEmpresaSessaoInicializada(true)
    } catch (error) {
      if (erroEhSessaoExpirada(error)) {
        await supabase.auth.signOut()
        limparEstadoAutenticacao()
        setUsuarioLogado(null)
        mostrarAviso('Sua sessão expirou. Faça login novamente.', 'erro')
      } else {
        console.warn('Falha ao carregar empresa do usuário:', error)
        const mensagemEmpresa = mensagemSeguraErro(error, 'Não foi possível carregar sua empresa. Tente novamente.')
        setEmpresaId(null)
        limparEmpresaAtiva()
        setErroEmpresa(mensagemEmpresa)
        mostrarAviso(mensagemEmpresa, 'erro')
      }
    } finally {
      setEmpresaCarregando(false)
      setLoading(false)
    }
  }

  async function carregarTudo(empresaAtual = empresaId, opcoes = {}) {
    if (!empresaAtual) return

    const permissoesCarga = opcoes.permissoesAcessoTelas || permissoesAcessoTelas
    const acessoLixeira = avaliarAcessoTela('lixeira', permissoesCarga)
    const permitirCarregarLixeira = acessoLixeira.permitido
      && opcoes.permitirCarregarLixeira !== false

    const tarefas = [
      buscarContas(empresaAtual, { permitirGerarRecorrencias: false }),
      buscarNotas(empresaAtual),
      buscarCentros(empresaAtual),
      buscarFiliais(empresaAtual),
      buscarConfiguracoes(empresaAtual)
    ]

    if (permitirCarregarLixeira) {
      tarefas.push(buscarLixeira(empresaAtual, {
        permitirCarregarLixeira: true,
        permissoesAcessoTelas: permissoesCarga
      }))
    } else {
      limparLixeiraLocal()
    }

    await Promise.all(tarefas)
  }

  const normalizarPerfil = useCallback((perfil) => normalizarPerfilUsuario(perfil), [])

  const temPermissao = useCallback((perfisPermitidos = []) => {
    if (permissoesUsuario?.isMaster) return true
    const perfilAtual = normalizarPerfil(perfilUsuario)
    return perfisPermitidos.includes(perfilAtual)
  }, [normalizarPerfil, perfilUsuario, permissoesUsuario?.isMaster])

  const permissoesAcessoTelas = useMemo(() => construirPermissoesAcessoTelas(
    permissoesUsuario,
    { perfil: normalizarPerfil(perfilUsuario || permissoesUsuario?.perfilEmpresa) }
  ), [
    normalizarPerfil,
    perfilUsuario,
    permissoesUsuario,
  ])

  const podeAdministrarUsuarios = useCallback(() => {
    return permissoesAcessoTelas.canManageUsers
  }, [permissoesAcessoTelas.canManageUsers])

  const podeAcessarConfiguracoes = useCallback(() => {
    return permissoesAcessoTelas.canAccessSettings
  }, [permissoesAcessoTelas.canAccessSettings])

  const podeImportarContas = useCallback(() => {
    return permissoesAcessoTelas.canImport
  }, [permissoesAcessoTelas.canImport])

  const podeEditarFinanceiro = useCallback(() => {
    return temPermissao(['admin', 'gerente'])
  }, [temPermissao])

  const podeVincularRecorrencia = useCallback(() => {
    return temPermissao(['admin'])
  }, [temPermissao])

  const podeGerarRecorrencia = useCallback(() => {
    return temPermissao(['admin'])
  }, [temPermissao])

  const podeGerenciarRecorrencias = useCallback(() => {
    return temPermissao(['admin'])
  }, [temPermissao])

  const podeExportarDados = useCallback(() => {
    return temPermissao(['admin', 'gerente'])
  }, [temPermissao])

  const podeEditarConfiguracoes = useCallback(() => {
    return permissoesAcessoTelas.canEditSettings
  }, [permissoesAcessoTelas.canEditSettings])

  const podeAcessarGestaoPessoas = useCallback(() => {
    return permissoesAcessoTelas.canAccessPeople
  }, [permissoesAcessoTelas.canAccessPeople])

  const podeGerenciarLixeira = useCallback(() => {
    return permissoesAcessoTelas.canManageTrash
  }, [permissoesAcessoTelas.canManageTrash])

  const podeExcluirDefinitivoFinanceiro = useCallback(() => {
    return temPermissao(['admin'])
      && permissoesAcessoTelas.canManageTrash === true
  }, [permissoesAcessoTelas.canManageTrash, temPermissao])

  const podeGerenciarCentroCusto = useCallback(() => {
    return permissoesAcessoTelas.canEditSettings
  }, [permissoesAcessoTelas.canEditSettings])

  useEffect(() => {
    if (permissoesAcessoTelas.canEditSettings) return
    setModalCentro(false)
    setNovoCentro('')
  }, [permissoesAcessoTelas.canEditSettings])

  const acessoTelaAtual = useMemo(
    () => avaliarAcessoTela(telaAtual, permissoesAcessoTelas),
    [permissoesAcessoTelas, telaAtual]
  )

  const acessoOnboarding = useMemo(
    () => avaliarAcessoTela('onboarding', permissoesAcessoTelas),
    [permissoesAcessoTelas]
  )

  const acessoConfiguracoes = useMemo(
    () => avaliarAcessoTela('configuracoes', permissoesAcessoTelas),
    [permissoesAcessoTelas]
  )

  useEffect(() => {
    if (
      acessoTelaAtual.permitido
      && ['usuarios', 'auditoria'].includes(telaAtual)
      && empresaId
    ) {
      buscarUsuariosEmpresa(empresaId)
    }
  }, [acessoTelaAtual.permitido, telaAtual, empresaId])

  const configuracaoInicialCompleta = useMemo(() => {
    const filiaisAtivas = filiais.filter((filial) => filial?.ativo !== false)
    const contasAtivas = contasOperacionais.filter((conta) => conta?.excluido !== true)

    return Boolean(empresaId && filiaisAtivas.length > 0 && centros.length > 0 && contasAtivas.length > 0)
  }, [centros, contasOperacionais, empresaId, filiais])

  useEffect(() => {
    if (!empresaSessaoInicializada || !usuarioLogado?.id || !acessoOnboarding.permitido) return

    if (configuracaoInicialCompleta && telaAtual === 'onboarding') {
      navegarPara('dashboard', { replace: true, origem: 'onboarding', contexto: null })
      return
    }

    if (!configuracaoInicialCompleta && telaAtual === 'dashboard') {
      navegarPara('onboarding', { replace: true, origem: 'dashboard', contexto: null })
    }
  }, [
    configuracaoInicialCompleta,
    empresaSessaoInicializada,
    acessoOnboarding.permitido,
    navegarPara,
    telaAtual,
    usuarioLogado?.id
  ])
  const bloquearAcaoSemPermissao = useCallback(() => {
    mostrarAviso('Você não tem permissão para realizar esta ação.', 'erro')
  }, [mostrarAviso])

  const podeGerenciarDestinatariosAlertas = podeEditarConfiguracoes()

  const {
    destinatarios,
    loadingDestinatarios,
    salvandoDestinatario,
    erroDestinatarios,
    criarDestinatario,
    atualizarDestinatario,
    alterarStatusDestinatario
  } = useDestinatariosAlertas({
    empresaId,
    incluirInativos: mostrarDestinatariosInativos,
    autoCarregar: Boolean(
      usuarioLogado?.id
      && empresaId
      && telaAtual === 'configuracoes'
      && acessoConfiguracoes.permitido
    )
  })

  function limparFormularioDestinatarioAlerta() {
    setDestinatarioEditandoId('')
    setFormDestinatarioAlerta(DESTINATARIO_ALERTA_FORM_INICIAL)
  }

  function preencherFormularioDestinatarioAlerta(destinatario) {
    if (!podeGerenciarDestinatariosAlertas) return bloquearAcaoSemPermissao()

    setDestinatarioEditandoId(destinatario.id)
    setFormDestinatarioAlerta({
      nome: destinatario.nome || '',
      email: destinatario.email || '',
      recebe_contas: destinatario.recebe_contas !== false,
      recebe_notas: destinatario.recebe_notas !== false,
      recebe_resumo: destinatario.recebe_resumo !== false,
      observacao: destinatario.observacao || '',
      ativo: destinatario.ativo !== false
    })
  }

  function atualizarCampoDestinatarioAlerta(campo, valor) {
    setFormDestinatarioAlerta((atual) => ({
      ...atual,
      [campo]: valor
    }))
  }

  async function salvarDestinatarioAlerta(event) {
    event?.preventDefault?.()

    if (!podeGerenciarDestinatariosAlertas) return bloquearAcaoSemPermissao()
    if (!empresaId) {
      mostrarAviso('Empresa ativa nao identificada para salvar destinatario.', 'erro')
      return
    }

    const resultado = destinatarioEditandoId
      ? await atualizarDestinatario(destinatarioEditandoId, formDestinatarioAlerta)
      : await criarDestinatario(formDestinatarioAlerta)

    if (resultado.error) {
      mostrarAviso(mensagemSeguraErro(resultado.error, 'Nao foi possivel salvar o destinatario.'), 'erro')
      return
    }

    mostrarAviso(destinatarioEditandoId ? 'Destinatario atualizado.' : 'Destinatario cadastrado.', 'info')
    limparFormularioDestinatarioAlerta()
  }

  async function alternarStatusDestinatarioAlerta(destinatario) {
    if (!podeGerenciarDestinatariosAlertas) return bloquearAcaoSemPermissao()

    const novoStatus = destinatario.ativo === false
    const resultado = await alterarStatusDestinatario(destinatario.id, novoStatus)

    if (resultado.error) {
      mostrarAviso(mensagemSeguraErro(resultado.error, 'Nao foi possivel alterar o destinatario.'), 'erro')
      return
    }

    if (destinatarioEditandoId === destinatario.id) limparFormularioDestinatarioAlerta()
    mostrarAviso(novoStatus ? 'Destinatario reativado.' : 'Destinatario inativado.', 'info')
  }

  const menuSectionsFiltradas = useMemo(
    () => filtrarMenuPorAcesso(menuSections, permissoesAcessoTelas),
    [permissoesAcessoTelas]
  )

  async function recarregarEmpresasDisponiveis() {
    if (!usuarioLogado) return

    try {
      const empresasAtualizadas = await listarEmpresasDisponiveisParaUsuario({
        userId: usuarioLogado.id,
        email: usuarioLogado.email,
        isMaster: permissoesUsuario?.isMaster
      })

      setEmpresasDisponiveis(empresasAtualizadas)
    } catch (error) {
      console.warn('Não foi possível atualizar a lista de empresas:', error.message)
    }
  }


  async function trocarEmpresaAtiva(empresaSelecionadaId) {
    if (!empresaSelecionadaId || trocandoEmpresa) return

    const empresaSelecionada = empresasDisponiveis.find((empresa) => empresa.id === empresaSelecionadaId)

    if (!empresaSelecionada) {
      mostrarAviso('Empresa selecionada não encontrada para este usuário.', 'erro')
      return
    }

    if (empresaSelecionada.id === empresaId) return

    setTrocandoEmpresa(true)
    setLoading(true)

    try {
      const perfilSelecionado = empresaSelecionada.perfil || (permissoesUsuario?.isMaster ? 'master' : 'operador')
      const permissoesAtualizadas = permissoesUsuario?.isMaster
        ? {
            ...permissoesUsuario,
            perfilEmpresa: normalizarPerfil(perfilSelecionado),
            canSwitchCompany: true
          }
        : await buscarPermissoesUsuario({
            userId: usuarioLogado?.id,
            email: usuarioLogado?.email,
            perfilEmpresa: perfilSelecionado
          })

      limparDadosTenant()
      navegarPara('dashboard', {
        replace: true,
        origem: '',
        contexto: null,
        invalidarContextoAnterior: true,
      })
      setEmpresaId(empresaSelecionada.id)
      setEmpresaAtiva({
        id: empresaSelecionada.id,
        nome: empresaSelecionada.nome || 'Empresa',
        perfil: perfilSelecionado
      })
      setPerfilUsuario(perfilSelecionado)
      setPermissoesUsuario(permissoesAtualizadas)
      const permissoesCarregamento = construirPermissoesAcessoTelas(permissoesAtualizadas, {
        perfil: normalizarPerfil(perfilSelecionado)
      })
      await carregarTudo(empresaSelecionada.id, {
        permissoesAcessoTelas: permissoesCarregamento
      })
      mostrarAviso(`Empresa ativa: ${empresaSelecionada.nome || 'Empresa'}`, 'sucesso')
    } catch (error) {
      avisarErro(error, 'Não foi possível trocar a empresa ativa.')
    } finally {
      setTrocandoEmpresa(false)
      setLoading(false)
    }
  }

  async function buscarUsuariosEmpresa(empresaAtual = empresaId, opcoes = {}) {
    if (!empresaAtual) return

    const silencioso = Boolean(opcoes?.silencioso)
    if (!silencioso) setUsuariosCarregando(true)
    setUsuariosErro('')

    try {
      const [usuarios, vinculosFiliais] = await Promise.all([
        listarUsuariosEmpresa(empresaAtual),
        listarFiliaisUsuariosEmpresa(empresaAtual)
      ])
      const mapaFiliais = {}
      ;(vinculosFiliais || []).forEach((vinculo) => {
        if (!vinculo?.usuario_id || !vinculo?.filial_id) return
        if (!mapaFiliais[vinculo.usuario_id]) mapaFiliais[vinculo.usuario_id] = []
        mapaFiliais[vinculo.usuario_id].push(vinculo.filial_id)
      })
      setUsuariosEmpresa(usuarios)
      setFiliaisUsuariosEmpresa(mapaFiliais)
      setUsuariosInicializados(true)
    } catch (error) {
      console.warn('Não foi possível carregar usuários:', error.message)
      setUsuariosEmpresa([])
      setFiliaisUsuariosEmpresa({})
      setUsuariosInicializados(true)
      setUsuariosErro(mensagemSeguraErro(error, 'Não foi possível carregar os usuários da empresa.'))
    } finally {
      if (!silencioso) setUsuariosCarregando(false)
    }
  }

  async function adicionarUsuarioEmpresa() {
    if (criandoUsuarioManual) return

    if (!empresaId) {
      mostrarAviso('Empresa não identificada.', 'erro')
      return
    }

    if (!podeAdministrarUsuarios()) {
      mostrarAviso('Apenas administradores podem adicionar usuários.', 'erro')
      return
    }

    const email = emailConviteUsuario.trim().toLowerCase()

    if (!email || !email.includes('@')) {
      mostrarAviso('Informe um e-mail válido.', 'erro')
      return
    }

    const senhaProvisoria = senhaConviteUsuario.trim()

    if (!senhaProvisoriaValida(senhaProvisoria)) {
      mostrarAviso(`Informe uma senha provisória com pelo menos ${TAMANHO_MINIMO_SENHA_PROVISORIA} caracteres.`, 'erro')
      return
    }

    const perfil = normalizarPerfil(perfilConviteUsuario)

    try {
      setCriandoUsuarioManual(true)
      const usuarioCriado = await adicionarUsuarioEmpresaService({
        empresaId,
        email,
        nome: nomeConviteUsuario,
        perfil,
        senhaProvisoria,
        criarAuthManual: true
      })

      await buscarUsuariosEmpresa(empresaId, { silencioso: true })
      if (usuarioCriado?.id) {
        await registrarEventoAuditoriaSeguro(supabase, {
          empresa_id: empresaId,
          acao: 'administracao.usuario.convite_criado',
          entidade_tipo: 'df_usuarios_empresas',
          entidade_id: usuarioCriado.id,
          modulo: 'administracao',
          origem: 'app',
          severidade: 'alta',
          status: 'sucesso',
          dados_antes: null,
          dados_depois: { perfil, origem: 'criacao_manual' },
          metadados: { criacao_manual: true }
        }, 'criação de usuário')
      }
    } catch (error) {
      avisarErro(error)
      return
    } finally {
      setCriandoUsuarioManual(false)
    }

    setEmailConviteUsuario('')
    setNomeConviteUsuario('')
    setSenhaConviteUsuario('')
    setPerfilConviteUsuario('operador')
    mostrarAviso('Usuário criado manualmente. Entregue o e-mail e a senha provisória ao usuário por um canal seguro.', 'sucesso')
  }

  async function enviarAcessoUsuarioEmpresa(usuario) {
    if (!empresaId) {
      mostrarAviso('Empresa não identificada.', 'erro')
      return
    }

    if (!podeAdministrarUsuarios()) {
      mostrarAviso('Apenas administradores podem enviar acesso ou reset de senha.', 'erro')
      return
    }

    if (!permissoesUsuario?.isMaster && usuarioEhMasterProtegido(usuario)) {
      mostrarAviso('Usuário master não pode ser alterado por admin comum.', 'erro')
      return
    }

    const nome = usuario.nome || usuario.email || 'este usuário'

    abrirConfirmacao({
      titulo: 'Enviar acesso',
      mensagem: `Deseja enviar um link de acesso/redefinição de senha para ${nome}?`,
      textoConfirmar: 'Enviar link',
      tipo: 'padrao',
      acao: async () => {
        if (!permissoesUsuario?.isMaster && usuarioEhMasterProtegido(usuario)) {
          mostrarAviso('Usuário master não pode ser alterado por admin comum.', 'erro')
          return
        }

        try {
          const resultado = await enviarAcessoUsuarioEmpresaService({ empresaId, usuario })
          if (usuario.id) await registrarEventoAuditoriaSeguro(supabase, {
            empresa_id: empresaId,
            acao: 'administracao.usuario.acesso_enviado',
            entidade_tipo: 'df_usuarios_empresas',
            entidade_id: usuario.id,
            modulo: 'administracao',
            severidade: 'alta',
            status: 'sucesso',
            dados_depois: { tipo_envio: resultado?.tipo || 'acesso' }
          }, 'envio de acesso')
          mostrarAviso(resultado.mensagem, 'info')
        } catch (error) {
          avisarErro(error)
        }
      }
    })
  }

  async function atualizarPerfilUsuarioEmpresa(usuario, novoPerfil) {
    if (!podeAdministrarUsuarios()) {
      mostrarAviso('Apenas administradores podem alterar perfis.', 'erro')
      return
    }

    const perfil = normalizarPerfil(novoPerfil)
    const usuarioAtual = usuario.user_id && usuarioLogado?.id && usuario.user_id === usuarioLogado.id

    if (!permissoesUsuario?.isMaster && usuarioEhMasterProtegido(usuario)) {
      mostrarAviso('Usuário master não pode ser alterado por admin comum.', 'erro')
      return
    }

    if (usuarioAtual && perfil !== 'admin') {
      const admins = usuariosEmpresa.filter((u) => normalizarPerfil(u.perfil) === 'admin')
      if (admins.length <= 1) {
        mostrarAviso('Você não pode remover o último administrador da empresa.', 'erro')
        return
      }
    }

    if (perfil === normalizarPerfil(usuario.perfil)) return

    const nome = usuario.nome || usuario.email || 'este usuário'
    const perfilLabel = primeiraLetraMaiuscula(perfil)

    abrirConfirmacao({
      titulo: 'Alterar perfil',
      mensagem: `Deseja alterar o perfil de ${nome} para ${perfilLabel}?`,
      textoConfirmar: 'Confirmar alteração',
      tipo: perfil === 'admin' ? 'perigo' : 'padrao',
      acao: async () => {
        if (!permissoesUsuario?.isMaster && usuarioEhMasterProtegido(usuario)) {
          mostrarAviso('Usuário master não pode ser alterado por admin comum.', 'erro')
          return
        }

        try {
          await atualizarPerfilUsuarioEmpresaService({ empresaId, usuario, perfil })
          if (usuario.id) await registrarEventoAuditoriaSeguro(supabase, {
            empresa_id: empresaId,
            acao: 'administracao.usuario.perfil_alterado',
            entidade_tipo: 'df_usuarios_empresas',
            entidade_id: usuario.id,
            modulo: 'administracao',
            severidade: 'alta',
            status: 'sucesso',
            dados_antes: { perfil: normalizarPerfil(usuario.perfil) },
            dados_depois: { perfil }
          }, 'alteração de perfil')
        } catch (error) {
          avisarErro(error)
          return
        }

        await buscarUsuariosEmpresa()
        mostrarAviso('Perfil do usuário atualizado.', 'sucesso')
      }
    })
  }

  async function atualizarFiliaisDoUsuario(
    usuario,
    proximasFiliais,
    acessoTodasFiliais = false,
  ) {
    if (!podeAdministrarUsuarios()) {
      mostrarAviso('Apenas administradores podem alterar filiais dos usuários.', 'erro')
      return
    }

    if (!permissoesUsuario?.isMaster && usuarioEhMasterProtegido(usuario)) {
      mostrarAviso('Usuário master não pode ser alterado por admin comum.', 'erro')
      return
    }

    if (!usuario?.id) {
      mostrarAviso('Este usuário precisa estar cadastrado na empresa para receber filiais.', 'erro')
      return
    }

    const chaveSalvamento = usuario.id
    setSalvandoFilialUsuario(chaveSalvamento)

    try {
      if (!permissoesUsuario?.isMaster && usuarioEhMasterProtegido(usuario)) {
        mostrarAviso('Usuário master não pode ser alterado por admin comum.', 'erro')
        return
      }

      const filiaisAnteriores = filiaisUsuariosEmpresa[usuario.id] || []
      const escopoAtualizado = await atualizarFiliaisUsuarioEmpresa({
        empresaId,
        usuario,
        filialIds: proximasFiliais,
        acessoTodasFiliais,
      })
      setUsuariosEmpresa((atuais) => atuais.map((item) => (
        item.id === usuario.id
          ? {
              ...item,
              acesso_todas_filiais: escopoAtualizado.acessoTodasFiliais,
            }
          : item
      )))
      setFiliaisUsuariosEmpresa((atual) => ({
        ...atual,
        [usuario.id]: escopoAtualizado.filialIds,
      }))
      await registrarEventoAuditoriaSeguro(supabase, {
        empresa_id: empresaId,
        acao: 'administracao.usuario.filiais_alteradas',
        entidade_tipo: 'df_usuarios_empresas',
        entidade_id: usuario.id,
        modulo: 'administracao',
        severidade: 'alta',
        status: 'sucesso',
        dados_antes: {
          quantidade_filiais: filiaisAnteriores.length,
          acesso_todas_filiais: usuario.acesso_todas_filiais === true,
        },
        dados_depois: {
          quantidade_filiais: escopoAtualizado.filialIds.length,
          acesso_todas_filiais: escopoAtualizado.acessoTodasFiliais,
        }
      }, 'alteração de filiais')
      mostrarAviso('Filiais do usuário atualizadas.', 'sucesso')
    } catch (error) {
      avisarErro(error, 'Não foi possível atualizar as filiais do usuário.')
    } finally {
      setSalvandoFilialUsuario('')
    }
  }

  function alternarFilialUsuario(usuario, filialId) {
    const filiaisAtuais = filiaisUsuariosEmpresa[usuario.id] || []
    const jaSelecionada = filiaisAtuais.includes(filialId)
    const proximasFiliais = jaSelecionada
      ? filiaisAtuais.filter((id) => id !== filialId)
      : [...filiaisAtuais, filialId]

    atualizarFiliaisDoUsuario(usuario, proximasFiliais, false)
  }

  function liberarTodasFiliaisUsuario(usuario) {
    atualizarFiliaisDoUsuario(usuario, [], true)
  }

  async function removerUsuarioEmpresa(usuario) {
    if (!podeAdministrarUsuarios()) {
      mostrarAviso('Apenas administradores podem remover usuários.', 'erro')
      return
    }

    const usuarioAtual = usuario.user_id && usuarioLogado?.id && usuario.user_id === usuarioLogado.id

    if (!permissoesUsuario?.isMaster && usuarioEhMasterProtegido(usuario)) {
      mostrarAviso('Usuário master não pode ser alterado por admin comum.', 'erro')
      return
    }

    if (usuarioAtual) {
      mostrarAviso('Você não pode remover o próprio acesso por aqui.', 'erro')
      return
    }

    if (normalizarPerfil(usuario.perfil) === 'admin') {
      const adminsAtivos = usuariosEmpresa.filter((u) => normalizarPerfil(u.perfil) === 'admin')
      if (adminsAtivos.length <= 1) {
        mostrarAviso('Você não pode remover o último administrador da empresa.', 'erro')
        return
      }
    }

    abrirConfirmacao({
      titulo: 'Remover usuário',
      mensagem: `Deseja remover ${usuario.nome || usuario.email || 'este usuário'} desta empresa?`,
      textoConfirmar: 'Remover',
      tipo: 'perigo',
      acao: async () => {
        if (!permissoesUsuario?.isMaster && usuarioEhMasterProtegido(usuario)) {
          mostrarAviso('Usuário master não pode ser alterado por admin comum.', 'erro')
          return
        }

        try {
          await removerUsuarioEmpresaService({ empresaId, usuario })
        } catch (error) {
          avisarErro(error)
          return
        }

        await buscarUsuariosEmpresa()
      }
    })
  }

  async function salvarMeuEmail() {
    const email = novoEmailUsuario.trim().toLowerCase()

    if (!email || !email.includes('@')) {
      mostrarAviso('Informe um e-mail válido.', 'erro')
      return
    }

    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: window.location.origin }
    )

    if (error) {
      avisarErro(error)
      return
    }

    setNovoEmailUsuario('')
    mostrarAviso('Solicitação enviada. Confirme o novo e-mail pelas instruções recebidas.', 'sucesso')
  }

  async function salvarMinhaSenha() {
    if (!novaSenhaUsuario || novaSenhaUsuario.length < 6) {
      mostrarAviso('A senha precisa ter pelo menos 6 caracteres.', 'erro')
      return
    }

    if (novaSenhaUsuario !== confirmarNovaSenhaUsuario) {
      mostrarAviso('As senhas não conferem.', 'erro')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: novaSenhaUsuario })

    if (error) {
      avisarErro(error)
      return
    }

    setNovaSenhaUsuario('')
    setConfirmarNovaSenhaUsuario('')
    mostrarAviso('Senha atualizada com sucesso.', 'sucesso')
  }


  // =========================
  // BLOCO 5 — BUSCAS SUPABASE
  // =========================
  async function buscarContas(empresaAtual = empresaId, opcoes = {}) {
    const resultado = await buscarContasHook({
      supabase,
      empresaAtual,
      avisarErro,
      configWhatsapp,
      configEmail,
      configPush,
      diasAlertaContas,
      diasAvisoPadrao,
      silencioso: opcoes.silencioso,
      permitirGerarRecorrencias: false
    })
    if (empresaAtual === empresaId && telaAtual === 'contas') {
      const tipoSecundario = busca.trim() ? 'busca' : (filtroStatus === 'pagas' || filtroStatus === 'ocultas' ? filtroStatus : null)
      if (tipoSecundario) await consultarContasSecundarias(tipoSecundario, 0)
    }
    return resultado
  }

  async function carregarContasContextuais(empresaAtual = empresaId) {
    return carregarContasContextuaisHook({
      supabase,
      empresaAtual,
      avisarErro
    })
  }

  async function buscarContasAposMutacao() {
    return atualizarAposMutacaoContas({
      invalidarContextual: limparContasContextuais,
      carregarOperacionais: () => buscarContas(empresaId, { permitirGerarRecorrencias: false }),
      carregarContextual: consumidorRequerHistoricoCompleto(telaAtual)
        ? () => carregarContasContextuais(empresaId)
        : null
    })
  }

  async function atualizarFontesContasDashboard() {
    return buscarContas(empresaId, { permitirGerarRecorrencias: false })
  }

  function abrirContasComPlanejamento({
    filtroStatus: status = 'pendentes',
    filtroHorizonte: horizonte = 'todos',
    dataInicial: inicio = '',
    dataFinal: fim = '',
    filialId = '',
    centroCustoId = ''
  } = {}) {
    setBusca('')
    setFiltroStatus(status)
    setFiltroHorizonte(horizonte)
    setFiltroFilial(filialId)
    setFiltroCentro(centroCustoId)
    setFiltroMes('')
    setDataInicial(inicio)
    setDataFinal(fim)
    limparConsultasSecundarias()
    navegarPara('contas', {
      origem: telaAtual,
      contexto: {
        filtroStatus: status,
        filtroHorizonte: horizonte,
        dataInicial: inicio,
        dataFinal: fim,
        filial: filialId,
        centroCusto: centroCustoId,
        telaRetorno: telaAtual,
      },
    })
  }

  function obterPeriodoPagasAtual() {
    return obterPeriodoConsultaPagas({
      periodoPagas,
      anoPagas,
      dataInicialPagas,
      dataFinalPagas
    })
  }

  async function consultarContasSecundarias(tipo, pagina = 0, termo = busca.trim(), status = filtroStatus) {
    return executarConsultaSecundariaHook({
      supabase,
      empresaAtual: empresaId,
      tipo,
      pagina,
      termo,
      status: status === 'pendentes' ? 'abertas' : status,
      periodo: obterPeriodoPagasAtual(),
      avisarErro
    })
  }
  async function buscarNotas(empresaAtual = empresaId) {
    return buscarNotasHook({
      supabase,
      empresaAtual,
      avisarErro
    })
  }



  async function carregarAlertasGlobais(empresaAtual = empresaId) {
    if (!empresaAtual) return

    const { data, error } = await supabase
      .from('df_configuracoes_alertas')
      .select('*')
      .eq('empresa_id', empresaAtual)
      .maybeSingle()

    if (error) {
      if (!(await podeContinuarOperacaoTenant(empresaAtual))) return
      console.warn('Não foi possível carregar alertas globais:', error.message)
      return
    }

    if (data) {
      setDiasAlertaContas(String(data.dias_alerta_contas ?? 1))
      setAlertarContasVencidas(data.alertar_contas_vencidas ?? true)
      setDestacarContasCriticas(data.destacar_contas_criticas ?? true)
      setDiasAlertaNotas(String(data.dias_alerta_notas ?? 3))
      setDestacarNotasUrgentes(data.destacar_notas_urgentes ?? true)
      return
    }

    if (!(await podeContinuarOperacaoTenant(empresaAtual))) return

    const payload = {
      empresa_id: empresaAtual,
      dias_alerta_contas: 1,
      alertar_contas_vencidas: true,
      destacar_contas_criticas: true,
      dias_alerta_notas: 3,
      destacar_notas_urgentes: true
    }

    const { data: criada, error: erroInsert } = await supabase
      .from('df_configuracoes_alertas')
      .insert([payload])
      .select()
      .maybeSingle()

    if (erroInsert) {
      console.warn('Não foi possível criar alertas globais:', erroInsert.message)
      return
    }

    if (criada) {
      setDiasAlertaContas(String(criada.dias_alerta_contas ?? 1))
      setAlertarContasVencidas(criada.alertar_contas_vencidas ?? true)
      setDestacarContasCriticas(criada.destacar_contas_criticas ?? true)
      setDiasAlertaNotas(String(criada.dias_alerta_notas ?? 3))
      setDestacarNotasUrgentes(criada.destacar_notas_urgentes ?? true)
    }
  }

  async function buscarConfiguracoes(empresaAtual = empresaId) {
    if (!empresaAtual) return

    const { data, error } = await supabase
      .from('df_configuracoes')
      .select('*')
      .eq('empresa_id', empresaAtual)
      .limit(1)

    if (error) {
      if (!(await podeContinuarOperacaoTenant(empresaAtual))) return
      avisarErro(error)
      return
    }

    const configEncontrada = Array.isArray(data) ? data[0] : data

    if (configEncontrada) {
      setConfiguracoes(configEncontrada)
      setNotificacoesAtivas(configEncontrada.notificacoes_ativas ?? true)
      setConfigWhatsapp(configEncontrada.enviar_whatsapp ?? true)
      setConfigEmail(configEncontrada.enviar_email ?? true)
      setConfigPush(configEncontrada.enviar_push ?? false)
      setDiasAvisoPadrao(String(configEncontrada.dias_aviso_padrao ?? 1))
      setNomeEmpresa(configEncontrada.nome_empresa || '')
      setWhatsappPadrao(configEncontrada.whatsapp_padrao || '')
      setEmailPadrao(configEncontrada.email_padrao || '')
      await carregarAlertasGlobais(empresaAtual)
      return
    }

    if (!(await podeContinuarOperacaoTenant(empresaAtual))) return

    const { data: novaConfig, error: erroInsert } = await supabase
      .from('df_configuracoes')
      .insert([{
        notificacoes_ativas: true,
        enviar_whatsapp: true,
        enviar_email: true,
        enviar_push: false,
        dias_aviso_padrao: 1,
        nome_empresa: 'Rede Dona Flor',
        empresa_id: empresaAtual
      }])
      .select()

    if (erroInsert) {
      avisarErro(erroInsert)
      return
    }

    const configCriada = Array.isArray(novaConfig) ? novaConfig[0] : novaConfig

    setConfiguracoes(configCriada)
    setNotificacoesAtivas(configCriada?.notificacoes_ativas ?? true)
    setConfigWhatsapp(configCriada?.enviar_whatsapp ?? true)
    setConfigEmail(configCriada?.enviar_email ?? true)
    setConfigPush(configCriada?.enviar_push ?? false)
    setDiasAvisoPadrao(String(configCriada?.dias_aviso_padrao ?? 1))
    setNomeEmpresa(configCriada?.nome_empresa || '')
    setWhatsappPadrao(configCriada?.whatsapp_padrao || '')
    setEmailPadrao(configCriada?.email_padrao || '')
    await carregarAlertasGlobais(empresaAtual)
  }

  async function buscarLixeira(empresaAtual = empresaId, opcoes = {}) {
    if (!empresaAtual) return

    const permissoesCarga = opcoes.permissoesAcessoTelas || permissoesAcessoTelas
    const permitirCarregarLixeira = avaliarAcessoTela(
      'lixeira',
      permissoesCarga
    ).permitido && opcoes.permitirCarregarLixeira !== false

    if (!permitirCarregarLixeira) {
      limparLixeiraLocal()
      return
    }

    const { data: contasExcluidas, error: erroContas } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)')
      .eq('empresa_id', empresaAtual)
      .eq('excluido', true)
      .order('excluido_em', { ascending: false })

    if (erroContas) {
      avisarErro(erroContas)
    }

    atualizarListaLixeiraEstavel(setContasLixeira, contasExcluidas || [])

    await buscarNotasLixeiraHook({
      supabase,
      empresaAtual,
      avisarErro
    })
  }

  async function buscarCentros(empresaAtual = empresaId) {
    if (!empresaAtual) return

    const { data, error } = await supabase
      .from('df_centros_custo')
      .select('*')
      .eq('empresa_id', empresaAtual)
      .order('nome')

    if (error) {
      avisarErro(error)
      return
    }

    setCentros(data || [])
  }


  async function buscarFiliais(empresaAtual = empresaId) {
    if (!empresaAtual) {
      setFiliais([])
      return
    }

    try {
      const dados = await listarFiliaisPorEmpresa(empresaAtual)
      setFiliais((dados || []).filter((filial) => filial.ativo !== false))
    } catch (error) {
      avisarErro(error)
      setFiliais([])
    }
  }

  // =========================
  // BLOCO 6 — FILTROS / RESUMOS
  // =========================
  const termoBuscaContas = useMemo(() => busca.trim().toLowerCase(), [busca])
  useEffect(() => {
    if (telaAtual !== 'contas' || !empresaId) return undefined
    const termo = busca.trim()
    if (termo) {
      const timer = setTimeout(() => { void consultarContasSecundarias('busca', 0, termo, filtroStatus) }, 350)
      return () => clearTimeout(timer)
    }
    if (filtroStatus === 'pagas') void consultarContasSecundarias('pagas', 0)
    if (filtroStatus === 'ocultas') void consultarContasSecundarias('ocultas', 0)
    if (filtroStatus === 'excluidas') void consultarContasSecundarias('excluidas', 0)
    return undefined
  }, [anoPagas, busca, dataFinalPagas, dataInicialPagas, empresaId, filtroStatus, periodoPagas, telaAtual])

  useEffect(() => {
    if (!empresaId) return
    if (['dashboard', 'controle-impostos', 'copilot'].includes(telaAtual)) return
    void carregarFonteContextualContas(telaAtual, () => carregarContasContextuais(empresaId))
  }, [empresaId, telaAtual])

  function alterarBuscaContas(valor) {
    const tinhaBusca = Boolean(busca.trim())
    const temBusca = Boolean(String(valor || '').trim())
    setBusca(valor)
    if (!tinhaBusca && temBusca) setFiltroStatus('todas')
    if (tinhaBusca && !temBusca) {
      limparConsultasSecundarias()
      setFiltroStatus('pendentes')
    }
  }

  const fonteContasExibidas = selecionarFonteContas({
    operacionais: contasOperacionais,
    pagas: contasPagas,
    busca: resultadosBuscaContas,
    ocultas: contasOcultas,
    excluidas: contasExcluidas,
    termo: termoBuscaContas,
    modo: filtroStatus
  })

  const valorBuscaContasCentavos = useMemo(() => normalizarValorBuscaContas(busca), [busca])
  const digitosBuscaValorContas = useMemo(() => normalizarDigitosValorBuscaContas(busca), [busca])

  const contasFiltradas = useMemo(() => filtrarContasPorHorizonte(fonteContasExibidas
    .filter((conta) => {
      if (filtroStatus === 'excluidas') return conta.excluido === true && conta.deletado !== true
      if (filtroStatus === 'ocultas') return conta.oculto === true
      if (!termoBuscaContas && conta.oculto === true) return false
      if (!termoBuscaContas && conta.excluido === true) return false
      if (filtroStatus === 'pendentes') return conta.status !== 'pago'
      if (filtroStatus === 'futuras') return conta.status !== 'pago' && conta.data_vencimento > formatarDataBancoLocal(new Date())
      if (filtroStatus === 'pagas') return conta.status === 'pago'
      if (filtroStatus === 'vencidas') return estaVencida(conta.data_vencimento, conta.status)
      return true
    })
    .filter((conta) => !filtroCentro || conta.centro_custo_id === filtroCentro)
    .filter((conta) => !filtroFilial || conta.filial_id === filtroFilial)
    .filter((conta) => !filtroMes || pegarMes(conta.data_vencimento) === filtroMes)
    .filter((conta) => {
      if (dataInicial && conta.data_vencimento < dataInicial) return false
      if (dataFinal && conta.data_vencimento > dataFinal) return false
      return true
    })
    .filter((conta) => {
      if (!termoBuscaContas || fonteContasExibidas === resultadosBuscaContas) return true
      if (valorContaCorrespondeBusca(conta, valorBuscaContasCentavos, digitosBuscaValorContas)) return true

      const centroNome = conta.df_centros_custo?.nome || ''
      const filialNome = conta.df_filiais?.nome || ''
      const statusBusca = conta.status === 'pago'
        ? 'pago'
        : estaVencida(conta.data_vencimento, conta.status)
          ? 'vencido'
          : 'pendente'

      const camposBusca = [
        conta.descricao,
        conta.observacao,
        conta.categoria,
        conta.forma_pagamento,
        centroNome,
        filialNome,
        statusBusca,
        formatarData(conta.data_vencimento),
        conta.data_vencimento
      ]

      return camposBusca
        .filter(Boolean)
        .some((campo) => String(campo).toLowerCase().includes(termoBuscaContas))
    }), filtroHorizonte, {
      hoje: formatarDataBancoLocal(new Date()),
      modo: filtroStatus,
      modoBuscaGlobal: Boolean(termoBuscaContas)
    }), [fonteContasExibidas, resultadosBuscaContas, dataFinal, dataInicial, filtroCentro, filtroFilial, filtroHorizonte, filtroMes, filtroStatus, termoBuscaContas, valorBuscaContasCentavos, digitosBuscaValorContas])

  const contasOperacionaisFiliais = useMemo(() => contasOperacionais
    .filter((conta) => {
      if (conta.oculto === true) return false
      if (filtroStatus === 'pendentes') return conta.status !== 'pago'
      if (filtroStatus === 'futuras') return conta.status !== 'pago' && conta.data_vencimento > formatarDataBancoLocal(new Date())
      if (filtroStatus === 'pagas') return conta.status === 'pago'
      if (filtroStatus === 'vencidas') return estaVencida(conta.data_vencimento, conta.status)
      return true
    })
    .filter((conta) => !filtroCentro || conta.centro_custo_id === filtroCentro)
    .filter((conta) => !filtroMes || pegarMes(conta.data_vencimento) === filtroMes)
    .filter((conta) => {
      if (dataInicial && conta.data_vencimento < dataInicial) return false
      if (dataFinal && conta.data_vencimento > dataFinal) return false
      return true
    })
    .filter((conta) => {
      if (!termoBuscaContas || fonteContasExibidas === resultadosBuscaContas) return true
      if (valorContaCorrespondeBusca(conta, valorBuscaContasCentavos, digitosBuscaValorContas)) return true

      const centroNome = conta.df_centros_custo?.nome || ''
      const filialNome = conta.df_filiais?.nome || ''
      const statusBusca = conta.status === 'pago'
        ? 'pago'
        : estaVencida(conta.data_vencimento, conta.status)
          ? 'vencido'
          : 'pendente'

      const camposBusca = [
        conta.descricao,
        conta.observacao,
        conta.categoria,
        conta.forma_pagamento,
        centroNome,
        filialNome,
        statusBusca,
        formatarData(conta.data_vencimento),
        conta.data_vencimento
      ]

      return camposBusca
        .filter(Boolean)
        .some((campo) => String(campo).toLowerCase().includes(termoBuscaContas))
    }), [contasOperacionais, dataFinal, dataInicial, filtroCentro, filtroMes, filtroStatus, termoBuscaContas, valorBuscaContasCentavos, digitosBuscaValorContas])

  const resumoFinanceiro = useMemo(
    () => calcularResumoFinanceiroContas(contasFiltradas),
    [contasFiltradas],
  )

  const { total, pago, vencido, pendente, encargos, descontos } = resumoFinanceiro

  const resumoPorCentro = useMemo(() => centros
    .map((centro) => {
      const lista = contasFiltradas.filter((conta) => conta.centro_custo_id === centro.id)
      const totalCentro = lista.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
      const pagoCentro = lista
        .filter((conta) => conta.status === 'pago')
        .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
      const vencidoCentro = lista
        .filter((conta) => estaVencida(conta.data_vencimento, conta.status))
        .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

      return {
        id: centro.id,
        nome: centro.nome,
        total: totalCentro,
        pago: pagoCentro,
        pendente: totalCentro - pagoCentro,
        vencido: vencidoCentro
      }
    })
    .filter((centro) => centro.total > 0 || centro.pago > 0 || centro.pendente > 0 || centro.vencido > 0), [centros, contasFiltradas])

  const pesoPrioridadeNota = { critico: 0, urgente: 1, normal: 2 }

  const termoBuscaNotas = useMemo(() => buscaNota.toLowerCase(), [buscaNota])

  const notasFiltradas = useMemo(() => notas
    .filter((nota) =>
      (!filtroFilial || nota.filial_id === filtroFilial) && `${nota.titulo || ''} ${nota.conteudo || ''}`
        .toLowerCase()
        .includes(termoBuscaNotas)
    )
    .sort((a, b) => {
      const concluidaA = a.concluida ? 1 : 0
      const concluidaB = b.concluida ? 1 : 0
      if (concluidaA !== concluidaB) return concluidaA - concluidaB
      const pesoA = (pesoPrioridadeNota[a.prioridade || 'normal'] ?? 2)
      const pesoB = (pesoPrioridadeNota[b.prioridade || 'normal'] ?? 2)
      if (pesoA !== pesoB) return pesoA - pesoB
      const dataA = a.data_evento || '9999-12-31'
      const dataB = b.data_evento || '9999-12-31'
      return String(dataA).localeCompare(String(dataB))
    }), [notas, filtroFilial, termoBuscaNotas])

  const notasPendentes = useMemo(() => notasFiltradas.filter((nota) => !nota.concluida), [notasFiltradas])
  const notasCriticas = useMemo(() => notasPendentes.filter((nota) => nota.prioridade === 'critico').length, [notasPendentes])
  const notasUrgentes = useMemo(() => notasPendentes.filter((nota) => nota.prioridade === 'urgente').length, [notasPendentes])

  // =========================
  // BLOCO 7 — AÇÕES CONTAS
  // =========================
  function abrirNovaConta() {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return
    }

    return abrirNovaContaHook({
      setMenuAberto,
      setMenuNavegacaoAberto,
      configWhatsapp,
      configEmail,
      configPush,
      diasAvisoPadrao
    })
  }

  async function abrirEdicaoConta(conta) {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return
    }

    return abrirEdicaoContaHook({
      conta,
      supabase,
      empresaId,
      diasAvisoPadrao,
      formatarDataParaBanco
    })
  }

  function fecharConta() {
    return fecharContaHook()
  }

  async function salvarConta() {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return
    }

    const contaVinculadaRecorrencia = Boolean(editandoContaId && recorrenciaContaId)
    const solicitaMutacaoRecorrencia = (
      (!contaVinculadaRecorrencia && contaRecorrente)
      || (contaVinculadaRecorrencia && escopoEdicaoRecorrencia === 'serie')
    )

    if (solicitaMutacaoRecorrencia && !podeGerenciarRecorrencias()) {
      mostrarAviso('Apenas Admin ou Master pode criar ou alterar séries recorrentes.', 'erro')
      return
    }

    return salvarContaHook({
      supabase,
      empresaId,
      mostrarAviso,
      configWhatsapp,
      configEmail,
      configPush,
      diasAlertaContas,
      diasAvisoPadrao,
      primeiraLetraMaiuscula,
      converterValor,
      formatarDataParaBanco,
      erroEhSessaoExpirada,
      limparEstadoAutenticacao,
      setUsuarioLogado,
      buscarContas: buscarContasAposMutacao,
      fecharConta,
      onContaSalva: (id) => {
        if (id) setContaFocusTarget({ tipo: 'conta', id, origem: 'salvamento', nonce: Date.now() })
      }
    })
  }

  async function marcarComoPago(id, pagamento) {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return false
    }

    return marcarComoPagoHook({ supabase, id, empresaId, buscarContas: buscarContasAposMutacao, mostrarAviso, pagamento })
  }

  async function corrigirPagamento(id, pagamento) {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return false
    }

    return corrigirPagamentoHook({ supabase, id, empresaId, buscarContas: buscarContasAposMutacao, mostrarAviso, pagamento })
  }

  async function registrarPagamentoParcial(id, pagamento) {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return false
    }

    return registrarPagamentoParcialHook({
      supabase,
      id,
      empresaId,
      buscarContas: buscarContasAposMutacao,
      mostrarAviso,
      pagamento
    })
  }

  async function listarPagamentosParciaisConta(id) {
    return listarPagamentosParciaisContaHook({
      supabase,
      id,
      empresaId,
      mostrarAviso
    })
  }

  async function estornarPagamentoParcial(pagamentoId, contaId) {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return false
    }

    return estornarPagamentoParcialHook({
      supabase,
      pagamentoId,
      contaId,
      empresaId,
      buscarContas: buscarContasAposMutacao,
      mostrarAviso
    })
  }

  async function baixarContaQuitadaPorParciais(contaId) {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return false
    }

    return baixarContaQuitadaPorParciaisHook({
      supabase,
      contaId,
      empresaId,
      buscarContas: buscarContasAposMutacao,
      mostrarAviso
    })
  }

  async function voltarParaPendente(id) {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return
    }

    return voltarParaPendenteHook({ supabase, id, empresaId, buscarContas: buscarContasAposMutacao, mostrarAviso })
  }

  async function excluirConta(id) {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return
    }

    return excluirContaHook({ supabase, id, empresaId, avisarErro, buscarContas: buscarContasAposMutacao, buscarLixeira, mostrarAviso })
  }

  async function ocultarConta(id) {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return
    }

    return ocultarContaHook({ supabase, id, empresaId, avisarErro, buscarContas: buscarContasAposMutacao, mostrarAviso })
  }

  async function reexibirConta(id) {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return
    }

    return reexibirContaHook({ supabase, id, empresaId, avisarErro, buscarContas: buscarContasAposMutacao, mostrarAviso })
  }

  async function cancelarGrupoParcelamento(grupoParcelamentoId) {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return false
    }

    return cancelarGrupoParcelamentoHook({
      supabase,
      empresaId,
      grupoParcelamentoId,
      buscarContas: buscarContasAposMutacao,
      mostrarAviso,
      fecharConta
    })
  }

  async function desativarSerieRecorrente(id) {
    if (!podeGerenciarRecorrencias()) {
      bloquearAcaoSemPermissao()
      return false
    }

    return desativarSerieRecorrenteHook({
      supabase,
      id,
      empresaId,
      avisarErro,
      buscarContas: buscarContasAposMutacao,
      mostrarAviso
    })
  }

  async function reativarSerieRecorrente(id) {
    if (!podeGerenciarRecorrencias()) {
      bloquearAcaoSemPermissao()
      return false
    }

    return reativarSerieRecorrenteHook({
      supabase,
      id,
      empresaId,
      avisarErro,
      buscarContas: buscarContasAposMutacao,
      mostrarAviso
    })
  }

  async function vincularContaManualRecorrencia({ contaId, recorrenciaId, dataVencimento, competencia } = {}) {
    if (!podeVincularRecorrencia()) {
      bloquearAcaoSemPermissao()
      return { data: null, error: null, bloqueado: true, codigo: 'SEM_PERMISSAO' }
    }
    if (!empresaId || !contaId || !recorrenciaId || !dataVencimento) {
      mostrarAviso('Dados insuficientes para vincular a conta manual.', 'erro')
      return { data: null, error: null, bloqueado: true, codigo: 'DADOS_INCOMPLETOS' }
    }

    const chaveOperacao = `${empresaId}:${contaId}:${recorrenciaId}:${dataVencimento}`
    if (vinculoManualRecorrenciaEmAndamentoRef.current.has(chaveOperacao)) {
      mostrarAviso('Vinculo em andamento para esta conta.', 'aviso')
      return { data: null, error: null, bloqueado: true, codigo: 'OPERACAO_EM_ANDAMENTO' }
    }

    vinculoManualRecorrenciaEmAndamentoRef.current.add(chaveOperacao)
    try {
      const resultado = await vincularContaManualRecorrenciaService(supabase, {
        empresaId,
        contaId,
        recorrenciaId,
        dataVencimento
      })

      if (resultado.error) {
        mostrarAviso(mensagemSeguraErro(resultado.error, 'Nao foi possivel vincular a conta manual.'), 'erro')
        return resultado
      }
      if (resultado.bloqueado) {
        mostrarAviso(resultado.mensagem || 'A conta manual nao pode ser vinculada.', 'aviso')
        return resultado
      }

      if (resultado.auditoriaNecessaria) {
        const auditoria = await registrarEventoAuditoriaSeguro(supabase, montarPayloadAuditoriaVinculoManual({
          empresaId,
          contaId,
          recorrenciaId,
          dataVencimento,
          competencia,
          correlationId: `financeiro.recorrencia.vinculo_manual:${contaId}:${recorrenciaId}:${Date.now()}`
        }), 'vinculo manual de recorrencia')
        if (auditoria.error) {
          mostrarAviso('Conta vinculada, mas a auditoria nao foi registrada. O estado foi atualizado.', 'aviso')
        } else {
          mostrarAviso('Conta manual vinculada a recorrencia.', 'sucesso')
        }
      } else {
        mostrarAviso('Conta ja estava vinculada a esta recorrencia.', 'info')
      }

      window.dispatchEvent(new CustomEvent('dna:fontes-financeiras-invalidar', {
        detail: { empresaId, origem: 'vinculo_manual_recorrencia' }
      }))
      try {
        await buscarContasAposMutacao()
      } catch (erroAtualizacao) {
        console.warn('Vinculo concluido, mas a atualizacao local das contas falhou.', {
          message: erroAtualizacao?.message
        })
        mostrarAviso('Conta vinculada. Atualize a tela para conferir o estado mais recente.', 'aviso')
      }
      return resultado
    } finally {
      vinculoManualRecorrenciaEmAndamentoRef.current.delete(chaveOperacao)
    }
  }

  async function gerarOcorrenciaRecorrencia({ recorrenciaId, dataVencimento, competencia } = {}) {
    if (!podeGerarRecorrencia()) {
      bloquearAcaoSemPermissao()
      return { data: null, error: null, bloqueado: true, codigo: 'SEM_PERMISSAO' }
    }
    if (!empresaId || !recorrenciaId || !dataVencimento) {
      mostrarAviso('Dados insuficientes para gerar a ocorrência.', 'erro')
      return { data: null, error: null, bloqueado: true, codigo: 'DADOS_INCOMPLETOS' }
    }

    const chaveOperacao = `${empresaId}:${recorrenciaId}:${dataVencimento}`
    if (geracaoControladaRecorrenciaEmAndamentoRef.current.has(chaveOperacao)) {
      mostrarAviso('A geração desta ocorrência já está em andamento.', 'aviso')
      return { data: null, error: null, bloqueado: true, codigo: 'OPERACAO_EM_ANDAMENTO' }
    }

    geracaoControladaRecorrenciaEmAndamentoRef.current.add(chaveOperacao)
    try {
      const resultado = await gerarOcorrenciaRecorrenciaService(supabase, {
        empresaId,
        recorrenciaId,
        dataVencimento,
        competencia,
        configuracao: {
          enviar_whatsapp: configWhatsapp,
          enviar_email: configEmail,
          enviar_push: configPush,
          dias_aviso: Number(diasAlertaContas || diasAvisoPadrao || 1)
        }
      })

      if (resultado.error) {
        mostrarAviso(mensagemSeguraErro(resultado.error, 'Não foi possível gerar a ocorrência.'), 'erro')
        return resultado
      }
      if (resultado.bloqueado) {
        mostrarAviso(resultado.mensagem || 'A ocorrência não pode ser gerada.', 'aviso')
        return resultado
      }

      if (resultado.auditoriaNecessaria) {
        const auditoria = await registrarEventoAuditoriaSeguro(
          supabase,
          montarPayloadAuditoriaGeracaoControlada({
            empresaId,
            contaId: resultado.data.id
          }),
          'geração controlada de recorrência'
        )
        if (auditoria.error) {
          mostrarAviso('Ocorrência criada, mas a auditoria não foi registrada. O estado foi atualizado.', 'aviso')
        } else {
          mostrarAviso('Ocorrência recorrente criada.', 'sucesso')
        }
      } else {
        mostrarAviso('A ocorrência já havia sido criada e foi reconciliada.', 'info')
      }

      window.dispatchEvent(new CustomEvent('dna:fontes-financeiras-invalidar', {
        detail: { empresaId, origem: 'geracao_controlada_recorrencia' }
      }))
      try {
        await buscarContasAposMutacao()
      } catch (erroAtualizacao) {
        console.warn('Ocorrência criada, mas a atualização local das contas falhou.', {
          message: erroAtualizacao?.message
        })
        mostrarAviso('Ocorrência criada. Atualize a tela para conferir o estado mais recente.', 'aviso')
      }
      return resultado
    } finally {
      geracaoControladaRecorrenciaEmAndamentoRef.current.delete(chaveOperacao)
    }
  }

  // =========================
  // BLOCO 8 — AÇÕES NOTAS
  // =========================
  function abrirNovaNota() {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return
    }

    return abrirNovaNotaHook({
      setMenuAberto,
      setMenuNavegacaoAberto
    })
  }

  function abrirEdicaoNota(nota) {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return
    }

    return abrirEdicaoNotaHook(nota)
  }

  function fecharNota() {
    return fecharNotaHook()
  }

  async function salvarNota() {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return
    }

    return salvarNotaHook({
      supabase,
      empresaId,
      mostrarAviso,
      avisarErro,
      buscarNotas
    })
  }

  async function excluirNota(id) {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return
    }

    return excluirNotaHook({
      supabase,
      id,
      empresaId,
      avisarErro,
      buscarNotas,
      buscarLixeira,
      mostrarAviso
    })
  }


  async function alternarNotaConcluida(nota) {
    if (!podeEditarFinanceiro()) {
      bloquearAcaoSemPermissao()
      return
    }

    return alternarNotaConcluidaHook({
      supabase,
      nota,
      empresaId,
      avisarErro,
      buscarNotas,
      mostrarAviso
    })
  }



  // =========================
  // BLOCO — AÇÕES CONFIGURAÇÕES
  // =========================
  async function salvarConfiguracoes() {
    if (!podeEditarConfiguracoes()) {
      bloquearAcaoSemPermissao()
      return
    }

    if (!empresaId) {
      mostrarAviso('Usuário sem empresa vinculada.', 'erro')
      return
    }

    const dias = Number(diasAvisoPadrao)
    const diasContas = Number(diasAlertaContas)
    const diasNotas = Number(diasAlertaNotas)

    if (isNaN(dias) || dias < 0 || isNaN(diasContas) || diasContas < 0 || isNaN(diasNotas) || diasNotas < 0) {
      mostrarAviso('Informe uma quantidade válida para os dias de alerta.', 'erro')
      return
    }

    const payload = {
      notificacoes_ativas: notificacoesAtivas,
      enviar_whatsapp: configWhatsapp,
      enviar_email: configEmail,
      enviar_push: configPush,
      dias_aviso_padrao: dias,
      nome_empresa: nomeEmpresa.trim() || null,
      whatsapp_padrao: whatsappPadrao.trim() || null,
      email_padrao: emailPadrao.trim() || null,
      empresa_id: empresaId
    }

    let resposta

    if (configuracoes?.id) {
      resposta = await supabase
        .from('df_configuracoes')
        .update(payload)
        .eq('id', configuracoes.id)
        .eq('empresa_id', empresaId)
        .select()
    } else {
      resposta = await supabase
        .from('df_configuracoes')
        .insert([payload])
        .select()
    }

    if (resposta.error) {
      avisarErro(resposta.error)
      return
    }

    const configSalva = Array.isArray(resposta.data) ? resposta.data[0] : resposta.data
    setConfiguracoes(configSalva)

    const { error: erroAlertas } = await supabase
      .from('df_configuracoes_alertas')
      .upsert([{
        empresa_id: empresaId,
        dias_alerta_contas: diasContas,
        alertar_contas_vencidas: alertarContasVencidas,
        destacar_contas_criticas: destacarContasCriticas,
        dias_alerta_notas: diasNotas,
        destacar_notas_urgentes: destacarNotasUrgentes
      }], { onConflict: 'empresa_id' })

    if (erroAlertas) {
      console.warn('Falha ao salvar alertas globais:', erroAlertas)
      mostrarAviso(mensagemSeguraErro(erroAlertas, 'Configurações principais salvas, mas os alertas globais não foram atualizados. Tente novamente.'), 'erro')
      return
    }

    mostrarAviso('Configurações salvas com sucesso.', 'info')
  }

  // =========================
  // BLOCO 9 — AÇÕES LIXEIRA
  // =========================
  async function restaurarConta(id) {
    if (!podeGerenciarLixeira()) {
      bloquearAcaoSemPermissao()
      return
    }

    const { error } = await supabase
      .from('df_contas')
      .update({
        excluido: false,
        excluido_em: null
      })
      .eq('id', id)
      .eq('empresa_id', empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    void buscarContasAposMutacao()
    buscarLixeira()
    mostrarAviso('Conta restaurada com sucesso.', 'sucesso')
  }

  async function restaurarNota(id) {
    if (!podeGerenciarLixeira()) {
      bloquearAcaoSemPermissao()
      return
    }

    return restaurarNotaHook({
      supabase,
      id,
      empresaId,
      avisarErro,
      buscarNotas,
      buscarLixeira,
      mostrarAviso
    })
  }

  async function excluirContaDefinitivo(conta) {
    if (!podeExcluirDefinitivoFinanceiro()) {
      bloquearAcaoSemPermissao()
      return
    }

    const { data: contaAtual, error: consultaError } = await supabase
      .from('df_contas')
      .select('id, excluido, excluido_em')
      .eq('id', conta.id)
      .eq('empresa_id', empresaId)
      .maybeSingle()

    if (consultaError) {
      avisarErro(consultaError)
      return
    }

    const retencao = obterEstadoRetencaoLixeira(contaAtual?.excluido_em)
    if (!contaAtual?.excluido || !retencao.elegivel) {
      mostrarAviso(
        `A exclusão definitiva será liberada em ${retencao.diasRestantes} dia(s).`,
        'aviso',
      )
      await buscarLixeira()
      return
    }

    const { data: excluida, error } = await excluirContaPermanentemente(
      supabase,
      conta.id,
      empresaId,
    )

    if (error) {
      avisarErro(error)
      return
    }

    if (!excluida?.excluida) {
      mostrarAviso('A conta não está mais elegível para exclusão definitiva.', 'aviso')
      await buscarLixeira()
      return
    }

    await buscarLixeira()
    mostrarAviso('Conta excluída definitivamente.', 'sucesso')
  }

  async function excluirNotaDefinitivo(nota) {
    if (!podeExcluirDefinitivoFinanceiro()) {
      bloquearAcaoSemPermissao()
      return
    }

    return excluirNotaDefinitivoHook({
      supabase,
      nota,
      empresaId,
      avisarErro,
      buscarLixeira,
      mostrarAviso
    })
  }

  // =========================
  // BLOCO 10 — AÇÕES CENTROS
  // =========================
  async function salvarCentro() {
    if (!podeGerenciarCentroCusto()) {
      bloquearAcaoSemPermissao()
      return
    }

    if (!empresaId) {
      mostrarAviso('Usuário sem empresa vinculada.', 'erro')
      return
    }

    const nomeCentro = primeiraLetraMaiuscula(novoCentro.trim())

    if (!nomeCentro) {
      mostrarAviso('Digite o centro de custo.', 'erro')
      return
    }

    const centroDuplicado = centros.some((centro) =>
      String(centro.nome || '').trim().toLowerCase() === nomeCentro.toLowerCase()
    )

    if (centroDuplicado) {
      mostrarAviso('Este centro de custo já existe nesta empresa.', 'erro')
      return
    }

    const { data, error } = await supabase
      .from('df_centros_custo')
      .insert([{ nome: nomeCentro, empresa_id: empresaId }])
      .select('*')
      .single()

    if (error) {
      avisarErro(error)
      return
    }

    setNovoCentro('')
    setCentros((listaAtual) => {
      const listaSemDuplicidade = listaAtual.filter((centro) => centro.id !== data.id)
      return [...listaSemDuplicidade, data].sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')))
    })
    await buscarCentros(empresaId)
    mostrarAviso('Centro de custo criado com sucesso.', 'sucesso')
  }

  function abrirModalCentro() {
    if (!podeGerenciarCentroCusto()) {
      bloquearAcaoSemPermissao()
      return
    }

    setModalCentro(true)
  }

  async function excluirCentro(id) {
    if (!podeGerenciarCentroCusto()) {
      bloquearAcaoSemPermissao()
      return
    }

    if (!empresaId) {
      mostrarAviso('Usuário sem empresa vinculada.', 'erro')
      return
    }

    try {
      const usoCentro = await verificarUsoCentroCusto(supabase, id, empresaId)

      if (usoCentro.emUso) {
        mostrarAviso('Este centro de custo não pode ser excluído porque existem contas ou recorrências vinculadas.', 'erro')
        return
      }
    } catch (error) {
      console.warn('Falha ao verificar uso do centro de custo:', error)
      mostrarAviso('Não foi possível verificar se o centro de custo está em uso. Tente novamente.', 'erro')
      return
    }

    const { error } = await supabase
      .from('df_centros_custo')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId)

    if (error) {
      mostrarAviso('Não foi possível excluir. Verifique se existem contas usando este centro.', 'erro')
      return
    }

    buscarCentros()
    buscarContas()
  }

  // =========================
  // BLOCO 10 — EXPORTAÇÕES
  // =========================
  function criarModeloAtualContas(criarModeloExportacaoContas) {
    const statusLabel = {
      pendentes: 'Em aberto', vencidas: 'Vencidas', futuras: 'Futuras', pagas: 'Pagas',
      ocultas: 'Ocultas', excluidas: 'Excluídas', todas: 'Todos'
    }[filtroStatus] || filtroStatus
    const horizonteLabel = {
      '30_dias': '30 dias', '90_dias': '90 dias', '6_meses': '6 meses', '12_meses': '12 meses', todos: 'Todos'
    }[filtroHorizonte] || filtroHorizonte
    return criarModeloExportacaoContas({
      registros: contasFiltradas,
      filtros: {
        dataInicial,
        dataFinal,
        horizonteLabel,
        statusLabel,
        filialNome: filiais.find((filial) => filial.id === filtroFilial)?.nome || 'Todas as filiais',
        centroNome: centros.find((centro) => centro.id === filtroCentro)?.nome || 'Todos',
        mesLabel: filtroMes || '',
        busca
      }
    })
  }

  async function exportarCSV() {
    if (!podeExportarDados()) {
      bloquearAcaoSemPermissao()
      return
    }

    const { criarModeloExportacaoContas, criarNomeArquivoContas, exportarContasCsv } = await import('./services/export/contasExportService.js')
    const modelo = criarModeloAtualContas(criarModeloExportacaoContas)
    exportarContasCsv({
      modelo,
      filename: criarNomeArquivoContas({ dataInicial, dataFinal, extensao: 'csv' })
    })
  }

  async function exportarPdfExecutivoContas() {
    if (!podeExportarDados()) {
      bloquearAcaoSemPermissao()
      return
    }
    const { criarModeloExportacaoContas, criarNomeArquivoContas, exportarContasPdf } = await import('./services/export/contasExportService.js')
    const modelo = criarModeloAtualContas(criarModeloExportacaoContas)
    exportarContasPdf({
      modelo,
      filename: criarNomeArquivoContas({ dataInicial, dataFinal, extensao: 'pdf' })
    })
  }

  function exportarExcel() {
    if (!podeExportarDados()) {
      bloquearAcaoSemPermissao()
      return
    }

    const escapeHtml = (valor) => String(valor ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')

    const cabecalho = [
      'Descricao',
      'Valor previsto',
      'Valor pago',
      'Encargos',
      'Desconto',
      'Data pagamento',
      'Observacao pagamento',
      'Vencimento',
      'Status',
      'Filial',
      'Centro'
    ]

    const linhas = contasFiltradas.map((conta) => {
      const valorPrevisto = Number(conta.valor || 0)
      const valorPago = conta.status === 'pago' ? Number(conta.valor_pago ?? conta.valor ?? 0) : ''

      return [
        conta.descricao || '',
        formatarValor(valorPrevisto),
        valorPago === '' ? '' : formatarValor(valorPago),
        formatarValor(conta.juros_multa || 0),
        formatarValor(conta.desconto || 0),
        conta.data_pagamento ? formatarData(conta.data_pagamento) : '',
        conta.observacao_pagamento || '',
        formatarData(conta.data_vencimento),
        estaVencida(conta.data_vencimento, conta.status) ? 'vencido' : conta.status,
        conta.df_filiais?.nome || '',
        conta.df_centros_custo?.nome || ''
      ]
    })

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
            th { background: #f0fdfa; color: #0f766e; font-weight: 700; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>${cabecalho.map((campo) => `<th>${escapeHtml(campo)}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${linhas.map((linha) => `<tr>${linha.map((campo) => `<td>${escapeHtml(campo)}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>`

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'relatorio-contas.xls'
    link.click()

    URL.revokeObjectURL(url)
  }

  function imprimirPDF() {
    if (!podeExportarDados()) {
      bloquearAcaoSemPermissao()
      return
    }

    const escapeHtml = (valor) => String(valor ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')

    const linhas = contasFiltradas.map((conta) => {
      const status = estaVencida(conta.data_vencimento, conta.status)
        ? 'Vencido'
        : conta.status === 'pago'
          ? 'Pago'
          : 'Pendente'
      const valorPago = conta.status === 'pago' ? Number(conta.valor_pago ?? conta.valor ?? 0) : null
      const jurosMulta = Number(conta.juros_multa || 0)
      const descontoPagamento = Number(conta.desconto || 0)

      return `
        <tr>
          <td class="col-conta">
            <strong>${escapeHtml(conta.descricao || '-')}</strong>
            ${conta.observacao ? `<small>Obs: ${escapeHtml(conta.observacao)}</small>` : ''}
            ${conta.observacao_pagamento ? `<small>Obs. pagamento: ${escapeHtml(conta.observacao_pagamento)}</small>` : ''}
          </td>
          <td class="col-filial">${escapeHtml(conta.df_filiais?.nome || '-')}</td>
          <td class="col-centro">${escapeHtml(conta.df_centros_custo?.nome || '-')}</td>
          <td class="col-data">${escapeHtml(formatarData(conta.data_vencimento))}</td>
          <td class="col-data">${escapeHtml(conta.data_pagamento ? formatarData(conta.data_pagamento) : '-')}</td>
          <td class="col-status"><span class="status ${status.toLowerCase()}">${status}</span></td>
          <td class="valor">${escapeHtml(formatarValor(conta.valor))}</td>
          <td class="valor">${valorPago == null ? '-' : escapeHtml(formatarValor(valorPago))}</td>
          <td class="valor">${jurosMulta > 0 ? escapeHtml(formatarValor(jurosMulta)) : '-'}</td>
          <td class="valor">${descontoPagamento > 0 ? escapeHtml(formatarValor(descontoPagamento)) : '-'}</td>
        </tr>
      `
    }).join('')

    const dataEmissao = new Date()
    const dataEmissaoFormatada = dataEmissao.toLocaleString('pt-BR')

    const html = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Contas — resultado exibido</title>
          <style>
            * { box-sizing: border-box; }
            @page { size: A4 landscape; margin: 8mm; }
            html, body { width: 100%; min-height: 100%; }
            body { margin: 0; font-family: Arial, sans-serif; color: #111827; background: #f8fafc; -webkit-text-size-adjust: 100%; }
            .page { width: 100%; max-width: 100%; margin: 0 auto; padding: 14px; background: #fff; min-height: 100vh; overflow: visible; }
            header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 14px; align-items: start; border-bottom: 2px solid #ccfbf1; padding-bottom: 12px; margin-bottom: 12px; }
            .brand { color: #0f766e; font-size: 11px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
            h1 { margin: 3px 0 0; font-size: 22px; color: #0f172a; }
            .subtitle { margin-top: 4px; color: #475569; font-size: 12px; font-weight: 700; }
            .empresa { margin-top: 5px; color: #475569; font-size: 13px; }
            .data { text-align: right; color: #64748b; font-size: 12px; }
            .summary { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; margin: 12px 0; }
            .box { border: 1px solid #e5e7eb; border-radius: 12px; padding: 9px; background: #f8fafc; min-width: 0; }
            .box span { display: block; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; }
            .box strong { display: block; margin-top: 3px; font-size: 13px; overflow-wrap: anywhere; }
            .table-wrap { width: 100%; max-width: 100%; overflow: visible; border: 1px solid #e5e7eb; border-radius: 12px; }
            footer { margin-top: 12px; padding-top: 10px; border-top: 1px solid #e5e7eb; color: #64748b; font-size: 11px; display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
            table { width: 100%; max-width: 100%; border-collapse: collapse; table-layout: fixed; }
            col.col-conta { width: 22%; }
            col.col-filial { width: 10%; }
            col.col-centro { width: 11%; }
            col.col-data { width: 8%; }
            col.col-status { width: 8%; }
            col.col-valor { width: 8%; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            tr { break-inside: avoid; page-break-inside: avoid; }
            th { background: #f0fdfa; color: #0f766e; text-align: left; padding: 7px 6px; font-size: 9px; text-transform: uppercase; letter-spacing: .02em; line-height: 1.15; overflow-wrap: anywhere; }
            td { border-bottom: 1px solid #e5e7eb; padding: 7px 6px; vertical-align: top; font-size: 10px; line-height: 1.25; overflow-wrap: anywhere; word-break: break-word; }
            td strong { display: block; overflow-wrap: anywhere; word-break: break-word; }
            td small { display: block; color: #64748b; margin-top: 4px; line-height: 1.35; }
            .valor { text-align: right; font-weight: 700; white-space: normal; overflow-wrap: anywhere; }
            .status { display: inline-block; max-width: 100%; padding: 3px 6px; border-radius: 999px; font-size: 9px; font-weight: 800; line-height: 1.1; overflow-wrap: anywhere; }
            .status.pago { background: #dcfce7; color: #166534; }
            .status.pendente { background: #fef3c7; color: #92400e; }
            .status.vencido { background: #fee2e2; color: #991b1b; }
            .toolbar { position: sticky; top: 0; display: flex; justify-content: flex-end; gap: 10px; margin: -18px -18px 14px; padding: 12px 18px; background: rgba(255,255,255,.96); border-bottom: 1px solid #e5e7eb; z-index: 5; }
            button { border: 1px solid #d1d5db; background: #fff; color: #374151; border-radius: 999px; padding: 10px 14px; font-weight: 800; cursor: pointer; font-size: 13px; }
            button.primary { background: #0f766e; border-color: #0f766e; color: white; }
            @media print {
              body { background: #fff; }
              .page { margin: 0; border: 0; border-radius: 0; max-width: none; padding: 0; }
              .toolbar { display: none; }
              .table-wrap { border-radius: 0; }
            }
            @media (max-width: 760px) {
              .page { width: 100%; margin: 0; border-radius: 0; padding: 16px; }
              .toolbar { margin: -16px -16px 14px; padding: 12px 16px; justify-content: space-between; }
              header { display: block; }
              h1 { font-size: 22px; }
              .data { text-align: left; margin-top: 8px; }
              .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .box strong { font-size: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="toolbar">
              <button onclick="window.close()">Fechar</button>
              <button class="primary" onclick="window.print()">Imprimir / salvar PDF</button>
            </div>
            <header>
              <div>
                <div class="brand">DNA Gestão</div>
                <h1>Contas — resultado exibido</h1>
                <div class="subtitle">Documento gerencial para conferência de contas, valores e situação operacional.</div>
                <div class="empresa">${escapeHtml(nomeEmpresa || 'Empresa não identificada')}</div>
              </div>
              <div class="data">Emitido em ${escapeHtml(dataEmissaoFormatada)}<br/>${contasFiltradas.length} conta(s) listada(s)</div>
            </header>
            <section class="summary">
              <div class="box"><span>Previsto</span><strong>${escapeHtml(formatarValor(total))}</strong></div>
              <div class="box"><span>Realizado</span><strong>${escapeHtml(formatarValor(pago))}</strong></div>
              <div class="box"><span>Pendente</span><strong>${escapeHtml(formatarValor(pendente))}</strong></div>
              <div class="box"><span>Vencido</span><strong>${escapeHtml(formatarValor(vencido))}</strong></div>
              <div class="box"><span>Encargos</span><strong>${escapeHtml(formatarValor(encargos))}</strong></div>
              <div class="box"><span>Descontos</span><strong>${escapeHtml(formatarValor(descontos))}</strong></div>
            </section>
            <div class="table-wrap">
              <table>
                <colgroup>
                  <col class="col-conta" />
                  <col class="col-filial" />
                  <col class="col-centro" />
                  <col class="col-data" />
                  <col class="col-data" />
                  <col class="col-status" />
                  <col class="col-valor" />
                  <col class="col-valor" />
                  <col class="col-valor" />
                  <col class="col-valor" />
                </colgroup>
                <thead>
                  <tr><th>Conta</th><th>Filial</th><th>Centro</th><th>Vencimento</th><th>Pagamento</th><th>Situação</th><th>Previsto</th><th>Realizado</th><th>Encargos</th><th>Desconto</th></tr>
                </thead>
                <tbody>
                  ${linhas || '<tr><td colspan="10">Nenhuma conta encontrada.</td></tr>'}
                </tbody>
              </table>
            </div>
            <footer>
              <span>DNA Gestão • Documento para conferência interna.</span>
              <span>Emitido em ${escapeHtml(dataEmissaoFormatada)}</span>
            </footer>
          </div>
        </body>
      </html>
    `

    const janela = window.open('', '_blank')
    if (!janela) {
      mostrarAviso('O navegador bloqueou a visualização do PDF. Permita pop-ups para abrir o relatório.', 'erro')
      return
    }

    janela.document.open()
    janela.document.write(html)
    janela.document.close()
  }


  const limparFiltros = useCallback(() => {
    setBusca('')
    setFiltroStatus('pendentes')
    setFiltroHorizonte('todos')
    setFiltroCentro('')
    setFiltroFilial('')
    setFiltroMes('')
    setDataInicial('')
    setDataFinal('')
    limparConsultasSecundarias()
  }, [limparConsultasSecundarias, setFiltroHorizonte])



  const abrirConfirmacao = useCallback(({ titulo, mensagem, textoConfirmar = 'Confirmar', tipo = 'padrao', acao }) => {
    setConfirmacao({
      aberto: true,
      titulo,
      mensagem,
      textoConfirmar,
      tipo,
      acao
    })
  }, [setConfirmacao])

  const fecharConfirmacao = useCallback(() => {
    setConfirmacao({
      aberto: false,
      titulo: '',
      mensagem: '',
      textoConfirmar: 'Confirmar',
      tipo: 'padrao',
      acao: null
    })
  }, [setConfirmacao])

  const executarConfirmacao = useCallback(async () => {
    if (typeof confirmacao.acao === 'function') {
      await confirmacao.acao()
    }

    fecharConfirmacao()
  }, [confirmacao.acao, fecharConfirmacao])



  function normalizarChaveExcel(chave) {
    return String(chave || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  function obterCampoExcel(linha, nomesPossiveis) {
    const entradas = Object.entries(linha || {})
    for (const nome of nomesPossiveis) {
      const alvo = normalizarChaveExcel(nome)
      const encontrado = entradas.find(([chave]) => normalizarChaveExcel(chave) === alvo)
      if (encontrado) return encontrado[1]
    }
    return ''
  }

  function normalizarTextoImportacao(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
  }

  function normalizarNomeImportacao(valor) {
    return String(valor || '').trim().replace(/\s+/g, ' ')
  }

  function chaveNomeImportacao(valor) {
    return normalizarTextoImportacao(valor)
  }

  function valorEmCentavosImportacao(valor) {
    const numero = Number(valor)
    if (!Number.isFinite(numero)) return null
    return Math.round(numero * 100)
  }

  function chaveDuplicidadeImportacao(conta, empresaIdFallback = empresaId) {
    const empresa = String(conta?.empresa_id || empresaIdFallback || '').trim()
    const descricao = normalizarTextoImportacao(conta?.descricao)
    const valorCentavos = valorEmCentavosImportacao(conta?.valor)
    const dataVencimento = String(conta?.data_vencimento || conta?.vencimento || '').trim()
    const centroCustoId = conta?.centro_custo_id || 'sem-centro'
    const filialId = conta?.filial_id || 'sem-filial'

    if (!empresa || !descricao || valorCentavos === null || !dataVencimento) return null

    return [
      empresa,
      descricao,
      valorCentavos,
      dataVencimento,
      centroCustoId,
      filialId
    ].join('|')
  }

  function dataIsoValida(valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || ''))) return false

    const [ano, mes, dia] = String(valor).split('-').map(Number)
    const data = new Date(Date.UTC(ano, mes - 1, dia))

    return data.getUTCFullYear() === ano
      && data.getUTCMonth() === mes - 1
      && data.getUTCDate() === dia
  }

  function converterDataExcel(valor) {
    if (valor === null || valor === undefined || valor === '') return null

    let dataBanco = null
    if (typeof valor === 'number') {
      const base = new Date(Date.UTC(1899, 11, 30))
      base.setUTCDate(base.getUTCDate() + valor)
      dataBanco = base.toISOString().slice(0, 10)
      return dataIsoValida(dataBanco) ? dataBanco : null
    }

    const texto = String(valor).trim()
    if (!texto) return null

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      dataBanco = texto
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
      const [dia, mes, ano] = texto.split('/')
      dataBanco = `${ano}-${mes}-${dia}`
    } else {
      dataBanco = formatarDataParaBanco(texto)
    }

    return dataIsoValida(dataBanco) ? dataBanco : null
  }

  function converterValorExcel(valor) {
    if (typeof valor === 'number') {
      return Number.isFinite(valor) && valor !== 0 ? valor : null
    }

    const texto = String(valor || '').replace(/[^\d,.-]/g, '').trim()
    if (!texto || texto === '-' || texto === ',' || texto === '.') return null

    const ultimaVirgula = texto.lastIndexOf(',')
    const ultimoPonto = texto.lastIndexOf('.')
    let normalizado = texto

    if (ultimaVirgula >= 0 && ultimoPonto >= 0) {
      normalizado = ultimaVirgula > ultimoPonto
        ? texto.replace(/\./g, '').replace(/,/g, '.')
        : texto.replace(/,/g, '')
    } else if (ultimaVirgula >= 0) {
      normalizado = texto.replace(',', '.')
    } else if (ultimoPonto >= 0) {
      const partes = texto.split('.')
      const pontosParecemMilhar = partes.length > 1 && partes.slice(1).every((parte) => /^\d{3}$/.test(parte))
      normalizado = pontosParecemMilhar ? texto.replace(/\./g, '') : texto
    }

    const numero = Number(normalizado)
    return Number.isFinite(numero) && numero !== 0 ? numero : null
  }

  function converterStatusImportacao(valor) {
    const status = normalizarTextoImportacao(valor)
    if (!status) return 'pendente'

    if (['pago', 'paga', 'quitado', 'quitada', 'recebido', 'recebida'].includes(status)) {
      return 'pago'
    }

    if (['pendente', 'a pagar', 'nao pago', 'aberto', 'em aberto'].includes(status)) {
      return 'pendente'
    }

    return null
  }

  function detectarDelimitadorCsv(texto) {
    const linhas = String(texto || '')
      .replace(/^\uFEFF/, '')
      .replace(/^﻿/, '')
      .split(/\r?\n/)
      .filter((linha) => linha.trim())

    const linhaComPontoEVirgula = linhas.find((linha) => linha.includes(';'))
    return linhaComPontoEVirgula ? ';' : ','
  }

  function separarLinhaCsv(linha, delimitador) {
    const resultado = []
    let atual = ''
    let dentroDeAspas = false

    for (let i = 0; i < linha.length; i += 1) {
      const char = linha[i]
      const proximo = linha[i + 1]

      if (char === '"' && proximo === '"') {
        atual += '"'
        i += 1
        continue
      }

      if (char === '"') {
        dentroDeAspas = !dentroDeAspas
        continue
      }

      if (char === delimitador && !dentroDeAspas) {
        resultado.push(atual.trim())
        atual = ''
        continue
      }

      atual += char
    }

    resultado.push(atual.trim())
    return resultado
  }

  function csvParaJson(texto) {
    const textoLimpo = String(texto || '')
      .replace(/^\uFEFF/, '')
      .replace(/^﻿/, '')

    const linhas = textoLimpo
      .split(/\r?\n/)
      .filter((linha) => linha.trim())

    if (linhas.length < 2) return []

    const delimitador = detectarDelimitadorCsv(textoLimpo)
    const cabecalho = separarLinhaCsv(linhas[0], delimitador)

    return linhas.slice(1).map((linha) => {
      const valores = separarLinhaCsv(linha, delimitador)
      return cabecalho.reduce((obj, chave, index) => {
        obj[chave] = valores[index] || ''
        return obj
      }, {})
    })
  }

  function descreverErroLinhaImportacao(linha) {
    const problemas = []
    if (!linha.descricao) problemas.push('descrição')
    if (!Number.isFinite(linha.valor) || linha.valor === 0) problemas.push('valor')
    if (!linha.data_vencimento) problemas.push('vencimento')
    if (!linha.status) problemas.push('status')

    return problemas.length > 0
      ? `Linha ${linha.linha}: confira ${problemas.join(', ')}.`
      : ''
  }

  function prepararLinhaImportacao(linha, index) {
    const descricaoExcel = obterCampoExcel(linha, ['descricao', 'descrição', 'conta', 'nome', 'fornecedor'])
    const valorExcel = obterCampoExcel(linha, ['valor', 'valor pago', 'total'])
    const vencimentoExcel = obterCampoExcel(linha, ['vencimento', 'data vencimento', 'data_vencimento', 'data'])
    const statusExcel = obterCampoExcel(linha, ['status', 'situacao', 'situação'])
    const centroExcel = obterCampoExcel(linha, ['centro', 'centro de custo', 'categoria', 'setor'])
    const filialExcel = obterCampoExcel(linha, ['filial', 'loja', 'unidade'])

    const preparada = {
      linha: index + 2,
      descricao: primeiraLetraMaiuscula(normalizarNomeImportacao(descricaoExcel)),
      valor: converterValorExcel(valorExcel),
      data_vencimento: converterDataExcel(vencimentoExcel),
      status: converterStatusImportacao(statusExcel),
      centro: normalizarNomeImportacao(centroExcel),
      filial: normalizarNomeImportacao(filialExcel)
    }

    const erro = descreverErroLinhaImportacao(preparada)

    return {
      ...preparada,
      valida: !erro,
      erro
    }
  }

  async function lerArquivoExcel(event) {
    const file = event.target.files?.[0]
    setArquivoImportacao(file || null)
    setLinhasImportacao([])
    setStatusImportacao('')

    if (!file) return

    const extensao = file.name.split('.').pop()?.toLowerCase()

    if (extensao !== 'csv') {
      setStatusImportacao('Importe um arquivo CSV. No Excel, use: Arquivo > Salvar como > CSV UTF-8.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const linhas = csvParaJson(e.target.result)

      const preparadas = linhas
        .filter((linha) => Object.values(linha || {}).some((valor) => String(valor || '').trim()))
        .map(prepararLinhaImportacao)

      setLinhasImportacao(preparadas)

      const primeiraInvalida = preparadas.find((linha) => !linha.valida)
      if (primeiraInvalida) {
        setStatusImportacao(`Planilha com erro. ${primeiraInvalida.erro}`)
      } else {
        setStatusImportacao(`${preparadas.length} linha(s) preparada(s) para revisão.`)
      }
    }

    reader.readAsText(file, 'UTF-8')
  }

  async function importarExcelParaContas() {
    if (!podeImportarContas()) {
      mostrarAviso('Seu perfil atual não permite importar contas.', 'erro')
      return
    }

    if (!empresaId) {
      mostrarAviso('Usuário sem empresa vinculada.', 'erro')
      return
    }

    if (linhasImportacao.length === 0) {
      mostrarAviso('Nenhuma linha válida encontrada para importar.', 'erro')
      return
    }

    const invalidas = linhasImportacao.filter((linha) => !linha.valida)
    if (invalidas.length > 0) {
      mostrarAviso(`Há erro na planilha. ${invalidas[0].erro} Corrija e importe novamente.`, 'erro')
      return
    }

    const centrosCriados = {
      ...Object.fromEntries(centros.map((centro) => [chaveNomeImportacao(centro.nome), centro.id]).filter(([chave, id]) => chave && id))
    }
    const filiaisCriadas = {
      ...Object.fromEntries((filiais || []).map((filial) => [chaveNomeImportacao(filial.nome), filial.id]).filter(([chave, id]) => chave && id))
    }

    for (const linha of linhasImportacao) {
      const chaveFilial = chaveNomeImportacao(linha.filial)
      const chaveCentro = chaveNomeImportacao(linha.centro)

      if (linha.filial && !filiaisCriadas[chaveFilial]) {
        const { data, error } = await supabase
          .from('df_filiais')
          .insert([{ nome: primeiraLetraMaiuscula(linha.filial), empresa_id: empresaId }])
          .select()

        if (error) {
          avisarErro(error)
          return
        }

        const filialNova = Array.isArray(data) ? data[0] : data
        if (!filialNova?.id) {
          mostrarAviso(`Não foi possível preparar a filial informada na linha ${linha.linha}.`, 'erro')
          return
        }

        filiaisCriadas[chaveFilial] = filialNova.id
      }

      if (linha.centro && !centrosCriados[chaveCentro]) {
        const { data, error } = await supabase
          .from('df_centros_custo')
          .insert([{ nome: primeiraLetraMaiuscula(linha.centro), empresa_id: empresaId }])
          .select()

        if (error) {
          avisarErro(error)
          return
        }

        const centroNovo = Array.isArray(data) ? data[0] : data
        if (!centroNovo?.id) {
          mostrarAviso(`Não foi possível preparar o centro de custo informado na linha ${linha.linha}.`, 'erro')
          return
        }

        centrosCriados[chaveCentro] = centroNovo.id
      }
    }

    const linhaSemCentroResolvido = linhasImportacao.find((linha) => linha.centro && !centrosCriados[chaveNomeImportacao(linha.centro)])
    if (linhaSemCentroResolvido) {
      mostrarAviso(`Não foi possível vincular o centro de custo informado na linha ${linhaSemCentroResolvido.linha}.`, 'erro')
      return
    }

    const linhaSemFilialResolvida = linhasImportacao.find((linha) => linha.filial && !filiaisCriadas[chaveNomeImportacao(linha.filial)])
    if (linhaSemFilialResolvida) {
      mostrarAviso(`Não foi possível vincular a filial informada na linha ${linhaSemFilialResolvida.linha}.`, 'erro')
      return
    }

    const itensImportacao = linhasImportacao.map((linha) => {
      const conta = {
        descricao: linha.descricao,
        valor: linha.valor,
        data_vencimento: linha.data_vencimento,
        vencimento: linha.data_vencimento,
        status: linha.status,
        centro_custo_id: linha.centro ? centrosCriados[chaveNomeImportacao(linha.centro)] : null,
        filial_id: linha.filial ? filiaisCriadas[chaveNomeImportacao(linha.filial)] : null,
        enviar_whatsapp: configWhatsapp,
        enviar_email: configEmail,
        enviar_push: configPush,
        dias_aviso: Number(diasAvisoPadrao || 1),
        empresa_id: empresaId
      }

      return {
        linha,
        conta,
        chaveDuplicidade: chaveDuplicidadeImportacao(conta, empresaId)
      }
    })

    const itemSemChaveDuplicidade = itensImportacao.find((item) => !item.chaveDuplicidade)
    if (itemSemChaveDuplicidade) {
      mostrarAviso(`Não foi possível verificar duplicidade na linha ${itemSemChaveDuplicidade.linha.linha}. Corrija e importe novamente.`, 'erro')
      return
    }

    const chavesCsv = new Set()
    const itensUnicosCsv = []
    let duplicadasInternas = 0

    for (const item of itensImportacao) {
      if (chavesCsv.has(item.chaveDuplicidade)) {
        duplicadasInternas += 1
        continue
      }

      chavesCsv.add(item.chaveDuplicidade)
      itensUnicosCsv.push(item)
    }

    const datasImportacao = [...new Set(itensUnicosCsv.map((item) => item.conta.data_vencimento).filter(Boolean))].sort()
    let consultaDuplicidades = supabase
      .from('df_contas')
      .select('id, descricao, valor, data_vencimento, centro_custo_id, filial_id, empresa_id')
      .eq('empresa_id', empresaId)
      .or('excluido.is.null,excluido.eq.false')

    if (datasImportacao[0]) {
      consultaDuplicidades = consultaDuplicidades.gte('data_vencimento', datasImportacao[0])
    }

    if (datasImportacao[datasImportacao.length - 1]) {
      consultaDuplicidades = consultaDuplicidades.lte('data_vencimento', datasImportacao[datasImportacao.length - 1])
    }

    const { data: contasExistentes, error: erroDuplicidades } = await consultaDuplicidades
    if (erroDuplicidades) {
      mostrarAviso('Não foi possível verificar duplicidades. Tente novamente.', 'erro')
      return
    }

    const chavesExistentes = new Set(
      (contasExistentes || [])
        .map((conta) => chaveDuplicidadeImportacao(conta, empresaId))
        .filter(Boolean)
    )

    const itensNovos = itensUnicosCsv.filter((item) => !chavesExistentes.has(item.chaveDuplicidade))
    const duplicadasBanco = itensUnicosCsv.length - itensNovos.length
    const totalDuplicadas = duplicadasInternas + duplicadasBanco
    const payload = itensNovos.map((item) => item.conta)

    if (payload.length === 0) {
      const mensagemSemNovas = 'Nenhuma conta nova para importar. Todas as linhas já existiam ou estavam duplicadas.'
      setStatusImportacao(mensagemSemNovas)
      mostrarAviso(mensagemSemNovas, 'info')
      return
    }

    const { error } = await supabase.from('df_contas').insert(payload)
    if (error) {
      avisarErro(error)
      return
    }

    await registrarEventoAuditoriaSeguro(supabase, {
      empresa_id: empresaId,
      acao: 'financeiro.importacao.contas_concluida',
      entidade_tipo: 'df_empresas',
      entidade_id: empresaId,
      modulo: 'financeiro',
      origem: 'app',
      severidade: 'alta',
      status: 'sucesso',
      dados_antes: null,
      dados_depois: { aceitas: payload.length, duplicadas: totalDuplicadas },
      metadados: { empresa_id: empresaId }
    }, 'importação de contas')

    const mensagemSucesso = totalDuplicadas > 0
      ? `Importação concluída: ${payload.length} conta(s) importada(s), ${totalDuplicadas} duplicada(s) ignorada(s).`
      : `${payload.length} conta(s) importada(s) com sucesso.`

    setStatusImportacao(mensagemSucesso)
    mostrarAviso(mensagemSucesso, totalDuplicadas > 0 ? 'info' : 'sucesso')
    setArquivoImportacao(null)
    setLinhasImportacao([])
    await carregarTudo(empresaId)
    navegarPara('contas')
  }

  const sairDoSistema = useCallback(async () => {
    logoutExplicitoRef.current = true
    navegarPara('dashboard', {
      replace: true,
      origem: '',
      contexto: null,
      invalidarContextoAnterior: true,
    })
    try {
      window.sessionStorage.removeItem(SESSION_RETURN_SCREEN_KEY)
    } catch (error) {
      console.warn('Nao foi possivel limpar a tela de retorno no logout:', error?.message || error)
    }
    limparEstadoAutenticacaoCallback()
    setUsuarioLogado(null)
    setCarregandoAuth(false)
    try {
      await supabase.auth.signOut()
    } finally {
      logoutExplicitoRef.current = false
    }
  }, [limparEstadoAutenticacaoCallback, navegarPara, setCarregandoAuth, setUsuarioLogado])

  function voltarPainel() {
    navegarPara('dashboard')
  }

  const nomeUsuarioAtual = useMemo(() => {
    const nome = nomeUsuarioPerfil || usuarioLogado?.user_metadata?.name || usuarioLogado?.user_metadata?.full_name
    if (nome) return String(nome).split(' ')[0]

    const email = usuarioLogado?.email || 'usuário'
    return primeiraLetraMaiuscula(email.split('@')[0])
  }, [nomeUsuarioPerfil, usuarioLogado?.email, usuarioLogado?.user_metadata?.full_name, usuarioLogado?.user_metadata?.name])

  const nomeUsuarioCompletoAtual = useMemo(() => {
    const nome = nomeUsuarioPerfil || usuarioLogado?.user_metadata?.name || usuarioLogado?.user_metadata?.full_name
    if (nome) return String(nome).trim()

    const email = usuarioLogado?.email || ''
    return email ? primeiraLetraMaiuscula(email.split('@')[0]) : ''
  }, [nomeUsuarioPerfil, usuarioLogado?.email, usuarioLogado?.user_metadata?.full_name, usuarioLogado?.user_metadata?.name])

  const nomeUsuario = useCallback(() => nomeUsuarioAtual, [nomeUsuarioAtual])

  const nomeUsuarioCompleto = useCallback(() => nomeUsuarioCompletoAtual, [nomeUsuarioCompletoAtual])

  const contextoModuloAtual = resolverContextoModulo(modalPerfilUsuario ? 'perfil' : telaAtual)
  const exibirAcoesRapidasFinanceiras = acessoTelaAtual.permitido
    && contextoModuloAtual === MODULOS_TOPBAR.financeiro
  const politicaAcoesFlutuantesAppShell = resolverAcoesFlutuantesAppShell({
    telaAtual,
    modalConta,
    modalNota,
    modalCentro,
    modalPerfilUsuario,
    menuNavegacaoAberto,
    confirmacaoAtiva: Boolean(confirmacao?.aberto),
    globalLoading: Boolean(globalLoading),
  })

  useEffect(() => {
    if (
      !exibirAcoesRapidasFinanceiras
      || politicaAcoesFlutuantesAppShell.bloqueioInteracaoAtivo
    ) {
      setMenuAberto(false)
    }
  }, [
    exibirAcoesRapidasFinanceiras,
    politicaAcoesFlutuantesAppShell.bloqueioInteracaoAtivo,
    setMenuAberto,
  ])

  const abrirPerfilUsuario = useCallback(() => {
    setNomePerfilEditando(nomeUsuarioCompletoAtual)
    setModalPerfilUsuario(true)
  }, [nomeUsuarioCompletoAtual, setModalPerfilUsuario, setNomePerfilEditando])

  async function salvarPerfilUsuario() {
    const nomeLimpo = String(nomePerfilEditando || '').trim().replace(/\s+/g, ' ')

    if (nomeLimpo.length < 2) {
      mostrarAviso('Informe um nome com pelo menos 2 caracteres.', 'erro')
      return
    }

    setSalvandoPerfilUsuario(true)

    try {
      await atualizarNomeUsuarioLogado({
        userId: usuarioLogado?.id,
        email: usuarioLogado?.email,
        nome: nomeLimpo
      })

      setNomeUsuarioPerfil(nomeLimpo)
      setUsuarioLogado((usuarioAtual) => usuarioAtual
        ? {
            ...usuarioAtual,
            user_metadata: {
              ...(usuarioAtual.user_metadata || {}),
              name: nomeLimpo,
              full_name: nomeLimpo
            }
          }
        : usuarioAtual
      )

      if (empresaId) await buscarUsuariosEmpresa(empresaId)

      setModalPerfilUsuario(false)
      mostrarAviso('Perfil atualizado com sucesso.', 'sucesso')
    } catch (error) {
      avisarErro(error, 'Não foi possível atualizar o perfil.')
    } finally {
      setSalvandoPerfilUsuario(false)
    }
  }

  function renderModaisGlobais() {
    return (
      <AppModalsLayer
        styles={styles}
        modalConta={modalConta}
        contaProps={{
          editandoContaId,
          descricao,
          setDescricao,
          valor,
          setValor,
          dataVencimento,
          setDataVencimento,
          centroCustoId,
          setCentroCustoId,
          centros,
          filialId,
          setFilialId,
          filiais,
          observacaoConta,
          setObservacaoConta,
          impostoTipoConta,
          setImpostoTipoConta,
          competenciaConta,
          setCompetenciaConta,
          contaRecorrente,
          setContaRecorrente,
          contaParcelada,
          setContaParcelada,
          parcelamentoTotal,
          setParcelamentoTotal,
          parcelamentoQuantidade,
          setParcelamentoQuantidade,
          parcelamentoPrimeiroVencimento,
          setParcelamentoPrimeiroVencimento,
          tipoRecorrencia,
          setTipoRecorrencia,
          diaVencimentoRecorrencia,
          setDiaVencimentoRecorrencia,
          valorVariavelRecorrencia,
          setValorVariavelRecorrencia,
          recorrenciaContaId,
          escopoEdicaoRecorrencia,
          recorrenciaEdicaoCarregada,
          parcelamentoGrupoConta,
          parcelamentoGrupoParcelas,
          carregandoParcelamentoGrupo,
          erroParcelamentoGrupo,
          cancelarGrupoParcelamento,
          alterarEscopoEdicaoRecorrencia,
          podeGerenciarRecorrencias: podeGerenciarRecorrencias(),
          fecharConta,
          salvarConta,
          salvandoConta,
          primeiraLetraMaiuscula,
          limitarDataInput,
          formatarDataParaBanco,
          fecharNota,
          setModalCentro,
          setMenuAberto,
          setMenuNavegacaoAberto,
          abrirConfirmacao
        }}
        modalNota={modalNota}
        notaProps={{
          editandoNotaId,
          tituloNota,
          setTituloNota,
          prioridadeNota,
          setPrioridadeNota,
          dataEventoNota,
          setDataEventoNota,
          conteudoNota,
          setConteudoNota,
          filialNotaId,
          setFilialNotaId,
          filiais,
          salvarNota,
          fecharNota,
          fecharConta,
          setModalCentro,
          setMenuAberto,
          setMenuNavegacaoAberto,
          primeiraLetraMaiuscula,
          limitarDataInput
        }}
        modalCentro={modalCentro && podeGerenciarCentroCusto()}
        centroProps={{
          novoCentro,
          setNovoCentro,
          salvarCentro,
          centros,
          abrirConfirmacao,
          excluirCentro,
          fecharConta,
          fecharNota,
          setModalCentro,
          setMenuAberto,
          setMenuNavegacaoAberto
        }}
        modalPerfilUsuario={modalPerfilUsuario}
        perfilProps={{
          nome: nomePerfilEditando,
          setNome: setNomePerfilEditando,
          email: usuarioLogado?.email,
          salvando: salvandoPerfilUsuario,
          onClose: () => setModalPerfilUsuario(false),
          onSave: salvarPerfilUsuario
        }}
      />
    )
  }


  function renderOverlaysLayer() {
    return (
      <AppOverlaysLayer
        styles={styles}
        globalLoading={globalLoading}
        globalToast={globalToast}
        hideToast={hideToast}
        confirmacao={confirmacao}
        fecharConfirmacao={fecharConfirmacao}
        executarConfirmacao={executarConfirmacao}
      />
    )
  }


  function renderTopShell() {
    return (
      <Topbar
        styles={styles}
        nomeEmpresa={nomeEmpresa}
        empresaAtivaNome={empresaAtiva?.nome}
        contextoModulo={contextoModuloAtual}
        navegarPara={navegarPara}
        menuNavegacaoAberto={menuNavegacaoAberto}
        setMenuNavegacaoAberto={setMenuNavegacaoAberto}
        canSwitchCompany={permissoesUsuario?.canSwitchCompany}
        empresasDisponiveis={empresasDisponiveis}
        empresaId={empresaId}
        trocarEmpresaAtiva={permissoesUsuario?.canSwitchCompany ? trocarEmpresaAtiva : undefined}
        trocandoEmpresa={trocandoEmpresa}
        menuNavegacaoTriggerRef={menuNavegacaoTriggerRef}
      />
    )
  }

  function renderFabGlobal() {
    if (!exibirAcoesRapidasFinanceiras) return null
    if (!podeEditarFinanceiro()) return null

    return (
      <GlobalFab
        styles={styles}
        menuAberto={menuAberto}
        setMenuAberto={setMenuAberto}
        abrirNovaConta={abrirNovaConta}
        abrirNovaNota={abrirNovaNota}
      />
    )
  }

  function EmptyState({ icon, title, description }) {
    return (
      <div className="empty-state-card">
        <div className="empty-state-icon">{icon}</div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    )
  }

  const toggleGrupoMenu = useCallback((grupo) => {
    setGruposMenu((atual) => ({ ...atual, [grupo]: !atual[grupo] }))
  }, [setGruposMenu])

  const preloadTelaLazy = useCallback((tela) => {
    if (!avaliarAcessoTela(tela, permissoesAcessoTelas).permitido) return
    const lazyRouteName = getLazyRouteName(tela)
    if (lazyRouteName) preloadRoute(lazyRouteName)
  }, [permissoesAcessoTelas])

  const HeaderExpansivelComStyles = useCallback((props) => (
    <HeaderExpansivel styles={styles} {...props} />
  ), [])

  function renderSidebar() {
    return (
      <Sidebar
        sidebarCompacta={sidebarCompacta}
        setSidebarCompacta={setSidebarCompacta}
        nomeUsuario={nomeUsuario}
        nomeUsuarioAtual={nomeUsuarioAtual}
        normalizarPerfil={normalizarPerfil}
        perfilUsuario={perfilUsuario}
        menuSections={menuSectionsFiltradas}
        telaAtual={telaAtual}
        navegarPara={navegarPara}
        gruposMenu={gruposMenu}
        toggleGrupoMenu={toggleGrupoMenu}
        sairDoSistema={sairDoSistema}
        abrirPerfilUsuario={abrirPerfilUsuario}
        onPreloadRoute={preloadTelaLazy}
      />
    )
  }

  function renderMobileMenu() {
    return (
      <MobileMenu
        visible={menuNavegacaoAberto}
        styles={styles}
        setMenuNavegacaoAberto={setMenuNavegacaoAberto}
        nomeUsuario={nomeUsuario}
        nomeUsuarioAtual={nomeUsuarioAtual}
        normalizarPerfil={normalizarPerfil}
        perfilUsuario={perfilUsuario}
        menuSections={menuSectionsFiltradas}
        telaAtual={telaAtual}
        navegarPara={navegarPara}
        sairDoSistema={sairDoSistema}
        canSwitchCompany={permissoesUsuario?.canSwitchCompany}
        empresasDisponiveis={empresasDisponiveis}
        empresaId={empresaId}
        trocarEmpresaAtiva={permissoesUsuario?.canSwitchCompany ? trocarEmpresaAtiva : undefined}
        trocandoEmpresa={trocandoEmpresa}
        abrirPerfilUsuario={abrirPerfilUsuario}
        onPreloadRoute={preloadTelaLazy}
        menuNavegacaoTriggerRef={menuNavegacaoTriggerRef}
      />
    )
  }

  const aguardandoEmpresaInicial = Boolean(usuarioLogado?.id && !erroEmpresa && !empresaSessaoInicializada)
  const bloqueandoPorEmpresa = Boolean(aguardandoEmpresaInicial && (empresaCarregando || !empresaId))

  const routeGuardProps = {
    carregandoAuth: carregandoAuth || bloqueandoPorEmpresa,
    usuarioLogado,
    erroEmpresa,
    styles,
    setUsuarioLogado,
    globalToast,
    hideToast,
    sairDoSistema
  }

  if (carregandoAuth || bloqueandoPorEmpresa || !usuarioLogado || erroEmpresa) {
    return <AppRouteGuards {...routeGuardProps} />
  }

  function renderConteudoTelaAtual() {
    if (!acessoTelaAtual.permitido) {
      return (
      <AccessDeniedPage
        titulo={acessoTelaAtual.titulo}
        mensagem={acessoTelaAtual.mensagem}
        onVoltar={() => navegarPara('dashboard')}
        styles={styles}
      />
      )
    }

    if (telaAtual === 'contas') {
      return (
      <LazyContasPage
        busca={busca}
        setBusca={alterarBuscaContas}
        mostrarFiltros={mostrarFiltros}
        setMostrarFiltros={setMostrarFiltros}
        limparFiltros={limparFiltros}
        imprimirPDF={exportarPdfExecutivoContas}
        exportarCSV={exportarCSV}
        exportarExcel={exportarExcel}
        podeEditarFinanceiro={podeEditarFinanceiro()}
        podeExportarDados={podeExportarDados()}
        abrirNovaConta={abrirNovaConta}
        filtroStatus={filtroStatus}
        setFiltroStatus={setFiltroStatus}
        filtroHorizonte={filtroHorizonte}
        setFiltroHorizonte={setFiltroHorizonte}
        periodoPagas={periodoPagas}
        setPeriodoPagas={setPeriodoPagas}
        anoPagas={anoPagas}
        setAnoPagas={setAnoPagas}
        dataInicialPagas={dataInicialPagas}
        setDataInicialPagas={setDataInicialPagas}
        dataFinalPagas={dataFinalPagas}
        setDataFinalPagas={setDataFinalPagas}
        loadingConsultaContas={loadingConsultaContas}
        haMaisContasConsulta={haMaisContasConsulta}
        carregarMaisContas={() => consultarContasSecundarias(busca.trim() ? 'busca' : filtroStatus, Math.floor(fonteContasExibidas.length / 100))}
        modoBuscaGlobal={Boolean(busca.trim())}
        centros={centros}
        filtroCentro={filtroCentro}
        setFiltroCentro={setFiltroCentro}
        filiais={filiais}
        filtroFilial={filtroFilial}
        setFiltroFilial={setFiltroFilial}
        filtroMes={filtroMes}
        setFiltroMes={setFiltroMes}
        dataInicial={dataInicial}
        setDataInicial={setDataInicial}
        dataFinal={dataFinal}
        setDataFinal={setDataFinal}
        limitarDataInput={limitarDataInput}
        contas={contasOperacionais}
        contasFiltradas={contasFiltradas}
        contaFocusTarget={contaFocusTarget}
        onContaFocusHandled={() => {
          setContaFocusTarget(null)
          consumirDestaqueContexto()
        }}
        onContaForaDoFiltro={() => mostrarAviso(
          'Conta criada, mas não aparece no filtro atual. Consulte em Todas ou Abertas.',
          'aviso'
        )}
        total={total}
        formatarValor={formatarValor}
        loading={loading}
        HeaderExpansivel={HeaderExpansivelComStyles}
        mostrarContas={mostrarContas}
        setMostrarContas={setMostrarContas}
        estaVencida={estaVencida}
        formatarData={formatarData}
        formatarTipoRecorrencia={formatarTipoRecorrencia}
        obterTipoRecorrenciaConta={obterTipoRecorrenciaConta}
        abrirConfirmacao={abrirConfirmacao}
        marcarComoPago={marcarComoPago}
        corrigirPagamento={corrigirPagamento}
        registrarPagamentoParcial={registrarPagamentoParcial}
        listarPagamentosParciaisConta={listarPagamentosParciaisConta}
        estornarPagamentoParcial={estornarPagamentoParcial}
        baixarContaQuitadaPorParciais={baixarContaQuitadaPorParciais}
        voltarParaPendente={voltarParaPendente}
        abrirEdicaoConta={abrirEdicaoConta}
        excluirConta={excluirConta}
        ocultarConta={ocultarConta}
        reexibirConta={reexibirConta}
        navegarPara={navegarPara}
        telaRetorno={telaRetornoContas}
        onVoltarOrigem={() => {
          setTelaRetornoContas('')
          navegarPara(telaRetornoContas || origemNavegacao || 'controle-impostos', {
            origem: 'contas',
          })
        }}
      />
      )
    }

  if (telaAtual === 'recorrencias') {
    return (
      <LazyRecorrenciasFinanceirasPage
          empresaId={empresaId}
          empresaNome={empresaAtiva?.nome || empresaId}
          centros={centros}
          filiais={filiais}
          formatarValor={formatarValor}
          formatarData={formatarData}
          formatarTipoRecorrencia={formatarTipoRecorrencia}
          navegarPara={navegarPara}
          navegarParaConta={(id) => navegarParaOrigemAgenda('conta', id)}
          abrirConfirmacao={abrirConfirmacao}
          desativarSerieRecorrente={desativarSerieRecorrente}
          reativarSerieRecorrente={reativarSerieRecorrente}
          podeGerenciarRecorrencias={podeGerenciarRecorrencias()}
          podeVincularRecorrencia={podeVincularRecorrencia()}
          vincularContaManualRecorrencia={vincularContaManualRecorrencia}
          podeGerarRecorrencia={podeGerarRecorrencia()}
          gerarOcorrenciaRecorrencia={gerarOcorrenciaRecorrencia}
        />
    )
  }

  if (telaAtual === 'controle-impostos') {
    return (
        <LazyControleImpostosPage
          empresaId={empresaId}
          centros={centros}
          filiais={filiais}
          formatarValor={formatarValor}
          formatarData={formatarData}
          navegarPara={navegarPara}
          navegarParaConta={navegarParaContaControleImpostos}
        />
    )
  }

  if (telaAtual === 'relatorios-contas' || telaAtual === 'relatorios') {
    return (
        <LazyAnaliseFinanceiraPage
          empresaId={empresaId}
          empresaNome={empresaAtiva?.nome}
          centros={centros}
          filiais={filiais}
          formatarValor={formatarValor}
          formatarData={formatarData}
          navegarPara={navegarPara}
          podeExportarDados={podeExportarDados()}
          mostrarAviso={mostrarAviso}
        />
    )
  }

  if (telaAtual === 'receitas') {
    return (
        <LazyReceitasPage
          empresaId={empresaId}
          empresaNome={empresaAtiva?.nome}
          filiais={filiais}
          voltar={() => navegarPara('contas')}
          mostrarAviso={mostrarAviso}
          podeEditarFinanceiro={podeEditarFinanceiro()}
        />
    )
  }

  if (telaAtual === 'fluxo-caixa') {
    return (
        <LazyFluxoCaixaPage
          empresaId={empresaId}
          empresaNome={empresaAtiva?.nome}
          voltar={() => navegarPara('relatorios-contas')}
          mostrarAviso={mostrarAviso}
          podeExportarDados={podeExportarDados()}
        />
    )
  }

  if (telaAtual === 'notas') {
    return (
      <LazyNotasPage
        navegarPara={navegarPara}
        notas={notas}
        notasFiltradas={notasFiltradas}
        agendaFocusTarget={agendaFocusTarget}
        onAgendaFocusHandled={() => setAgendaFocusTarget(null)}
        notasPendentes={notasPendentes}
        notasCriticas={notasCriticas}
        notasUrgentes={notasUrgentes}
        buscaNota={buscaNota}
        setBuscaNota={setBuscaNota}
        formatarData={formatarData}
        alternarNotaConcluida={alternarNotaConcluida}
        abrirEdicaoNota={abrirEdicaoNota}
        abrirNovaNota={abrirNovaNota}
        abrirConfirmacao={abrirConfirmacao}
        excluirNota={excluirNota}
        podeEditarFinanceiro={podeEditarFinanceiro()}
        loading={loading}
        nomeUsuario={nomeUsuario()}
        filiais={filiais}
        filtroFilial={filtroFilial}
        setFiltroFilial={setFiltroFilial}
        contasOperacionaisFiliais={contasOperacionaisFiliais}
      />
    )
  }

  if (telaAtual === 'funcionarios') {
    return (
      <LazyFuncionariosPage
        empresaId={empresaId}
        empresaNome={empresaAtiva?.nome || nomeEmpresa}
        filiais={filiais}
        mostrarAviso={mostrarAviso}
        podeEditar={podeAcessarGestaoPessoas()}
        contextoNavegacao={contextoNavegacao}
        voltarPainel={() => navegarPara('dashboard')}
      />
    )
  }

  if (telaAtual === 'relatorios-pessoas') {
    return (
      <LazyRelatoriosPessoasPage
        styles={styles}
        empresaId={empresaId}
        empresaNome={empresaAtiva?.nome || nomeEmpresa}
        voltarPainel={() => navegarPara('dashboard')}
      />
    )
  }

  if (telaAtual === 'relatorios-gestao-pessoas') {
    return (
      <LazyRelatoriosGestaoPessoasPage
        styles={styles}
        empresaId={empresaId}
        empresaNome={empresaAtiva?.nome || nomeEmpresa}
        voltarPainel={() => navegarPara('dashboard')}
      />
    )
  }

  if (telaAtual === 'relatorios-ferias') {
    return (
      <LazyRelatoriosFeriasPage
        styles={styles}
        empresaId={empresaId}
        empresaNome={empresaAtiva?.nome || nomeEmpresa}
        voltarPainel={() => navegarPara('dashboard')}
      />
    )
  }

  if (telaAtual === 'ferias') {
    return (
      <LazyFeriasPage
        empresaId={empresaId}
        empresaNome={empresaAtiva?.nome || nomeEmpresa}
        mostrarAviso={mostrarAviso}
        podeEditar={podeAcessarGestaoPessoas()}
        contextoNavegacao={contextoNavegacao}
        voltarPainel={() => navegarPara('dashboard')}
      />
    )
  }

  if (telaAtual === 'fechamento-folha') {
    return (
      <LazyFechamentoFolhaPage
        empresaId={empresaId}
        empresaNome={empresaAtiva?.nome || nomeEmpresa}
        podeEditar={podeAcessarGestaoPessoas()}
        contextoNavegacao={contextoNavegacao}
        voltarPainel={() => navegarPara('dashboard')}
        filiais={filiais}
      />
    )
  }


  if (telaAtual === 'importar') {
    return (
        <LazyImportarPage
          styles={styles}
          podeImportarContas={podeImportarContas()}
          navegarPara={navegarPara}
          lerArquivoExcel={lerArquivoExcel}
          importarExcelParaContas={importarExcelParaContas}
          arquivoImportacao={arquivoImportacao}
          linhasImportacao={linhasImportacao}
          statusImportacao={statusImportacao}
          formatarData={formatarData}
          formatarValor={formatarValor}
        />
    )
  }



  if (telaAtual === 'master-empresas') {
    return (
      <LazyMasterPanelPage
        styles={styles}
        usuarioLogado={usuarioLogado}
        nomeUsuarioCompleto={nomeUsuarioCompleto}
        empresaId={empresaId}
        empresasDisponiveis={empresasDisponiveis}
        trocarEmpresaAtiva={trocarEmpresaAtiva}
        trocandoEmpresa={trocandoEmpresa}
        mostrarAviso={mostrarAviso}
        onEmpresasAtualizadas={recarregarEmpresasDisponiveis}
        voltarPainel={voltarPainel}
        abaInicial="empresas"
      />
    )
  }



  if (telaAtual === 'onboarding') {
    return (
      <LazyOnboardingPage
        styles={styles}
        empresaId={empresaId}
        empresaNome={nomeEmpresa}
        filiais={filiais}
        centros={centros}
        contas={contasOperacionais}
        mostrarAviso={mostrarAviso}
        onRefresh={() => carregarTudo(empresaId)}
        voltarPainel={() => navegarPara('configuracoes')}
        abrirDashboard={() => navegarPara('dashboard')}
      />
    )
  }

  if (telaAtual === 'billing') {
    return (
      <LazyBillingPage
        styles={styles}
        empresaId={empresaId}
        empresaNome={nomeEmpresa}
        filiais={filiais}
        usuarios={usuariosEmpresa}
        mostrarAviso={mostrarAviso}
        podeEditar={podeEditarBilling(permissoesUsuario)}
        voltarPainel={() => navegarPara('configuracoes')}
      />
    )
  }


  if (telaAtual === 'filiais') {
    return (
      <LazyFiliaisPage
        styles={styles}
        empresaId={empresaId}
        empresaNome={nomeEmpresa}
        mostrarAviso={mostrarAviso}
        voltarPainel={() => navegarPara('configuracoes')}
      />
    )
  }


  if (telaAtual === 'usuarios') {
    return (
      <LazyUsuariosPage
        styles={styles}
        EmptyState={EmptyState}
        podeAcessarConfiguracoes={podeAcessarConfiguracoes}
        podeAdministrarUsuarios={podeAdministrarUsuarios}
        navegarPara={navegarPara}
        usuarioLogado={usuarioLogado}
        normalizarPerfil={normalizarPerfil}
        perfilUsuario={perfilUsuario}
        permissoesUsuario={permissoesUsuario}
        novoEmailUsuario={novoEmailUsuario}
        setNovoEmailUsuario={setNovoEmailUsuario}
        novaSenhaUsuario={novaSenhaUsuario}
        setNovaSenhaUsuario={setNovaSenhaUsuario}
        confirmarNovaSenhaUsuario={confirmarNovaSenhaUsuario}
        setConfirmarNovaSenhaUsuario={setConfirmarNovaSenhaUsuario}
        salvarMeuEmail={salvarMeuEmail}
        salvarMinhaSenha={salvarMinhaSenha}
        empresasDisponiveis={empresasDisponiveis}
        empresaId={empresaId}
        trocandoEmpresa={trocandoEmpresa}
        trocarEmpresaAtiva={trocarEmpresaAtiva}
        buscarUsuariosEmpresa={buscarUsuariosEmpresa}
        primeiraLetraMaiuscula={primeiraLetraMaiuscula}
        nomeConviteUsuario={nomeConviteUsuario}
        setNomeConviteUsuario={setNomeConviteUsuario}
        emailConviteUsuario={emailConviteUsuario}
        setEmailConviteUsuario={setEmailConviteUsuario}
        senhaConviteUsuario={senhaConviteUsuario}
        setSenhaConviteUsuario={setSenhaConviteUsuario}
        perfilConviteUsuario={perfilConviteUsuario}
        setPerfilConviteUsuario={setPerfilConviteUsuario}
        criandoUsuarioManual={criandoUsuarioManual}
        adicionarUsuarioEmpresa={adicionarUsuarioEmpresa}
        usuariosCarregando={usuariosCarregando}
        usuariosInicializados={usuariosInicializados}
        usuariosErro={usuariosErro}
        usuariosEmpresa={usuariosEmpresa}
        filiais={filiais}
        filiaisUsuariosEmpresa={filiaisUsuariosEmpresa}
        salvandoFilialUsuario={salvandoFilialUsuario}
        liberarTodasFiliaisUsuario={liberarTodasFiliaisUsuario}
        alternarFilialUsuario={alternarFilialUsuario}
        atualizarPerfilUsuarioEmpresa={atualizarPerfilUsuarioEmpresa}
        enviarAcessoUsuarioEmpresa={enviarAcessoUsuarioEmpresa}
        removerUsuarioEmpresa={removerUsuarioEmpresa}
      />
    )
  }

  if (telaAtual === 'auditoria') {
    return <LazyAuditoriaPage empresaId={empresaId} permissoesUsuario={permissoesUsuario} usuariosEmpresa={usuariosEmpresa} navegarPara={navegarPara} />
  }

  if (telaAtual === 'configuracoes') {
    return (
        <LazyConfiguracoesPage
          styles={styles}
          podeAcessarConfiguracoes={podeAcessarConfiguracoes()}
          podeEditarConfiguracoes={podeEditarConfiguracoes()}
          podeGerenciarDestinatariosAlertas={podeGerenciarDestinatariosAlertas}
          podeGerenciarCentroCusto={podeGerenciarCentroCusto()}
          podeGerenciarCatalogoChecklist={podeAdministrarUsuarios()}
          empresaId={empresaId}
          mostrarAviso={mostrarAviso}
          navegarPara={navegarPara}
          notificacoesAtivas={notificacoesAtivas}
          setNotificacoesAtivas={setNotificacoesAtivas}
          configEmail={configEmail}
          diasAlertaContas={diasAlertaContas}
          setDiasAlertaContas={setDiasAlertaContas}
          setDiasAvisoPadrao={setDiasAvisoPadrao}
          alertarContasVencidas={alertarContasVencidas}
          setAlertarContasVencidas={setAlertarContasVencidas}
          destacarContasCriticas={destacarContasCriticas}
          setDestacarContasCriticas={setDestacarContasCriticas}
          diasAlertaNotas={diasAlertaNotas}
          setDiasAlertaNotas={setDiasAlertaNotas}
          destacarNotasUrgentes={destacarNotasUrgentes}
          setDestacarNotasUrgentes={setDestacarNotasUrgentes}
          nomeEmpresa={nomeEmpresa}
          setNomeEmpresa={setNomeEmpresa}
          whatsappPadrao={whatsappPadrao}
          setWhatsappPadrao={setWhatsappPadrao}
          emailPadrao={emailPadrao}
          setEmailPadrao={setEmailPadrao}
          mostrarConfigNotificacoes={mostrarConfigNotificacoes}
          setMostrarConfigNotificacoes={setMostrarConfigNotificacoes}
          mostrarConfigNegocio={mostrarConfigNegocio}
          setMostrarConfigNegocio={setMostrarConfigNegocio}
          mostrarConfigDestinatarios={mostrarConfigDestinatarios}
          setMostrarConfigDestinatarios={setMostrarConfigDestinatarios}
          mostrarDestinatariosInativos={mostrarDestinatariosInativos}
          setMostrarDestinatariosInativos={setMostrarDestinatariosInativos}
          mostrarConfigRecorrencias={mostrarConfigRecorrencias}
          setMostrarConfigRecorrencias={setMostrarConfigRecorrencias}
          mostrarConfigCentros={mostrarConfigCentros}
          setMostrarConfigCentros={setMostrarConfigCentros}
          destinatarios={destinatarios}
          loadingDestinatarios={loadingDestinatarios}
          salvandoDestinatario={salvandoDestinatario}
          erroDestinatarios={erroDestinatarios}
          destinatarioEditandoId={destinatarioEditandoId}
          formDestinatarioAlerta={formDestinatarioAlerta}
          salvarDestinatarioAlerta={salvarDestinatarioAlerta}
          atualizarCampoDestinatarioAlerta={atualizarCampoDestinatarioAlerta}
          limparFormularioDestinatarioAlerta={limparFormularioDestinatarioAlerta}
          preencherFormularioDestinatarioAlerta={preencherFormularioDestinatarioAlerta}
          alternarStatusDestinatarioAlerta={alternarStatusDestinatarioAlerta}
          centros={centros}
          setModalCentro={abrirModalCentro}
          salvarConfiguracoes={salvarConfiguracoes}
        />
    )
  }
  if (telaAtual === 'agenda') {
    return (
        <LazyAgendaPage
          styles={styles}
          empresaId={empresaId}
          filiais={filiais}
          contas={contasOperacionais}
          notas={notas}
          carregandoFinanceiro={loading}
          podeAcessarPessoas={podeAcessarGestaoPessoas()}
          atualizarContas={() => buscarContas(empresaId, {
            silencioso: true,
            permitirGerarRecorrencias: false
          })}
          atualizarNotas={() => buscarNotas(empresaId)}
          formatarValor={formatarValor}
          formatarData={formatarData}
          limitarDataInput={limitarDataInput}
          podeEditarFinanceiro={podeEditarFinanceiro()}
          abrirEdicaoConta={abrirEdicaoConta}
          marcarComoPago={marcarComoPago}
          navegarPara={navegarPara}
          navegarParaOrigemAgenda={navegarParaOrigemAgenda}
        />
    )
  }

  if (telaAtual === 'lixeira') {
    return (
        <LazyLixeiraPage
          styles={styles}
          contasLixeira={contasLixeira}
          notasLixeira={notasLixeira}
          podeGerenciarLixeira={podeGerenciarLixeira()}
          podeExcluirDefinitivoFinanceiro={podeExcluirDefinitivoFinanceiro()}
          navegarPara={navegarPara}
          abrirConfirmacao={abrirConfirmacao}
          restaurarConta={restaurarConta}
          excluirContaDefinitivo={excluirContaDefinitivo}
          restaurarNota={restaurarNota}
          excluirNotaDefinitivo={excluirNotaDefinitivo}
          diasNaLixeira={diasNaLixeira}
          podeExcluirDefinitivo={podeExcluirDefinitivo}
          obterEstadoRetencaoLixeira={obterEstadoRetencaoLixeira}
          formatarValor={formatarValor}
          formatarData={formatarData}
        />
    )
  }

    if (telaAtual === 'dashboard') {
      return (
        <LazyDashboardRouteComposition
          routeProps={{
            nomeUsuario: nomeUsuario(),
            formatarValor,
            navegarPara,
            loading,
            filiais,
            centros,
            contasCentral: contasOperacionais,
            notasCentral: notas,
            onAtualizarContasCentral: atualizarFontesContasDashboard,
            onAtualizarNotasCentral: () => buscarNotas(empresaId),
            navegarParaOrigemAgenda,
            onAbrirContasPlanejamento: abrirContasComPlanejamento,
            podeAcessarPessoas: podeAcessarGestaoPessoas()
          }}
        />
      )
    }

    return null
  }

  const layoutAppShell = resolverLayoutAppShell(telaAtual)

  // =========================
  // BLOCO 11 — UI
  // =========================
  return (
    <AppShell
      empresaId={empresaId}
      navegarPara={navegarPara}
      menuAberto={menuAberto}
      setMenuAberto={setMenuAberto}
      pageStyle={styles.page}
      modoFrame={layoutAppShell.modoFrame}
      envolverConteudoEmMain={layoutAppShell.envolverConteudoEmMain}
      mostrarElementosImpressao={layoutAppShell.mostrarElementosImpressao}
      topShell={renderTopShell()}
      sidebar={renderSidebar()}
      mobileMenu={renderMobileMenu()}
      fab={renderFabGlobal()}
      mostrarFab={politicaAcoesFlutuantesAppShell.mostrarFab}
      modals={renderModaisGlobais()}
      overlays={renderOverlaysLayer()}
    >
      {renderConteudoTelaAtual()}
    </AppShell>
  )
}
