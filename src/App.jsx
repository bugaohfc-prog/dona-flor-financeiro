import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import {
  adicionarUsuarioEmpresa as adicionarUsuarioEmpresaService,
  atualizarPerfilUsuarioEmpresa as atualizarPerfilUsuarioEmpresaService,
  enviarAcessoUsuarioEmpresa as enviarAcessoUsuarioEmpresaService,
  listarUsuariosEmpresa,
  normalizarPerfilUsuario,
  removerUsuarioEmpresa as removerUsuarioEmpresaService,
  atualizarNomeUsuarioLogado,
  listarFiliaisUsuariosEmpresa,
  atualizarFiliaisUsuarioEmpresa
} from './services/usuariosService'
import Relatorios from './pages/Relatorios.jsx'
import ContasPage from './pages/ContasPage.jsx'
import NotasPage from './pages/NotasPage.jsx'
import MasterPanelPage from './pages/MasterPanelPage.jsx'
import FiliaisPage from './pages/FiliaisPage.jsx'
import BillingPage from './pages/BillingPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import UsuariosPage from './pages/UsuariosPage.jsx'
import Topbar from './components/layout/Topbar.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import MobileMenu from './components/layout/MobileMenu.jsx'
import GlobalFab from './components/layout/GlobalFab.jsx'
import HeaderExpansivel from './components/ui/HeaderExpansivel.jsx'
import AppRouteGuards from './components/routes/AppRouteGuards.jsx'
import DashboardRouteComposition from './components/routes/DashboardRouteComposition.jsx'
import AppSuspenseBoundary from './components/routes/AppSuspenseBoundary.jsx'
import AppModalsLayer from './components/render/AppModalsLayer.jsx'
import AppOverlaysLayer from './components/render/AppOverlaysLayer.jsx'
import AppShell from './components/shell/AppShell.jsx'
import AppProviders from './components/providers/AppProviders.jsx'
import CopilotFloatingButton from './components/copilot/layout/CopilotFloatingButton.jsx'
import CopilotDrawer from './components/copilot/layout/CopilotDrawer.jsx'
import CopilotStyles from './components/copilot/layout/CopilotStyles.jsx'
import { useApp } from './context/AppContext.jsx'
import { useContas } from './hooks/useContas'
import { useNotas } from './hooks/useNotas'
import { useAuthSession } from './hooks/useAuthSession'
import { useUiState } from './hooks/useUiState'
import { useAppNavigation } from './hooks/useAppNavigation'
import { useEmpresaContext } from './hooks/useEmpresaContext'
import { converterValor, formatarData, formatarDataParaBanco, formatarValor, limitarDataInput, primeiraLetraMaiuscula } from './utils/format'
import { dataLocal, diferencaDias, mesmoMesAtual } from './utils/dates'
import { formatarTipoRecorrencia, obterTipoRecorrenciaConta } from './utils/recorrencia'
import { estaVencida, pegarMes } from './utils/contasStatus'
import { atualizarListaLixeiraEstavel, diasNaLixeira, podeExcluirDefinitivo } from './utils/lixeira'
import { erroEhSessaoExpirada } from './utils/session'
import { buscarNomePerfilUsuario, buscarVinculoEmpresaDoUsuario, sincronizarUsuarioLogadoComEmpresa, TENANT_ERRORS } from './services/tenantService'
import { buscarPermissoesUsuario, criarPermissoesUsuario, listarEmpresasDisponiveisParaUsuario } from './services/permissoesService'
import { listarFiliaisPorEmpresa } from './services/filiaisService'
import './styles.css'
import styles from './styles/appStyles.js'
import menuSections from './config/menuSections.js'
import {
  limparSessaoSegura
} from './services/sessionSecurityService.js'

export default function App() {
  const sincronizacaoTenantRef = useRef(null)
  const { globalLoading, toast: globalToast, showToast, hideToast, empresaAtiva, setEmpresaAtiva, limparEmpresaAtiva, empresasDisponiveis, setEmpresasDisponiveis } = useApp()
  // =========================
  // BLOCO 0 — UTILITÁRIOS
  // =========================
  // Utilitários compartilhados foram movidos para src/utils.

  // =========================
  // BLOCO 1 — STATES CONTAS
  // =========================
  const {
    contas,
    setContas,
    contasLixeira,
    setContasLixeira,
    busca,
    setBusca,
    filtroStatus,
    setFiltroStatus,
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
    tipoRecorrencia,
    setTipoRecorrencia,
    diaVencimentoRecorrencia,
    setDiaVencimentoRecorrencia,
    recorrenciaContaId,
    setRecorrenciaContaId,
    buscarContas: buscarContasHook,
    abrirNovaConta: abrirNovaContaHook,
    abrirEdicaoConta: abrirEdicaoContaHook,
    fecharConta: fecharContaHook,
    salvarConta: salvarContaHook,
    marcarComoPago: marcarComoPagoHook,
    voltarParaPendente: voltarParaPendenteHook,
    excluirConta: excluirContaHook
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
    setTelaAtualState,
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
    mostrarContasDashboard,
    setMostrarContasDashboard,
    mostrarNotas,
    setMostrarNotas,
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
  function mostrarAviso(mensagem, tipo = 'info') {
    showToast(mensagem, tipo)
  }

  function avisarErro(erro, fallback = 'Não foi possível concluir a operação.') {
    const mensagem = erro?.message || erro || fallback

    if (erroEhSessaoExpirada(erro)) {
      encerrarSessao('Sua sessão expirou. Faça login novamente.')
      return
    }

    mostrarAviso(String(mensagem), 'erro')
  }

  function limparDadosTenant() {
    setContas([])
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
    setFiltroStatus('todas')
    setFiltroCentro('')
    setFiltroFilial('')
    setFiltroMes('')
    setDataInicial('')
    setDataFinal('')
    setArquivoImportacao(null)
    setLinhasImportacao([])
    setStatusImportacao('')
  }

  function limparEstadoAutenticacao() {
    limparDadosTenant()
    setEmpresasDisponiveis([])
    setEmpresaId(null)
    limparEmpresaAtiva()
    setPerfilUsuario('')
    setFiliaisUsuariosEmpresa({})
    setNomeUsuarioPerfil('')
    setErroEmpresa('')
    setLoading(false)
    limparSessaoSegura()
  }

  const limparEstadoAutenticacaoCallback = useCallback(() => {
    limparEstadoAutenticacao()
  }, [])

  const navegarParaLoginCallback = useCallback(() => {
    setTelaAtualState('dashboard')
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
      setLoading(false)
      return
    }

    carregarEmpresaDoUsuario(usuarioLogado.id)
  }, [usuarioLogado])


  useEffect(() => {
    if (!usuarioLogado?.id || !empresaId) return

    let cancelado = false

    async function sincronizarTenantAtual() {
      if (cancelado) return

      try {
        await Promise.allSettled([
          buscarContas(empresaId),
          buscarCentros(empresaId),
          buscarFiliais(empresaId),
          buscarLixeira(empresaId)
        ])
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
    if (telaAtual === 'usuarios' && empresaId) {
      buscarUsuariosEmpresa(empresaId)
    }
  }, [telaAtual, empresaId])

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
  async function carregarEmpresaDoUsuario(userId) {
    setLoading(true)
    setErroEmpresa('')

    try {
      await sincronizarUsuarioLogadoComEmpresa()
      const vinculo = await buscarVinculoEmpresaDoUsuario(userId)
      const nomePerfil = await buscarNomePerfilUsuario(userId)

      const permissoesBase = await buscarPermissoesUsuario({
        userId,
        email: usuarioLogado?.email,
        perfilEmpresa: vinculo?.perfil || 'operador'
      })

      const empresasSessao = await listarEmpresasDisponiveisParaUsuario({
        userId,
        email: usuarioLogado?.email,
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
        setPermissoesUsuario({ ...permissoesBase, canSwitchCompany: true, canManageCompanies: true })
        setNomeUsuarioPerfil(nomePerfil || usuarioLogado?.user_metadata?.name || usuarioLogado?.user_metadata?.full_name || '')
        setErroEmpresa('Nenhuma empresa cadastrada em df_empresas para o usuário master.')
        return
      }

      const empresaSalvaValida = empresasSessao.find((empresa) => empresa.id === empresaAtiva?.id)
      const empresaSelecionada = empresaSalvaValida || empresasSessao.find((empresa) => empresa.id === vinculo?.empresaId) || empresasSessao[0] || {
        id: vinculo?.empresaId,
        nome: vinculo?.nomeEmpresa || 'Dona Flor',
        perfil: vinculo?.perfil || 'operador'
      }

      const perfilSelecionado = empresaSelecionada.perfil || vinculo?.perfil || (permissoesBase.isMaster ? 'master' : 'operador')
      const permissoes = permissoesBase.isMaster
        ? { ...permissoesBase, perfilEmpresa: normalizarPerfil(perfilSelecionado), canSwitchCompany: true, canManageCompanies: true }
        : await buscarPermissoesUsuario({
            userId,
            email: usuarioLogado?.email,
            perfilEmpresa: perfilSelecionado
          })

      setEmpresasDisponiveis(empresasSessao.length > 0 ? empresasSessao : [empresaSelecionada])
      setEmpresaId(empresaSelecionada.id)
      setEmpresaAtiva({
        id: empresaSelecionada.id,
        nome: empresaSelecionada.nome || vinculo?.nomeEmpresa || 'Dona Flor',
        perfil: perfilSelecionado
      })
      setPerfilUsuario(perfilSelecionado)
      setPermissoesUsuario(permissoes)
      setNomeUsuarioPerfil(nomePerfil || usuarioLogado?.user_metadata?.name || usuarioLogado?.user_metadata?.full_name || '')
      await carregarTudo(empresaSelecionada.id)
    } catch (error) {
      if (erroEhSessaoExpirada(error)) {
        await supabase.auth.signOut()
        limparEstadoAutenticacao()
        setUsuarioLogado(null)
        mostrarAviso('Sua sessão expirou. Faça login novamente.', 'erro')
      } else {
        mostrarAviso(error.message, 'erro')
      }
    } finally {
      setLoading(false)
    }
  }

  async function carregarTudo(empresaAtual = empresaId) {
    if (!empresaAtual) return

    await Promise.all([
      buscarContas(empresaAtual),
      buscarNotas(empresaAtual),
      buscarCentros(empresaAtual),
      buscarFiliais(empresaAtual),
      buscarLixeira(empresaAtual),
      buscarConfiguracoes(empresaAtual)
    ])
  }

  function normalizarPerfil(perfil) {
    return normalizarPerfilUsuario(perfil)
  }

  function temPermissao(perfisPermitidos = []) {
    if (permissoesUsuario?.isMaster) return true
    const perfilAtual = normalizarPerfil(perfilUsuario)
    return perfisPermitidos.includes(perfilAtual)
  }

  function podeAdministrarUsuarios() {
    return Boolean(permissoesUsuario?.canManageUsers || temPermissao(['admin']))
  }

  function podeAcessarConfiguracoes() {
    return Boolean(permissoesUsuario?.canAccessSettings || temPermissao(['admin', 'gerente']))
  }

  function menuSectionsVisiveis() {
    return menuSections
      .map((grupo) => ({
        ...grupo,
        items: grupo.items.filter((item) => !item.masterOnly || permissoesUsuario?.canManageCompanies)
      }))
      .filter((grupo) => grupo.items.length > 0)
  }

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
            canSwitchCompany: true,
            canManageCompanies: true,
            canManageUsers: true,
            canAccessSettings: true
          }
        : await buscarPermissoesUsuario({
            userId: usuarioLogado?.id,
            email: usuarioLogado?.email,
            perfilEmpresa: perfilSelecionado
          })

      limparDadosTenant()
      setEmpresaId(empresaSelecionada.id)
      setEmpresaAtiva({
        id: empresaSelecionada.id,
        nome: empresaSelecionada.nome || 'Empresa',
        perfil: perfilSelecionado
      })
      setPerfilUsuario(perfilSelecionado)
      setPermissoesUsuario(permissoesAtualizadas)
      setTelaAtualState('dashboard')
      await carregarTudo(empresaSelecionada.id)
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
      setUsuariosErro(error?.message || 'Não foi possível carregar os usuários da empresa.')
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

    if (senhaProvisoria.length < 6) {
      mostrarAviso('Informe uma senha provisória com pelo menos 6 caracteres.', 'erro')
      return
    }

    const perfil = normalizarPerfil(perfilConviteUsuario)

    try {
      setCriandoUsuarioManual(true)
      await adicionarUsuarioEmpresaService({
        empresaId,
        email,
        nome: nomeConviteUsuario,
        perfil,
        senhaProvisoria,
        criarAuthManual: true
      })

      await buscarUsuariosEmpresa(empresaId, { silencioso: true })
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
    if (!podeAdministrarUsuarios()) {
      mostrarAviso('Apenas administradores podem enviar acesso ou reset de senha.', 'erro')
      return
    }

    const nome = usuario.nome || usuario.email || 'este usuário'

    abrirConfirmacao({
      titulo: 'Enviar acesso',
      mensagem: `Deseja enviar um link de acesso/redefinição de senha para ${nome}?`,
      textoConfirmar: 'Enviar link',
      tipo: 'padrao',
      acao: async () => {
        try {
          const resultado = await enviarAcessoUsuarioEmpresaService({ usuario })
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
        try {
          await atualizarPerfilUsuarioEmpresaService({ empresaId, usuario, perfil })
        } catch (error) {
          avisarErro(error)
          return
        }

        await buscarUsuariosEmpresa()
        mostrarAviso('Perfil do usuário atualizado.', 'sucesso')
      }
    })
  }

  async function atualizarFiliaisDoUsuario(usuario, proximasFiliais) {
    if (!podeAdministrarUsuarios()) {
      mostrarAviso('Apenas administradores podem alterar filiais dos usuários.', 'erro')
      return
    }

    if (!usuario?.id) {
      mostrarAviso('Este usuário precisa estar cadastrado na empresa para receber filiais.', 'erro')
      return
    }

    const chaveSalvamento = usuario.id
    setSalvandoFilialUsuario(chaveSalvamento)

    try {
      await atualizarFiliaisUsuarioEmpresa({
        empresaId,
        usuario,
        filialIds: proximasFiliais
      })
      setFiliaisUsuariosEmpresa((atual) => ({
        ...atual,
        [usuario.id]: proximasFiliais
      }))
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

    atualizarFiliaisDoUsuario(usuario, proximasFiliais)
  }

  function liberarTodasFiliaisUsuario(usuario) {
    atualizarFiliaisDoUsuario(usuario, [])
  }

  async function removerUsuarioEmpresa(usuario) {
    if (!podeAdministrarUsuarios()) {
      mostrarAviso('Apenas administradores podem remover usuários.', 'erro')
      return
    }

    const usuarioAtual = usuario.user_id && usuarioLogado?.id && usuario.user_id === usuarioLogado.id

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
    mostrarAviso('Solicitação enviada. Confirme o novo e-mail conforme orientação do Supabase.', 'sucesso')
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
  async function buscarContas(empresaAtual = empresaId) {
    return buscarContasHook({
      supabase,
      empresaAtual,
      avisarErro,
      configWhatsapp,
      configEmail,
      configPush,
      diasAlertaContas,
      diasAvisoPadrao
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

    const { data: novaConfig, error: erroInsert } = await supabase
      .from('df_configuracoes')
      .insert([{
        notificacoes_ativas: true,
        enviar_whatsapp: true,
        enviar_email: true,
        enviar_push: false,
        dias_aviso_padrao: 1,
        nome_empresa: 'DF Gestão Financeira',
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

  async function buscarLixeira(empresaAtual = empresaId) {
    if (!empresaAtual) return

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
  const contasFiltradas = contas
    .filter((conta) => {
      if (filtroStatus === 'pendentes') return conta.status !== 'pago'
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
      const termo = busca.trim().toLowerCase()
      if (!termo) return true

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
        .some((campo) => String(campo).toLowerCase().includes(termo))
    })

  const contasOperacionaisFiliais = contas
    .filter((conta) => {
      if (filtroStatus === 'pendentes') return conta.status !== 'pago'
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
      const termo = busca.trim().toLowerCase()
      if (!termo) return true

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
        .some((campo) => String(campo).toLowerCase().includes(termo))
    })

  const total = contasFiltradas.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const pago = contasFiltradas
    .filter((conta) => conta.status === 'pago')
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const vencido = contasFiltradas
    .filter((conta) => estaVencida(conta.data_vencimento, conta.status))
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const pendente = total - pago

  const contasAbertasDashboard = contasFiltradas
    .filter((conta) => conta.status !== 'pago')
    .sort((a, b) => String(b.created_at || b.data_vencimento || '').localeCompare(String(a.created_at || a.data_vencimento || '')))

  const resumoPorCentro = centros
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
    .filter((centro) => centro.total > 0 || centro.pago > 0 || centro.pendente > 0 || centro.vencido > 0)

  const pesoPrioridadeNota = { critico: 0, urgente: 1, normal: 2 }

  const notasFiltradas = notas
    .filter((nota) =>
      (!filtroFilial || nota.filial_id === filtroFilial) && `${nota.titulo || ''} ${nota.conteudo || ''}`
        .toLowerCase()
        .includes(buscaNota.toLowerCase())
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
    })

  const notasPendentes = notasFiltradas.filter((nota) => !nota.concluida)
  const notasCriticas = notasPendentes.filter((nota) => nota.prioridade === 'critico').length
  const notasUrgentes = notasPendentes.filter((nota) => nota.prioridade === 'urgente').length

  // =========================
  // BLOCO 7 — AÇÕES CONTAS
  // =========================
  function abrirNovaConta() {
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
      buscarContas,
      fecharConta
    })
  }

  async function marcarComoPago(id) {
    return marcarComoPagoHook({ supabase, id, empresaId, buscarContas, mostrarAviso })
  }

  async function voltarParaPendente(id) {
    return voltarParaPendenteHook({ supabase, id, empresaId, buscarContas, mostrarAviso })
  }

  async function excluirConta(id) {
    return excluirContaHook({ supabase, id, empresaId, avisarErro, buscarContas, buscarLixeira, mostrarAviso })
  }

  // =========================
  // BLOCO 8 — AÇÕES NOTAS
  // =========================
  function abrirNovaNota() {
    return abrirNovaNotaHook({
      setMenuAberto,
      setMenuNavegacaoAberto
    })
  }

  function abrirEdicaoNota(nota) {
    return abrirEdicaoNotaHook(nota)
  }

  function fecharNota() {
    return fecharNotaHook()
  }

  async function salvarNota() {
    return salvarNotaHook({
      supabase,
      empresaId,
      mostrarAviso,
      avisarErro,
      buscarNotas
    })
  }

  async function excluirNota(id) {
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
      mostrarAviso('Configurações principais salvas, mas os alertas globais não foram atualizados: ' + erroAlertas.message, 'erro')
      return
    }

    mostrarAviso('Configurações salvas com sucesso.', 'info')
  }

  // =========================
  // BLOCO 9 — AÇÕES LIXEIRA
  // =========================
  async function restaurarConta(id) {
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

    buscarContas()
    buscarLixeira()
    mostrarAviso('Conta restaurada com sucesso.', 'sucesso')
  }

  async function restaurarNota(id) {
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
    const { error } = await supabase
      .from('df_contas')
      .delete()
      .eq('id', conta.id)
      .eq('empresa_id', empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    buscarLixeira()
    mostrarAviso('Conta excluída definitivamente.', 'sucesso')
  }

  async function excluirNotaDefinitivo(nota) {
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

  async function excluirCentro(id) {
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
  function exportarCSV() {
    const cabecalho = ['Descricao', 'Valor', 'Vencimento', 'Status', 'Filial', 'Centro']
    const linhas = contasFiltradas.map((conta) => [
      conta.descricao || '',
      Number(conta.valor || 0).toFixed(2).replace('.', ','),
      formatarData(conta.data_vencimento),
      estaVencida(conta.data_vencimento, conta.status) ? 'vencido' : conta.status,
      conta.df_filiais?.nome || '',
      conta.df_centros_custo?.nome || ''
    ])

    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((campo) => `"${String(campo).replaceAll('"', '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'relatorio-contas.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  function imprimirPDF() {
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

      return `
        <tr>
          <td>
            <strong>${escapeHtml(conta.descricao || '-')}</strong>
            ${conta.observacao ? `<small>Obs: ${escapeHtml(conta.observacao)}</small>` : ''}
          </td>
          <td>${escapeHtml(conta.df_filiais?.nome || '-')}</td>
          <td>${escapeHtml(conta.df_centros_custo?.nome || '-')}</td>
          <td>${escapeHtml(formatarData(conta.data_vencimento))}</td>
          <td><span class="status ${status.toLowerCase()}">${status}</span></td>
          <td class="valor">${escapeHtml(formatarValor(conta.valor))}</td>
        </tr>
      `
    }).join('')

    const html = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Relatório de contas</title>
          <style>
            * { box-sizing: border-box; }
            html, body { width: 100%; min-height: 100%; }
            body { margin: 0; font-family: Arial, sans-serif; color: #111827; background: #f8fafc; -webkit-text-size-adjust: 100%; }
            .page { width: min(100%, 920px); margin: 0 auto; padding: 18px; background: #fff; min-height: 100vh; }
            header { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; border-bottom: 2px solid #ccfbf1; padding-bottom: 18px; margin-bottom: 18px; }
            h1 { margin: 0; font-size: 24px; color: #0f766e; }
            .empresa { margin-top: 6px; color: #475569; font-size: 14px; }
            .data { text-align: right; color: #64748b; font-size: 13px; }
            .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 18px 0; }
            .box { border: 1px solid #e5e7eb; border-radius: 14px; padding: 12px; background: #f8fafc; }
            .box span { display: block; font-size: 12px; color: #64748b; font-weight: 700; }
            .box strong { display: block; margin-top: 4px; font-size: 17px; }
            .table-wrap { width: 100%; overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 16px; }
            footer { margin-top: 18px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #64748b; font-size: 12px; display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
            table { width: 100%; border-collapse: collapse; min-width: 620px; }
            th { background: #f0fdfa; color: #0f766e; text-align: left; padding: 11px; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
            td { border-bottom: 1px solid #e5e7eb; padding: 11px; vertical-align: top; font-size: 13px; }
            td small { display: block; color: #64748b; margin-top: 4px; line-height: 1.35; }
            .valor { text-align: right; font-weight: 700; white-space: nowrap; }
            .status { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; }
            .status.pago { background: #dcfce7; color: #166534; }
            .status.pendente { background: #fef3c7; color: #92400e; }
            .status.vencido { background: #fee2e2; color: #991b1b; }
            .toolbar { position: sticky; top: 0; display: flex; justify-content: flex-end; gap: 10px; margin: -18px -18px 14px; padding: 12px 18px; background: rgba(255,255,255,.96); border-bottom: 1px solid #e5e7eb; z-index: 5; }
            button { border: 1px solid #d1d5db; background: #fff; color: #374151; border-radius: 999px; padding: 10px 14px; font-weight: 800; cursor: pointer; font-size: 13px; }
            button.primary { background: #0f766e; border-color: #0f766e; color: white; }
            @media print {
              body { background: #fff; }
              .page { margin: 0; border: 0; border-radius: 0; max-width: none; }
              .toolbar { display: none; }
            }
            @media (max-width: 760px) {
              .page { width: 100%; margin: 0; border-radius: 0; padding: 16px; }
              .toolbar { margin: -16px -16px 14px; padding: 12px 16px; justify-content: space-between; }
              header { display: block; }
              h1 { font-size: 22px; }
              .data { text-align: left; margin-top: 8px; }
              .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .box strong { font-size: 15px; }
              th:nth-child(2), td:nth-child(2) { display: none; }
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
                <h1>Relatório de Contas</h1>
                <div class="empresa">${escapeHtml(nomeEmpresa || 'DF Gestão Financeira')}</div>
              </div>
              <div class="data">Gerado em ${new Date().toLocaleDateString('pt-BR')}<br/>${contasFiltradas.length} conta(s) listada(s)</div>
            </header>
            <section class="summary">
              <div class="box"><span>Total</span><strong>${escapeHtml(formatarValor(total))}</strong></div>
              <div class="box"><span>Pago</span><strong>${escapeHtml(formatarValor(pago))}</strong></div>
              <div class="box"><span>Pendente</span><strong>${escapeHtml(formatarValor(pendente))}</strong></div>
              <div class="box"><span>Vencido</span><strong>${escapeHtml(formatarValor(vencido))}</strong></div>
            </section>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>Conta</th><th>Filial</th><th>Centro</th><th>Vencimento</th><th>Status</th><th>Valor</th></tr>
                </thead>
                <tbody>
                  ${linhas || '<tr><td colspan="6">Nenhuma conta encontrada.</td></tr>'}
                </tbody>
              </table>
            </div>
            <footer>
              <span>Gerado pelo DF Gestão Financeira</span>
              <span>${new Date().toLocaleString('pt-BR')}</span>
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


  function limparFiltros() {
    setBusca('')
    setFiltroStatus('todas')
    setFiltroCentro('')
    setFiltroFilial('')
    setFiltroMes('')
    setDataInicial('')
    setDataFinal('')
  }



  function abrirConfirmacao({ titulo, mensagem, textoConfirmar = 'Confirmar', tipo = 'padrao', acao }) {
    setConfirmacao({
      aberto: true,
      titulo,
      mensagem,
      textoConfirmar,
      tipo,
      acao
    })
  }

  function fecharConfirmacao() {
    setConfirmacao({
      aberto: false,
      titulo: '',
      mensagem: '',
      textoConfirmar: 'Confirmar',
      tipo: 'padrao',
      acao: null
    })
  }

  async function executarConfirmacao() {
    if (typeof confirmacao.acao === 'function') {
      await confirmacao.acao()
    }

    fecharConfirmacao()
  }



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

  function converterDataExcel(valor) {
    if (!valor) return null

    if (typeof valor === 'number') {
      const base = new Date(Date.UTC(1899, 11, 30))
      base.setUTCDate(base.getUTCDate() + valor)
      return base.toISOString().slice(0, 10)
    }

    const texto = String(valor).trim()
    if (!texto) return null

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
      const [dia, mes, ano] = texto.split('/')
      return `${ano}-${mes}-${dia}`
    }

    return formatarDataParaBanco(texto)
  }

  function converterValorExcel(valor) {
    if (typeof valor === 'number') return valor
    const texto = String(valor || '')
      .replace(/R\$/gi, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim()
    return Number(texto || 0)
  }

  function separarLinhaCsv(linha) {
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

      if ((char === ';' || char === ',') && !dentroDeAspas) {
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
    const linhas = String(texto || '')
      .replace(/^﻿/, '')
      .split(/\r?\n/)
      .filter((linha) => linha.trim())

    if (linhas.length < 2) return []

    const cabecalho = separarLinhaCsv(linhas[0])

    return linhas.slice(1).map((linha) => {
      const valores = separarLinhaCsv(linha)
      return cabecalho.reduce((obj, chave, index) => {
        obj[chave] = valores[index] || ''
        return obj
      }, {})
    })
  }

  async function lerArquivoExcel(event) {
    const file = event.target.files?.[0]
    setArquivoImportacao(file || null)
    setLinhasImportacao([])
    setStatusImportacao('')

    if (!file) return

    const extensao = file.name.split('.').pop()?.toLowerCase()

    if (extensao !== 'csv') {
      setStatusImportacao('Para evitar erro no deploy, esta versão importa CSV. No Excel, use: Arquivo > Salvar como > CSV UTF-8.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const linhas = csvParaJson(e.target.result)

      const preparadas = linhas.map((linha, index) => {
        const descricaoExcel = obterCampoExcel(linha, ['descricao', 'descrição', 'conta', 'nome', 'fornecedor'])
        const valorExcel = obterCampoExcel(linha, ['valor', 'valor pago', 'total'])
        const vencimentoExcel = obterCampoExcel(linha, ['vencimento', 'data vencimento', 'data_vencimento', 'data'])
        const statusExcel = String(obterCampoExcel(linha, ['status', 'situacao', 'situação']) || 'pendente').toLowerCase()
        const centroExcel = obterCampoExcel(linha, ['centro', 'centro de custo', 'categoria', 'setor'])

        return {
          linha: index + 2,
          descricao: primeiraLetraMaiuscula(String(descricaoExcel || '').trim()),
          valor: converterValorExcel(valorExcel),
          data_vencimento: converterDataExcel(vencimentoExcel),
          status: statusExcel.includes('pag') ? 'pago' : 'pendente',
          centro: String(centroExcel || '').trim()
        }
      }).filter((linha) => linha.descricao || linha.valor || linha.data_vencimento)

      setLinhasImportacao(preparadas)
      setStatusImportacao(`${preparadas.length} linha(s) preparada(s) para revisão.`)
    }

    reader.readAsText(file, 'UTF-8')
  }

  async function importarExcelParaContas() {
    if (!empresaId) {
      mostrarAviso('Usuário sem empresa vinculada.', 'erro')
      return
    }

    const invalidas = linhasImportacao.filter((linha) => !linha.descricao || !linha.valor || !linha.data_vencimento)
    if (invalidas.length > 0) {
      mostrarAviso(`Existem ${invalidas.length} linha(s) sem descrição, valor ou vencimento. Corrija a planilha e importe novamente.`, 'erro')
      return
    }

    const centrosCriados = { ...Object.fromEntries(centros.map((centro) => [centro.nome.toLowerCase(), centro.id])) }

    for (const linha of linhasImportacao) {
      if (linha.centro && !centrosCriados[linha.centro.toLowerCase()]) {
        const { data, error } = await supabase
          .from('df_centros_custo')
          .insert([{ nome: primeiraLetraMaiuscula(linha.centro), empresa_id: empresaId }])
          .select()

        if (error) {
          avisarErro(error)
          return
        }

        const centroNovo = Array.isArray(data) ? data[0] : data
        centrosCriados[linha.centro.toLowerCase()] = centroNovo?.id
      }
    }

    const payload = linhasImportacao.map((linha) => ({
      descricao: linha.descricao,
      valor: linha.valor,
      data_vencimento: linha.data_vencimento,
      vencimento: linha.data_vencimento,
      status: linha.status,
      centro_custo_id: linha.centro ? centrosCriados[linha.centro.toLowerCase()] || null : null,
      enviar_whatsapp: configWhatsapp,
      enviar_email: configEmail,
      enviar_push: configPush,
      dias_aviso: Number(diasAvisoPadrao || 1),
      empresa_id: empresaId
    }))

    const { error } = await supabase.from('df_contas').insert(payload)
    if (error) {
      avisarErro(error)
      return
    }

    setStatusImportacao(`${payload.length} conta(s) importada(s) com sucesso.`)
    setArquivoImportacao(null)
    setLinhasImportacao([])
    await carregarTudo(empresaId)
    navegarPara('contas')
  }

  async function sairDoSistema() {
    limparEstadoAutenticacao()
    setUsuarioLogado(null)
    setCarregandoAuth(false)
    setTelaAtualState('contas')
    await supabase.auth.signOut()
  }

  function voltarPainel() {
    navegarPara('dashboard')
  }

  function nomeUsuario() {
    const nome = nomeUsuarioPerfil || usuarioLogado?.user_metadata?.name || usuarioLogado?.user_metadata?.full_name
    if (nome) return String(nome).split(' ')[0]

    const email = usuarioLogado?.email || 'usuário'
    return primeiraLetraMaiuscula(email.split('@')[0])
  }

  function nomeUsuarioCompleto() {
    const nome = nomeUsuarioPerfil || usuarioLogado?.user_metadata?.name || usuarioLogado?.user_metadata?.full_name
    if (nome) return String(nome).trim()

    const email = usuarioLogado?.email || ''
    return email ? primeiraLetraMaiuscula(email.split('@')[0]) : ''
  }

  function abrirPerfilUsuario() {
    setNomePerfilEditando(nomeUsuarioCompleto())
    setModalPerfilUsuario(true)
  }

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
          contaRecorrente,
          setContaRecorrente,
          tipoRecorrencia,
          setTipoRecorrencia,
          diaVencimentoRecorrencia,
          setDiaVencimentoRecorrencia,
          fecharConta,
          salvarConta,
          primeiraLetraMaiuscula,
          limitarDataInput,
          formatarDataParaBanco,
          fecharNota,
          setModalCentro,
          setMenuAberto,
          setMenuNavegacaoAberto
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
        modalCentro={modalCentro}
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
        navegarPara={navegarPara}
        menuNavegacaoAberto={menuNavegacaoAberto}
        setMenuNavegacaoAberto={setMenuNavegacaoAberto}
        canSwitchCompany={permissoesUsuario?.canSwitchCompany}
        empresasDisponiveis={empresasDisponiveis}
        empresaId={empresaId}
        trocarEmpresaAtiva={trocarEmpresaAtiva}
        trocandoEmpresa={trocandoEmpresa}
        nomeUsuario={nomeUsuario}
        abrirPerfilUsuario={abrirPerfilUsuario}
        sairDoSistema={sairDoSistema}
      />
    )
  }

  function renderFabGlobal() {
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

  function renderMobileFinalStyle() {
    return (
      <style>{`
        /* ===== MOBILE FINAL — SCROLL, ALINHAMENTO E LIXEIRA ===== */
        @media (max-width: 979px) {
          html.mobile-nav-open,
          body.mobile-nav-open {
            overflow: hidden !important;
            overscroll-behavior: none !important;
            touch-action: none !important;
          }

          .mobile-menu-backdrop {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100dvh !important;
            overflow: hidden !important;
            overscroll-behavior: none !important;
            touch-action: none !important;
            padding: calc(env(safe-area-inset-top, 0px) + 76px) 12px calc(env(safe-area-inset-bottom, 0px) + 12px) 12px !important;
            align-items: flex-start !important;
          }

          .mobile-menu-panel {
            width: min(92vw, 372px) !important;
            height: auto !important;
            max-height: calc(100dvh - 96px - env(safe-area-inset-bottom, 0px)) !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            overscroll-behavior-y: contain !important;
            -webkit-overflow-scrolling: touch !important;
            touch-action: pan-y !important;
            scrollbar-width: thin !important;
            display: block !important;
            padding: 14px 14px 18px !important;
          }

          .mobile-menu-panel * {
            touch-action: auto !important;
          }

          .mobile-menu-panel .mobile-menu-group:last-child {
            padding-bottom: 18px !important;
          }

          .mobile-menu-group[open] {
            display: block !important;
          }

          .mobile-menu-group summary {
            min-height: 40px !important;
            position: sticky !important;
            top: 0 !important;
            z-index: 2 !important;
            background: #ffffff !important;
          }

          .mobile-menu-group button,
          .mobile-menu-panel button {
            width: 100% !important;
            min-height: 54px !important;
            margin: 6px 0 !important;
            box-sizing: border-box !important;
          }

          .filters-desktop {
            display: grid !important;
            gap: 10px !important;
          }

          .filters-desktop .filter-toggle-button,
          .filters-desktop .export-actions button {
            height: 44px !important;
            min-height: 44px !important;
            padding: 0 14px !important;
            border-radius: 14px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            line-height: 1 !important;
            box-sizing: border-box !important;
            white-space: nowrap !important;
          }

          .filters-desktop .export-actions {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 8px !important;
            align-items: center !important;
            width: 100% !important;
            margin: 0 !important;
          }

          .filters-desktop .advanced-filters,
          .filters-desktop .status-tabs {
            width: 100% !important;
          }

          .dashboard-account-row {
            align-items: stretch !important;
            gap: 12px !important;
            padding: 13px !important;
          }

          .dashboard-account-row > div:first-child {
            min-width: 0 !important;
          }

          .dashboard-account-row > div:first-child strong,
          .dashboard-account-row > div:first-child small {
            overflow-wrap: anywhere !important;
          }

          .dashboard-account-row-actions {
            min-width: 112px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            justify-content: center !important;
            gap: 6px !important;
            margin-left: auto !important;
            flex: 0 0 auto !important;
          }

          .dashboard-account-row-actions .dashboard-account-value {
            font-size: 14px !important;
            font-weight: 900 !important;
            color: #0f172a !important;
            white-space: nowrap !important;
          }

          .dashboard-account-row-actions .status-pill {
            min-width: 82px !important;
            text-align: center !important;
            justify-content: center !important;
          }

          .dashboard-paid-button {
            min-width: 82px !important;
            height: 36px !important;
            min-height: 36px !important;
            padding: 0 12px !important;
            border-radius: 999px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin: 0 !important;
          }

          .trash-card {
            padding: 13px !important;
            gap: 10px !important;
          }

          .trash-card small {
            color: #64748b !important;
            font-weight: 700 !important;
            line-height: 1.45 !important;
          }

          .trash-card .userActions,
          .trash-card [style*="display: flex"] {
            gap: 8px !important;
          }

          .trash-card button {
            min-height: 40px !important;
            border-radius: 12px !important;
          }

          .trash-card button:last-child {
            background: #fff7f7 !important;
            color: #b91c1c !important;
            border: 1px solid #fecaca !important;
          }
        }
      `}</style>
    )
  }


  function renderMobileUxFinalPatchStyle() {
    return (
      <style>{`
        /* ===== UX FINAL — MOBILE COM IDENTIDADE DO DESKTOP ===== */
        @media (max-width: 979px) {
          .dashboard-open-list .dashboard-account-row {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) auto !important;
            align-items: center !important;
            gap: 10px 12px !important;
            padding: 14px !important;
            border-radius: 18px !important;
            box-shadow: 0 8px 18px rgba(15, 23, 42, .045) !important;
          }

          .dashboard-open-list .dashboard-account-row.account-row-pendente {
            background: #fffdf2 !important;
            border-color: #fde68a !important;
            border-left-color: #fbbf24 !important;
          }

          .dashboard-open-list .dashboard-account-row.account-row-vencido {
            background: #fff7f7 !important;
            border-color: #fecaca !important;
            border-left-color: #f87171 !important;
          }

          .dashboard-open-list .dashboard-account-row > div:first-child {
            grid-column: 1 / 2 !important;
            min-width: 0 !important;
            align-self: center !important;
          }

          .dashboard-open-list .dashboard-account-row-actions {
            grid-column: 2 / 3 !important;
            width: auto !important;
            min-width: 116px !important;
            display: grid !important;
            grid-template-columns: auto auto !important;
            grid-template-areas:
              "valor valor"
              "status pago" !important;
            align-items: center !important;
            justify-content: end !important;
            gap: 6px 8px !important;
            margin-left: 0 !important;
          }

          .dashboard-open-list .dashboard-account-value {
            grid-area: valor !important;
            text-align: right !important;
            font-size: 17px !important;
            line-height: 1.15 !important;
          }

          .dashboard-open-list .status-pill {
            grid-area: status !important;
            min-width: auto !important;
            padding: 4px 9px !important;
            font-size: 11px !important;
            line-height: 1 !important;
          }

          .dashboard-open-list .dashboard-paid-button {
            grid-area: pago !important;
            min-width: 68px !important;
            height: 34px !important;
            min-height: 34px !important;
            padding: 0 14px !important;
            box-shadow: 0 6px 12px rgba(15, 118, 110, .10) !important;
          }

          .account-card-desktop {
            background: #ffffff !important;
            border: 1px solid #e5e7eb !important;
            border-left: 5px solid #cbd5e1 !important;
            border-radius: 18px !important;
            padding: 16px !important;
            box-shadow: 0 8px 20px rgba(15, 23, 42, .045) !important;
          }

          .account-card-desktop.account-card-pendente {
            background: #fffdf2 !important;
            border-color: #fde68a !important;
            border-left-color: #fbbf24 !important;
          }

          .account-card-desktop.account-card-vencida {
            background: #fff7f7 !important;
            border-color: #fecaca !important;
            border-left-color: #f87171 !important;
          }

          .account-card-desktop.account-card-paga {
            background: #f0fdf4 !important;
            border-color: #bbf7d0 !important;
            border-left-color: #86efac !important;
          }

          .account-card-desktop .account-actions {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 10px !important;
            width: 100% !important;
            margin-top: 12px !important;
          }

          .account-card-desktop .account-actions button {
            width: 100% !important;
            min-width: 0 !important;
            min-height: 48px !important;
            border-radius: 14px !important;
            box-shadow: 0 6px 14px rgba(15, 23, 42, .06) !important;
          }

          .status-pill.status-pendente {
            background: #fef3c7 !important;
            color: #92400e !important;
          }

          .status-pill.status-vencido {
            background: #fee2e2 !important;
            color: #991b1b !important;
          }

          .status-pill.status-pago {
            background: #dcfce7 !important;
            color: #166534 !important;
          }

          .relatorios-page .report-status-tabs {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }

          .relatorios-page .report-status-tabs button {
            width: 100% !important;
            min-height: 48px !important;
            margin: 0 !important;
            border-radius: 14px !important;
          }

          .user-badge,
          .roleBadge {
            display: inline-flex !important;
            align-items: center !important;
            width: fit-content !important;
            border: 1px solid rgba(15, 23, 42, .06) !important;
            box-shadow: 0 4px 10px rgba(15, 23, 42, .045) !important;
          }

          .roleBadge.admin { background: #f3e8ff !important; color: #7e22ce !important; }
          .roleBadge.gerente { background: #e0f2fe !important; color: #0369a1 !important; }
          .roleBadge.operador { background: #f1f5f9 !important; color: #475569 !important; }
          .user-badge-self { background: #dcfce7 !important; color: #166534 !important; }
          .user-badge-pending { background: #fef3c7 !important; color: #92400e !important; }
        }

        @media (max-width: 390px) {
          .dashboard-open-list .dashboard-account-row {
            grid-template-columns: 1fr !important;
          }
          .dashboard-open-list .dashboard-account-row-actions {
            grid-column: 1 / -1 !important;
            width: 100% !important;
            justify-content: stretch !important;
            grid-template-columns: 1fr auto !important;
          }
          .dashboard-open-list .dashboard-account-value {
            text-align: left !important;
          }
        }

        @media (min-width: 980px) {
          .trash-card small {
            display: block !important;
            color: #64748b !important;
            font-weight: 700 !important;
            line-height: 1.45 !important;
            margin: 8px 0 0 !important;
          }
        }
      `}</style>
    )
  }

  function renderDesktopRefinoStyle() {
    return (
      <style>{`
        @media (min-width: 980px) {
          .top-shell .mobile-menu-trigger { display: none !important; }
          .desktop-sidebar.no-print {
            background: #ffffff !important;
            color: #0f172a !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: 0 18px 44px rgba(15, 23, 42, .08) !important;
          }
          .desktop-sidebar-brand { border-bottom: 1px solid #e2e8f0 !important; }
          .desktop-sidebar-brand img { background: #f0fdfa !important; border: 1px solid #ccfbf1 !important; }
          .desktop-sidebar-brand strong, .desktop-sidebar-user strong { color: #0f172a !important; }
          .desktop-sidebar-brand small, .desktop-sidebar-user small { color: #64748b !important; }
          .desktop-sidebar-user.sidebar-user-clean { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; }
          .sidebar-user-avatar { background: #f0fdfa !important; color: #0f766e !important; border: 1px solid #ccfbf1 !important; }
          .sidebar-collapse-btn {
            width: 42px !important; height: 42px !important; min-height: 42px !important; padding: 0 !important; margin: 8px auto 14px !important;
            display: inline-flex !important; align-items: center !important; justify-content: center !important; align-self: center !important;
            background: #f0fdfa !important; color: #0f766e !important; border: 1px solid #99f6e4 !important;
            box-shadow: 0 8px 18px rgba(15, 118, 110, .10) !important;
            transition: transform .18s ease, background .18s ease, box-shadow .18s ease !important;
          }
          .sidebar-collapse-btn:hover { background: #ccfbf1 !important; transform: translateY(-1px) !important; box-shadow: 0 12px 24px rgba(15, 118, 110, .14) !important; }
          .sidebar-collapse-btn small { display: none !important; }
          .sidebar-collapse-btn small, .sidebar-collapse-arrow { color: #0f766e !important; font-weight: 900 !important; }
          .sidebar-collapse-arrow { width: 22px !important; height: 22px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; border-radius: 999px !important; background: #ffffff !important; }
          .sidebar-group-toggle { color: #94a3b8 !important; }
          .sidebar-group-toggle strong { background: #f1f5f9 !important; color: #64748b !important; }
          .desktop-sidebar-nav button { color: #64748b !important; background: transparent !important; border: 1px solid transparent !important; font-weight: 700 !important; }
          .desktop-sidebar-nav button:hover { background: #f8fafc !important; border-color: #e2e8f0 !important; color: #0f172a !important; }
          .desktop-sidebar-nav button.active { background: #f0fdfa !important; border-color: #99f6e4 !important; color: #0f766e !important; box-shadow: inset 3px 0 0 #0f766e !important; }
          .desktop-sidebar-nav button.active .menu-icon, .desktop-sidebar-nav button:hover .menu-icon { color: #0f766e !important; }

          .summary-grid > div, .result-summary, .content-block, .agenda-card-polished, [class*="users-page-section"] {
            border: 1px solid #f1f5f9 !important; box-shadow: 0 12px 28px rgba(15, 23, 42, .055) !important;
          }
          .account-card-desktop { background: #ffffff !important; border: 1px solid #f1f5f9 !important; box-shadow: 0 10px 24px rgba(15, 23, 42, .045) !important; border-left: 4px solid transparent !important; }
          .account-card-desktop.account-card-vencida { border-left-color: #f87171 !important; background: #ffffff !important; }
          .account-card-desktop.account-card-paga { border-left-color: #86efac !important; background: #ffffff !important; }
          .account-card-desktop.account-card-pendente { border-left-color: #cbd5e1 !important; background: #ffffff !important; }
          .account-card-desktop strong { color: #0f172a !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; display: block !important; }
          .account-meta-line { color: #64748b !important; min-width: 0 !important; flex-wrap: wrap !important; }
          .status-pill { border-radius: 999px !important; padding: 4px 10px !important; font-size: 12px !important; font-weight: 800 !important; }
          .status-pago { background: #dcfce7 !important; color: #166534 !important; }
          .status-pendente { background: #f1f5f9 !important; color: #475569 !important; }
          .status-vencido { background: #fee2e2 !important; color: #b91c1c !important; }

          .notes-list-dashboard p, .trash-card p { white-space: pre-wrap !important; overflow-wrap: anywhere !important; }
          .notes-list-dashboard > div { background: #ffffff !important; border: 1px solid #f1f5f9 !important; border-radius: 16px !important; box-shadow: 0 8px 20px rgba(15, 23, 42, .04) !important; }
          .notes-list-dashboard button:last-child { background: transparent !important; border-color: transparent !important; color: #94a3b8 !important; box-shadow: none !important; }
          .notes-list-dashboard button:last-child:hover { background: #fee2e2 !important; color: #dc2626 !important; }

          .users-page-section { gap: 14px !important; padding: 18px 20px !important; border-radius: 18px !important; }
          .users-account-grid { grid-template-columns: repeat(2, minmax(280px, 1fr)) !important; gap: 14px !important; }
          .users-form-card, .users-add-card, .users-permission-guide { box-shadow: none !important; background: #ffffff !important; border-color: #e2e8f0 !important; }
          .users-form-card { padding: 14px !important; border-radius: 14px !important; gap: 10px !important; }
          .users-form-card input, .users-add-card input, .users-add-card select { min-height: 42px !important; }
          .users-form-card button, .users-add-card button { min-height: 42px !important; }
          .users-permission-guide { padding: 12px !important; border-radius: 16px !important; grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .users-permission-guide span { min-height: 54px !important; padding: 10px 12px !important; border-radius: 12px !important; background: #f8fafc !important; display: flex !important; align-items: center !important; line-height: 1.25 !important; }
          .users-add-card { grid-template-columns: minmax(170px, .9fr) minmax(220px, 1.1fr) 160px auto !important; gap: 10px !important; padding: 12px !important; border-radius: 16px !important; }
          .users-list { gap: 8px !important; }
          .userCard { display: grid !important; grid-template-columns: minmax(220px, 1fr) auto 150px auto !important; align-items: center !important; gap: 12px !important; background: #ffffff !important; border-radius: 14px !important; border: 1px solid #f1f5f9 !important; padding: 12px 14px !important; box-shadow: none !important; }
          .userInfo { min-width: 0 !important; }
          .userInfo strong, .userInfo small { display: block !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
          .roleBadge { padding: 5px 11px !important; border-radius: 999px !important; font-size: 12px !important; font-weight: 800 !important; text-transform: capitalize !important; white-space: nowrap !important; }
          .roleBadge.admin { background: #f3e8ff !important; color: #7e22ce !important; }
          .roleBadge.gerente { background: #e0f2fe !important; color: #0369a1 !important; }
          .roleBadge.operador { background: #f1f5f9 !important; color: #475569 !important; }
          .user-role-select { max-width: 150px !important; margin: 0 !important; min-height: 38px !important; }
          .user-actions { gap: 6px !important; }
          .user-actions button { min-height: 32px !important; padding: 6px 10px !important; font-size: 12px !important; border-radius: 9px !important; }
          .user-actions button:disabled { opacity: .42 !important; cursor: not-allowed !important; filter: grayscale(1) !important; }

          .trash-card { background: #fcfcfd !important; border: 1px dashed #cbd5e1 !important; border-radius: 18px !important; color: #64748b !important; box-shadow: none !important; }
          .trash-card strong { color: #64748b !important; text-decoration: line-through !important; }
          .agenda-page-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important; }
          .relatorios-page [style*="grid-template-columns: 1fr 1fr 1fr"], .relatorios-page [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important; }
        }
      `}</style>
    )
  }


  function renderAppFrame(children) {
    return (
      <AppProviders contas={contas} contasFiltradas={contasFiltradas} navegarPara={navegarPara}>
      <div className="app-page app-frame" style={styles.page}>
        <style>{`

          .app-toast {
            position: fixed;
            left: 50%;
            bottom: 92px;
            transform: translateX(-50%);
            z-index: 5000;
            width: min(360px, calc(100vw - 32px));
            padding: 12px 14px;
            border-radius: 16px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            box-shadow: 0 18px 45px rgba(15,23,42,.20);
            display: grid;
            gap: 3px;
            color: #111827;
          }
          .app-toast strong { font-size: 13px; }
          .app-toast span { font-size: 13px; color: #4b5563; }
          .app-toast-erro { border-left: 5px solid #ef4444; }
          .app-toast-info { border-left: 5px solid #14b8a6; }
          .master-page-hero {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 18px;
          }
          .master-kicker {
            display: inline-flex;
            align-items: center;
            width: fit-content;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(20, 184, 166, .10);
            color: #0f766e;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .08em;
            margin-bottom: 8px;
          }

          .master-tabs {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: -4px 0 18px;
            padding: 6px;
            width: fit-content;
            border-radius: 999px;
            background: #f1f5f9;
            border: 1px solid rgba(15, 23, 42, .06);
          }
          .master-tabs button {
            min-height: 36px;
            border: 0;
            border-radius: 999px;
            padding: 8px 14px;
            background: transparent;
            color: #64748b;
            font-size: 13px;
            font-weight: 900;
            cursor: pointer;
            transition: all .18s ease;
          }
          .master-tabs button.active {
            background: #ffffff;
            color: #0f766e;
            box-shadow: 0 8px 22px rgba(15, 23, 42, .08);
          }
          .master-stats-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 18px;
          }
          .master-stat-card {
            border: 1px solid rgba(15, 23, 42, .08);
            border-radius: 22px;
            background: linear-gradient(135deg, #ffffff, #f8fafc);
            box-shadow: 0 14px 34px rgba(15, 23, 42, .06);
            padding: 18px;
            display: grid;
            gap: 8px;
          }
          .master-stat-card small {
            color: #64748b;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .06em;
            font-size: 11px;
          }
          .master-stat-card strong {
            color: #0f172a;
            font-size: 24px;
            font-weight: 950;
            line-height: 1.1;
          }
          .master-create-card,
          .master-create-form,
          .master-list-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 14px;
          }
          .master-create-form { flex: 1; max-width: 560px; }
          .master-create-form input { margin: 0 !important; }
          .master-search-input { max-width: 320px; margin: 0 !important; }
          .master-companies-list {
            display: grid;
            gap: 12px;
            margin-top: 16px;
          }
          .master-company-card {
            display: grid;
            grid-template-columns: minmax(0, 1.2fr) auto auto;
            gap: 14px;
            align-items: center;
            border: 1px solid rgba(15, 23, 42, .08);
            border-radius: 20px;
            background: #ffffff;
            padding: 14px;
            box-shadow: 0 10px 28px rgba(15, 23, 42, .05);
          }
          .master-company-card.active {
            border-color: rgba(20, 184, 166, .32);
            background: linear-gradient(135deg, #ffffff, #f0fdfa);
          }
          .master-company-main {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .master-company-icon {
            width: 42px;
            height: 42px;
            border-radius: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: rgba(20, 184, 166, .10);
            flex: 0 0 42px;
          }
          .master-company-main h3 {
            margin: 0 0 4px;
            color: #0f172a;
            font-size: 16px;
          }
          .master-company-main small {
            display: block;
            max-width: 360px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #64748b;
          }
          .master-company-meta {
            display: grid;
            gap: 4px;
            color: #64748b;
            font-size: 12px;
          }
          .master-company-meta strong {
            color: #0f766e;
            font-weight: 900;
          }
          .master-company-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
          }
          .master-company-actions button {
            min-height: 36px !important;
            padding: 8px 12px !important;
            margin: 0 !important;
          }
          @media (max-width: 860px) {
            .master-page-hero,
            .master-create-card,
            .master-create-form,
            .master-list-header {
              display: grid;
              align-items: stretch;
            }
            .master-tabs { width: 100%; }
            .master-tabs button { flex: 1; }
            .master-stats-grid { grid-template-columns: 1fr; }
            .master-create-form { max-width: none; }
            .master-search-input { max-width: none; }
            .master-company-card {
              grid-template-columns: 1fr;
              align-items: stretch;
            }
            .master-company-actions { justify-content: flex-start; flex-wrap: wrap; }
          }
          .top-shell-clean {
            min-height: 72px !important;
            box-sizing: border-box !important;
          }
          @media (max-width: 979px) {
            .top-shell-clean {
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              gap: 10px !important;
              margin: 0 0 14px 0 !important;
              padding: 10px 12px !important;
              border-radius: 20px !important;
              background: #ffffff !important;
              border: 1px solid #e5e7eb !important;
              box-shadow: 0 10px 24px rgba(15,23,42,.06) !important;
            }
            .top-shell-logo {
              min-width: 0 !important;
              flex: 1 !important;
              overflow: hidden !important;
            }
            .top-shell-logo img {
              width: 42px !important;
              height: 42px !important;
              flex: 0 0 42px !important;
            }
            .top-shell-logo strong {
              display: block !important;
              max-width: 190px !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              white-space: nowrap !important;
              font-size: 15px !important;
              line-height: 1.1 !important;
            }
            .top-shell-logo small {
              display: block !important;
              font-size: 11px !important;
              line-height: 1.1 !important;
              color: #64748b !important;
            }
            .mobile-menu-trigger {
              flex: 0 0 42px !important;
              width: 42px !important;
              height: 42px !important;
              border-radius: 14px !important;
              background: #ffffff !important;
              color: #0f172a !important;
              border: 1px solid #e5e7eb !important;
              box-shadow: 0 6px 16px rgba(15,23,42,.08) !important;
            }
          }

          .desktop-sidebar { display: none; }
          @media (min-width: 980px) {
            body { background: #eef7f5 !important; }
            .app-frame { max-width: none !important; width: 100% !important; min-height: 100vh !important; margin: 0 !important; padding: 24px 32px 80px 300px !important; box-sizing: border-box !important; background: linear-gradient(180deg, #f8fafc 0%, #eef7f5 100%) !important; }
            .app-frame-content { max-width: 1280px; margin: 0 auto; }
            .app-frame-content > h1 { font-size: 34px !important; margin: 0 0 16px 0 !important; }
            .app-frame-content > section { border-radius: 22px !important; box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07) !important; }
            .relatorios-page { max-width: 1280px !important; width: 100% !important; padding: 0 !important; margin: 0 !important; background: transparent !important; }
            .relatorios-page [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
            .desktop-sidebar { display: flex !important; position: fixed; left: 24px; top: 24px; bottom: 24px; width: 244px; padding: 18px; border-radius: 24px; background: linear-gradient(180deg, #064e3b 0%, #0f766e 48%, #14b8a6 100%); color: white; box-shadow: 0 24px 60px rgba(15, 118, 110, 0.28); z-index: 60; flex-direction: column; gap: 14px; box-sizing: border-box; }
            .desktop-sidebar-brand { display:flex; align-items:center; gap:12px; padding-bottom:14px; border-bottom:1px solid rgba(255,255,255,.18); }
            .desktop-sidebar-brand img { width:48px; height:48px; border-radius:16px; background:white; }
            .desktop-sidebar-brand strong { display:block; font-size:17px; }
            .desktop-sidebar-brand small { color:rgba(255,255,255,.78); }
            .desktop-sidebar-section-label { margin:12px 4px 4px; font-size:10px; letter-spacing:.9px; text-transform:uppercase; color:rgba(255,255,255,.62); font-weight:900; }
            .desktop-sidebar-nav { display:grid; gap:6px; margin-top:2px; }
            .desktop-sidebar-nav button { display:flex; align-items:center; gap:10px; width:100%; border:1px solid transparent; background:transparent; color:rgba(255,255,255,.92); border-radius:14px; padding:11px 12px; text-align:left; font-weight:800; cursor:pointer; }
            .desktop-sidebar-nav button:hover { background:rgba(255,255,255,.14); border-color:rgba(255,255,255,.12); }
            .desktop-sidebar-nav button.active { background:rgba(255,255,255,.22); border-color:rgba(255,255,255,.18); box-shadow:inset 3px 0 0 rgba(255,255,255,.8); }
            .desktop-sidebar-spacer { flex:1; }
            .desktop-sidebar-user { border-radius:18px; padding:12px; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.16); }
            .desktop-sidebar-user strong { display:block; }
            .desktop-sidebar-user small { color:rgba(255,255,255,.8); }
            .top-shell { max-width:1280px; margin:0 auto 22px auto !important; padding:16px 18px !important; border-radius:24px !important; }
            .mobile-menu-trigger { display:none !important; }
            .agenda-page-grid { display:grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:16px; }
          }
          @media (max-width: 979px) { .app-frame { max-width: 430px; margin:auto; } }
          .note-card-action { transition:.2s; }

          /* ===== DF GESTAO — LAYOUT LIMPO E BLINDADO ===== */
          @media (min-width: 980px) {
            .app-page, .app-frame {
              padding-left: 300px !important;
              transition: padding-left .25s ease !important;
            }
            body:has(.desktop-sidebar.compacta) .app-page,
            body:has(.desktop-sidebar.compacta) .app-frame {
              padding-left: 112px !important;
            }
            .desktop-sidebar {
              width: 244px !important;
              overflow: hidden !important;
              gap: 10px !important;
            }
            .desktop-sidebar.compacta {
              width: 72px !important;
              padding: 14px 10px !important;
              align-items: center !important;
            }
            .desktop-sidebar.compacta .desktop-sidebar-brand {
              justify-content: center !important;
              padding-bottom: 10px !important;
            }
            .desktop-sidebar.compacta .desktop-sidebar-brand img {
              width: 44px !important;
              height: 44px !important;
            }
            .sidebar-collapse-btn {
              display:flex; align-items:center; justify-content:center; gap:8px;
              width:100%; border:1px solid rgba(255,255,255,.14); border-radius:14px;
              background:rgba(255,255,255,.08); color:white; font-weight:900;
              padding:8px 10px; cursor:pointer; opacity:.88;
            }
            .sidebar-collapse-btn:hover { opacity:1; background:rgba(255,255,255,.14); }
            .sidebar-collapse-btn small { font-size:12px; color:rgba(255,255,255,.78); font-weight:800; }
            .sidebar-user-clean { display:flex; align-items:center; gap:10px; background:rgba(255,255,255,.14) !important; }
            .sidebar-user-avatar { width:34px; height:34px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:#ffffff; color:#0f766e; font-weight:900; flex:0 0 34px; }
            .desktop-sidebar-scroll {
              width: 100%; overflow-y: auto; overflow-x: hidden; padding-right: 2px;
              display: grid; gap: 8px;
            }
            .desktop-sidebar-scroll::-webkit-scrollbar { width: 4px; }
            .desktop-sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.28); border-radius: 999px; }
            .sidebar-group-clean { display:grid; gap:5px; width:100%; }
            .sidebar-group-toggle {
              display:flex; align-items:center; justify-content:space-between;
              width:100%; border:0; background:transparent; color:rgba(255,255,255,.70);
              text-transform:uppercase; letter-spacing:.7px; font-size:10px; font-weight:900;
              padding:8px 8px 2px; cursor:pointer;
            }
            .desktop-sidebar.compacta .sidebar-group-toggle { justify-content:center; padding:6px 0; }
            .desktop-sidebar-nav button {
              min-height: 42px !important; padding:10px 11px !important; border-radius:14px !important;
              white-space: nowrap !important;
            }
            .desktop-sidebar.compacta .desktop-sidebar-nav button { justify-content:center !important; padding:10px 0 !important; }
            .menu-icon { width:22px; text-align:center; flex:0 0 22px; }
            .desktop-sidebar.compacta .menu-icon { width:auto; flex:auto; }
            .desktop-sidebar.compacta .desktop-sidebar-user { width:44px !important; height:44px !important; border-radius:16px !important; padding:0 !important; display:flex; align-items:center; justify-content:center; }
            .desktop-sidebar.compacta .sidebar-exit { width:100%; }
            .top-shell { background:#ffffff !important; }
            .top-shell strong, .desktop-sidebar-brand strong { letter-spacing:.1px; }
            .dashboard-title-row { margin-right: 360px !important; }
            body:has(.desktop-sidebar.compacta) .dashboard-title-row,
            body:has(.desktop-sidebar.compacta) .summary-grid,
            body:has(.desktop-sidebar.compacta) .agenda-card-polished,
            body:has(.desktop-sidebar.compacta) .filters-desktop,
            body:has(.desktop-sidebar.compacta) .result-summary,
            body:has(.desktop-sidebar.compacta) .content-block { margin-right: 360px !important; }
            .notes-panel {
              right: 28px !important; top: 158px !important; width: 330px !important;
              padding: 18px !important; border-radius: 24px !important;
              box-shadow: 0 18px 40px rgba(15,23,42,.08) !important;
            }
            .quick-actions-card {
              display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:14px; border-radius:18px;
              background:linear-gradient(135deg,#f8fafc,#ecfeff); border:1px solid #ccfbf1; margin-bottom:14px;
            }
            .quick-actions-card strong { grid-column:1/-1; font-size:15px; }
            .quick-actions-card button { border:0; border-radius:12px; padding:11px 10px; color:white; font-weight:900; cursor:pointer; }
            .quick-actions-card button:nth-of-type(1) { background:linear-gradient(135deg,#14b8a6,#0f766e); }
            .quick-actions-card button:nth-of-type(2) { background:#111827; }
            .account-card-desktop .account-actions { display:flex !important; gap:8px !important; flex-wrap:nowrap !important; }
            .account-card-desktop .account-actions button { min-width:74px !important; margin:0 !important; }
            .note-event-date { display:inline-flex; margin:6px 0; padding:4px 8px; border-radius:999px; background:#eef2ff; color:#3730a3; font-weight:800; font-size:12px; }
          }

          @media (max-width: 979px) {
            .mobile-menu-panel { padding-bottom: 24px !important; }
            .mobile-menu-group { margin-top: 12px !important; }
            .mobile-menu-group summary { padding: 10px 4px !important; font-weight:900; color:#0f766e; }
            .mobile-fab-menu { display:grid !important; gap:10px !important; }
            .notes-panel { position: static !important; width:auto !important; max-height:none !important; overflow:visible !important; }
            .quick-actions-card { display:none !important; }
          }


          /* MOBILE: bloco de notas visível e FAB funcional */
          @media (max-width: 979px) {
            .notes-panel {
              position: static !important;
              width: auto !important;
              max-height: none !important;
              overflow: visible !important;
              margin: 14px 0 18px !important;
              padding: 16px !important;
              border-radius: 22px !important;
              background: #ffffff !important;
              border: 1px solid #e5e7eb !important;
              box-shadow: 0 12px 28px rgba(15,23,42,.08) !important;
            }
            .note-add-small {
              width: 38px !important;
              height: 38px !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .mobile-fab, .mobile-fab-menu { z-index: 3000 !important; }
            .mobile-fab-menu button { touch-action: manipulation !important; }
          }

  

        /* PARIDADE MOBILE/DESKTOP + CSS SUAVE */
        .relatorios-page [style*="grid-template-columns: 1fr 1fr 1fr"],
        .relatorios-page [style*="grid-template-columns: repeat(3"],
        .relatorios-page .report-grid-fluid,
        .summary-grid,
        .metrics-grid,
        .dashboard-grid-fluid {
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important;
        }
        .app-frame-content > section,
        .content-block,
        .print-card,
        .modal,
        .dashboard-notes-card,
        .dashboard-open-accounts {
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06) !important;
        }
        button.danger,
        .btn-danger,
        .account-actions button:last-child,
        .notes-list-dashboard button:last-child {
          background: #fee2e2 !important;
          color: #ef4444 !important;
          border: 1px solid #f87171 !important;
        }
        @media (max-width: 979px) {
          button,
          .desktop-sidebar-nav button,
          .mobile-menu-panel button,
          .filter-toggle-button,
          .dashboard-see-all-link,
          .note-toggle-small,
          .account-actions button,
          .export-actions button {
            min-height: 44px !important;
          }
          .btnMiniExcluir,
          [style*="padding: 4px 7px"] {
            min-width: 44px !important;
            min-height: 44px !important;
          }
          .dashboard-notes-card.mobile-collapsed-default {
            margin-top: 10px !important;
          }
        }

      `}</style>
      {renderDesktopRefinoStyle()}
      {renderMobileFinalStyle()}
      <CopilotStyles />
      {renderMobileUxFinalPatchStyle()}
      {renderTopShell()}

        {renderSidebar()}
        {renderMobileMenu()}

        <main className="app-frame-content">{children}</main>
        {renderFabGlobal()}
      <CopilotFloatingButton />
      <CopilotDrawer />
        {renderModaisGlobais()}
        {renderOverlaysLayer()}
      </div>
      </AppProviders>
    )
  }


  function AppFrame({ children }) {
    return (
      <div className="app-page app-frame" style={styles.page}>
        <style>{`
          .desktop-sidebar { display: none; }
          @media (min-width: 980px) {
            body { background: #eef7f5 !important; }
            .app-frame { max-width: none !important; width: 100% !important; min-height: 100vh !important; margin: 0 !important; padding: 24px 32px 80px 300px !important; box-sizing: border-box !important; background: linear-gradient(180deg, #f8fafc 0%, #eef7f5 100%) !important; }
            .app-frame-content { max-width: 1280px; margin: 0 auto; }
            .app-frame-content > h1 { font-size: 34px !important; margin: 0 0 16px 0 !important; }
            .app-frame-content > section { border-radius: 22px !important; box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07) !important; }
            .relatorios-page { max-width: 1280px !important; width: 100% !important; padding: 0 !important; margin: 0 !important; background: transparent !important; }
            .relatorios-page [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
            .desktop-sidebar { display: flex !important; position: fixed; left: 24px; top: 24px; bottom: 24px; width: 244px; padding: 18px; border-radius: 24px; background: linear-gradient(180deg, #064e3b 0%, #0f766e 48%, #14b8a6 100%); color: white; box-shadow: 0 24px 60px rgba(15, 118, 110, 0.28); z-index: 60; flex-direction: column; gap: 14px; box-sizing: border-box; }
            .desktop-sidebar-brand { display:flex; align-items:center; gap:12px; padding-bottom:14px; border-bottom:1px solid rgba(255,255,255,.18); }
            .desktop-sidebar-brand img { width:48px; height:48px; border-radius:16px; background:white; }
            .desktop-sidebar-brand strong { display:block; font-size:17px; }
            .desktop-sidebar-brand small { color:rgba(255,255,255,.78); }
            .desktop-sidebar-section-label { margin:12px 4px 4px; font-size:10px; letter-spacing:.9px; text-transform:uppercase; color:rgba(255,255,255,.62); font-weight:900; }
            .desktop-sidebar-nav { display:grid; gap:6px; margin-top:2px; }
            .desktop-sidebar-nav button { display:flex; align-items:center; gap:10px; width:100%; border:1px solid transparent; background:transparent; color:rgba(255,255,255,.92); border-radius:14px; padding:11px 12px; text-align:left; font-weight:800; cursor:pointer; }
            .desktop-sidebar-nav button:hover { background:rgba(255,255,255,.14); border-color:rgba(255,255,255,.12); }
            .desktop-sidebar-nav button.active { background:rgba(255,255,255,.22); border-color:rgba(255,255,255,.18); box-shadow:inset 3px 0 0 rgba(255,255,255,.8); }
            .desktop-sidebar-spacer { flex:1; }
            .desktop-sidebar-user { border-radius:18px; padding:12px; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.16); }
            .desktop-sidebar-user strong { display:block; }
            .desktop-sidebar-user small { color:rgba(255,255,255,.8); }
            .top-shell { max-width:1280px; margin:0 auto 22px auto !important; padding:16px 18px !important; border-radius:24px !important; }
            .mobile-menu-trigger { display:none !important; }
            .agenda-page-grid { display:grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:16px; }
          }
          @media (max-width: 979px) { .app-frame { max-width: 430px; margin:auto; } }
          .note-card-action { transition:.2s; }

          /* ===== DF GESTAO — LAYOUT LIMPO E BLINDADO ===== */
          @media (min-width: 980px) {
            .app-page, .app-frame {
              padding-left: 300px !important;
              transition: padding-left .25s ease !important;
            }
            body:has(.desktop-sidebar.compacta) .app-page,
            body:has(.desktop-sidebar.compacta) .app-frame {
              padding-left: 112px !important;
            }
            .desktop-sidebar {
              width: 244px !important;
              overflow: hidden !important;
              gap: 10px !important;
            }
            .desktop-sidebar.compacta {
              width: 72px !important;
              padding: 14px 10px !important;
              align-items: center !important;
            }
            .desktop-sidebar.compacta .desktop-sidebar-brand {
              justify-content: center !important;
              padding-bottom: 10px !important;
            }
            .desktop-sidebar.compacta .desktop-sidebar-brand img {
              width: 44px !important;
              height: 44px !important;
            }
            .sidebar-collapse-btn {
              display:flex; align-items:center; justify-content:center; gap:8px;
              width:100%; border:1px solid rgba(255,255,255,.16); border-radius:14px;
              background:rgba(255,255,255,.10); color:white; font-weight:900;
              padding:9px 10px; cursor:pointer;
            }
            .desktop-sidebar-scroll {
              width: 100%; overflow-y: auto; overflow-x: hidden; padding-right: 2px;
              display: grid; gap: 8px;
            }
            .desktop-sidebar-scroll::-webkit-scrollbar { width: 4px; }
            .desktop-sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.28); border-radius: 999px; }
            .sidebar-group-clean { display:grid; gap:5px; width:100%; }
            .sidebar-group-toggle {
              display:flex; align-items:center; justify-content:space-between;
              width:100%; border:0; background:transparent; color:rgba(255,255,255,.70);
              text-transform:uppercase; letter-spacing:.7px; font-size:10px; font-weight:900;
              padding:8px 8px 2px; cursor:pointer;
            }
            .desktop-sidebar.compacta .sidebar-group-toggle { justify-content:center; padding:6px 0; }
            .desktop-sidebar-nav button {
              min-height: 42px !important; padding:10px 11px !important; border-radius:14px !important;
              white-space: nowrap !important;
            }
            .desktop-sidebar.compacta .desktop-sidebar-nav button { justify-content:center !important; padding:10px 0 !important; }
            .menu-icon { width:22px; text-align:center; flex:0 0 22px; }
            .desktop-sidebar.compacta .menu-icon { width:auto; flex:auto; }
            .desktop-sidebar.compacta .desktop-sidebar-user { width:44px !important; height:44px !important; border-radius:16px !important; padding:0 !important; display:flex; align-items:center; justify-content:center; }
            .desktop-sidebar.compacta .sidebar-exit { width:100%; }
            .top-shell { background:#ffffff !important; }
            .top-shell strong, .desktop-sidebar-brand strong { letter-spacing:.1px; }
            .dashboard-title-row { margin-right: 360px !important; }
            body:has(.desktop-sidebar.compacta) .dashboard-title-row,
            body:has(.desktop-sidebar.compacta) .summary-grid,
            body:has(.desktop-sidebar.compacta) .agenda-card-polished,
            body:has(.desktop-sidebar.compacta) .filters-desktop,
            body:has(.desktop-sidebar.compacta) .result-summary,
            body:has(.desktop-sidebar.compacta) .content-block { margin-right: 360px !important; }
            .notes-panel {
              right: 28px !important; top: 158px !important; width: 330px !important;
              padding: 18px !important; border-radius: 24px !important;
              box-shadow: 0 18px 40px rgba(15,23,42,.08) !important;
            }
            .quick-actions-card {
              display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:14px; border-radius:18px;
              background:linear-gradient(135deg,#f8fafc,#ecfeff); border:1px solid #ccfbf1; margin-bottom:14px;
            }
            .quick-actions-card strong { grid-column:1/-1; font-size:15px; }
            .quick-actions-card button { border:0; border-radius:12px; padding:11px 10px; color:white; font-weight:900; cursor:pointer; }
            .quick-actions-card button:nth-of-type(1) { background:linear-gradient(135deg,#14b8a6,#0f766e); }
            .quick-actions-card button:nth-of-type(2) { background:#111827; }
            .account-card-desktop .account-actions { display:flex !important; gap:8px !important; flex-wrap:nowrap !important; }
            .account-card-desktop .account-actions button { min-width:74px !important; margin:0 !important; }
            .note-event-date { display:inline-flex; margin:6px 0; padding:4px 8px; border-radius:999px; background:#eef2ff; color:#3730a3; font-weight:800; font-size:12px; }
          }

          @media (max-width: 979px) {
            .mobile-menu-panel { padding-bottom: 24px !important; }
            .mobile-menu-group { margin-top: 12px !important; }
            .mobile-menu-group summary { padding: 10px 4px !important; font-weight:900; color:#0f766e; }
            .mobile-fab-menu { display:grid !important; gap:10px !important; }
            .notes-panel { position: static !important; width:auto !important; max-height:none !important; overflow:visible !important; }
            .quick-actions-card { display:none !important; }
          }


          /* MOBILE: bloco de notas visível e FAB funcional */
          @media (max-width: 979px) {
            .notes-panel {
              position: static !important;
              width: auto !important;
              max-height: none !important;
              overflow: visible !important;
              margin: 14px 0 18px !important;
              padding: 16px !important;
              border-radius: 22px !important;
              background: #ffffff !important;
              border: 1px solid #e5e7eb !important;
              box-shadow: 0 12px 28px rgba(15,23,42,.08) !important;
            }
            .note-add-small {
              width: 38px !important;
              height: 38px !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .mobile-fab, .mobile-fab-menu { z-index: 3000 !important; }
            .mobile-fab-menu button { touch-action: manipulation !important; }
          }

        `}</style>
      {renderDesktopRefinoStyle()}
      {renderMobileFinalStyle()}
      <CopilotStyles />
      {renderMobileUxFinalPatchStyle()}
      {renderTopShell()}

        {renderSidebar()}
        {renderMobileMenu()}

        <main className="app-frame-content">{children}</main>
        {renderFabGlobal()}
      <CopilotFloatingButton />
      <CopilotDrawer />
        {renderModaisGlobais()}
        {renderOverlaysLayer()}
      </div>
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

  function toggleGrupoMenu(grupo) {
    setGruposMenu((atual) => ({ ...atual, [grupo]: !atual[grupo] }))
  }

  function ItemMenu({ tela, icon, label, onClick }) {
    const ativo = tela && telaAtual === tela
    return (
      <button
        className={ativo ? 'active' : ''}
        title={label}
        onClick={onClick || (() => navegarPara(tela))}
      >
        <span className="menu-icon">{icon}</span>
        {!sidebarCompacta && <span className="menu-text">{label}</span>}
      </button>
    )
  }

  function GrupoMenu({ id, titulo, children }) {
    return (
      <div className="sidebar-group-clean">
        <button className="sidebar-group-toggle" onClick={() => toggleGrupoMenu(id)} title={titulo}>
          <span>{!sidebarCompacta ? titulo : '•'}</span>
          {!sidebarCompacta && <strong>{gruposMenu[id] ? '−' : '+'}</strong>}
        </button>
        {(sidebarCompacta || gruposMenu[id]) && <nav className="desktop-sidebar-nav">{children}</nav>}
      </div>
    )
  }

  function renderSidebar() {
    return (
      <Sidebar
        sidebarCompacta={sidebarCompacta}
        setSidebarCompacta={setSidebarCompacta}
        nomeUsuario={nomeUsuario}
        nomeUsuarioAtual={nomeUsuario()}
        normalizarPerfil={normalizarPerfil}
        perfilUsuario={perfilUsuario}
        menuSections={menuSectionsVisiveis()}
        telaAtual={telaAtual}
        navegarPara={navegarPara}
        gruposMenu={gruposMenu}
        toggleGrupoMenu={toggleGrupoMenu}
        sairDoSistema={sairDoSistema}
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
        nomeUsuarioAtual={nomeUsuario()}
        normalizarPerfil={normalizarPerfil}
        perfilUsuario={perfilUsuario}
        menuSections={menuSectionsVisiveis()}
        navegarPara={navegarPara}
        sairDoSistema={sairDoSistema}
        canSwitchCompany={permissoesUsuario?.canSwitchCompany}
        empresasDisponiveis={empresasDisponiveis}
        empresaId={empresaId}
        trocarEmpresaAtiva={trocarEmpresaAtiva}
        trocandoEmpresa={trocandoEmpresa}
        abrirPerfilUsuario={abrirPerfilUsuario}
      />
    )
  }

  const routeGuardProps = {
    carregandoAuth,
    usuarioLogado,
    erroEmpresa,
    styles,
    setUsuarioLogado,
    globalToast,
    hideToast,
    sairDoSistema
  }

  if (carregandoAuth || !usuarioLogado || erroEmpresa) {
    return <AppRouteGuards {...routeGuardProps} />
  }

  if (telaAtual === 'contas') {
    return renderAppFrame(
      <ContasPage
        styles={styles}
        busca={busca}
        setBusca={setBusca}
        mostrarFiltros={mostrarFiltros}
        setMostrarFiltros={setMostrarFiltros}
        limparFiltros={limparFiltros}
        imprimirPDF={imprimirPDF}
        exportarCSV={exportarCSV}
        filtroStatus={filtroStatus}
        setFiltroStatus={setFiltroStatus}
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
        contasFiltradas={contasFiltradas}
        total={total}
        formatarValor={formatarValor}
        loading={loading}
        HeaderExpansivel={(props) => <HeaderExpansivel styles={styles} {...props} />}
        mostrarContas={mostrarContas}
        setMostrarContas={setMostrarContas}
        estaVencida={estaVencida}
        formatarData={formatarData}
        formatarTipoRecorrencia={formatarTipoRecorrencia}
        obterTipoRecorrenciaConta={obterTipoRecorrenciaConta}
        abrirConfirmacao={abrirConfirmacao}
        marcarComoPago={marcarComoPago}
        voltarParaPendente={voltarParaPendente}
        abrirEdicaoConta={abrirEdicaoConta}
        excluirConta={excluirConta}
        navegarPara={navegarPara}
      />
    )
  }

  if (telaAtual === 'relatorios') {
    return renderAppFrame(
      <Relatorios voltar={() => navegarPara('contas')} empresaId={empresaId} usuario={usuarioLogado} mostrarAviso={mostrarAviso} />
    )
  }



  if (telaAtual === 'notas') {
    return renderAppFrame(
      <NotasPage
        styles={styles}
        navegarPara={navegarPara}
        notasFiltradas={notasFiltradas}
        notasPendentes={notasPendentes}
        notasCriticas={notasCriticas}
        notasUrgentes={notasUrgentes}
        buscaNota={buscaNota}
        setBuscaNota={setBuscaNota}
        formatarData={formatarData}
        alternarNotaConcluida={alternarNotaConcluida}
        abrirEdicaoNota={abrirEdicaoNota}
        abrirConfirmacao={abrirConfirmacao}
        excluirNota={excluirNota}
        loading={loading}
        nomeUsuario={nomeUsuario()}
        filiais={filiais}
        filtroFilial={filtroFilial}
        setFiltroFilial={setFiltroFilial}
        contasOperacionaisFiliais={contasOperacionaisFiliais}
      />
    )
  }


  if (telaAtual === 'importar') {
    return renderAppFrame(
      <>
        <h1 style={styles.titulo}>📥 Importar planilha</h1>

        <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
          ← Voltar
        </button>

        <section style={styles.cardConfiguracao}>
          <h2 style={styles.subtitulo}>1. Enviar arquivo</h2>
          <p style={styles.textoNota}>
            Importe sua planilha do ano em CSV para alimentar o histórico e liberar os relatórios do app.
          </p>

          <label style={styles.uploadExcelBox}>
            <strong>📊 Selecionar arquivo CSV</strong>
            <small>No Excel: Arquivo &gt; Salvar como &gt; CSV UTF-8</small>
            <input type="file" accept=".csv" onChange={lerArquivoExcel} style={{ display: 'none' }} />
          </label>

          {arquivoImportacao && <p style={styles.textoNota}>Arquivo: <strong>{arquivoImportacao.name}</strong></p>}
          {statusImportacao && <p style={styles.alertaSucesso}>{statusImportacao}</p>}
        </section>

        <section style={styles.cardConfiguracao}>
          <h2 style={styles.subtitulo}>2. Colunas esperadas</h2>
          <div style={styles.importDicasGrid}>
            <span>Descrição</span>
            <span>Valor</span>
            <span>Vencimento</span>
            <span>Status</span>
            <span>Centro de custo</span>
          </div>
          <p style={styles.textoAjuda}>
            O app também aceita nomes parecidos, como Conta, Data, Categoria e Situação.
          </p>
        </section>

        {linhasImportacao.length > 0 && (
          <section style={styles.cardConfiguracao}>
            <h2 style={styles.subtitulo}>3. Revisar dados</h2>
            <div style={styles.previewImportacao}>
              {linhasImportacao.slice(0, 8).map((linha) => (
                <div key={linha.linha} style={styles.previewLinha}>
                  <strong>{linha.descricao || `Linha ${linha.linha}`}</strong>
                  <small>{formatarData(linha.data_vencimento)} • {formatarValor(linha.valor)} • {linha.status} • {linha.centro || 'Sem centro'}</small>
                </div>
              ))}
            </div>
            {linhasImportacao.length > 8 && <small style={styles.textoAjuda}>Mostrando 8 de {linhasImportacao.length} linhas.</small>}

            <button style={styles.btnSalvar} onClick={importarExcelParaContas}>
              Importar {linhasImportacao.length} conta(s)
            </button>
          </section>
        )}
      </>
    )
  }



  if (telaAtual === 'master-empresas') {
    if (!permissoesUsuario?.canManageCompanies) {
      return renderAppFrame(
        <>
          <h1 style={styles.titulo}>🏢 Painel Master</h1>
          <section style={styles.cardConfiguracao}>
            <h2 style={styles.subtitulo}>Acesso restrito</h2>
            <p style={styles.textoNota}>Seu perfil atual não permite acessar o painel master.</p>
            <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>← Voltar</button>
          </section>
        </>
      )
    }

    return renderAppFrame(
      <MasterPanelPage
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
    if (!podeAcessarConfiguracoes()) {
      return renderAppFrame(
        <>
          <h1 style={styles.titulo}>🚀 Onboarding SaaS</h1>
          <section style={styles.cardConfiguracao}>
            <h2 style={styles.subtitulo}>Acesso restrito</h2>
            <p style={styles.textoNota}>Seu perfil atual não permite acessar o onboarding.</p>
            <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>← Voltar</button>
          </section>
        </>
      )
    }

    return renderAppFrame(
      <OnboardingPage
        styles={styles}
        empresaId={empresaId}
        empresaNome={nomeEmpresa}
        filiais={filiais}
        centros={centros}
        contas={contas}
        mostrarAviso={mostrarAviso}
        onRefresh={() => carregarTudo(empresaId)}
        voltarPainel={() => navegarPara('configuracoes')}
        abrirDashboard={() => navegarPara('dashboard')}
      />
    )
  }

  if (telaAtual === 'billing') {
    if (!podeAcessarConfiguracoes()) {
      return renderAppFrame(
        <>
          <h1 style={styles.titulo}>💼 Billing</h1>
          <section style={styles.cardConfiguracao}>
            <h2 style={styles.subtitulo}>Acesso restrito</h2>
            <p style={styles.textoNota}>Seu perfil atual não permite acessar o billing.</p>
            <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>← Voltar</button>
          </section>
        </>
      )
    }

    return renderAppFrame(
      <BillingPage
        styles={styles}
        empresaId={empresaId}
        empresaNome={nomeEmpresa}
        filiais={filiais}
        usuarios={usuariosEmpresa}
        mostrarAviso={mostrarAviso}
        podeEditar={podeAdministrarUsuarios()}
        voltarPainel={() => navegarPara('configuracoes')}
      />
    )
  }


  if (telaAtual === 'filiais') {
    if (!podeAcessarConfiguracoes()) {
      return renderAppFrame(
        <>
          <h1 style={styles.titulo}>🏬 Filiais</h1>
          <section style={styles.cardConfiguracao}>
            <h2 style={styles.subtitulo}>Acesso restrito</h2>
            <p style={styles.textoNota}>Seu perfil atual não permite gerenciar filiais.</p>
            <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>← Voltar</button>
          </section>
        </>
      )
    }

    return renderAppFrame(
      <FiliaisPage
        styles={styles}
        empresaId={empresaId}
        empresaNome={nomeEmpresa}
        mostrarAviso={mostrarAviso}
        voltarPainel={() => navegarPara('configuracoes')}
      />
    )
  }


  if (telaAtual === 'usuarios') {
    return renderAppFrame(
      <UsuariosPage
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

  if (telaAtual === 'configuracoes') {
    if (!podeAcessarConfiguracoes()) {
      return renderAppFrame(
        <>
          <h1 style={styles.titulo}>⚙️ Configurações</h1>
          <section style={styles.cardConfiguracao}>
            <h2 style={styles.subtitulo}>Acesso restrito</h2>
            <p style={styles.textoNota}>Seu perfil atual não permite acessar configurações.</p>
            <button style={styles.btnCinza} onClick={() => navegarPara('contas')}>← Voltar</button>
          </section>
        </>
      )
    }

    return renderAppFrame(
      <>
        <h1 style={styles.titulo}>⚙️ Configurações</h1>

        <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
          ← Voltar
        </button>

        <section style={styles.cardConfiguracao}>
          <HeaderExpansivel
            styles={styles}
            titulo="🔔 Notificações"
            aberto={mostrarConfigNotificacoes}
            onClick={() => setMostrarConfigNotificacoes(!mostrarConfigNotificacoes)}
          />

          {mostrarConfigNotificacoes && (
            <>
              <label className="checkbox-row-fix" style={styles.switchLinha}>
                <div>
                  <strong>Notificações ativas</strong>
                  <small>Controle geral dos disparos automáticos da empresa.</small>
                </div>

                <input
                  type="checkbox"
                  checked={notificacoesAtivas}
                  onChange={(e) => setNotificacoesAtivas(e.target.checked)}
                />
              </label>

              <div style={styles.configResumo}>
                <strong>Contas</strong>
                <span>Regras aplicadas automaticamente em todas as contas, sem checkbox individual no formulário.</span>
              </div>

              <input
                style={styles.input}
                type="number"
                min="0"
                placeholder="Avisar contas antes do vencimento. Ex: 1"
                value={diasAlertaContas}
                onChange={(e) => { setDiasAlertaContas(e.target.value); setDiasAvisoPadrao(e.target.value) }}
              />

              <label className="checkbox-row-fix" style={styles.switchLinha}>
                <div>
                  <strong>Notificar contas vencidas</strong>
                  <small>Exibir contas em atraso nas notificações e destaques.</small>
                </div>
                <input type="checkbox" checked={alertarContasVencidas} onChange={(e) => setAlertarContasVencidas(e.target.checked)} />
              </label>

              <label className="checkbox-row-fix" style={styles.switchLinha}>
                <div>
                  <strong>Destacar contas críticas</strong>
                  <small>Dar prioridade visual para contas vencidas ou muito próximas do vencimento.</small>
                </div>
                <input type="checkbox" checked={destacarContasCriticas} onChange={(e) => setDestacarContasCriticas(e.target.checked)} />
              </label>

              <div style={styles.configResumo}>
                <strong>Notas</strong>
                <span>Regras para pendências e prioridades do bloco de notas.</span>
              </div>

              <input
                style={styles.input}
                type="number"
                min="0"
                placeholder="Avisar notas pendentes após quantos dias. Ex: 3"
                value={diasAlertaNotas}
                onChange={(e) => setDiasAlertaNotas(e.target.value)}
              />

              <label className="checkbox-row-fix" style={styles.switchLinha}>
                <div>
                  <strong>Destacar notas urgentes</strong>
                  <small>Manter notas urgentes e críticas no topo do acompanhamento.</small>
                </div>
                <input type="checkbox" checked={destacarNotasUrgentes} onChange={(e) => setDestacarNotasUrgentes(e.target.checked)} />
              </label>

              <div style={styles.configResumo}>
                <strong>Canais preparados</strong>
                <span>WhatsApp: {configWhatsapp ? 'Ligado' : 'Desligado'} • E-mail: {configEmail ? 'Ligado' : 'Desligado'} • Push: {configPush ? 'Ligado' : 'Desligado'}</span>
              </div>
            </>
          )}
        </section>

        <section style={styles.cardConfiguracao}>
          <HeaderExpansivel
            styles={styles}
            titulo="🏢 Dados do negócio"
            aberto={mostrarConfigNegocio}
            onClick={() => setMostrarConfigNegocio(!mostrarConfigNegocio)}
          />

          {mostrarConfigNegocio && (
            <>
              <input
                style={styles.input}
                placeholder="Nome da empresa"
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(primeiraLetraMaiuscula(e.target.value))}
              />

              <input
                style={styles.input}
                placeholder="WhatsApp padrão. Ex: 5511999999999"
                value={whatsappPadrao}
                onChange={(e) => setWhatsappPadrao(e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="E-mail padrão"
                value={emailPadrao}
                onChange={(e) => setEmailPadrao(e.target.value)}
              />
            </>
          )}
        </section>


        <section style={styles.cardConfiguracao}>
          <HeaderExpansivel
            styles={styles}
            titulo="🔁 Recorrências"
            aberto={mostrarConfigRecorrencias}
            onClick={() => setMostrarConfigRecorrencias(!mostrarConfigRecorrencias)}
          />

          {mostrarConfigRecorrencias && (
            <>
              <p style={styles.textoNota}>
                As recorrências são cadastradas e editadas dentro de Nova Conta ou Editar Conta, mantendo o mesmo padrão de campos da conta original.
              </p>

              <div style={styles.configResumo}>
                <strong>Padrão atual</strong>
                <span>Frequência mensal • dia de vencimento configurável • geração automática no mês vigente quando ainda não existir.</span>
              </div>
            </>
          )}
        </section>

        <section style={styles.cardConfiguracao}>
          <HeaderExpansivel
            styles={styles}
            titulo="🏷 Centros de custo"
            aberto={mostrarConfigCentros}
            onClick={() => setMostrarConfigCentros(!mostrarConfigCentros)}
          />

          {mostrarConfigCentros && (
            <>
              <p style={styles.textoNota}>
                Cadastre e gerencie os centros usados nas contas e nos relatórios.
              </p>

              <div style={styles.configResumo}>
                <span>Total de centros: {centros.length}</span>
                <span>Uso nos filtros e relatórios</span>
              </div>

              <button style={styles.btnSalvar} onClick={() => setModalCentro(true)}>
                Gerenciar centros
              </button>
            </>
          )}
        </section>

        <section style={styles.cardConfiguracao}>
          <HeaderExpansivel
            styles={styles}
            titulo="🏬 Filiais / Unidades"
            aberto={mostrarConfigCentros}
            onClick={() => navegarPara('filiais')}
          />

          <p style={styles.textoNota}>
            Cadastre lojas, unidades, produção ou delivery dentro da empresa ativa. Na próxima fase, contas poderão ser vinculadas a uma filial.
          </p>

          <div style={styles.configResumo}>
            <span>Organização: empresa → filial → centro de custo → conta</span>
            <span>Isolamento por empresa ativo</span>
          </div>

          <button style={styles.btnSalvar} onClick={() => navegarPara('filiais')}>
            Gerenciar filiais
          </button>
        </section>

        <section style={styles.cardConfiguracao}>
          <h2 style={styles.subtitulo}>🧠 Como o sistema vai usar</h2>

          <p style={styles.textoNota}>
            O envio automático seguirá as regras globais da empresa. Os formulários ficam mais limpos
            e as contas/notas passam a obedecer ao mesmo padrão configurado aqui.
          </p>

          <div style={styles.configResumo}>
            <span>Geral: {notificacoesAtivas ? 'Ligado' : 'Desligado'}</span>
            <span>WhatsApp: {configWhatsapp ? 'Ligado' : 'Desligado'}</span>
            <span>E-mail: {configEmail ? 'Ligado' : 'Desligado'}</span>
            <span>Push: {configPush ? 'Ligado' : 'Desligado'}</span>
          </div>
        </section>

        <button style={styles.btnSalvar} onClick={salvarConfiguracoes}>
          Salvar configurações
        </button>
      </>
    )
  }

  if (telaAtual === 'agenda') {
    const contasAgenda = [...contas]
      .filter((conta) => conta.status !== 'pago')
      .sort((a, b) => dataLocal(a.data_vencimento) - dataLocal(b.data_vencimento))

    const contasVencidas = contasAgenda.filter((conta) => diferencaDias(conta.data_vencimento) < 0)
    const contasHoje = contasAgenda.filter((conta) => diferencaDias(conta.data_vencimento) === 0)
    const contasSemana = contasAgenda.filter((conta) => {
      const dias = diferencaDias(conta.data_vencimento)
      return dias > 0 && dias <= 7
    })
    const contasMes = contasAgenda.filter((conta) => {
      const dias = diferencaDias(conta.data_vencimento)
      return dias > 7 && mesmoMesAtual(conta.data_vencimento)
    })

    const totalVencidasAgenda = contasVencidas.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
    const totalHojeAgenda = contasHoje.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
    const totalSemanaAgenda = contasSemana.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
    const totalMesAgenda = contasMes.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

    function CardAgenda({ titulo, total, lista, cor }) {
      return (
        <section style={styles.cardAgenda}>
          <div style={styles.cardTopo}>
            <strong>{titulo}</strong>
            <span>{formatarValor(total)}</span>
          </div>

          {lista.length === 0 && (
            <EmptyState icon="✅" title="Agenda limpa" description="Não há contas neste grupo de vencimento no momento." />
          )}

          {lista.map((conta) => {
            const dias = diferencaDias(conta.data_vencimento)

            return (
              <div key={conta.id} style={{ ...styles.itemAgenda, borderLeft: `5px solid ${cor}` }}>
                <div>
                  <strong>{conta.descricao}</strong>
                  <div style={styles.cardInfo}>
                    {formatarData(conta.data_vencimento)} • {conta.df_centros_custo?.nome || 'Sem centro'}
                  </div>

                  <small style={dias < 0 ? styles.textoVencidoAgenda : styles.textoAgenda}>
                    {dias < 0
                      ? `Vencida há ${Math.abs(dias)} dia(s)`
                      : dias === 0
                        ? 'Vence hoje'
                        : `Vence em ${dias} dia(s)`}
                  </small>
                </div>

                <div style={styles.agendaDireita}>
                  <strong>{formatarValor(conta.valor)}</strong>

                  <button style={styles.btnPago} onClick={() => abrirConfirmacao({ titulo: 'Confirmar pagamento', mensagem: `Deseja marcar a conta ${conta.descricao} como paga?`, textoConfirmar: 'Marcar como pago', tipo: 'sucesso', acao: () => marcarComoPago(conta.id) })}>
                    Pago
                  </button>
                </div>
              </div>
            )
          })}
        </section>
      )
    }

    return renderAppFrame(
      <>
        <h1 style={styles.titulo}>📅 Agenda Financeira</h1>

        <button className="btn-back-page" style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
          ← Voltar
        </button>

        <section className="agenda-summary-grid" style={styles.resumo}>
          <div style={styles.boxVencido}>
            <span>Vencidas</span>
            <strong>{formatarValor(totalVencidasAgenda)}</strong>
          </div>

          <div style={styles.boxPendente}>
            <span>Hoje</span>
            <strong>{formatarValor(totalHojeAgenda)}</strong>
          </div>

          <div style={styles.boxTotal}>
            <span>7 dias</span>
            <strong>{formatarValor(totalSemanaAgenda)}</strong>
          </div>

          <div style={styles.boxPago}>
            <span>Mês</span>
            <strong>{formatarValor(totalMesAgenda)}</strong>
          </div>
        </section>

        <div className="agenda-page-grid">
          <CardAgenda titulo="🚨 Vencidas" total={totalVencidasAgenda} lista={contasVencidas} cor="#dc3545" />
          <CardAgenda titulo="📌 Vencem hoje" total={totalHojeAgenda} lista={contasHoje} cor="#ffc107" />
          <CardAgenda titulo="🗓️ Próximos 7 dias" total={totalSemanaAgenda} lista={contasSemana} cor="#0d6efd" />
          <CardAgenda titulo="📆 Restante do mês" total={totalMesAgenda} lista={contasMes} cor="#14b8a6" />
        </div>
      </>
    )
  }

  if (telaAtual === 'lixeira') {
    return renderAppFrame(
      <>
        <h1 style={styles.titulo}>🗑️ Lixeira</h1>

        <button className="btn-back-page" style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
          ← Voltar
        </button>

        <section className="trash-section trash-section-accounts" style={styles.bloco}>
          <h2 style={styles.subtitulo}>💰 Contas excluídas</h2>

          {contasLixeira.length === 0 && (
            <EmptyState icon="🧹" title="Nenhuma conta na lixeira" description="As contas excluídas aparecerão aqui durante o período de quarentena." />
          )}

          {contasLixeira.map((conta) => {
            const dias = diasNaLixeira(conta.excluido_em)
            const liberada = podeExcluirDefinitivo(conta.excluido_em)

            return (
              <div key={conta.id} className="trash-card trash-card-account" style={styles.cardLixeira}>
                <div style={styles.cardTopo}>
                  <strong>{conta.descricao}</strong>
                  <span>{formatarValor(conta.valor)}</span>
                </div>

                <div style={styles.cardInfo}>
                  Venc.: {formatarData(conta.data_vencimento)} •
                  Centro: {conta.df_centros_custo?.nome || 'Sem centro'} •
                  Lixeira há {dias} dia(s)
                </div>

                <small style={liberada ? styles.textoLiberado : styles.textoQuarentena}>
                  Excluída há {dias} dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente.
                </small>

                <div style={styles.acoes}>
                  <button style={styles.btnPago} onClick={() => abrirConfirmacao({ titulo: 'Restaurar conta', mensagem: `Deseja restaurar a conta ${conta.descricao}?`, textoConfirmar: 'Restaurar', tipo: 'sucesso', acao: () => restaurarConta(conta.id) })}>
                    Restaurar
                  </button>

                  <button style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Excluir definitivamente', mensagem: `Excluir definitivamente a conta ${conta.descricao}? Essa ação não poderá ser desfeita.`, textoConfirmar: 'Excluir definitivo', tipo: 'perigo', acao: () => excluirContaDefinitivo(conta) })}>
                    Excluir definitivo
                  </button>
                </div>
              </div>
            )
          })}
        </section>

        <section className="trash-section trash-section-notes" style={styles.bloco}>
          <h2 style={styles.subtitulo}>📝 Notas excluídas</h2>

          {notasLixeira.length === 0 && (
            <EmptyState icon="🗒️" title="Nenhuma nota na lixeira" description="As notas excluídas aparecerão aqui antes da remoção definitiva." />
          )}

          {notasLixeira.map((nota) => {
            const dias = diasNaLixeira(nota.excluido_em)
            const liberada = podeExcluirDefinitivo(nota.excluido_em)

            return (
              <div key={nota.id} className="trash-card trash-card-note" style={styles.cardLixeira}>
                <strong>{nota.titulo}</strong>

                {nota.conteudo && (
                  <p style={styles.textoNota}>{nota.conteudo}</p>
                )}

                <small style={liberada ? styles.textoLiberado : styles.textoQuarentena}>
                  Excluída há {dias} dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente.
                </small>

                <div style={styles.acoes}>
                  <button style={styles.btnPago} onClick={() => abrirConfirmacao({ titulo: 'Restaurar nota', mensagem: `Deseja restaurar a nota ${nota.titulo}?`, textoConfirmar: 'Restaurar', tipo: 'sucesso', acao: () => restaurarNota(nota.id) })}>
                    Restaurar
                  </button>

                  <button style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Excluir definitivamente', mensagem: `Excluir definitivamente a nota ${nota.titulo}? Essa ação não poderá ser desfeita.`, textoConfirmar: 'Excluir definitivo', tipo: 'perigo', acao: () => excluirNotaDefinitivo(nota) })}>
                    Excluir definitivo
                  </button>
                </div>
              </div>
            )
          })}
        </section>
      </>
    )
  }

  // =========================
  // BLOCO 11 — UI
  // =========================
  return (
    <AppShell
      contas={contas}
      contasFiltradas={contasFiltradas}
      navegarPara={navegarPara}
      menuAberto={menuAberto}
      setMenuAberto={setMenuAberto}
      pageStyle={styles.page}
    >
      
      {renderDesktopRefinoStyle()}
      {renderMobileFinalStyle()}
      <CopilotStyles />

      <div className="print-header">
        <h1>Relatório Financeiro</h1>
        <p>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="print-footer">
        Relatório gerado pelo Sistema DF Gestão Financeira
      </div>
      {renderTopShell()}

      {renderSidebar()}

      {renderMobileMenu()}

      {renderFabGlobal()}
      <CopilotFloatingButton />
      <CopilotDrawer />

      

      <AppSuspenseBoundary>
        <DashboardRouteComposition
          routeProps={{
          styles,
          nomeUsuario: nomeUsuario(),
          formatarValor,
          total,
          pago,
          pendente,
          vencido,
          contas: contasFiltradas,
          diferencaDias,
          navegarPara,
          contasAbertasDashboard,
          mostrarContasDashboard,
          setMostrarContasDashboard,
          busca,
          setBusca,
          estaVencida,
          formatarData,
          abrirConfirmacao,
          marcarComoPago,
          notasPendentes,
          notasCriticas,
          notasUrgentes,
          mostrarNotas,
          setMostrarNotas,
          alternarNotaConcluida,
          abrirEdicaoNota,
          excluirNota,
          loading,
          filiais,
          filtroFilial,
          setFiltroFilial,
          contasOperacionaisFiliais
          }}
        />
      </AppSuspenseBoundary>

      {/* Lista de contas movida para a tela Financeiro > Contas. */}


      {renderModaisGlobais()}

      {renderOverlaysLayer()}
    </AppShell>
  )
}
