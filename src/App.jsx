import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import {
  adicionarUsuarioEmpresa as adicionarUsuarioEmpresaService,
  atualizarPerfilUsuarioEmpresa as atualizarPerfilUsuarioEmpresaService,
  enviarAcessoUsuarioEmpresa as enviarAcessoUsuarioEmpresaService,
  listarUsuariosEmpresa,
  normalizarPerfilUsuario,
  removerUsuarioEmpresa as removerUsuarioEmpresaService
} from './services/usuariosService'
import Relatorios from './pages/Relatorios.jsx'
import Login from './pages/Login.jsx'
import UserSecurityCards from './components/UserSecurityCards.jsx'
import Topbar from './components/layout/Topbar.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import MobileMenu from './components/layout/MobileMenu.jsx'
import DashboardHome from './components/dashboard/DashboardHome.jsx'
import AccountModal from './components/modals/AccountModal.jsx'
import NoteModal from './components/modals/NoteModal.jsx'
import CostCenterModal from './components/modals/CostCenterModal.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import { useContas } from './hooks/useContas'
import { useNotas } from './hooks/useNotas'
import { converterValor, formatarData, formatarDataParaBanco, formatarValor, limitarDataInput, primeiraLetraMaiuscula } from './utils/format'
import { dataLocal, diferencaDias, mesmoMesAtual } from './utils/dates'
import { formatarTipoRecorrencia, obterTipoRecorrenciaConta } from './utils/recorrencia'
import { prepararLinhasImportacaoCsv } from './utils/importacaoCsv'
import './styles.css'

const SESSAO_STORAGE_KEY = 'df_sessao_segura'
const OITO_HORAS_MS = 8 * 60 * 60 * 1000
const TRINTA_MINUTOS_MS = 30 * 60 * 1000
const VINTE_CINCO_MINUTOS_MS = 25 * 60 * 1000

function lerSessaoSegura() {
  try {
    return JSON.parse(localStorage.getItem(SESSAO_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function salvarSessaoSegura(dados) {
  localStorage.setItem(SESSAO_STORAGE_KEY, JSON.stringify(dados))
}

function limparSessaoSegura() {
  localStorage.removeItem(SESSAO_STORAGE_KEY)
}

export default function App() {
  const avisoSessaoMostradoRef = useRef(false)
  const encerrandoSessaoRef = useRef(false)
  // =========================
  // BLOCO 0 — UTILITÁRIOS
  // =========================
  // Utilitários compartilhados foram movidos para src/utils.

  function erroEhSessaoExpirada(erro) {
    const mensagem = String(erro?.message || erro || '').toLowerCase()
    return mensagem.includes('jwt') || mensagem.includes('expired') || mensagem.includes('unauthorized') || mensagem.includes('session')
  }



  function estaVencida(data, status) {
    if (!data || status === 'pago') return false
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const vencimento = new Date(data + 'T00:00:00')
    vencimento.setHours(0, 0, 0, 0)
    return vencimento < hoje
  }

  function pegarMes(data) {
    if (!data) return ''
    return String(data).slice(0, 7)
  }

  function diasNaLixeira(dataExclusao) {
    if (!dataExclusao) return 0

    const excluidoEm = new Date(dataExclusao)
    const hoje = new Date()
    const diff = hoje - excluidoEm

    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  }

  function podeExcluirDefinitivo(dataExclusao) {
    return true
  }

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
  const [modalCentro, setModalCentro] = useState(false)
  const [novoCentro, setNovoCentro] = useState('')

  // =========================
  // BLOCO 4 — MENU
  // =========================
  const [menuAberto, setMenuAberto] = useState(false)
  const [menuNavegacaoAberto, setMenuNavegacaoAberto] = useState(false)
  const [sidebarCompacta, setSidebarCompacta] = useState(false)
  const [gruposMenu, setGruposMenu] = useState({ principal: true, financeiro: true, analise: true, sistema: true })
  const [telaAtual, setTelaAtualState] = useState('dashboard')
  const [usuarioLogado, setUsuarioLogado] = useState(null)
  const [carregandoAuth, setCarregandoAuth] = useState(true)
  const [empresaId, setEmpresaId] = useState(null)
  const [perfilUsuario, setPerfilUsuario] = useState('')
  const [nomeUsuarioPerfil, setNomeUsuarioPerfil] = useState('')
  const [erroEmpresa, setErroEmpresa] = useState('')
  const [usuariosEmpresa, setUsuariosEmpresa] = useState([])
  const [emailConviteUsuario, setEmailConviteUsuario] = useState('')
  const [nomeConviteUsuario, setNomeConviteUsuario] = useState('')
  const [perfilConviteUsuario, setPerfilConviteUsuario] = useState('operador')
  const [novoEmailUsuario, setNovoEmailUsuario] = useState('')
  const [novaSenhaUsuario, setNovaSenhaUsuario] = useState('')
  const [confirmarNovaSenhaUsuario, setConfirmarNovaSenhaUsuario] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [mostrarContas, setMostrarContas] = useState(true)
  const [mostrarContasDashboard, setMostrarContasDashboard] = useState(true)
  const [mostrarNotas, setMostrarNotas] = useState(() => typeof window === 'undefined' ? true : window.innerWidth >= 980)
  const [mostrarConfigNegocio, setMostrarConfigNegocio] = useState(true)
  const [mostrarConfigNotificacoes, setMostrarConfigNotificacoes] = useState(true)
  const [mostrarConfigCentros, setMostrarConfigCentros] = useState(true)
  const [mostrarConfigRecorrencias, setMostrarConfigRecorrencias] = useState(true)
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
  const [confirmacao, setConfirmacao] = useState({
    aberto: false,
    titulo: '',
    mensagem: '',
    textoConfirmar: 'Confirmar',
    tipo: 'padrao',
    acao: null
  })
  const [arquivoImportacao, setArquivoImportacao] = useState(null)
  const [linhasImportacao, setLinhasImportacao] = useState([])
  const [statusImportacao, setStatusImportacao] = useState('')
  const [toast, setToast] = useState({ visivel: false, mensagem: '', tipo: 'info' })

  function mostrarAviso(mensagem, tipo = 'info') {
    setToast({ visivel: true, mensagem, tipo })
    window.clearTimeout(mostrarAviso.timeoutId)
    mostrarAviso.timeoutId = window.setTimeout(() => {
      setToast({ visivel: false, mensagem: '', tipo: 'info' })
    }, 3200)
  }

  function avisarErro(erro, fallback = 'Não foi possível concluir a operação.') {
    const mensagem = erro?.message || erro || fallback

    if (erroEhSessaoExpirada(erro)) {
      if (encerrandoSessaoRef.current) return
      encerrandoSessaoRef.current = true
      supabase.auth.signOut().finally(() => {
        limparEstadoAutenticacao()
        setUsuarioLogado(null)
        setTelaAtualState('dashboard')
        setCarregandoAuth(false)
        mostrarAviso('Sua sessão expirou. Faça login novamente.', 'erro')
        window.setTimeout(() => { encerrandoSessaoRef.current = false }, 1200)
      })
      return
    }

    mostrarAviso(String(mensagem), 'erro')
  }

  function limparEstadoAutenticacao() {
    setContas([])
    setNotas([])
    setCentros([])
    setContasLixeira([])
    setNotasLixeira([])
    setUsuariosEmpresa([])
    setEmpresaId(null)
    setPerfilUsuario('')
    setNomeUsuarioPerfil('')
    setErroEmpresa('')
    setLoading(false)
    limparSessaoSegura()
  }

  useEffect(() => {
    let ativo = true

    async function verificarSessao() {
      try {
        const timeoutSessao = new Promise((resolve) => {
          window.setTimeout(() => resolve({ data: { session: null }, error: new Error('Timeout ao validar sessão') }), 8000)
        })

        const { data, error } = await Promise.race([
          supabase.auth.getSession(),
          timeoutSessao
        ])

        if (!ativo) return

        if (error || !data?.session) {
          limparEstadoAutenticacao()
          setUsuarioLogado(null)
          return
        }

        setUsuarioLogado(data.session.user)
      } catch (error) {
        if (!ativo) return
        console.warn('Falha ao validar sessão:', error?.message || error)
        limparEstadoAutenticacao()
        setUsuarioLogado(null)
      } finally {
        if (ativo) setCarregandoAuth(false)
      }
    }

    verificarSessao()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCarregandoAuth(false)
      setUsuarioLogado(session?.user || null)

      if (!session) {
        limparEstadoAutenticacao()
      }
    })

    return () => {
      ativo = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!usuarioLogado) return

    const agora = Date.now()
    const sessaoAtual = lerSessaoSegura()

    salvarSessaoSegura({
      inicio: sessaoAtual.inicio || agora,
      ultimaAtividade: agora
    })

    function registrarAtividade() {
      const sessao = lerSessaoSegura()
      salvarSessaoSegura({
        inicio: sessao.inicio || Date.now(),
        ultimaAtividade: Date.now()
      })
      avisoSessaoMostradoRef.current = false
    }

    async function encerrarPorSeguranca(mensagem) {
      if (encerrandoSessaoRef.current) return
      encerrandoSessaoRef.current = true
      limparEstadoAutenticacao()
      setUsuarioLogado(null)
      setTelaAtualState('dashboard')
      setCarregandoAuth(false)
      await supabase.auth.signOut()
      mostrarAviso(mensagem, 'erro')
      window.setTimeout(() => { encerrandoSessaoRef.current = false }, 1200)
    }

    function verificarExpiracao() {
      const sessao = lerSessaoSegura()
      const inicio = Number(sessao.inicio || Date.now())
      const ultimaAtividade = Number(sessao.ultimaAtividade || Date.now())
      const agoraVerificacao = Date.now()
      const tempoTotal = agoraVerificacao - inicio
      const tempoInativo = agoraVerificacao - ultimaAtividade

      if (tempoTotal >= OITO_HORAS_MS) {
        encerrarPorSeguranca('Sua sessão expirou por segurança. Faça login novamente.')
        return
      }

      if (tempoInativo >= TRINTA_MINUTOS_MS) {
        encerrarPorSeguranca('Sua sessão foi encerrada por inatividade. Faça login novamente.')
        return
      }

      if (tempoInativo >= VINTE_CINCO_MINUTOS_MS && !avisoSessaoMostradoRef.current) {
        avisoSessaoMostradoRef.current = true
        abrirConfirmacao({
          titulo: 'Sessão quase expirada',
          mensagem: 'Sua sessão vai expirar por segurança. Deseja continuar conectado?',
          textoConfirmar: 'Continuar conectado',
          tipo: 'padrao',
          acao: async () => registrarAtividade()
        })
      }
    }

    const eventos = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
    eventos.forEach((evento) => window.addEventListener(evento, registrarAtividade, { passive: true }))

    const intervalo = window.setInterval(verificarExpiracao, 60 * 1000)

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, registrarAtividade))
      window.clearInterval(intervalo)
    }
  }, [usuarioLogado])

  useEffect(() => {
    if (!usuarioLogado) {
      setLoading(false)
      return
    }

    carregarEmpresaDoUsuario(usuarioLogado.id)
  }, [usuarioLogado])


  useEffect(() => {
    window.history.replaceState({ tela: telaAtual }, '', window.location.href)

    function aoVoltar(event) {
      const proximaTela = event.state?.tela || 'dashboard'
      setMenuAberto(false)
      setMenuNavegacaoAberto(false)
      setTelaAtualState(proximaTela)
    }

    window.addEventListener('popstate', aoVoltar)
    return () => window.removeEventListener('popstate', aoVoltar)
  }, [])


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

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    const originalBodyPosition = document.body.style.position
    const originalBodyWidth = document.body.style.width
    const originalScrollY = window.scrollY

    if (menuNavegacaoAberto) {
      document.body.classList.add('mobile-nav-open')
      document.documentElement.classList.add('mobile-nav-open')
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.top = `-${originalScrollY}px`
    }

    return () => {
      document.body.classList.remove('mobile-nav-open')
      document.documentElement.classList.remove('mobile-nav-open')
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
      document.body.style.position = originalBodyPosition
      document.body.style.width = originalBodyWidth
      document.body.style.top = ''
      if (menuNavegacaoAberto) window.scrollTo(0, originalScrollY)
    }
  }, [menuNavegacaoAberto])

  async function carregarEmpresaDoUsuario(userId) {
    setLoading(true)
    setErroEmpresa('')

    const { error: erroVinculo } = await supabase.rpc('vincular_usuario_logado')
    if (erroVinculo) {
      console.warn('Não foi possível executar vínculo automático:', erroVinculo.message)
    }

    const { data, error } = await supabase
      .from('df_usuarios_empresas')
      .select('empresa_id, perfil')
      .eq('user_id', userId)
      .limit(1)

    if (error) {
      setLoading(false)
      if (erroEhSessaoExpirada(error)) {
        await supabase.auth.signOut()
        limparEstadoAutenticacao()
        setUsuarioLogado(null)
        mostrarAviso('Sua sessão expirou. Faça login novamente.', 'erro')
      } else {
        mostrarAviso(error.message, 'erro')
      }
      return
    }

    const vinculo = Array.isArray(data) ? data[0] : data

    if (!vinculo?.empresa_id) {
      setEmpresaId(null)
      setPerfilUsuario('')
      setNomeUsuarioPerfil('')
      setLoading(false)
      setErroEmpresa('Usuário sem empresa vinculada. Vincule este usuário em df_usuarios_empresas antes de continuar.')
      return
    }

    const { data: perfilData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .limit(1)

    const perfilEncontrado = Array.isArray(perfilData) ? perfilData[0] : perfilData

    setEmpresaId(vinculo.empresa_id)
    setPerfilUsuario(vinculo.perfil || 'usuario')
    setNomeUsuarioPerfil(perfilEncontrado?.name || usuarioLogado?.user_metadata?.name || usuarioLogado?.user_metadata?.full_name || '')
    await carregarTudo(vinculo.empresa_id)
    setLoading(false)
  }

  async function carregarTudo(empresaAtual = empresaId) {
    if (!empresaAtual) return

    await Promise.all([
      buscarContas(empresaAtual),
      buscarNotas(empresaAtual),
      buscarCentros(empresaAtual),
      buscarLixeira(empresaAtual),
      buscarConfiguracoes(empresaAtual),
      buscarUsuariosEmpresa(empresaAtual)
    ])
  }

  function normalizarPerfil(perfil) {
    return normalizarPerfilUsuario(perfil)
  }

  function temPermissao(perfisPermitidos = []) {
    const perfilAtual = normalizarPerfil(perfilUsuario)
    return perfisPermitidos.includes(perfilAtual)
  }

  function podeAdministrarUsuarios() {
    return temPermissao(['admin'])
  }

  function podeAcessarConfiguracoes() {
    return temPermissao(['admin', 'gerente'])
  }

  async function buscarUsuariosEmpresa(empresaAtual = empresaId) {
    if (!empresaAtual) return

    try {
      const usuarios = await listarUsuariosEmpresa(empresaAtual)
      setUsuariosEmpresa(usuarios)
    } catch (error) {
      console.warn('Não foi possível carregar usuários:', error.message)
      setUsuariosEmpresa([])
    }
  }

  async function adicionarUsuarioEmpresa() {
    if (!empresaId) {
      alert('Empresa não identificada.')
      return
    }

    if (!podeAdministrarUsuarios()) {
      alert('Apenas administradores podem adicionar usuários.')
      return
    }

    const email = emailConviteUsuario.trim().toLowerCase()

    if (!email || !email.includes('@')) {
      alert('Informe um e-mail válido.')
      return
    }

    const perfil = normalizarPerfil(perfilConviteUsuario)

    try {
      await adicionarUsuarioEmpresaService({
        empresaId,
        email,
        nome: nomeConviteUsuario,
        perfil
      })
    } catch (error) {
      avisarErro(error)
      return
    }

    setEmailConviteUsuario('')
    setNomeConviteUsuario('')
    setPerfilConviteUsuario('operador')
    await buscarUsuariosEmpresa()

    abrirConfirmacao({
      titulo: 'Usuário cadastrado',
      mensagem: 'O usuário foi adicionado à empresa. Deseja enviar agora o link de acesso/redefinição de senha para este e-mail?',
      textoConfirmar: 'Enviar acesso',
      tipo: 'sucesso',
      acao: async () => {
        try {
          const resultado = await enviarAcessoUsuarioEmpresaService({
            usuario: { email, nome: nomeConviteUsuario }
          })
          mostrarAviso(resultado.mensagem, 'info')
        } catch (error) {
          avisarErro(error)
        }
      }
    })
  }

  async function enviarAcessoUsuarioEmpresa(usuario) {
    if (!podeAdministrarUsuarios()) {
      alert('Apenas administradores podem enviar acesso ou reset de senha.')
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
      alert('Apenas administradores podem alterar perfis.')
      return
    }

    const perfil = normalizarPerfil(novoPerfil)
    const usuarioAtual = usuario.user_id && usuarioLogado?.id && usuario.user_id === usuarioLogado.id

    if (usuarioAtual && perfil !== 'admin') {
      const admins = usuariosEmpresa.filter((u) => normalizarPerfil(u.perfil) === 'admin')
      if (admins.length <= 1) {
        alert('Você não pode remover o último administrador da empresa.')
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
      }
    })
  }

  async function removerUsuarioEmpresa(usuario) {
    if (!podeAdministrarUsuarios()) {
      alert('Apenas administradores podem remover usuários.')
      return
    }

    const usuarioAtual = usuario.user_id && usuarioLogado?.id && usuario.user_id === usuarioLogado.id

    if (usuarioAtual) {
      alert('Você não pode remover o próprio acesso por aqui.')
      return
    }

    if (normalizarPerfil(usuario.perfil) === 'admin') {
      const adminsAtivos = usuariosEmpresa.filter((u) => normalizarPerfil(u.perfil) === 'admin')
      if (adminsAtivos.length <= 1) {
        alert('Você não pode remover o último administrador da empresa.')
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
      alert('Informe um e-mail válido.')
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
    alert('Solicitação enviada. Confirme o novo e-mail conforme orientação do Supabase.')
  }

  async function salvarMinhaSenha() {
    if (!novaSenhaUsuario || novaSenhaUsuario.length < 6) {
      alert('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    if (novaSenhaUsuario !== confirmarNovaSenhaUsuario) {
      alert('As senhas não conferem.')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: novaSenhaUsuario })

    if (error) {
      avisarErro(error)
      return
    }

    setNovaSenhaUsuario('')
    setConfirmarNovaSenhaUsuario('')
    alert('Senha atualizada com sucesso.')
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
      .select('*, df_centros_custo(nome), df_contas_recorrentes(tipo_recorrencia)')
      .eq('empresa_id', empresaAtual)
      .eq('excluido', true)
      .order('excluido_em', { ascending: false })

    if (erroContas) {
      avisarErro(erroContas)
    }

    setContasLixeira(contasExcluidas || [])

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
      `${nota.titulo || ''} ${nota.conteudo || ''}`
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
    return marcarComoPagoHook({ supabase, id, empresaId, buscarContas })
  }

  async function voltarParaPendente(id) {
    return voltarParaPendenteHook({ supabase, id, empresaId, buscarContas })
  }

  async function excluirConta(id) {
    return excluirContaHook({ supabase, id, empresaId, avisarErro, buscarContas, buscarLixeira })
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
      buscarLixeira
    })
  }


  async function alternarNotaConcluida(nota) {
    return alternarNotaConcluidaHook({
      supabase,
      nota,
      empresaId,
      avisarErro,
      buscarNotas
    })
  }



  // =========================
  // BLOCO — AÇÕES CONFIGURAÇÕES
  // =========================
  async function salvarConfiguracoes() {
    if (!empresaId) {
      alert('Usuário sem empresa vinculada.')
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
  }

  async function restaurarNota(id) {
    return restaurarNotaHook({
      supabase,
      id,
      empresaId,
      avisarErro,
      buscarNotas,
      buscarLixeira
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
  }

  async function excluirNotaDefinitivo(nota) {
    return excluirNotaDefinitivoHook({
      supabase,
      nota,
      empresaId,
      avisarErro,
      buscarLixeira
    })
  }

  // =========================
  // BLOCO 10 — AÇÕES CENTROS
  // =========================
  async function salvarCentro() {
    if (!empresaId) {
      alert('Usuário sem empresa vinculada.')
      return
    }

    if (!novoCentro.trim()) {
      alert('Digite o centro de custo')
      return
    }

    const { error } = await supabase
      .from('df_centros_custo')
      .insert([{ nome: primeiraLetraMaiuscula(novoCentro.trim()), empresa_id: empresaId }])

    if (error) {
      avisarErro(error)
      return
    }

    setNovoCentro('')
    buscarCentros()
  }

  async function excluirCentro(id) {
    const { error } = await supabase
      .from('df_centros_custo')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId)

    if (error) {
      alert('Não foi possível excluir. Verifique se existem contas usando este centro.')
      return
    }

    buscarCentros()
    buscarContas()
  }

  // =========================
  // BLOCO 10 — EXPORTAÇÕES
  // =========================
  function exportarCSV() {
    const cabecalho = ['Descricao', 'Valor', 'Vencimento', 'Status', 'Centro']
    const linhas = contasFiltradas.map((conta) => [
      conta.descricao || '',
      Number(conta.valor || 0).toFixed(2).replace('.', ','),
      formatarData(conta.data_vencimento),
      estaVencida(conta.data_vencimento, conta.status) ? 'vencido' : conta.status,
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
                  <tr><th>Conta</th><th>Centro</th><th>Vencimento</th><th>Status</th><th>Valor</th></tr>
                </thead>
                <tbody>
                  ${linhas || '<tr><td colspan="5">Nenhuma conta encontrada.</td></tr>'}
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
      const preparadas = prepararLinhasImportacaoCsv(e.target.result)

      setLinhasImportacao(preparadas)
      setStatusImportacao(`${preparadas.length} linha(s) preparada(s) para revisão.`)
    }

    reader.readAsText(file, 'UTF-8')
  }

  async function importarExcelParaContas() {
    if (!empresaId) {
      alert('Usuário sem empresa vinculada.')
      return
    }

    const invalidas = linhasImportacao.filter((linha) => !linha.descricao || !linha.valor || !linha.data_vencimento)
    if (invalidas.length > 0) {
      alert(`Existem ${invalidas.length} linha(s) sem descrição, valor ou vencimento. Corrija a planilha e importe novamente.`)
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

  function HeaderExpansivel({ titulo, aberto, onClick }) {
    const partesTitulo = String(titulo || '').split(' ')
    const iconeTitulo = partesTitulo[0] || ''
    const textoTitulo = partesTitulo.slice(1).join(' ') || titulo

    return (
      <button style={styles.headerExpansivel} onClick={onClick}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#0f172a',
            fontWeight: 900,
            lineHeight: 1.1
          }}
        >
          <span style={{ fontSize: 24, lineHeight: 1 }}>{iconeTitulo}</span>
          <span>{textoTitulo}</span>
        </span>
        <strong style={{ color: '#0f172a' }}>{aberto ? '−' : '+'}</strong>
      </button>
    )
  }


  function navegarPara(tela) {
    setMenuAberto(false)
    setMenuNavegacaoAberto(false)
    setTelaAtualState(tela)

    if (tela === 'usuarios') {
      buscarUsuariosEmpresa()
    }

    if (window.history.state?.tela !== tela) {
      window.history.pushState({ tela }, '', window.location.href)
    }
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

  function renderConfirmacaoGlobal() {
    if (!confirmacao.aberto) return null

    return (
      <div style={styles.overlayConfirmacao}>
        <div style={styles.modalConfirmacao}>
          <div style={styles.confirmacaoIcone}>
            {confirmacao.tipo === 'perigo' ? '⚠️' : confirmacao.tipo === 'sucesso' ? '✅' : 'ℹ️'}
          </div>

          <h3 style={styles.confirmacaoTitulo}>{confirmacao.titulo}</h3>
          <p style={styles.confirmacaoTexto}>{confirmacao.mensagem}</p>

          <div style={styles.confirmacaoAcoes}>
            <button style={styles.btnConfirmarCancelar} onClick={fecharConfirmacao}>Cancelar</button>
            <button
              style={{
                ...styles.btnConfirmarAcao,
                background: confirmacao.tipo === 'perigo' ? '#dc3545' : confirmacao.tipo === 'sucesso' ? '#14b8a6' : '#0d6efd'
              }}
              onClick={executarConfirmacao}
            >
              {confirmacao.textoConfirmar}
            </button>
          </div>
        </div>
      </div>
    )
  }


  function renderModaisGlobais() {
    return (
      <>
        {modalConta && (
          <AccountModal
            styles={styles}
            editandoContaId={editandoContaId}
            descricao={descricao}
            setDescricao={setDescricao}
            valor={valor}
            setValor={setValor}
            dataVencimento={dataVencimento}
            setDataVencimento={setDataVencimento}
            centroCustoId={centroCustoId}
            setCentroCustoId={setCentroCustoId}
            centros={centros}
            observacaoConta={observacaoConta}
            setObservacaoConta={setObservacaoConta}
            contaRecorrente={contaRecorrente}
            setContaRecorrente={setContaRecorrente}
            tipoRecorrencia={tipoRecorrencia}
            setTipoRecorrencia={setTipoRecorrencia}
            diaVencimentoRecorrencia={diaVencimentoRecorrencia}
            setDiaVencimentoRecorrencia={setDiaVencimentoRecorrencia}
            fecharConta={fecharConta}
            salvarConta={salvarConta}
            primeiraLetraMaiuscula={primeiraLetraMaiuscula}
            limitarDataInput={limitarDataInput}
            formatarDataParaBanco={formatarDataParaBanco}
            fecharNota={fecharNota}
            setModalCentro={setModalCentro}
            setMenuAberto={setMenuAberto}
            setMenuNavegacaoAberto={setMenuNavegacaoAberto}
          />
        )}

        {modalNota && (
          <NoteModal
            styles={styles}
            editandoNotaId={editandoNotaId}
            tituloNota={tituloNota}
            setTituloNota={setTituloNota}
            prioridadeNota={prioridadeNota}
            setPrioridadeNota={setPrioridadeNota}
            dataEventoNota={dataEventoNota}
            setDataEventoNota={setDataEventoNota}
            conteudoNota={conteudoNota}
            setConteudoNota={setConteudoNota}
            salvarNota={salvarNota}
            fecharNota={fecharNota}
            fecharConta={fecharConta}
            setModalCentro={setModalCentro}
            setMenuAberto={setMenuAberto}
            setMenuNavegacaoAberto={setMenuNavegacaoAberto}
            primeiraLetraMaiuscula={primeiraLetraMaiuscula}
            limitarDataInput={limitarDataInput}
          />
        )}

        {modalCentro && (
          <CostCenterModal
            styles={styles}
            novoCentro={novoCentro}
            setNovoCentro={setNovoCentro}
            salvarCentro={salvarCentro}
            centros={centros}
            abrirConfirmacao={abrirConfirmacao}
            excluirCentro={excluirCentro}
            fecharConta={fecharConta}
            fecharNota={fecharNota}
            setModalCentro={setModalCentro}
            setMenuAberto={setMenuAberto}
            setMenuNavegacaoAberto={setMenuNavegacaoAberto}
          />
        )}
      </>
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
      />
    )
  }

  function renderFabGlobal() {
    return (
      <>
        {menuAberto && (
          <div className="global-fab-menu" style={styles.menuFab} onClick={(e) => e.stopPropagation()}>
            <button style={styles.menuItem} type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); abrirNovaConta() }} aria-label="Nova conta">
              <span style={styles.menuItemIcone}>💰</span>
              <span style={styles.menuItemTexto}>Nova conta</span>
            </button>
            <button style={styles.menuItem} type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); abrirNovaNota() }} aria-label="Nova nota">
              <span style={styles.menuItemIcone}>📝</span>
              <span style={styles.menuItemTexto}>Nova nota</span>
            </button>
          </div>
        )}

        <button className="global-fab" style={styles.fab} onClick={(e) => { e.stopPropagation(); setMenuAberto(!menuAberto) }}>
          {menuAberto ? '×' : '+'}
        </button>
      </>
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
      {renderMobileUxFinalPatchStyle()}
      {renderTopShell()}

        {renderSidebar()}
        {renderMobileMenu()}

        <main className="app-frame-content">{children}</main>
        {renderFabGlobal()}
        {renderConfirmacaoGlobal()}
        {renderModaisGlobais()}
      </div>
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
      {renderMobileUxFinalPatchStyle()}
      {renderTopShell()}

        {renderSidebar()}
        {renderMobileMenu()}

        <main className="app-frame-content">{children}</main>
        {renderFabGlobal()}
        {renderConfirmacaoGlobal()}
        {renderModaisGlobais()}
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

  const menuSections = [
    {
      id: 'principal',
      titulo: 'Principal',
      items: [
        { tela: 'dashboard', icon: '🏠', label: 'Dashboard', desc: 'Resumo financeiro' },
        { tela: 'agenda', icon: '📅', label: 'Agenda', desc: 'Vencimentos e previsões' },
        { tela: 'notas', icon: '📝', label: 'Bloco de Notas', desc: 'Pendências e histórico de notas' }
      ]
    },
    {
      id: 'financeiro',
      titulo: 'Financeiro',
      items: [
        { tela: 'contas', icon: '💳', label: 'Contas', desc: 'Contas a pagar e filtros' }
      ]
    },
    {
      id: 'analise',
      titulo: 'Análise',
      items: [
        { tela: 'relatorios', icon: '📊', label: 'Relatórios', desc: 'Análises e indicadores' }
      ]
    },
    {
      id: 'sistema',
      titulo: 'Sistema',
      items: [
        { tela: 'usuarios', icon: '👥', label: 'Usuários', desc: 'Perfis, acessos e senhas' },
        { tela: 'configuracoes', icon: '⚙️', label: 'Configurações', desc: 'Preferências da empresa' },
        { tela: 'importar', icon: '📥', label: 'Importar CSV', desc: 'Trazer histórico do Excel' },
        { tela: 'lixeira', icon: '🗑️', label: 'Lixeira', desc: 'Restaurar ou excluir definitivo' }
      ]
    }
  ]

  function renderSidebar() {
    return (
      <Sidebar
        sidebarCompacta={sidebarCompacta}
        setSidebarCompacta={setSidebarCompacta}
        nomeUsuario={nomeUsuario}
        normalizarPerfil={normalizarPerfil}
        perfilUsuario={perfilUsuario}
        menuSections={menuSections}
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
        normalizarPerfil={normalizarPerfil}
        perfilUsuario={perfilUsuario}
        menuSections={menuSections}
        navegarPara={navegarPara}
        sairDoSistema={sairDoSistema}
      />
    )
  }

  if (carregandoAuth) {
    return (
      <div style={styles.page}>
        <h2>Carregando...</h2>
      </div>
    )
  }

  if (!usuarioLogado) {
    return <Login onLogin={setUsuarioLogado} />
  }


  function renderListaContasConteudo() {
    return (
      <>
      <section className="no-print filters-desktop" style={styles.filtrosBox}>
        <input
          style={styles.input}
          placeholder="Buscar por conta, data, centro, observação ou status..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <button className="filter-toggle-button" onClick={() => setMostrarFiltros(!mostrarFiltros)}>
          {mostrarFiltros ? 'Ocultar filtros' : 'Filtros'}
        </button>

        <div className="export-actions" style={styles.acoes}>
          <button style={styles.btnCinza} onClick={limparFiltros}>Limpar</button>
          <button style={styles.btnRoxo} onClick={imprimirPDF}>PDF</button>
          <button style={styles.btnVerde} onClick={exportarCSV}>CSV</button>
        </div>

        {mostrarFiltros && (
          <div className="advanced-filters">
            <div className="status-tabs filter-tabs-fixed" style={styles.filtros}>
              <button style={filtroStatus === 'todas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('todas')}>Todas</button>
              <button style={filtroStatus === 'pendentes' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('pendentes')}>Pendentes</button>
              <button style={filtroStatus === 'pagas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('pagas')}>Pagas</button>
              <button style={filtroStatus === 'vencidas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('vencidas')}>Vencidas</button>
            </div>

            <select style={styles.input} value={filtroCentro} onChange={(e) => setFiltroCentro(e.target.value)}>
              <option value="">Todos os centros</option>
              {centros.map((centro) => (<option key={centro.id} value={centro.id}>{centro.nome}</option>))}
            </select>

            <input style={styles.input} type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} />

            <input style={styles.input} type="date" value={dataInicial} onChange={(e) => setDataInicial(limitarDataInput(e.target.value))} />
            <input style={styles.input} type="date" value={dataFinal} onChange={(e) => setDataFinal(limitarDataInput(e.target.value))} />
          </div>
        )}
      </section>

      <section className="result-summary" style={styles.resumoFiltro}>
        <strong>Resultado filtrado</strong>
        <span>{contasFiltradas.length} conta(s) • Total {formatarValor(total)}</span>
        <small>
          Centro: {filtroCentro ? centros.find((centro) => centro.id === filtroCentro)?.nome || 'Selecionado' : 'Todos'} •
          Status: {filtroStatus} •
          Mês: {filtroMes || 'Todos'}
        </small>
      </section>

      <section className="content-block" style={styles.bloco}>
        {loading && <p>Carregando...</p>}

        <HeaderExpansivel
          titulo="💰 Contas"
          aberto={mostrarContas}
          onClick={() => setMostrarContas(!mostrarContas)}
        />

        {mostrarContas && contasFiltradas.map((conta) => {
          const vencida = estaVencida(conta.data_vencimento, conta.status)

          return (
            <div
              className={`print-card account-card-desktop ${vencida ? 'account-card-vencida' : conta.status === 'pago' ? 'account-card-paga' : 'account-card-pendente'}`}
              key={conta.id}
              style={{
                ...styles.cardConta,
                background:
                  conta.status === 'pago'
                    ? '#d4edda'
                    : vencida
                      ? '#ffb3b3'
                      : '#fff3cd'
              }}
            >
              <div style={styles.cardTopo}>
                <strong>{conta.descricao}</strong>
                <span>{formatarValor(conta.valor)}</span>
              </div>

              <div style={styles.cardInfo} className="account-meta-line">
                <span className="account-date-badge">📅 {formatarData(conta.data_vencimento)}</span>
                <span>{conta.df_centros_custo?.nome || '-'}</span>
                {conta.recorrencia_id && (
                  <span className="account-recurring-badge">🔁 {formatarTipoRecorrencia(obterTipoRecorrenciaConta(conta))}</span>
                )}
                <span className={`status-pill ${vencida ? 'status-vencido' : conta.status === 'pago' ? 'status-pago' : 'status-pendente'}`}>
                  {vencida ? 'Vencido' : conta.status === 'pago' ? 'Pago' : 'Pendente'}
                </span>
              </div>

              <div className="account-actions" style={styles.acoes}>
                {conta.status !== 'pago' ? (
                  <button style={styles.btnPago} onClick={() => abrirConfirmacao({ titulo: 'Confirmar pagamento', mensagem: `Deseja marcar a conta ${conta.descricao} como paga?`, textoConfirmar: 'Marcar como pago', tipo: 'sucesso', acao: () => marcarComoPago(conta.id) })}>
                    Pago
                  </button>
                ) : (
                  <button style={styles.btnVoltar} onClick={() => abrirConfirmacao({ titulo: 'Voltar para pendente', mensagem: `Deseja voltar a conta ${conta.descricao} para pendente?`, textoConfirmar: 'Voltar', tipo: 'aviso', acao: () => voltarParaPendente(conta.id) })}>
                    Voltar
                  </button>
                )}

                <button style={styles.btnEditar} onClick={() => abrirEdicaoConta(conta)}>
                  Editar
                </button>

                <button style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Mover para lixeira', mensagem: `Deseja mover a conta ${conta.descricao} para a lixeira? Ela ficará em quarentena por 60 dias.`, textoConfirmar: 'Mover', tipo: 'perigo', acao: () => excluirConta(conta.id) })}>
                  Excluir
                </button>
              </div>
            </div>
          )
        })}
      </section>

      </>
    )
  }

  if (erroEmpresa) {
    return (
      <div style={styles.page}>
        <h2>⚠️ Empresa não vinculada</h2>
        <p>{erroEmpresa}</p>
        <button style={styles.btnSair} onClick={sairDoSistema}>Sair</button>
      </div>
    )
  }


  if (telaAtual === 'contas') {
    return renderAppFrame(
      <>
        <div className="page-title-actions">
          <div>
            <h1 style={styles.titulo}>💳 Contas</h1>
            <p style={styles.textoNota}>Consulte, filtre, exporte e administre as contas da empresa em uma página dedicada.</p>
          </div>
          <div className="page-actions-row">
            <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>← Dashboard</button>
          </div>
        </div>
        {renderListaContasConteudo()}
      </>
    )
  }

  if (telaAtual === 'relatorios') {
    return (
      <AppFrame>
        <Relatorios voltar={() => navegarPara('contas')} empresaId={empresaId} usuario={usuarioLogado} />
      </AppFrame>
    )
  }



  if (telaAtual === 'notas') {
    return renderAppFrame(
      <>
        <div className="page-title-actions">
          <div>
            <h1 style={styles.titulo}>📝 Notas</h1>
            <p style={styles.textoNota}>Central de notas e lembretes da empresa, separada do painel financeiro para reduzir poluição visual.</p>
          </div>
          <div className="page-actions-row">
            <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>← Dashboard</button>
          </div>
        </div>

        <section style={styles.cardConfiguracao} className="notes-page-section">
          <div className="notes-page-header">
            <div>
              <h2 style={styles.subtitulo}>Todas as notas</h2>
              <p style={styles.textoNota}>{notasFiltradas.length} nota(s) encontrada(s) • {notasPendentes.length} pendente(s)</p>
            </div>
            <div className="notes-page-stats">
              <span className="note-stat note-stat-pendente">{notasPendentes.length} pendente(s)</span>
              <span className="note-stat note-stat-critico">{notasCriticas} crítica(s)</span>
              <span className="note-stat note-stat-urgente">{notasUrgentes} urgente(s)</span>
            </div>
          </div>

          <div className="notes-toolbar">
            <input
              style={styles.input}
              placeholder="Buscar por título, conteúdo ou prioridade..."
              value={buscaNota}
              onChange={(e) => setBuscaNota(e.target.value)}
            />
          </div>

          {notasFiltradas.length === 0 && (
            <p style={styles.mensagemVazia}>Nenhuma nota encontrada.</p>
          )}

          <div className="notes-page-grid">
            {notasFiltradas.map((nota) => {
              const prioridade = nota.prioridade || 'normal'
              return (
                <div key={nota.id} className={`note-card-action note-card-${prioridade}`} style={{ ...styles.cardNotaAcao, ...(prioridade === 'critico' ? styles.cardNotaCritico : prioridade === 'urgente' ? styles.cardNotaUrgente : styles.cardNotaNormal), opacity: nota.concluida ? 0.65 : 1 }}>
                  <div style={styles.cardTopo}>
                    <strong style={{ textDecoration: nota.concluida ? 'line-through' : 'none' }}>{nota.titulo}</strong>
                    <span className={`note-priority-badge note-priority-${prioridade}`} style={{ ...styles.badgePrioridade, ...(prioridade === 'critico' ? styles.badgeCritico : prioridade === 'urgente' ? styles.badgeUrgente : styles.badgeNormal) }}>
                      {prioridade === 'critico' ? 'Crítico' : prioridade === 'urgente' ? 'Urgente' : 'Normal'}
                    </span>
                  </div>

                  {nota.data_evento && <small className="note-event-date">📅 {formatarData(nota.data_evento)}</small>}
                  {nota.conteudo && <p style={styles.textoNota}>{nota.conteudo}</p>}

                  <div style={styles.acoes}>
                    <button style={styles.btnPago} onClick={() => alternarNotaConcluida(nota)}>{nota.concluida ? 'Reabrir' : 'Concluir'}</button>
                    <button style={styles.btnEditar} onClick={() => abrirEdicaoNota(nota)}>Editar</button>
                    <button style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Mover nota para lixeira', mensagem: `Deseja mover a nota ${nota.titulo} para a lixeira? Ela ficará em quarentena por 60 dias.`, textoConfirmar: 'Mover', tipo: 'perigo', acao: () => excluirNota(nota.id) })}>Excluir</button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </>
    )
  }


  if (telaAtual === 'importar') {
    return (
      <AppFrame>
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
      </AppFrame>
    )
  }



  if (telaAtual === 'usuarios') {
    if (!podeAcessarConfiguracoes()) {
      return renderAppFrame(
        <>
          <h1 style={styles.titulo}>👥 Usuários</h1>
          <section style={styles.cardConfiguracao}>
            <h2 style={styles.subtitulo}>Acesso restrito</h2>
            <p style={styles.textoNota}>Seu perfil atual não permite acessar a gestão de usuários.</p>
            <button style={styles.btnCinza} onClick={() => navegarPara('contas')}>← Voltar</button>
          </section>
        </>
      )
    }

    const usuarioAtualEmail = usuarioLogado?.email || ''

    return renderAppFrame(
      <>
        <h1 style={styles.titulo}>👥 Gestão de usuários</h1>

        <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
          ← Voltar
        </button>

        <section style={styles.cardConfiguracao} className="users-page-section">
          <h2 style={styles.subtitulo}>Minha conta</h2>
          <p style={styles.textoNota}>
            Usuário conectado: <strong>{usuarioAtualEmail}</strong> • Perfil: <strong>{normalizarPerfil(perfilUsuario)}</strong>
          </p>

          <UserSecurityCards
            novoEmailUsuario={novoEmailUsuario}
            setNovoEmailUsuario={setNovoEmailUsuario}
            novaSenhaUsuario={novaSenhaUsuario}
            setNovaSenhaUsuario={setNovaSenhaUsuario}
            confirmarNovaSenhaUsuario={confirmarNovaSenhaUsuario}
            setConfirmarNovaSenhaUsuario={setConfirmarNovaSenhaUsuario}
            salvarMeuEmail={salvarMeuEmail}
            salvarMinhaSenha={salvarMinhaSenha}
            styles={styles}
          />
        </section>

        <section style={styles.cardConfiguracao} className="users-page-section">
          <div className="users-header-row">
            <div>
              <h2 style={styles.subtitulo}>Usuários da empresa</h2>
              <p style={styles.textoNota}>Defina o nível de acesso: admin, gerente ou operador.</p>
            </div>
            <button style={styles.btnCinza} onClick={() => buscarUsuariosEmpresa()}>Atualizar</button>
          </div>

          <div className="users-permission-guide">
            <span><strong>Admin:</strong> acesso total</span>
            <span><strong>Gerente:</strong> contas, notas, relatórios e configurações operacionais</span>
            <span><strong>Operador:</strong> contas e notas</span>
          </div>

          {podeAdministrarUsuarios() && (
            <div className="users-add-card">
              <input
                style={styles.input}
                type="text"
                placeholder="Nome do usuário"
                value={nomeConviteUsuario}
                onChange={(e) => setNomeConviteUsuario(primeiraLetraMaiuscula(e.target.value))}
              />

              <input
                style={styles.input}
                type="email"
                placeholder="E-mail do usuário"
                value={emailConviteUsuario}
                onChange={(e) => setEmailConviteUsuario(e.target.value)}
              />

              <select
                style={styles.input}
                value={perfilConviteUsuario}
                onChange={(e) => setPerfilConviteUsuario(e.target.value)}
              >
                <option value="operador">Operador</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Admin</option>
              </select>

              <button style={styles.btnSalvar} onClick={adicionarUsuarioEmpresa}>Adicionar usuário</button>
            </div>
          )}

          <div className="users-list">
            {usuariosEmpresa.length === 0 && (
              <p style={styles.mensagemVazia}>Nenhum usuário cadastrado para esta empresa.</p>
            )}

            {usuariosEmpresa.map((usuario) => {
              const atual = usuario.user_id && usuarioLogado?.id && usuario.user_id === usuarioLogado.id
              const pendente = !usuario.user_id

              return (
                <div key={usuario.id || usuario.user_id || usuario.email} className="user-card userCard">
                  <div className="user-main-info userInfo">
                    <strong>{usuario.nome || usuario.email || 'Usuário sem nome'}</strong>
                    <small>{usuario.email || usuario.user_id || 'Sem e-mail vinculado'}</small>
                    {atual && <span className="user-badge user-badge-self">Você</span>}
                    {pendente && <span className="user-badge user-badge-pending">Pendente de vínculo</span>}
                  </div>

                  <span className={`roleBadge ${normalizarPerfil(usuario.perfil)}`}>{normalizarPerfil(usuario.perfil)}</span>

                  <select
                    className="user-role-select"
                    style={styles.input}
                    value={normalizarPerfil(usuario.perfil)}
                    disabled={!podeAdministrarUsuarios()}
                    onChange={(e) => atualizarPerfilUsuarioEmpresa(usuario, e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="gerente">Gerente</option>
                    <option value="operador">Operador</option>
                  </select>

                  {podeAdministrarUsuarios() && (
                    <div className="user-actions">
                      <button
                        style={styles.btnSecundario}
                        onClick={() => enviarAcessoUsuarioEmpresa(usuario)}
                      >
                        Enviar acesso
                      </button>

                      <button
                        style={styles.btnExcluir}
                        disabled={atual}
                        onClick={() => removerUsuarioEmpresa(usuario)}
                        title={atual ? 'Você não pode remover o próprio acesso.' : 'Remover usuário'}
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </>
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
            <p style={styles.mensagemVazia}>Nenhuma conta nesta agenda.</p>
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

    return (
      <AppFrame>
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
      </AppFrame>
    )
  }

  if (telaAtual === 'lixeira') {
    return (
      <AppFrame>
        <h1 style={styles.titulo}>🗑️ Lixeira</h1>

        <button className="btn-back-page" style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
          ← Voltar
        </button>

        <section style={styles.bloco}>
          <h2 style={styles.subtitulo}>💰 Contas excluídas</h2>

          {contasLixeira.length === 0 && (
            <p style={styles.mensagemVazia}>Nenhuma conta na lixeira.</p>
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

        <section style={styles.bloco}>
          <h2 style={styles.subtitulo}>📝 Notas excluídas</h2>

          {notasLixeira.length === 0 && (
            <p style={styles.mensagemVazia}>Nenhuma nota na lixeira.</p>
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
      </AppFrame>
    )
  }

  // =========================
  // BLOCO 11 — UI
  // =========================
  return (
    <div className="app-page" style={styles.page} onClick={() => { if (menuAberto) setMenuAberto(false) }}>
      <style>
        {`
          .print-header,
          .print-footer {
            display: none;
          }

          .desktop-sidebar { display: none; }
          .desktop-quick-actions { display: none; }

          @media (min-width: 980px) {
            body { background: #eef7f5 !important; }

            .app-page {
              max-width: none !important;
              width: 100% !important;
              min-height: 100vh !important;
              margin: 0 !important;
              padding: 24px 32px 80px 300px !important;
              box-sizing: border-box !important;
              background: linear-gradient(180deg, #f8fafc 0%, #eef7f5 100%) !important;
            }

            .desktop-sidebar {
              display: flex !important;
              position: fixed;
              left: 24px;
              top: 24px;
              bottom: 24px;
              width: 244px;
              padding: 18px;
              border-radius: 24px;
              background: linear-gradient(180deg, #064e3b 0%, #0f766e 48%, #14b8a6 100%);
              color: white;
              box-shadow: 0 24px 60px rgba(15, 118, 110, 0.28);
              z-index: 60;
              flex-direction: column;
              gap: 14px;
              box-sizing: border-box;
            }

            .desktop-sidebar-brand {
              display: flex;
              align-items: center;
              gap: 12px;
              padding-bottom: 14px;
              border-bottom: 1px solid rgba(255,255,255,.18);
            }

            .desktop-sidebar-brand img {
              width: 48px;
              height: 48px;
              border-radius: 16px;
              background: white;
            }

            .desktop-sidebar-brand strong { display: block; font-size: 17px; }
            .desktop-sidebar-brand small { color: rgba(255,255,255,.78); }

            .desktop-sidebar-section-label {
              margin: 12px 4px 4px;
              font-size: 10px;
              letter-spacing: .9px;
              text-transform: uppercase;
              color: rgba(255,255,255,.62);
              font-weight: 900;
            }
            .desktop-sidebar-nav { display: grid; gap: 6px; margin-top: 2px; }
            .desktop-sidebar-nav button {
              display: flex;
              align-items: center;
              gap: 10px;
              width: 100%;
              border: 1px solid transparent;
              background: transparent;
              color: rgba(255,255,255,.92);
              border-radius: 14px;
              padding: 11px 12px;
              text-align: left;
              font-weight: 800;
              cursor: pointer;
            }
            .desktop-sidebar-nav button:hover { background: rgba(255,255,255,.14); border-color: rgba(255,255,255,.12); }
            .desktop-sidebar-nav button.active { background: rgba(255,255,255,.22); border-color: rgba(255,255,255,.18); box-shadow: inset 3px 0 0 rgba(255,255,255,.8); }
            .desktop-sidebar-spacer { flex: 1; }
            .desktop-sidebar-user {
              border-radius: 18px;
              padding: 12px;
              background: rgba(255,255,255,.12);
              border: 1px solid rgba(255,255,255,.16);
            }
            .desktop-sidebar-user strong { display:block; }
            .desktop-sidebar-user small { color: rgba(255,255,255,.8); }

            .top-shell {
              max-width: 1280px;
              margin: 0 auto 22px auto !important;
              padding: 16px 18px !important;
              border-radius: 24px !important;
            }

            .mobile-menu-trigger { display: none !important; }

            .desktop-quick-actions {
              display: flex !important;
              gap: 10px;
              align-items: center;
            }

            .desktop-quick-actions button {
              border: none;
              border-radius: 13px;
              padding: 10px 14px;
              color: white;
              font-weight: 800;
              cursor: pointer;
              box-shadow: 0 10px 22px rgba(20,184,166,.22);
            }

            .desktop-quick-actions .primary { background: linear-gradient(135deg, #14b8a6, #0f766e); }
            .desktop-quick-actions .secondary { background: #111827; }

            .dashboard-title-row {
              max-width: 1280px;
              margin: 0 auto !important;
              display: flex;
              align-items: end;
              justify-content: space-between;
              gap: 20px;
            }

            .main-title { font-size: 34px !important; margin: 0 0 16px 0 !important; }

            .summary-grid {
              max-width: 1280px;
              margin: 0 auto 18px auto !important;
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
              gap: 14px !important;
            }
            .summary-grid > div {
              min-height: 96px;
              border: 1px solid rgba(15, 118, 110, 0.08);
              box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07) !important;
            }
            .summary-grid span { font-size: 13px; color: #475569; }
            .summary-grid strong { font-size: 25px; margin-top: 6px; }

            .agenda-card-polished {
              max-width: 1280px;
              margin: 0 auto 18px auto !important;
              grid-template-columns: 1fr auto auto !important;
              align-items: center !important;
              padding: 18px 20px !important;
              border-radius: 22px !important;
              background: linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%) !important;
            }
            .agenda-card-polished > div:first-child strong { display:block; font-size: 18px; }
            .agenda-card-polished > div:first-child small { display:block; margin-top: 3px; color:#64748b; }
            .agenda-card-polished button { min-width: 170px; height: 42px; }
            .agenda-compact-items { display:flex !important; gap: 10px; align-items:center; }
            .agenda-pill { min-width: 112px; padding: 9px 12px; border-radius: 14px; background: rgba(255,255,255,.86); border:1px solid #ccfbf1; }
            .agenda-pill small { display:block; font-size:11px; color:#64748b; font-weight:800; }
            .agenda-pill strong { display:block; margin-top:2px; color:#0f172a; }

            .filters-desktop {
              max-width: 1280px;
              margin: 0 auto 16px auto !important;
              display: grid !important;
              grid-template-columns: 1fr auto auto !important;
              align-items: center;
              gap: 10px !important;
              padding: 14px !important;
              border-radius: 22px !important;
            }
            .filters-desktop input, .filters-desktop select { height: 42px !important; margin-bottom: 0 !important; }
            .filters-desktop .status-tabs { grid-column: 1 / -1; display:none !important; }
            .filters-desktop .advanced-filters { grid-column: 1 / -1; display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; padding-top: 4px; }
            .filters-desktop .export-actions { justify-content: flex-end; margin-top: 0 !important; }
            .filter-toggle-button { height:42px; border:none; border-radius:12px; padding:0 14px; font-weight:900; background:#ecfeff; color:#0f766e; border:1px solid #99f6e4; cursor:pointer; }
            .export-dropdown { position: relative; }
            .export-dropdown > button { height:42px; border:none; border-radius:12px; padding:0 14px; font-weight:900; background:#111827; color:white; cursor:pointer; }

            .result-summary, .content-block {
              max-width: 1280px;
              margin-left: auto !important;
              margin-right: auto !important;
            }

            .content-block {
              margin-top: 18px !important;
            }

            .account-card-desktop {
              display: grid !important;
              grid-template-columns: minmax(240px, 1.5fr) 180px 1fr auto;
              align-items: center;
              gap: 14px;
              padding: 16px !important;
              border-radius: 18px !important;
            }
            .account-card-desktop > div { margin: 0 !important; }
            .account-card-desktop .account-actions { justify-content: flex-end; margin-top: 0 !important; }

            .notes-block { max-width: 1280px; margin-left: auto !important; margin-right: auto !important; }
            .notes-panel { position: fixed; right: 32px; top: 180px; width: 320px; max-height: calc(100vh - 220px); overflow: auto; z-index: 20; }
            .filters-desktop, .agenda-card-polished, .dashboard-title-row, .summary-grid, .result-summary, .content-block { max-width: calc(1280px - 360px) !important; margin-left: auto !important; margin-right: 360px !important; }



            /* ===== CORRECAO FINAL DESKTOP DASHBOARD ===== */
            .dashboard-title-row {
              max-width: none !important;
              margin: 0 360px 20px 0 !important;
              display: block !important;
            }

            .dashboard-title-row .main-title {
              display: block !important;
              width: 100% !important;
              max-width: none !important;
              line-height: 1.1 !important;
              margin: 0 0 18px 0 !important;
              white-space: normal !important;
            }

            .dashboard-title-row .summary-grid,
            .summary-grid {
              display: grid !important;
              grid-template-columns: repeat(4, minmax(150px, 1fr)) !important;
              gap: 14px !important;
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
            }

            .summary-grid > div {
              min-width: 0 !important;
              min-height: 92px !important;
              padding: 16px !important;
              border-radius: 18px !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
              align-items: flex-start !important;
              overflow: hidden !important;
            }

            .summary-grid span {
              display: block !important;
              width: 100% !important;
              font-size: 13px !important;
              line-height: 1.2 !important;
              margin: 0 0 4px 0 !important;
              white-space: nowrap !important;
            }

            .summary-grid strong {
              display: block !important;
              width: 100% !important;
              font-size: 22px !important;
              line-height: 1.1 !important;
              margin: 0 !important;
              white-space: nowrap !important;
            }

            .agenda-card-polished,
            .filters-desktop,
            .result-summary,
            .content-block {
              max-width: none !important;
              margin-left: 0 !important;
              margin-right: 360px !important;
              width: auto !important;
            }

            .notes-panel {
              position: fixed !important;
              right: 32px !important;
              top: 150px !important;
              width: 320px !important;
              max-height: calc(100vh - 180px) !important;
              overflow: auto !important;
              z-index: 20 !important;
              background: #ffffff !important;
              border-radius: 22px !important;
              padding: 16px !important;
              box-shadow: 0 18px 44px rgba(15,23,42,.08) !important;
              border: 1px solid rgba(15,118,110,.10) !important;
            }

            .top-shell {
              max-width: none !important;
              margin: 0 0 28px 0 !important;
            }

            @media (min-width: 980px) and (max-width: 1220px) {
              .dashboard-title-row,
              .agenda-card-polished,
              .filters-desktop,
              .result-summary,
              .content-block {
                margin-right: 0 !important;
              }

              .notes-panel {
                position: static !important;
                width: auto !important;
                max-height: none !important;
                margin: 18px 0 !important;
              }
            }

            .mobile-fab, .mobile-fab-menu { display: none !important; }
          }



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



          /* ===== AJUSTE LIMPO: NOTAS NO FLUXO DO DASHBOARD ===== */
          @media (min-width: 980px) {
            .dashboard-title-row,
            .agenda-card-polished,
            .filters-desktop,
            .result-summary,
            .content-block,
            .dashboard-notes-card {
              max-width: 1280px !important;
              width: 100% !important;
              margin-left: auto !important;
              margin-right: auto !important;
              box-sizing: border-box !important;
            }

            body:has(.desktop-sidebar.compacta) .dashboard-title-row,
            body:has(.desktop-sidebar.compacta) .summary-grid,
            body:has(.desktop-sidebar.compacta) .agenda-card-polished,
            body:has(.desktop-sidebar.compacta) .filters-desktop,
            body:has(.desktop-sidebar.compacta) .result-summary,
            body:has(.desktop-sidebar.compacta) .content-block {
              margin-right: auto !important;
            }

            .dashboard-notes-card {
              position: static !important;
              display: grid !important;
              grid-template-columns: minmax(240px, 320px) minmax(0, 1fr) !important;
              gap: 16px !important;
              padding: 18px !important;
              margin-top: 18px !important;
              margin-bottom: 18px !important;
              border-radius: 24px !important;
              background: #ffffff !important;
              border: 1px solid #e5e7eb !important;
              box-shadow: 0 18px 44px rgba(15,23,42,.08) !important;
              overflow: visible !important;
              white-space: normal !important;
              z-index: auto !important;
            }

            .dashboard-notes-card .quick-actions-card {
              margin: 0 !important;
              align-self: start !important;
            }

            .dashboard-notes-card .notes-header-clean,
            .dashboard-notes-card .notes-list-dashboard,
            .dashboard-notes-card .notes-see-all,
            .dashboard-notes-card > p {
              grid-column: 2 !important;
              min-width: 0 !important;
            }

            .dashboard-notes-card .notes-header-clean {
              display: flex !important;
              align-items: flex-start !important;
              justify-content: space-between !important;
              flex-wrap: wrap !important;
              gap: 12px !important;
              margin-bottom: 10px !important;
            }

            .dashboard-notes-card .notes-stats-row {
              display: flex !important;
              flex-wrap: wrap !important;
              gap: 8px !important;
              margin-top: 8px !important;
            }

            .dashboard-notes-card .notes-list-dashboard {
              display: grid !important;
              grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
              gap: 12px !important;
            }

            .dashboard-notes-card .notes-list-dashboard > div {
              margin: 0 !important;
              min-width: 0 !important;
              overflow: hidden !important;
            }

            .dashboard-notes-card .notes-see-all {
              justify-self: start !important;
              margin-top: 4px !important;
            }
          }

          @media (max-width: 979px) {
            .dashboard-notes-card {
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
              white-space: normal !important;
            }
          }

          @media print {
            html,
            body {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              overflow: visible !important;
            }

            .app-page {
              min-height: auto !important;
              padding-bottom: 0 !important;
              background: #ffffff !important;
            }

            button,
            .no-print {
              display: none !important;
            }

            .print-header {
              display: block !important;
              text-align: center;
              margin-bottom: 14px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 8px;
            }

            .print-header h1 {
              font-size: 20px;
              margin: 0 0 4px 0;
            }

            .print-header p {
              font-size: 11px;
              margin: 0;
              color: #555;
            }

            .print-footer {
              display: block !important;
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 6px;
              background: #fff;
            }

            .print-card {
              page-break-inside: avoid;
              break-inside: avoid;
              box-shadow: none !important;
              border: 1px solid #ddd;
            }

            @page {
              size: A4;
              margin: 12mm 12mm 18mm 12mm;
            }
          }
        `}
      </style>
      {renderDesktopRefinoStyle()}
      {renderMobileFinalStyle()}

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

      <style>{`
        /* ===== CORRECAO ESTRUTURAL DEFINITIVA: DASHBOARD + NOTAS ===== */
        @media (min-width: 980px) {
          html, body, #root {
            max-width: 100%;
            overflow-x: hidden !important;
          }

          .app-page,
          .app-frame {
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }

          .app-frame-content {
            width: 100% !important;
            max-width: 1280px !important;
            margin-left: auto !important;
            margin-right: auto !important;
            overflow-x: hidden !important;
          }

          .dashboard-title-row,
          .agenda-card-polished,
          .filters-desktop,
          .result-summary,
          .content-block,
          .dashboard-notes-card {
            max-width: 1280px !important;
            width: 100% !important;
            margin-left: auto !important;
            margin-right: auto !important;
            box-sizing: border-box !important;
          }

          body:has(.desktop-sidebar.compacta) .dashboard-title-row,
          body:has(.desktop-sidebar.compacta) .summary-grid,
          body:has(.desktop-sidebar.compacta) .agenda-card-polished,
          body:has(.desktop-sidebar.compacta) .filters-desktop,
          body:has(.desktop-sidebar.compacta) .result-summary,
          body:has(.desktop-sidebar.compacta) .content-block,
          body:has(.desktop-sidebar.compacta) .dashboard-notes-card {
            margin-left: auto !important;
            margin-right: auto !important;
          }

          .dashboard-title-row {
            display: block !important;
            margin-top: 0 !important;
            margin-bottom: 18px !important;
          }

          .dashboard-title-row .main-title {
            width: 100% !important;
            margin: 0 0 16px 0 !important;
            white-space: normal !important;
          }

          .dashboard-title-row .summary-grid,
          .summary-grid {
            display: grid !important;
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 14px !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
          }

          .summary-grid > div {
            min-width: 0 !important;
            overflow: hidden !important;
          }

          .dashboard-notes-card,
          .notes-panel {
            position: static !important;
            inset: auto !important;
            right: auto !important;
            top: auto !important;
            left: auto !important;
            bottom: auto !important;
            width: 100% !important;
            max-width: 1280px !important;
            max-height: none !important;
            overflow: hidden !important;
            z-index: auto !important;
          }

          .dashboard-notes-card {
            display: grid !important;
            grid-template-columns: minmax(220px, 300px) minmax(0, 1fr) !important;
            gap: 16px !important;
            align-items: start !important;
            padding: 18px !important;
            margin-top: 18px !important;
            margin-bottom: 18px !important;
            border-radius: 24px !important;
            background: #ffffff !important;
            border: 1px solid #e5e7eb !important;
            box-shadow: 0 18px 44px rgba(15,23,42,.08) !important;
            box-sizing: border-box !important;
          }

          .dashboard-notes-card .quick-actions-card {
            grid-column: 1 !important;
            grid-row: 1 / span 4 !important;
            margin: 0 !important;
            min-width: 0 !important;
          }

          .dashboard-notes-card .notes-header-clean,
          .dashboard-notes-card .notes-list-dashboard,
          .dashboard-notes-card .notes-see-all,
          .dashboard-notes-card > p {
            grid-column: 2 !important;
            min-width: 0 !important;
          }

          .dashboard-notes-card .notes-list-dashboard {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
            gap: 12px !important;
            overflow: hidden !important;
          }

          .dashboard-notes-card .notes-list-dashboard > div,
          .dashboard-notes-card .notes-header-clean,
          .dashboard-notes-card .notes-title-wrap {
            min-width: 0 !important;
            max-width: 100% !important;
            overflow-wrap: anywhere !important;
          }

          .dashboard-notes-card .notes-see-all {
            justify-self: start !important;
          }
        }

        @media (min-width: 980px) and (max-width: 1180px) {
          .dashboard-title-row .summary-grid,
          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .dashboard-notes-card {
            grid-template-columns: 1fr !important;
          }

          .dashboard-notes-card .quick-actions-card,
          .dashboard-notes-card .notes-header-clean,
          .dashboard-notes-card .notes-list-dashboard,
          .dashboard-notes-card .notes-see-all,
          .dashboard-notes-card > p {
            grid-column: 1 !important;
            grid-row: auto !important;
          }
        }

        @media (max-width: 979px) {
          .dashboard-notes-card,
          .notes-panel {
            position: static !important;
            width: auto !important;
            max-width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
          }
        }


        /* ===== REFINAMENTO PRODUTO: BOTOES, MENU E NOTAS ===== */
        @media (min-width: 980px) {
          .dashboard-heading-actions {
            display:flex !important;
            align-items:flex-start !important;
            justify-content:space-between !important;
            gap:14px !important;
            width:100% !important;
            margin-bottom:16px !important;
          }
          .dashboard-heading-actions .main-title { margin:0 !important; }
          .btn-dashboard-primary,
          .btn-action-ghost,
          .note-add-small,
          .note-toggle-small,
          .notes-see-all {
            border:1px solid #d1d5db !important;
            background:#ffffff !important;
            color:#374151 !important;
            border-radius:999px !important;
            padding:7px 12px !important;
            font-size:13px !important;
            font-weight:800 !important;
            line-height:1 !important;
            box-shadow:none !important;
            width:auto !important;
            min-width:auto !important;
            cursor:pointer !important;
            transition:background .18s ease, border-color .18s ease, color .18s ease, transform .18s ease !important;
          }
          .btn-dashboard-primary:hover,
          .btn-action-ghost:hover,
          .note-add-small:hover,
          .note-toggle-small:hover,
          .notes-see-all:hover {
            background:#f9fafb !important;
            border-color:#9ca3af !important;
            color:#111827 !important;
            transform:translateY(-1px) !important;
          }
          .sidebar-collapse-btn {
            background:transparent !important;
            border:1px solid rgba(255,255,255,.10) !important;
            color:rgba(255,255,255,.82) !important;
            opacity:.72 !important;
            min-height:34px !important;
            padding:6px 8px !important;
          }
          .sidebar-collapse-btn small { font-size:11px !important; color:rgba(255,255,255,.68) !important; }
          .sidebar-collapse-btn:hover { opacity:1 !important; background:rgba(255,255,255,.08) !important; }
          .dashboard-notes-card {
            display:block !important;
            grid-template-columns:1fr !important;
            padding:18px !important;
          }
          .dashboard-notes-card .notes-header-clean,
          .dashboard-notes-card .notes-list-dashboard,
          .dashboard-notes-card .notes-see-all,
          .dashboard-notes-card > p {
            grid-column:auto !important;
          }
          .notes-header-actions { display:flex !important; align-items:center !important; gap:8px !important; flex-wrap:wrap !important; }
          .notes-page-grid .btn-action-ghost { justify-self:start; }
          .account-actions button,
          .notes-page-grid button,
          .content-block button {
            font-weight:800 !important;
            border-radius:10px !important;
            cursor:pointer !important;
          }
        }
        @media (max-width: 979px) {
          .dashboard-heading-actions { display:grid !important; gap:10px !important; }
          .btn-dashboard-primary,
          .btn-action-ghost,
          .note-add-small,
          .note-toggle-small,
          .notes-see-all {
            width:auto !important;
            border:1px solid #d1d5db !important;
            background:#ffffff !important;
            color:#374151 !important;
            border-radius:999px !important;
            padding:7px 12px !important;
            font-size:13px !important;
            font-weight:800 !important;
          }
        }
        @media (max-width: 979px) {
          html, body, #root {
            max-width: 100% !important;
            overflow-x: hidden !important;
          }

          .app-page,
          .app-frame {
            width: 100% !important;
            max-width: 430px !important;
            margin: 0 auto !important;
            overflow-x: hidden !important;
            box-sizing: border-box !important;
          }

          .top-shell {
            margin: 0 0 14px 0 !important;
            padding: 12px !important;
            border-radius: 18px !important;
            box-shadow: 0 10px 24px rgba(15,23,42,.06) !important;
          }

          .mobile-menu-trigger {
            width: 40px !important;
            height: 40px !important;
            border-radius: 14px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            border: 1px solid #e5e7eb !important;
            box-shadow: 0 6px 16px rgba(15,23,42,.08) !important;
          }

          .mobile-menu-panel {
            width: min(92vw, 360px) !important;
            max-height: calc(100vh - 28px) !important;
            overflow-y: auto !important;
            border-radius: 24px !important;
            padding: 16px !important;
            box-sizing: border-box !important;
          }

          .mobile-menu-group {
            margin-top: 12px !important;
          }

          .mobile-menu-group summary {
            list-style: none !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 8px 2px !important;
            color: #0f766e !important;
            font-size: 12px !important;
            font-weight: 900 !important;
            letter-spacing: .05em !important;
            text-transform: uppercase !important;
          }

          .mobile-menu-group summary::-webkit-details-marker { display: none !important; }

          .mobile-menu-group button,
          .mobile-menu-panel button {
            border-radius: 16px !important;
            background: #ffffff !important;
            border: 1px solid #e5e7eb !important;
            color: #0f172a !important;
            box-shadow: none !important;
          }

          .mobile-menu-group button span:first-child {
            width: 34px !important;
            height: 34px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 12px !important;
            background: #f0fdfa !important;
          }

          .dashboard-title-row,
          .summary-grid,
          .agenda-card-polished,
          .filters-desktop,
          .result-summary,
          .content-block,
          .dashboard-notes-card {
            width: 100% !important;
            max-width: 100% !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            box-sizing: border-box !important;
          }

          .summary-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }

          .summary-grid > div,
          .agenda-card-polished,
          .result-summary,
          .content-block,
          .dashboard-notes-card {
            border-radius: 18px !important;
          }

          .agenda-card-polished,
          .filters-desktop {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          .agenda-compact-items,
          .export-actions,
          .account-actions,
          .notes-list-dashboard .account-actions {
            display: flex !important;
            gap: 8px !important;
            flex-wrap: wrap !important;
          }

          .advanced-filters {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .dashboard-notes-card {
            padding: 14px !important;
            overflow: visible !important;
          }

          .notes-header-clean {
            align-items: flex-start !important;
            gap: 12px !important;
          }

          .notes-list-dashboard {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .global-fab {
            right: 18px !important;
            bottom: max(20px, env(safe-area-inset-bottom)) !important;
            width: 50px !important;
            height: 50px !important;
            border-radius: 18px !important;
            font-size: 26px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            border: 1px solid #e5e7eb !important;
            box-shadow: 0 12px 30px rgba(15,23,42,.16) !important;
            z-index: 5000 !important;
          }

          .global-fab-menu {
            right: 18px !important;
            bottom: calc(76px + env(safe-area-inset-bottom)) !important;
            z-index: 5001 !important;
          }

          .global-fab-menu button {
            background: #ffffff !important;
            color: #0f172a !important;
            border: 1px solid #e5e7eb !important;
            box-shadow: 0 10px 26px rgba(15,23,42,.14) !important;
          }

          .content-block {
            padding-bottom: 84px !important;
          }
        }



        /* HOTFIX VALIDACAO: contas em aberto, PDF, FAB global e menu mobile */
        .dashboard-section-header-accounts {
          display:flex !important;
          align-items:flex-start !important;
          justify-content:space-between !important;
          gap:12px !important;
          flex-wrap:wrap !important;
        }
        .dashboard-section-title-wrap {
          display:grid !important;
          gap:4px !important;
          min-width:0 !important;
          flex:1 1 190px !important;
        }
        .dashboard-section-actions {
          display:flex !important;
          align-items:center !important;
          justify-content:flex-end !important;
          gap:8px !important;
          flex:0 0 auto !important;
        }
        .dashboard-see-all-link {
          border:1px solid #d1d5db !important;
          background:#fff !important;
          color:#374151 !important;
          border-radius:999px !important;
          padding:7px 11px !important;
          font-size:12px !important;
          font-weight:900 !important;
          min-height:34px !important;
          box-shadow:none !important;
          white-space:nowrap !important;
        }
        .dashboard-open-accounts.accounts-collapsed {
          padding-bottom:16px !important;
        }
        .mobile-menu-trigger {
          display:inline-flex !important;
          align-items:center !important;
          justify-content:center !important;
          line-height:1 !important;
          padding:0 !important;
        }
        .mobile-menu-panel {
          overscroll-behavior: contain !important;
          -webkit-overflow-scrolling: touch !important;
          touch-action: pan-y !important;
        }
        .mobile-menu-panel * {
          touch-action: pan-y !important;
        }
        @media (max-width: 979px) {
          .page-title-actions {
            margin-top: 10px !important;
          }
          .dashboard-section-header-accounts {
            align-items:center !important;
          }
          .dashboard-section-actions {
            margin-left:auto !important;
          }
          .dashboard-see-all-link {
            padding:6px 10px !important;
            font-size:12px !important;
          }
          .note-toggle-small {
            min-width:42px !important;
            width:42px !important;
            height:42px !important;
            padding:0 !important;
            display:inline-flex !important;
            align-items:center !important;
            justify-content:center !important;
            border-radius:999px !important;
          }
        }


        /* PADRONIZACAO FINAL: links de ver paginas, busca ampla e status visual */
        .dashboard-notes-card .dashboard-section-actions,
        .notes-header-actions {
          display:flex !important;
          align-items:center !important;
          justify-content:flex-end !important;
          gap:8px !important;
          flex:0 0 auto !important;
        }
        .dashboard-open-list {
          display:grid !important;
          gap:10px !important;
        }
        .dashboard-account-row {
          border:1px solid #e5e7eb !important;
          border-left:5px solid #f59e0b !important;
          background:#fffbeb !important;
          border-radius:18px !important;
          padding:14px !important;
          display:flex !important;
          align-items:center !important;
          justify-content:space-between !important;
          gap:12px !important;
        }
        .dashboard-account-row.account-row-vencido {
          border-left-color:#ef4444 !important;
          background:#fff1f2 !important;
        }
        .dashboard-account-row.account-row-pendente {
          border-left-color:#f59e0b !important;
          background:#fffbeb !important;
        }
        .dashboard-account-row > div:first-child {
          display:grid !important;
          gap:4px !important;
          min-width:0 !important;
        }
        .dashboard-account-row > div:first-child small {
          color:#64748b !important;
          font-weight:700 !important;
        }
        .dashboard-account-row-actions {
          display:flex !important;
          align-items:center !important;
          justify-content:flex-end !important;
          gap:8px !important;
          flex-wrap:wrap !important;
        }
        .dashboard-account-row-actions > span:first-child {
          font-size:18px !important;
          font-weight:900 !important;
          color:#0f172a !important;
        }
        .status-pill.status-pendente {
          background:#fef3c7 !important;
          color:#92400e !important;
        }
        .status-pill.status-vencido {
          background:#fee2e2 !important;
          color:#991b1b !important;
        }
        .status-pill.status-pago {
          background:#dcfce7 !important;
          color:#166534 !important;
        }
        @media (max-width: 979px) {
          .dashboard-account-row {
            align-items:flex-start !important;
            flex-direction:column !important;
          }
          .dashboard-account-row-actions {
            width:100% !important;
            justify-content:flex-start !important;
          }
          .dashboard-section-header,
          .notes-header-clean {
            gap:10px !important;
          }
          .dashboard-see-all-link {
            min-width:auto !important;
          }
        }

        /* Identidade visual única para botões do produto */
        .filter-toggle-button,
        .export-actions button,
        .account-actions button,
        .notes-list-dashboard button,
        .notes-page-section button,
        .users-page-section button,
        .btn-back-page,
        .agenda-card-polished button,
        .notes-see-all,
        .note-toggle-small {
          border-radius: 999px !important;
          padding: 8px 12px !important;
          min-height: 36px !important;
          font-size: 13px !important;
          font-weight: 800 !important;
          border: 1px solid #d1d5db !important;
          background: #ffffff !important;
          color: #374151 !important;
          box-shadow: none !important;
        }

        .account-actions button:hover,
        .notes-list-dashboard button:hover,
        .export-actions button:hover,
        .filter-toggle-button:hover,
        .notes-see-all:hover,
        .note-toggle-small:hover {
          background: #f8fafc !important;
          border-color: #94a3b8 !important;
          color: #0f172a !important;
        }

        .account-actions button:first-child,
        .notes-list-dashboard button:first-child,
        .agenda-card-polished button {
          border-color: #99f6e4 !important;
          background: #f0fdfa !important;
          color: #0f766e !important;
        }

        .account-actions button:last-child,
        .notes-list-dashboard button:last-child,
        .users-page-section button[title*="Remover"] {
          border-color: #fecaca !important;
          background: #fff1f2 !important;
          color: #be123c !important;
        }

        /* FECHAMENTO MOBILE: alinhamentos, header, chips e menu */
        .top-shell-clean {
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          box-shadow: 0 6px 18px rgba(15,23,42,.06) !important;
        }
        .top-shell-logo span {
          display: grid !important;
          gap: 1px !important;
          line-height: 1.1 !important;
        }
        .top-shell-logo strong {
          display: block !important;
          white-space: normal !important;
          font-size: 15px !important;
        }
        .top-shell-logo small {
          display: block !important;
          font-size: 12px !important;
          color: #64748b !important;
          font-weight: 700 !important;
        }
        .dashboard-open-accounts.content-block,
        .dashboard-notes-card {
          padding: 16px !important;
          border-radius: 20px !important;
          overflow: visible !important;
        }
        .dashboard-section-header-accounts,
        .notes-header-clean {
          display: flex !important;
          align-items: flex-start !important;
          justify-content: space-between !important;
          gap: 12px !important;
        }
        .dashboard-section-title-wrap,
        .notes-title-wrap {
          padding-top: 2px !important;
          min-width: 0 !important;
          flex: 1 1 auto !important;
        }
        .dashboard-section-title-wrap strong,
        .notes-title {
          display: block !important;
          line-height: 1.25 !important;
          margin-bottom: 4px !important;
        }
        .dashboard-section-actions,
        .notes-header-actions {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 8px !important;
          margin-top: 0 !important;
        }
        .dashboard-see-all-link,
        .note-toggle-small {
          height: 36px !important;
          min-height: 36px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .note-toggle-small {
          width: 36px !important;
          min-width: 36px !important;
          padding: 0 !important;
          font-size: 18px !important;
          line-height: 1 !important;
        }
        .notes-stats-row,
        .notes-page-stats {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 6px !important;
        }
        .note-stat {
          background: #f8fafc !important;
          border: 1px solid #e5e7eb !important;
          color: #475569 !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          padding: 4px 8px !important;
          border-radius: 999px !important;
        }
        .note-stat-critico { border-color: #fecaca !important; color: #991b1b !important; background: #fff7f7 !important; }
        .note-stat-urgente { border-color: #fde68a !important; color: #92400e !important; background: #fffbeb !important; }
        .mobile-menu-trigger {
          background: #ffffff !important;
          color: #0f766e !important;
          border: 1px solid #d8eee9 !important;
          box-shadow: 0 6px 16px rgba(15,23,42,.08) !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0 !important;
          line-height: 1 !important;
        }
        .mobile-menu-panel {
          max-height: calc(100dvh - 104px) !important;
          overflow-y: auto !important;
          overscroll-behavior: contain !important;
          -webkit-overflow-scrolling: touch !important;
          touch-action: auto !important;
        }
        .mobile-menu-panel * { touch-action: auto !important; }
        @media (max-width: 979px) {
          .app-frame-content,
          .app-page { padding-bottom: 92px !important; }
          .dashboard-section-header-accounts,
          .notes-header-clean { align-items: flex-start !important; }
        }
      `}</style>

      <DashboardHome
        styles={styles}
        formatarValor={formatarValor}
        total={total}
        pago={pago}
        pendente={pendente}
        vencido={vencido}
        contas={contas}
        diferencaDias={diferencaDias}
        navegarPara={navegarPara}
        contasAbertasDashboard={contasAbertasDashboard}
        mostrarContasDashboard={mostrarContasDashboard}
        setMostrarContasDashboard={setMostrarContasDashboard}
        busca={busca}
        setBusca={setBusca}
        estaVencida={estaVencida}
        formatarData={formatarData}
        abrirConfirmacao={abrirConfirmacao}
        marcarComoPago={marcarComoPago}
        notasPendentes={notasPendentes}
        notasCriticas={notasCriticas}
        notasUrgentes={notasUrgentes}
        mostrarNotas={mostrarNotas}
        setMostrarNotas={setMostrarNotas}
        alternarNotaConcluida={alternarNotaConcluida}
        abrirEdicaoNota={abrirEdicaoNota}
        excluirNota={excluirNota}
      />

      {/* Lista de contas movida para a tela Financeiro > Contas. */}


      {renderModaisGlobais()}

      {toast.visivel && (
        <div
          className={`app-toast app-toast-${toast.tipo}`}
          role="status"
          onClick={() => setToast({ visivel: false, mensagem: '', tipo: 'info' })}
        >
          <strong>{toast.tipo === 'erro' ? 'Atenção' : 'Aviso'}</strong>
          <span>{toast.mensagem}</span>
        </div>
      )}

      <ConfirmModal
        styles={styles}
        confirmacao={confirmacao}
        fecharConfirmacao={fecharConfirmacao}
        executarConfirmacao={executarConfirmacao}
      />
    </div>
  )
}

// =========================
// BLOCO 12 — STYLES
// =========================
const styles = {
  usuarioTopo: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
    border: '1px solid #d8eee9',
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 10px 24px rgba(15,118,110,0.10)',
    position: 'relative',
    zIndex: 20
  },
  logoMarca: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'transparent',
    border: 'none',
    padding: 0,
    textAlign: 'left',
    color: '#064e3b'
  },
  logoIcone: {
    width: 42,
    height: 42,
    borderRadius: 14,
    background: '#e8f5ee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    boxShadow: 'inset 0 0 0 1px #cfe8da'
  },
  logoImagem: {
    width: 48,
    height: 48,
    borderRadius: 16,
    objectFit: 'cover',
    background: '#0f766e',
    boxShadow: '0 8px 18px rgba(20,184,166,0.28)'
  },
  logoTexto: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    lineHeight: 1.05
  },
  usuarioAcoes: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  usuarioTexto: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    fontSize: 13,
    color: '#1f2937'
  },
  btnMenuTopo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: 22,
    fontWeight: 'bold',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(15,23,42,0.08)'
  },
  menuBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.22)',
    zIndex: 4000,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: '76px 12px 12px 12px'
  },
  menuNavegacao: {
    width: 'min(360px, 94vw)',
    height: 'auto',
    maxHeight: 'calc(100dvh - 96px)',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    overscrollBehavior: 'contain',
    touchAction: 'pan-y',
    background: '#ffffff',
    border: '1px solid #d8eee9',
    borderRadius: 22,
    padding: 14,
    display: 'grid',
    gap: 8,
    boxShadow: '0 24px 60px rgba(15,23,42,0.25)'
  },
  menuPerfil: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    background: 'linear-gradient(135deg, #ecfdf5, #f0fdfa)',
    color: '#064e3b',
    marginBottom: 4
  },
  menuPerfilIcone: {
    width: 46,
    height: 46,
    borderRadius: 16,
    objectFit: 'cover',
    background: '#0f766e'
  },
  menuSecaoTitulo: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 800,
    color: '#6b7280',
    padding: '10px 8px 2px'
  },
  menuNavItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textAlign: 'left',
    background: '#f8faf9',
    border: '1px solid #edf1ef',
    borderRadius: 16,
    padding: '12px 14px',
    fontSize: 15,
    color: '#064e3b'
  },
  menuSairItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textAlign: 'left',
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    borderRadius: 16,
    padding: '12px 14px',
    fontSize: 15,
    color: '#be123c',
    fontWeight: 700
  },
  agendaResumoCard: {
    background: '#ffffff',
    border: '1px solid #dfe7e2',
    borderLeft: '5px solid #14b8a6',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    display: 'grid',
    gap: 10
  },
  agendaResumoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 6,
    fontSize: 12,
    color: '#374151'
  },
  btnAgendaCompleta: {
    border: 'none',
    borderRadius: 10,
    background: '#14b8a6',
    color: '#fff',
    padding: '10px 12px',
    fontWeight: 'bold'
  },
  uploadExcelBox: {
    border: '2px dashed #99f6e4',
    background: '#f0fdfa',
    borderRadius: 16,
    padding: 24,
    textAlign: 'center',
    display: 'grid',
    gap: 6,
    color: '#0f766e',
    cursor: 'pointer'
  },
  importDicasGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    margin: '12px 0'
  },
  previewImportacao: {
    display: 'grid',
    gap: 8,
    marginBottom: 12
  },
  previewLinha: {
    background: '#f8fafc',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 10,
    display: 'grid',
    gap: 4
  },
  alertaSucesso: {
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#047857',
    borderRadius: 12,
    padding: 10,
    fontWeight: 'bold'
  },
  btnSair: {
    background: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    fontWeight: 'bold'
  },
  overlayConfirmacao: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    zIndex: 3000
  },
  modalConfirmacao: {
    background: '#fff',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    maxWidth: 360,
    boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
    textAlign: 'center'
  },
  confirmacaoIcone: {
    fontSize: 38,
    marginBottom: 8
  },
  confirmacaoTitulo: {
    margin: '4px 0 8px',
    fontSize: 20
  },
  confirmacaoTexto: {
    margin: '0 0 16px',
    color: '#444',
    lineHeight: 1.4
  },
  confirmacaoAcoes: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10
  },
  btnConfirmarCancelar: {
    border: 'none',
    borderRadius: 10,
    padding: 11,
    background: '#6c757d',
    color: '#fff',
    fontWeight: 'bold'
  },
  btnConfirmarAcao: {
    border: 'none',
    borderRadius: 10,
    padding: 11,
    color: '#fff',
    fontWeight: 'bold'
  },
  headerExpansivel: {
    width: '100%',
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: 14,
    padding: '12px 14px',
    margin: '12px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  page: {
    padding: 16,
    maxWidth: 700,
    margin: 'auto',
    fontFamily: 'Arial',
    background: '#f8fafc',
    minHeight: '100vh',
    paddingBottom: 100
  },
  titulo: { fontSize: 28, marginBottom: 12 },
  subtitulo: { fontSize: 22, marginBottom: 12 },
  bloco: { marginTop: 24 },
  resumo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 12
  },
  boxTotal: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  boxPago: {
    background: '#d4edda',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column'
  },
  boxPendente: {
    background: '#fff3cd',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column'
  },
  boxVencido: {
    background: '#f8d7da',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column'
  },
  filtrosBox: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  input: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ccc',
    marginBottom: 8,
    boxSizing: 'border-box'
  },
  datas: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8
  },
  filtros: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8
  },
  filtro: {
    border: '1px solid #ccc',
    background: '#fff',
    padding: '7px 11px',
    borderRadius: 10,
    fontWeight: 800,
    cursor: 'pointer'
  },
  filtroAtivo: {
    border: 'none',
    background: '#0d6efd',
    color: '#fff',
    padding: '7px 11px',
    borderRadius: 8
  },
  resumoFiltro: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 14
  },
  cardConta: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  cardTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 18,
    marginBottom: 4
  },
  cardInfo: {
    fontSize: 13,
    opacity: 0.75
  },
  cardDashboard: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 5,
    marginTop: 6,
    fontSize: 13
  },
  cardConfiguracao: {
    background: '#fff',
    padding: 14,
    borderRadius: 14,
    marginTop: 14,
    marginBottom: 10,
    border: '1px solid #ddd',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  switchLinha: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid #eee'
  },
  configResumo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    fontSize: 13,
    background: '#f8fafc',
    padding: 10,
    borderRadius: 10
  },
  cardAgenda: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginTop: 14,
    marginBottom: 10,
    border: '1px solid #ddd',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  itemAgenda: {
    background: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center'
  },
  agendaDireita: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6
  },
  textoAgenda: {
    display: 'block',
    marginTop: 5,
    color: '#444',
    fontWeight: 'bold'
  },
  textoVencidoAgenda: {
    display: 'block',
    marginTop: 5,
    color: '#dc3545',
    fontWeight: 'bold'
  },
  cardLixeira: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    border: '1px solid #ddd',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  textoQuarentena: {
    display: 'block',
    marginTop: 8,
    color: '#64748b',
    fontWeight: 700
  },
  textoLiberado: {
    display: 'block',
    marginTop: 8,
    color: '#64748b',
    fontWeight: 700
  },
  cardNota: {
    background: '#eef2ff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  textoNota: {
    fontSize: 14,
    whiteSpace: 'pre-wrap'
  },
  acoes: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 8
  },
  mensagemVazia: {
    fontSize: 13,
    opacity: 0.7
  },
  btnPago: {
    minHeight: 38,
    minWidth: 74,
    background: '#0f766e',
    color: '#fff',
    border: '1px solid #0f766e',
    padding: '8px 12px',
    borderRadius: 10,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnVoltar: {
    minHeight: 38,
    minWidth: 74,
    background: '#f8fafc',
    color: '#475569',
    border: '1px solid #cbd5e1',
    padding: '8px 12px',
    borderRadius: 10,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnEditar: {
    minHeight: 38,
    minWidth: 74,
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fcd34d',
    padding: '8px 12px',
    borderRadius: 10,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnExcluir: {
    minHeight: 38,
    minWidth: 74,
    background: '#fff1f2',
    color: '#e11d48',
    border: '1px solid #fecdd3',
    padding: '8px 12px',
    borderRadius: 10,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnSecundario: {
    background: '#f8fafc',
    color: '#0f766e',
    border: '1px solid #99f6e4',
    padding: '6px 10px',
    borderRadius: 8,
    fontWeight: 800,
    cursor: 'pointer'
  },
  btnCinza: {
    background: '#64748b',
    color: '#fff',
    border: 'none',
    padding: '7px 10px',
    borderRadius: 8
  },
  btnRoxo: {
    background: '#6f42c1',
    color: '#fff',
    border: 'none',
    padding: '7px 10px',
    borderRadius: 8
  },
  btnVerde: {
    background: '#14b8a6',
    color: '#fff',
    border: 'none',
    padding: '7px 10px',
    borderRadius: 8
  },
  fab: {
    position: 'fixed',
    right: 20,
    bottom: 20,
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: '#ffffff',
    color: '#0f172a',
    border: '1px solid #e5e7eb',
    fontSize: 28,
    lineHeight: 1,
    boxShadow: '0 12px 28px rgba(15,23,42,0.16)',
    zIndex: 3000,
    cursor: 'pointer'
  },
  menuFab: {
    position: 'fixed',
    right: 20,
    bottom: 86,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 3001
  },
  menuItem: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: '0 14px',
    minWidth: 190,
    width: 190,
    height: 48,
    fontSize: 14,
    fontWeight: 800,
    boxShadow: '0 10px 24px rgba(15,23,42,0.14)',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'visible',
    cursor: 'pointer'
  },
  menuItemIcone: {
    display: 'inline-flex',
    width: 26,
    minWidth: 26,
    justifyContent: 'center',
    fontSize: 18,
    lineHeight: 1
  },
  menuItemTexto: {
    display: 'inline-block',
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 999
  },
  blocoNotificacaoConta: {
    background: '#f8fafc',
    border: '1px solid #e5e5e5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10
  },
  blocoRecorrenciaConta: {
    background: '#f0fdfa',
    border: '1px solid #99f6e4',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10
  },
  switchLinhaCompacta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #e5e5e5',
    fontSize: 14
  },
  textoAjuda: {
    display: 'block',
    color: '#666',
    fontSize: 11,
    marginTop: 4
  },
  notificacaoChips: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 6
  },
  chipNotif: {
    background: '#eef6ff',
    color: '#0d6efd',
    border: '1px solid #b6d4fe',
    borderRadius: 999,
    padding: '3px 7px',
    fontSize: 11,
    fontWeight: 'bold'
  },
  modal: {
    background: '#fff',
    padding: 18,
    borderRadius: 14,
    width: '100%',
    maxWidth: 360
  },
  inputModal: {
    width: '100%',
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    border: '1px solid #ccc',
    boxSizing: 'border-box'
  },
  textareaModal: {
    width: '100%',
    minHeight: 110,
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    fontFamily: 'Arial'
  },
  btnGhostAction: {
    width: 'auto',
    background: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '7px 12px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    marginBottom: 0
  },
  btnSalvar: {
    width: '100%',
    padding: 10,
    border: 'none',
    borderRadius: 8,
    background: '#14b8a6',
    color: '#fff',
    marginBottom: 8
  },
  btnCancelar: {
    width: '100%',
    padding: 10,
    border: 'none',
    borderRadius: 8,
    background: '#6c757d',
    color: '#fff'
  },
  itemCentro: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f1f1f1',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    fontSize: 13
  },
  btnMiniExcluir: {
    background: '#fee2e2',
    color: '#ef4444',
    border: '1px solid #f87171',
    borderRadius: 999,
    padding: '8px 10px',
    fontSize: 11
  },
  notasHeaderNovo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10
  },
  btnMiniVerde: {
    background: '#0f766e',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '6px 11px',
    fontWeight: '900',
    fontSize: 18,
    lineHeight: 1
  },
  notasListaNova: {
    display: 'grid',
    gap: 10
  },
  cardNotaAcao: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    border: '1px solid #e5e7eb',
    boxShadow: '0 8px 20px rgba(15,23,42,0.06)'
  },
  cardNotaNormal: {
    background: '#f8fafc',
    borderColor: '#e5e7eb'
  },
  cardNotaUrgente: {
    background: '#fffbeb',
    borderColor: '#fde68a'
  },
  cardNotaCritico: {
    background: '#fff7f7',
    borderColor: '#fecaca'
  },
  badgePrioridade: {
    borderRadius: 999,
    padding: '4px 8px',
    fontSize: 12,
    fontWeight: '900'
  },
  badgeNormal: {
    background: '#f1f5f9',
    color: '#475569'
  },
  badgeUrgente: {
    background: '#fffbeb',
    color: '#92400e',
    border: '1px solid #fde68a'
  },
  badgeCritico: {
    background: '#fff7f7',
    color: '#991b1b',
    border: '1px solid #fecaca'
  }

}
