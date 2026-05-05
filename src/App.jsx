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
import './styles.css'

const SESSAO_STORAGE_KEY = 'df_sessao_segura'
const OITO_HORAS_MS = 8 * 60 * 60 * 1000
const QUINZE_MINUTOS_MS = 15 * 60 * 1000
const DOZE_MINUTOS_MS = 12 * 60 * 1000

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
  // =========================
  // BLOCO 0 — UTILITÁRIOS
  // =========================
  function primeiraLetraMaiuscula(texto) {
    if (!texto) return ''
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  function formatarValor(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarData(data) {
    if (!data) return '-'
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  function converterValor(valorDigitado) {
    return Number(String(valorDigitado).replace(',', '.'))
  }


  function formatarDataParaBanco(valor) {
    if (!valor) return null

    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return valor
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
      const [dia, mes, ano] = valor.split('/')
      return `${ano}-${mes}-${dia}`
    }

    return valor
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

  function dataLocal(data) {
    if (!data) return null
    const valor = String(data).slice(0, 10)
    return new Date(valor + 'T00:00:00')
  }

  function diferencaDias(data) {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const alvo = dataLocal(data)
    if (!alvo) return 999999

    const diff = alvo - hoje
    return Math.round(diff / (1000 * 60 * 60 * 24))
  }

  function mesmoMesAtual(data) {
    const alvo = dataLocal(data)
    if (!alvo) return false

    const hoje = new Date()
    return alvo.getMonth() === hoje.getMonth() && alvo.getFullYear() === hoje.getFullYear()
  }

  function montarDataRecorrente(ano, mes, dia) {
    const ultimoDiaMes = new Date(ano, mes, 0).getDate()
    const diaSeguro = Math.min(Number(dia || 1), ultimoDiaMes)
    return `${ano}-${String(mes).padStart(2, '0')}-${String(diaSeguro).padStart(2, '0')}`
  }

  function deveGerarRecorrenciaNoMes(recorrencia, ano, mes) {
    if (!recorrencia?.ativo) return false
    if ((recorrencia.tipo_recorrencia || 'mensal') !== 'mensal') return false

    const inicio = recorrencia.data_inicio ? dataLocal(recorrencia.data_inicio) : null
    if (!inicio) return true

    const primeiroDiaMes = new Date(ano, mes - 1, 1)
    const ultimoDiaMes = new Date(ano, mes, 0)

    return inicio <= ultimoDiaMes && primeiroDiaMes >= new Date(inicio.getFullYear(), inicio.getMonth(), 1)
  }

  // =========================
  // BLOCO 1 — STATES CONTAS
  // =========================
  const [contas, setContas] = useState([])
  const [contasLixeira, setContasLixeira] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [filtroCentro, setFiltroCentro] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalConta, setModalConta] = useState(false)
  const [editandoContaId, setEditandoContaId] = useState(null)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [centroCustoId, setCentroCustoId] = useState('')
  const [contaWhatsapp, setContaWhatsapp] = useState(false)
  const [contaEmail, setContaEmail] = useState(false)
  const [contaPush, setContaPush] = useState(false)
  const [contaDiasAviso, setContaDiasAviso] = useState('1')
  const [contaRecorrente, setContaRecorrente] = useState(false)
  const [tipoRecorrencia, setTipoRecorrencia] = useState('mensal')
  const [diaVencimentoRecorrencia, setDiaVencimentoRecorrencia] = useState('')

  // =========================
  // BLOCO 2 — STATES NOTAS
  // =========================
  const [notas, setNotas] = useState([])
  const [notasLixeira, setNotasLixeira] = useState([])
  const [buscaNota, setBuscaNota] = useState('')
  const [modalNota, setModalNota] = useState(false)
  const [editandoNotaId, setEditandoNotaId] = useState(null)
  const [tituloNota, setTituloNota] = useState('')
  const [conteudoNota, setConteudoNota] = useState('')
  const [prioridadeNota, setPrioridadeNota] = useState('normal')
  const [dataEventoNota, setDataEventoNota] = useState('')

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
  const [gruposMenu, setGruposMenu] = useState({ principal: true, financeiro: true, notas: true, analise: true, sistema: true })
  const [telaAtual, setTelaAtualState] = useState('contas')
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
  const [mostrarNotas, setMostrarNotas] = useState(true)
  const [mostrarConfigNegocio, setMostrarConfigNegocio] = useState(true)
  const [mostrarConfigNotificacoes, setMostrarConfigNotificacoes] = useState(true)
  const [mostrarConfigCentros, setMostrarConfigCentros] = useState(true)
  const [configuracoes, setConfiguracoes] = useState(null)
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true)
  const [configWhatsapp, setConfigWhatsapp] = useState(true)
  const [configEmail, setConfigEmail] = useState(true)
  const [configPush, setConfigPush] = useState(false)
  const [diasAvisoPadrao, setDiasAvisoPadrao] = useState('1')
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

  function limparEstadoAutenticacao() {
    setUsuarioLogado(null)
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
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        if (!ativo) return

        setUsuarioLogado(data.session?.user || null)
        if (!data.session) {
          limparEstadoAutenticacao()
        }
      } catch (error) {
        console.warn('Sessão inválida ou expirada:', error?.message || error)
        await supabase.auth.signOut()
        if (ativo) limparEstadoAutenticacao()
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
      limparSessaoSegura()
      await supabase.auth.signOut()
      limparEstadoAutenticacao()
      setCarregandoAuth(false)
      alert(mensagem)
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

      if (tempoInativo >= QUINZE_MINUTOS_MS) {
        encerrarPorSeguranca('Sua sessão foi encerrada por inatividade. Faça login novamente.')
        return
      }

      if (tempoInativo >= DOZE_MINUTOS_MS && !avisoSessaoMostradoRef.current) {
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
      const proximaTela = event.state?.tela || 'contas'
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
      alert(error.message)
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
      alert(error.message)
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
          alert(resultado.mensagem)
        } catch (error) {
          alert(error.message)
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
          alert(resultado.mensagem)
        } catch (error) {
          alert(error.message)
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
          alert(error.message)
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
          alert(error.message)
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
      alert(error.message)
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
      alert(error.message)
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
    if (!empresaAtual) return

    const { data, error } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome)')
      .eq('empresa_id', empresaAtual)
      .eq('excluido', false)
      .order('data_vencimento')

    if (error) {
      alert(error.message)
      return
    }

    const contasAtuais = data || []
    const contasComRecorrencias = await garantirContasRecorrentesDoMes(empresaAtual, contasAtuais)
    setContas(contasComRecorrencias)
  }

  async function garantirContasRecorrentesDoMes(empresaAtual, contasAtuais) {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = hoje.getMonth() + 1

    const { data: recorrentes, error } = await supabase
      .from('df_contas_recorrentes')
      .select('*')
      .eq('empresa_id', empresaAtual)
      .eq('ativo', true)

    if (error) {
      console.warn('Não foi possível carregar contas recorrentes:', error.message)
      return contasAtuais
    }

    const novasContas = []

    ;(recorrentes || []).forEach((recorrencia) => {
      if (!deveGerarRecorrenciaNoMes(recorrencia, ano, mes)) return

      const dataGerada = montarDataRecorrente(ano, mes, recorrencia.dia_vencimento)

      const jaExiste = contasAtuais.some((conta) =>
        String(conta.descricao || '').trim().toLowerCase() === String(recorrencia.descricao || '').trim().toLowerCase()
        && conta.data_vencimento === dataGerada
      )

      if (jaExiste) return

      novasContas.push({
        empresa_id: empresaAtual,
        descricao: recorrencia.descricao,
        valor: Number(recorrencia.valor || 0),
        data_vencimento: dataGerada,
        vencimento: dataGerada,
        centro_custo_id: recorrencia.centro_custo_id || null,
        status: 'pendente',
        excluido: false,
        enviar_whatsapp: recorrencia.enviar_whatsapp ?? false,
        enviar_email: recorrencia.enviar_email ?? false,
        enviar_push: recorrencia.enviar_push ?? false,
        dias_aviso: recorrencia.dias_aviso ?? 1
      })
    })

    if (novasContas.length === 0) return contasAtuais

    const { data: contasCriadas, error: erroInsert } = await supabase
      .from('df_contas')
      .insert(novasContas)
      .select('*, df_centros_custo(nome)')

    if (erroInsert) {
      console.warn('Não foi possível gerar contas recorrentes:', erroInsert.message)
      return contasAtuais
    }

    return [...contasAtuais, ...(contasCriadas || [])].sort((a, b) =>
      String(a.data_vencimento || '').localeCompare(String(b.data_vencimento || ''))
    )
  }

  async function buscarNotas(empresaAtual = empresaId) {
    if (!empresaAtual) return

    const { data, error } = await supabase
      .from('df_notas')
      .select('*')
      .eq('empresa_id', empresaAtual)
      .eq('excluido', false)
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setNotas(data || [])
  }



  async function buscarConfiguracoes(empresaAtual = empresaId) {
    if (!empresaAtual) return

    const { data, error } = await supabase
      .from('df_configuracoes')
      .select('*')
      .eq('empresa_id', empresaAtual)
      .limit(1)

    if (error) {
      alert(error.message)
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
      alert(erroInsert.message)
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
  }

  async function buscarLixeira(empresaAtual = empresaId) {
    if (!empresaAtual) return

    const { data: contasExcluidas, error: erroContas } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome)')
      .eq('empresa_id', empresaAtual)
      .eq('excluido', true)
      .order('excluido_em', { ascending: false })

    const { data: notasExcluidas, error: erroNotas } = await supabase
      .from('df_notas')
      .select('*')
      .eq('empresa_id', empresaAtual)
      .eq('excluido', true)
      .order('excluido_em', { ascending: false })

    if (erroContas) {
      alert(erroContas.message)
    }

    if (erroNotas) {
      alert(erroNotas.message)
    }

    setContasLixeira(contasExcluidas || [])
    setNotasLixeira(notasExcluidas || [])
  }

  async function buscarCentros(empresaAtual = empresaId) {
    if (!empresaAtual) return

    const { data, error } = await supabase
      .from('df_centros_custo')
      .select('*')
      .eq('empresa_id', empresaAtual)
      .order('nome')

    if (error) {
      alert(error.message)
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
    .filter((conta) =>
      String(conta.descricao || '').toLowerCase().includes(busca.toLowerCase())
    )

  const total = contasFiltradas.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const pago = contasFiltradas
    .filter((conta) => conta.status === 'pago')
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const vencido = contasFiltradas
    .filter((conta) => estaVencida(conta.data_vencimento, conta.status))
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const pendente = total - pago

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
    setMenuAberto(false)
    setMenuNavegacaoAberto(false)
    setEditandoContaId(null)
    setDescricao('')
    setValor('')
    setDataVencimento('')
    setCentroCustoId('')
    setContaWhatsapp(configWhatsapp)
    setContaEmail(configEmail)
    setContaPush(configPush)
    setContaDiasAviso(String(diasAvisoPadrao || 1))
    setContaRecorrente(false)
    setTipoRecorrencia('mensal')
    setDiaVencimentoRecorrencia('')
    setModalConta(true)
  }

  function abrirEdicaoConta(conta) {
    setEditandoContaId(conta.id)
    setDescricao(conta.descricao || '')
    setValor(conta.valor || '')
    setDataVencimento(conta.data_vencimento || '')
    setCentroCustoId(conta.centro_custo_id || '')
    setContaWhatsapp(conta.enviar_whatsapp ?? false)
    setContaEmail(conta.enviar_email ?? false)
    setContaPush(conta.enviar_push ?? false)
    setContaDiasAviso(String(conta.dias_aviso ?? diasAvisoPadrao ?? 1))
    setContaRecorrente(false)
    setTipoRecorrencia('mensal')
    setDiaVencimentoRecorrencia(conta.data_vencimento ? String(Number(conta.data_vencimento.slice(8, 10))) : '')
    setModalConta(true)
  }

  function fecharConta() {
    setModalConta(false)
    setEditandoContaId(null)
    setDescricao('')
    setValor('')
    setDataVencimento('')
    setCentroCustoId('')
    setContaWhatsapp(false)
    setContaEmail(false)
    setContaPush(false)
    setContaDiasAviso('1')
    setContaRecorrente(false)
    setTipoRecorrencia('mensal')
    setDiaVencimentoRecorrencia('')
  }

  async function salvarConta() {
    if (!empresaId) {
      alert('Usuário sem empresa vinculada.')
      return
    }

    if (!descricao || !valor || !dataVencimento) {
      alert('Preencha descrição, valor e vencimento')
      return
    }

    const diasAvisoConta = Number(contaDiasAviso)

    if (isNaN(diasAvisoConta) || diasAvisoConta < 0) {
      alert('Informe uma quantidade válida de dias de aviso.')
      return
    }

    const payload = {
      descricao: primeiraLetraMaiuscula(descricao.trim()),
      valor: converterValor(valor),
      data_vencimento: formatarDataParaBanco(dataVencimento),
      vencimento: formatarDataParaBanco(dataVencimento),
      centro_custo_id: centroCustoId || null,
      enviar_whatsapp: contaWhatsapp,
      enviar_email: contaEmail,
      enviar_push: contaPush,
      dias_aviso: diasAvisoConta,
      empresa_id: empresaId
    }

    let error

    if (editandoContaId) {
      const resposta = await supabase.from('df_contas').update(payload).eq('id', editandoContaId).eq('empresa_id', empresaId)
      error = resposta.error
    } else {
      const resposta = await supabase.from('df_contas').insert([{ ...payload, status: 'pendente', excluido: false }])
      error = resposta.error

      if (!error && contaRecorrente) {
        const dataBanco = formatarDataParaBanco(dataVencimento)
        const diaRecorrencia = Number(diaVencimentoRecorrencia || String(dataBanco).slice(8, 10))

        if (!diaRecorrencia || diaRecorrencia < 1 || diaRecorrencia > 31) {
          alert('Informe um dia válido para a recorrência.')
          return
        }

        const { error: erroRecorrencia } = await supabase
          .from('df_contas_recorrentes')
          .insert([{
            empresa_id: empresaId,
            descricao: primeiraLetraMaiuscula(descricao.trim()),
            valor: converterValor(valor),
            centro_custo_id: centroCustoId || null,
            tipo_recorrencia: tipoRecorrencia,
            dia_vencimento: diaRecorrencia,
            data_inicio: dataBanco,
            ativo: true,
            enviar_whatsapp: contaWhatsapp,
            enviar_email: contaEmail,
            enviar_push: contaPush,
            dias_aviso: diasAvisoConta
          }])

        if (erroRecorrencia) {
          alert('A conta foi criada, mas a recorrência não foi salva: ' + erroRecorrencia.message)
        }
      }
    }

    if (error) {
      alert(error.message)
      return
    }

    fecharConta()
    buscarContas()
  }

  async function marcarComoPago(id) {
    await supabase.from('df_contas').update({ status: 'pago' }).eq('id', id).eq('empresa_id', empresaId)
    buscarContas()
  }

  async function voltarParaPendente(id) {
    await supabase.from('df_contas').update({ status: 'pendente' }).eq('id', id).eq('empresa_id', empresaId)
    buscarContas()
  }

  async function excluirConta(id) {
    const { error } = await supabase
      .from('df_contas')
      .update({
        excluido: true,
        excluido_em: new Date().toISOString()
      })
      .eq('id', id)
      .eq('empresa_id', empresaId)

    if (error) {
      alert(error.message)
      return
    }

    buscarContas()
    buscarLixeira()
  }

  // =========================
  // BLOCO 8 — AÇÕES NOTAS
  // =========================
  function abrirNovaNota() {
    setMenuAberto(false)
    setMenuNavegacaoAberto(false)
    setEditandoNotaId(null)
    setTituloNota('')
    setConteudoNota('')
    setPrioridadeNota('normal')
    setDataEventoNota('')
    setModalNota(true)
  }

  function abrirEdicaoNota(nota) {
    setEditandoNotaId(nota.id)
    setTituloNota(nota.titulo || '')
    setConteudoNota(nota.conteudo || '')
    setPrioridadeNota(nota.prioridade || 'normal')
    setDataEventoNota(nota.data_evento || '')
    setModalNota(true)
  }

  function fecharNota() {
    setModalNota(false)
    setEditandoNotaId(null)
    setTituloNota('')
    setConteudoNota('')
    setPrioridadeNota('normal')
    setDataEventoNota('')
  }

  async function salvarNota() {
    if (!empresaId) {
      alert('Usuário sem empresa vinculada.')
      return
    }

    if (!tituloNota.trim()) {
      alert('Digite o título da nota')
      return
    }

    const payload = {
      titulo: primeiraLetraMaiuscula(tituloNota.trim()),
      conteudo: conteudoNota.trim(),
      prioridade: prioridadeNota || 'normal',
      data_evento: dataEventoNota || null,
      concluida: false,
      empresa_id: empresaId
    }

    let error

    if (editandoNotaId) {
      const resposta = await supabase.from('df_notas').update(payload).eq('id', editandoNotaId).eq('empresa_id', empresaId)
      error = resposta.error
    } else {
      const resposta = await supabase.from('df_notas').insert([payload])
      error = resposta.error
    }

    if (error) {
      alert(error.message)
      return
    }

    fecharNota()
    buscarNotas()
  }

  async function excluirNota(id) {
    const { error } = await supabase
      .from('df_notas')
      .update({
        excluido: true,
        excluido_em: new Date().toISOString()
      })
      .eq('id', id)
      .eq('empresa_id', empresaId)

    if (error) {
      alert(error.message)
      return
    }

    buscarNotas()
    buscarLixeira()
  }


  async function alternarNotaConcluida(nota) {
    const { error } = await supabase
      .from('df_notas')
      .update({ concluida: !nota.concluida })
      .eq('id', nota.id)
      .eq('empresa_id', empresaId)

    if (error) {
      alert(error.message)
      return
    }

    buscarNotas()
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

    if (isNaN(dias) || dias < 0) {
      alert('Informe uma quantidade válida de dias de aviso.')
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
      alert(resposta.error.message)
      return
    }

    const configSalva = Array.isArray(resposta.data) ? resposta.data[0] : resposta.data
    setConfiguracoes(configSalva)
    alert('Configurações salvas com sucesso!')
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
      alert(error.message)
      return
    }

    buscarContas()
    buscarLixeira()
  }

  async function restaurarNota(id) {
    const { error } = await supabase
      .from('df_notas')
      .update({
        excluido: false,
        excluido_em: null
      })
      .eq('id', id)
      .eq('empresa_id', empresaId)

    if (error) {
      alert(error.message)
      return
    }

    buscarNotas()
    buscarLixeira()
  }

  async function excluirContaDefinitivo(conta) {
    const { error } = await supabase
      .from('df_contas')
      .delete()
      .eq('id', conta.id)
      .eq('empresa_id', empresaId)

    if (error) {
      alert(error.message)
      return
    }

    buscarLixeira()
  }

  async function excluirNotaDefinitivo(nota) {
    const { error } = await supabase
      .from('df_notas')
      .delete()
      .eq('id', nota.id)
      .eq('empresa_id', empresaId)

    if (error) {
      alert(error.message)
      return
    }

    buscarLixeira()
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
      alert(error.message)
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
    window.print()
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
          alert(error.message)
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
      alert(error.message)
      return
    }

    setStatusImportacao(`${payload.length} conta(s) importada(s) com sucesso.`)
    setArquivoImportacao(null)
    setLinhasImportacao([])
    await carregarTudo(empresaId)
    navegarPara('contas')
  }

  async function sairDoSistema() {
    limparSessaoSegura()
    await supabase.auth.signOut()
    limparEstadoAutenticacao()
    setTelaAtualState('contas')
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
    navegarPara('contas')
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
          <div style={styles.overlay} onClick={() => { fecharConta(); fecharNota(); setModalCentro(false); setMenuAberto(false); setMenuNavegacaoAberto(false) }}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>{editandoContaId ? 'Editar Conta' : 'Nova Conta'}</h3>

              <input style={styles.inputModal} placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(primeiraLetraMaiuscula(e.target.value))} />
              <input style={styles.inputModal} placeholder="Valor. Ex: 150,90" value={valor} onChange={(e) => setValor(e.target.value)} />
              <input style={styles.inputModal} type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />

              <select style={styles.inputModal} value={centroCustoId} onChange={(e) => setCentroCustoId(e.target.value)}>
                <option value="">Centro de custo</option>
                {centros.map((centro) => (
                  <option key={centro.id} value={centro.id}>{centro.nome}</option>
                ))}
              </select>

              {!editandoContaId && (
                <div className="recurrence-box" style={styles.blocoRecorrenciaConta}>
                  <label className="checkbox-row-fix" style={styles.switchLinhaCompacta}>
                    <span>
                      <strong>🔁 Conta recorrente</strong>
                      <small style={styles.textoAjuda}>Ideal para aluguel, internet, sistema, mensalidades e contas fixas.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={contaRecorrente}
                      onChange={(e) => {
                        const marcado = e.target.checked
                        setContaRecorrente(marcado)
                        if (marcado && dataVencimento) {
                          setDiaVencimentoRecorrencia(String(Number(formatarDataParaBanco(dataVencimento).slice(8, 10))))
                        }
                      }}
                    />
                  </label>

                  {contaRecorrente && (
                    <div className="recurrence-fields">
                      <select style={styles.inputModal} value={tipoRecorrencia} onChange={(e) => setTipoRecorrencia(e.target.value)}>
                        <option value="mensal">Mensal</option>
                      </select>

                      <input
                        style={styles.inputModal}
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Dia de vencimento mensal. Ex: 5"
                        value={diaVencimentoRecorrencia || (dataVencimento ? String(Number(formatarDataParaBanco(dataVencimento).slice(8, 10))) : '')}
                        onChange={(e) => setDiaVencimentoRecorrencia(e.target.value)}
                      />

                      <small style={styles.textoAjuda}>
                        O sistema criará automaticamente essa conta no mês vigente quando ela ainda não existir.
                      </small>
                    </div>
                  )}
                </div>
              )}

              <div style={styles.blocoNotificacaoConta}>
                <strong>🔔 Notificações desta conta</strong>

                <label className="checkbox-row-fix" style={styles.switchLinhaCompacta}>
                  <span>WhatsApp</span>
                  <input type="checkbox" checked={contaWhatsapp} onChange={(e) => setContaWhatsapp(e.target.checked)} />
                </label>

                <label className="checkbox-row-fix" style={styles.switchLinhaCompacta}>
                  <span>E-mail</span>
                  <input type="checkbox" checked={contaEmail} onChange={(e) => setContaEmail(e.target.checked)} />
                </label>

                <label className="checkbox-row-fix" style={styles.switchLinhaCompacta}>
                  <span>Push mobile</span>
                  <input type="checkbox" checked={contaPush} onChange={(e) => setContaPush(e.target.checked)} />
                </label>

                <input style={styles.inputModal} type="number" min="0" placeholder="Dias antes do vencimento" value={contaDiasAviso} onChange={(e) => setContaDiasAviso(e.target.value)} />
                <small style={styles.textoAjuda}>Exemplo: 1 = avisar 1 dia antes. 0 = avisar no dia do vencimento.</small>
              </div>

              <button style={styles.btnSalvar} onClick={salvarConta}>Salvar</button>
              <button style={styles.btnCancelar} onClick={fecharConta}>Cancelar</button>
            </div>
          </div>
        )}

        {modalNota && (
          <div style={styles.overlay} onClick={() => { fecharConta(); fecharNota(); setModalCentro(false); setMenuAberto(false); setMenuNavegacaoAberto(false) }}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>{editandoNotaId ? 'Editar Nota' : 'Nova Nota'}</h3>
              <input style={styles.inputModal} placeholder="Título" value={tituloNota} onChange={(e) => setTituloNota(primeiraLetraMaiuscula(e.target.value))} />
              <select style={styles.inputModal} value={prioridadeNota} onChange={(e) => setPrioridadeNota(e.target.value)}>
                <option value="normal">Prioridade normal</option>
                <option value="urgente">Urgente</option>
                <option value="critico">Crítico</option>
              </select>
              <input style={styles.inputModal} type="date" value={dataEventoNota} onChange={(e) => setDataEventoNota(e.target.value)} />
              <textarea style={styles.textareaModal} placeholder="Conteúdo..." value={conteudoNota} onChange={(e) => setConteudoNota(e.target.value)} />
              <button style={styles.btnSalvar} onClick={salvarNota}>Salvar</button>
              <button style={styles.btnCancelar} onClick={fecharNota}>Cancelar</button>
            </div>
          </div>
        )}

        {modalCentro && (
          <div style={styles.overlay} onClick={() => { fecharConta(); fecharNota(); setModalCentro(false); setMenuAberto(false); setMenuNavegacaoAberto(false) }}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>Centros de Custo</h3>
              <input style={styles.inputModal} placeholder="Novo centro" value={novoCentro} onChange={(e) => setNovoCentro(e.target.value)} autoFocus />
              <button style={styles.btnSalvar} onClick={salvarCentro}>Salvar Centro</button>
              {centros.map((centro) => (
                <div key={centro.id} style={styles.itemCentro}>
                  <span>{centro.nome}</span>
                  <button style={styles.btnMiniExcluir} onClick={() => abrirConfirmacao({ titulo: 'Excluir centro de custo', mensagem: `Deseja excluir o centro ${centro.nome}?`, textoConfirmar: 'Excluir', tipo: 'perigo', acao: () => excluirCentro(centro.id) })}>excluir</button>
                </div>
              ))}
              <button style={styles.btnCancelar} onClick={() => setModalCentro(false)}>Fechar</button>
            </div>
          </div>
        )}
      </>
    )
  }


  function renderTopShell() {
    return (
      <section className="no-print top-shell top-shell-clean" style={styles.usuarioTopo}>
        <div className="top-shell-context">
          <button className="top-shell-logo" style={styles.logoMarca} onClick={() => navegarPara('contas')} title="Ir para o painel">
            <img src="/icon-192.png" alt="DF Gestão Financeira" style={styles.logoImagem} />
            <span>
              <strong>{nomeEmpresa || 'Dona Flor'}</strong>
              <small>Gestão Financeira</small>
            </span>
          </button>
        </div>

        <div className="top-shell-actions" style={styles.usuarioAcoes}>
          <button className="mobile-menu-trigger" style={styles.btnMenuTopo} onClick={() => setMenuNavegacaoAberto(!menuNavegacaoAberto)}>☰</button>
        </div>
      </section>
    )
  }

  function renderAppFrame(children) {
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

        `}</style>
      {renderTopShell()}

        {renderSidebar()}
        {renderMobileMenu()}

        <main className="app-frame-content">{children}</main>
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
      {renderTopShell()}

        {renderSidebar()}
        {renderMobileMenu()}

        <main className="app-frame-content">{children}</main>
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

  function renderSidebar() {
    return (
      <aside className={`desktop-sidebar no-print ${sidebarCompacta ? 'compacta' : ''}`}>
        <div className="desktop-sidebar-brand sidebar-brand-clean" title="DF Gestão Financeira">
          <img src="/icon-192.png" alt="DF Gestão Financeira" />
          {!sidebarCompacta && (
            <div>
              <strong>Menu</strong>
              <small>Navegação</small>
            </div>
          )}
        </div>

        <div className="desktop-sidebar-user sidebar-user-clean" title={`${nomeUsuario()} • ${normalizarPerfil(perfilUsuario || 'usuário')}`}>
          <span className="sidebar-user-avatar">{String(nomeUsuario() || 'U').slice(0, 1).toUpperCase()}</span>
          {!sidebarCompacta && (
            <div>
              <strong>{nomeUsuario()}</strong>
              <small>{normalizarPerfil(perfilUsuario || 'usuário')}</small>
            </div>
          )}
        </div>

        <button className="sidebar-collapse-btn sidebar-collapse-icon" onClick={() => setSidebarCompacta(!sidebarCompacta)} title={sidebarCompacta ? 'Expandir menu' : 'Recolher menu'}>
          <span>{sidebarCompacta ? '›' : '‹'}</span>
          {!sidebarCompacta && <small>Recolher menu</small>}
        </button>

        <div className="desktop-sidebar-scroll">
          <GrupoMenu id="principal" titulo="Principal">
            <ItemMenu tela="contas" icon="🏠" label="Painel" />
            <ItemMenu tela="agenda" icon="📅" label="Agenda" />
            <ItemMenu tela="notas" icon="📝" label="Bloco de Notas" />
            <ItemMenu icon="➕" label="Nova nota" onClick={abrirNovaNota} />
          </GrupoMenu>

          <GrupoMenu id="financeiro" titulo="Financeiro">
            <ItemMenu icon="💰" label="Nova conta" onClick={abrirNovaConta} />
            <ItemMenu tela="importar" icon="📥" label="Importar CSV" />
          </GrupoMenu>


          <GrupoMenu id="analise" titulo="Análise">
            <ItemMenu tela="relatorios" icon="📊" label="Relatórios" />
          </GrupoMenu>

          <GrupoMenu id="sistema" titulo="Sistema">
            <ItemMenu tela="usuarios" icon="👥" label="Usuários" onClick={() => navegarPara('usuarios')} />
            <ItemMenu tela="configuracoes" icon="⚙️" label="Configurações" />
            <ItemMenu tela="lixeira" icon="🗑️" label="Lixeira" />
          </GrupoMenu>
        </div>

        <div className="desktop-sidebar-spacer" />
        <nav className="desktop-sidebar-nav sidebar-exit">
          <button onClick={sairDoSistema} title="Sair"><span className="menu-icon">🚪</span>{!sidebarCompacta && <span>Sair</span>}</button>
        </nav>
      </aside>
    )
  }

  function renderMobileMenu() {
    if (!menuNavegacaoAberto) return null
    const item = (icon, titulo, desc, acao) => (
      <button style={styles.menuNavItem} onClick={acao}>
        <span>{icon}</span>
        <div><strong>{titulo}</strong><small>{desc}</small></div>
      </button>
    )

    return (
      <div className="no-print" style={styles.menuBackdrop} onClick={() => setMenuNavegacaoAberto(false)}>
        <div className="mobile-menu-panel" style={styles.menuNavegacao} onClick={(e) => e.stopPropagation()}>
          <div style={styles.menuPerfil}>
            <img src="/icon-192.png" alt="DF Gestão Financeira" style={styles.menuPerfilIcone} />
            <div><strong>{nomeUsuario()}</strong><small>{normalizarPerfil(perfilUsuario || 'usuário')}</small></div>
          </div>

          <details className="mobile-menu-group" open>
            <summary>Principal</summary>
            {item('🏠', 'Dashboard', 'Resumo financeiro', () => navegarPara('contas'))}
            {item('📅', 'Agenda', 'Vencimentos e previsões', () => navegarPara('agenda'))}
            {item('📝', 'Bloco de Notas', 'Pendências e histórico de notas', () => navegarPara('notas'))}
            {item('➕', 'Nova nota', 'Criar lembrete rápido', abrirNovaNota)}
          </details>

          <details className="mobile-menu-group" open>
            <summary>Financeiro</summary>
            {item('💰', 'Nova conta', 'Cadastrar pagamento', abrirNovaConta)}
            {item('📥', 'Importar CSV', 'Trazer histórico do Excel', () => navegarPara('importar'))}
          </details>


          <details className="mobile-menu-group">
            <summary>Análise</summary>
            {item('📊', 'Relatórios PRO+', 'Análises e indicadores', () => navegarPara('relatorios'))}
          </details>

          <details className="mobile-menu-group">
            <summary>Sistema</summary>
            {item('👥', 'Gestão de usuários', 'Perfis, acessos e senhas', () => navegarPara('usuarios'))}
            {item('⚙️', 'Configurações', 'Preferências da empresa', () => navegarPara('configuracoes'))}
            {item('🗑️', 'Lixeira', 'Restaurar ou excluir definitivo', () => navegarPara('lixeira'))}
            <button style={styles.menuSairItem} onClick={sairDoSistema}><span>🚪</span><div><strong>Sair</strong><small>Encerrar sessão</small></div></button>
          </details>
        </div>
      </div>
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

  if (erroEmpresa) {
    return (
      <div style={styles.page}>
        <h2>⚠️ Empresa não vinculada</h2>
        <p>{erroEmpresa}</p>
        <button style={styles.btnSair} onClick={sairDoSistema}>Sair</button>
      </div>
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
            <button style={styles.btnCinza} onClick={() => navegarPara('contas')}>← Painel</button>
            <button style={styles.btnSalvar} onClick={abrirNovaNota}>+ Nova nota</button>
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
                <div key={nota.id} style={{ ...styles.cardNotaAcao, ...(prioridade === 'critico' ? styles.cardNotaCritico : prioridade === 'urgente' ? styles.cardNotaUrgente : styles.cardNotaNormal), opacity: nota.concluida ? 0.65 : 1 }}>
                  <div style={styles.cardTopo}>
                    <strong style={{ textDecoration: nota.concluida ? 'line-through' : 'none' }}>{nota.titulo}</strong>
                    <span style={{ ...styles.badgePrioridade, ...(prioridade === 'critico' ? styles.badgeCritico : prioridade === 'urgente' ? styles.badgeUrgente : styles.badgeNormal) }}>
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

        <button style={styles.btnCinza} onClick={() => navegarPara('contas')}>
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

        <button style={styles.btnCinza} onClick={() => navegarPara('contas')}>
          ← Voltar
        </button>

        <section style={styles.cardConfiguracao} className="users-page-section">
          <h2 style={styles.subtitulo}>Minha conta</h2>
          <p style={styles.textoNota}>
            Usuário conectado: <strong>{usuarioAtualEmail}</strong> • Perfil: <strong>{normalizarPerfil(perfilUsuario)}</strong>
          </p>

          <div className="users-account-grid">
            <div className="users-form-card">
              <strong>Alterar e-mail</strong>
              <input
                style={styles.input}
                type="email"
                placeholder="Novo e-mail"
                value={novoEmailUsuario}
                onChange={(e) => setNovoEmailUsuario(e.target.value)}
              />
              <button style={styles.btnSalvar} onClick={salvarMeuEmail}>Atualizar e-mail</button>
              <small style={styles.textoAjuda}>Pode ser necessário confirmar o novo e-mail.</small>
            </div>

            <div className="users-form-card">
              <strong>Alterar senha</strong>
              <input
                style={styles.input}
                type="password"
                placeholder="Nova senha"
                value={novaSenhaUsuario}
                onChange={(e) => setNovaSenhaUsuario(e.target.value)}
              />
              <input
                style={styles.input}
                type="password"
                placeholder="Confirmar nova senha"
                value={confirmarNovaSenhaUsuario}
                onChange={(e) => setConfirmarNovaSenhaUsuario(e.target.value)}
              />
              <button style={styles.btnSalvar} onClick={salvarMinhaSenha}>Atualizar senha</button>
            </div>
          </div>
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
                onChange={(e) => setNomeConviteUsuario(e.target.value)}
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
                <div key={usuario.id || usuario.user_id || usuario.email} className="user-card">
                  <div className="user-main-info">
                    <strong>{usuario.nome || usuario.email || 'Usuário sem nome'}</strong>
                    <small>{usuario.email || usuario.user_id || 'Sem e-mail vinculado'}</small>
                    {atual && <span className="user-badge user-badge-self">Você</span>}
                    {pendente && <span className="user-badge user-badge-pending">Pendente de vínculo</span>}
                  </div>

                  <select
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

        <button style={styles.btnCinza} onClick={() => navegarPara('contas')}>
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
                  <small>Controle geral dos disparos automáticos.</small>
                </div>

                <input
                  type="checkbox"
                  checked={notificacoesAtivas}
                  onChange={(e) => setNotificacoesAtivas(e.target.checked)}
                />
              </label>

              <label className="checkbox-row-fix" style={styles.switchLinha}>
                <div>
                  <strong>WhatsApp</strong>
                  <small>Permitir disparos por WhatsApp.</small>
                </div>

                <input
                  type="checkbox"
                  checked={configWhatsapp}
                  onChange={(e) => setConfigWhatsapp(e.target.checked)}
                />
              </label>

              <label className="checkbox-row-fix" style={styles.switchLinha}>
                <div>
                  <strong>E-mail</strong>
                  <small>Permitir disparos por e-mail.</small>
                </div>

                <input
                  type="checkbox"
                  checked={configEmail}
                  onChange={(e) => setConfigEmail(e.target.checked)}
                />
              </label>

              <label className="checkbox-row-fix" style={styles.switchLinha}>
                <div>
                  <strong>Push mobile</strong>
                  <small>Preparado para notificação web/PWA.</small>
                </div>

                <input
                  type="checkbox"
                  checked={configPush}
                  onChange={(e) => setConfigPush(e.target.checked)}
                />
              </label>

              <input
                style={styles.input}
                type="number"
                min="0"
                placeholder="Dias padrão de aviso"
                value={diasAvisoPadrao}
                onChange={(e) => setDiasAvisoPadrao(e.target.value)}
              />
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
                onChange={(e) => setNomeEmpresa(e.target.value)}
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
            O envio automático só acontecerá quando a configuração global estiver ativa
            e a conta também estiver marcada para receber aviso.
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

        <button className="btn-back-page" style={styles.btnCinza} onClick={() => navegarPara('contas')}>
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

        <button className="btn-back-page" style={styles.btnCinza} onClick={() => navegarPara('contas')}>
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
              <div key={conta.id} style={styles.cardLixeira}>
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
                  Excluída há {dias} dia(s). Pode restaurar ou excluir definitivamente.
                </small>

                <div style={styles.acoes}>
                  <button style={styles.btnPago} onClick={() => restaurarConta(conta.id)}>
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
              <div key={nota.id} style={styles.cardLixeira}>
                <strong>{nota.titulo}</strong>

                {nota.conteudo && (
                  <p style={styles.textoNota}>{nota.conteudo}</p>
                )}

                <small style={liberada ? styles.textoLiberado : styles.textoQuarentena}>
                  Excluída há {dias} dia(s). Pode restaurar ou excluir definitivamente.
                </small>

                <div style={styles.acoes}>
                  <button style={styles.btnPago} onClick={() => restaurarNota(nota.id)}>
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
    <div className="app-page" style={styles.page}>
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
      `}</style>

      <section className="dashboard-title-row">
        <h1 className="main-title" style={styles.titulo}>📊 Dashboard Financeiro</h1>

        <div className="summary-grid" style={styles.resumo}>
          <div style={styles.boxTotal}>
            <span>Total</span>
            <strong>{formatarValor(total)}</strong>
          </div>

          <div style={styles.boxPago}>
            <span>Pago</span>
            <strong>{formatarValor(pago)}</strong>
          </div>

          <div style={styles.boxPendente}>
            <span>Pendente</span>
            <strong>{formatarValor(pendente)}</strong>
          </div>

          <div style={styles.boxVencido}>
            <span>Vencido</span>
            <strong>{formatarValor(vencido)}</strong>
          </div>
        </div>
      </section>

      <section className="no-print agenda-card-polished" style={styles.agendaResumoCard}>
        <div>
          <strong>📅 Próximos vencimentos</strong>
          <small>Resumo compacto da agenda financeira</small>
        </div>
        <div className="agenda-compact-items" style={styles.agendaResumoGrid}>
          <div className="agenda-pill"><small>Hoje</small><strong>{formatarValor(contas.filter((conta) => conta.status !== 'pago' && diferencaDias(conta.data_vencimento) === 0).reduce((acc, conta) => acc + Number(conta.valor || 0), 0))}</strong></div>
          <div className="agenda-pill"><small>7 dias</small><strong>{formatarValor(contas.filter((conta) => { const dias = diferencaDias(conta.data_vencimento); return conta.status !== 'pago' && dias > 0 && dias <= 7 }).reduce((acc, conta) => acc + Number(conta.valor || 0), 0))}</strong></div>
        </div>
        <button style={styles.btnAgendaCompleta} onClick={() => navegarPara('agenda')}>Abrir agenda</button>
      </section>

      <section className="no-print dashboard-notes-card">
        <div className="quick-actions-card">
          <strong>⚡ Ações rápidas</strong>
          <button onClick={abrirNovaConta}>+ Nova conta</button>
          <button onClick={abrirNovaNota}>+ Nova nota</button>
        </div>

        <div style={styles.notasHeaderNovo} className="notes-header-clean dashboard-notes-content">
          <div className="notes-title-wrap">
            <strong className="notes-title">📝 Bloco de Notas</strong>
            <div className="notes-stats-row">
              <span className="note-stat note-stat-pendente">{notasPendentes.length} pendente(s)</span>
              <span className="note-stat note-stat-critico">{notasCriticas} crítica(s)</span>
              <span className="note-stat note-stat-urgente">{notasUrgentes} urgente(s)</span>
            </div>
          </div>
          <button className="note-add-small" style={styles.btnMiniVerde} onClick={abrirNovaNota} title="Nova nota">+</button>
        </div>

        {notasPendentes.length === 0 && (
          <p style={styles.mensagemVazia}>Nenhuma nota pendente no momento.</p>
        )}

        <div style={styles.notasListaNova} className="notes-list-dashboard">
          {notasPendentes.slice(0, 4).map((nota) => {
            const prioridade = nota.prioridade || 'normal'
            return (
              <div key={nota.id} style={{ ...styles.cardNotaAcao, ...(prioridade === 'critico' ? styles.cardNotaCritico : prioridade === 'urgente' ? styles.cardNotaUrgente : styles.cardNotaNormal), opacity: nota.concluida ? 0.65 : 1 }}>
                <div style={styles.cardTopo}>
                  <strong style={{ textDecoration: nota.concluida ? 'line-through' : 'none' }}>{nota.titulo}</strong>
                  <span style={{ ...styles.badgePrioridade, ...(prioridade === 'critico' ? styles.badgeCritico : prioridade === 'urgente' ? styles.badgeUrgente : styles.badgeNormal) }}>
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

        <button className="notes-see-all" style={styles.btnCinza} onClick={() => navegarPara('notas')}>Ver todas as notas</button>
      </section>


      <section className="no-print filters-desktop" style={styles.filtrosBox}>
        <input
          style={styles.input}
          placeholder="Buscar por conta, centro ou status..."
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

            <input style={styles.input} type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
            <input style={styles.input} type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
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
              className="print-card account-card-desktop"
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
                <span>{formatarData(conta.data_vencimento)}</span>
                <span>•</span>
                <span>{conta.df_centros_custo?.nome || '-'}</span>
                <span>•</span>
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

      {menuAberto && (
        <div className="mobile-fab-menu" style={styles.menuFab}>
          <button style={styles.menuItem} onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); abrirNovaConta() }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); abrirNovaConta() }} aria-label="Nova conta">
            <span style={styles.menuItemIcone}>💰</span>
            <span style={styles.menuItemTexto}>Nova conta</span>
          </button>
          <button style={styles.menuItem} onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); abrirNovaNota() }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); abrirNovaNota() }} aria-label="Nova nota">
            <span style={styles.menuItemIcone}>📝</span>
            <span style={styles.menuItemTexto}>Nova nota</span>
          </button>
        </div>
      )}

      <button className="mobile-fab" style={styles.fab} onClick={() => setMenuAberto(!menuAberto)}>
        {menuAberto ? '×' : '+'}
      </button>

      {modalConta && (
        <div style={styles.overlay} onClick={() => { fecharConta(); fecharNota(); setModalCentro(false); setMenuAberto(false); setMenuNavegacaoAberto(false) }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{editandoContaId ? 'Editar Conta' : 'Nova Conta'}</h3>

            <input style={styles.inputModal} placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(primeiraLetraMaiuscula(e.target.value))} />
            <input style={styles.inputModal} placeholder="Valor. Ex: 150,90" value={valor} onChange={(e) => setValor(e.target.value)} />
            <input style={styles.inputModal} type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />

            <select style={styles.inputModal} value={centroCustoId} onChange={(e) => setCentroCustoId(e.target.value)}>
              <option value="">Centro de custo</option>
              {centros.map((centro) => (
                <option key={centro.id} value={centro.id}>{centro.nome}</option>
              ))}
            </select>

            <div style={styles.blocoNotificacaoConta}>
              <strong>🔔 Notificações desta conta</strong>

              <label className="checkbox-row-fix" style={styles.switchLinhaCompacta}>
                <span>WhatsApp</span>
                <input
                  type="checkbox"
                  checked={contaWhatsapp}
                  onChange={(e) => setContaWhatsapp(e.target.checked)}
                />
              </label>

              <label className="checkbox-row-fix" style={styles.switchLinhaCompacta}>
                <span>E-mail</span>
                <input
                  type="checkbox"
                  checked={contaEmail}
                  onChange={(e) => setContaEmail(e.target.checked)}
                />
              </label>

              <label className="checkbox-row-fix" style={styles.switchLinhaCompacta}>
                <span>Push mobile</span>
                <input
                  type="checkbox"
                  checked={contaPush}
                  onChange={(e) => setContaPush(e.target.checked)}
                />
              </label>

              <input
                style={styles.inputModal}
                type="number"
                min="0"
                placeholder="Dias antes do vencimento"
                value={contaDiasAviso}
                onChange={(e) => setContaDiasAviso(e.target.value)}
              />

              <small style={styles.textoAjuda}>
                Exemplo: 1 = avisar 1 dia antes. 0 = avisar no dia do vencimento.
              </small>
            </div>

            <button style={styles.btnSalvar} onClick={salvarConta}>Salvar</button>
            <button style={styles.btnCancelar} onClick={fecharConta}>Cancelar</button>
          </div>
        </div>
      )}

      {modalNota && (
        <div style={styles.overlay} onClick={() => { fecharConta(); fecharNota(); setModalCentro(false); setMenuAberto(false); setMenuNavegacaoAberto(false) }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{editandoNotaId ? 'Editar Nota' : 'Nova Nota'}</h3>

            <input style={styles.inputModal} placeholder="Título" value={tituloNota} onChange={(e) => setTituloNota(primeiraLetraMaiuscula(e.target.value))} />
            <select style={styles.inputModal} value={prioridadeNota} onChange={(e) => setPrioridadeNota(e.target.value)}>
              <option value="normal">Prioridade normal</option>
              <option value="urgente">Urgente</option>
              <option value="critico">Crítico</option>
            </select>
            <input style={styles.inputModal} type="date" value={dataEventoNota} onChange={(e) => setDataEventoNota(e.target.value)} />
            <textarea style={styles.textareaModal} placeholder="Conteúdo..." value={conteudoNota} onChange={(e) => setConteudoNota(e.target.value)} />

            <button style={styles.btnSalvar} onClick={salvarNota}>Salvar</button>
            <button style={styles.btnCancelar} onClick={fecharNota}>Cancelar</button>
          </div>
        </div>
      )}

      {modalCentro && (
        <div style={styles.overlay} onClick={() => { fecharConta(); fecharNota(); setModalCentro(false); setMenuAberto(false); setMenuNavegacaoAberto(false) }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Centros de Custo</h3>

            <input style={styles.inputModal} placeholder="Novo centro" value={novoCentro} onChange={(e) => setNovoCentro(primeiraLetraMaiuscula(e.target.value))} />
            <button style={styles.btnSalvar} onClick={salvarCentro}>Salvar Centro</button>

            {centros.map((centro) => (
              <div key={centro.id} style={styles.itemCentro}>
                <span>{centro.nome}</span>
                <button style={styles.btnMiniExcluir} onClick={() => abrirConfirmacao({ titulo: 'Excluir centro de custo', mensagem: `Deseja excluir o centro ${centro.nome}?`, textoConfirmar: 'Excluir', tipo: 'perigo', acao: () => excluirCentro(centro.id) })}>excluir</button>
              </div>
            ))}

            <button style={styles.btnCancelar} onClick={() => setModalCentro(false)}>Fechar</button>
          </div>
        </div>
      )}


      {confirmacao.aberto && (
        <div style={styles.overlayConfirmacao}>
          <div style={styles.modalConfirmacao}>
            <div style={styles.confirmacaoIcone}>
              {confirmacao.tipo === 'perigo' ? '⚠️' : confirmacao.tipo === 'sucesso' ? '✅' : 'ℹ️'}
            </div>

            <h3 style={styles.confirmacaoTitulo}>{confirmacao.titulo}</h3>
            <p style={styles.confirmacaoTexto}>{confirmacao.mensagem}</p>

            <div style={styles.confirmacaoAcoes}>
              <button style={styles.btnConfirmarCancelar} onClick={fecharConfirmacao}>
                Cancelar
              </button>

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
      )}
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
    border: 'none',
    background: 'linear-gradient(135deg, #14b8a6, #0f766e)',
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    boxShadow: '0 8px 18px rgba(20,184,166,0.28)'
  },
  menuBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.22)',
    zIndex: 999,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: '88px 14px 14px 14px'
  },
  menuNavegacao: {
    width: 'min(360px, 94vw)',
    maxHeight: 'calc(100vh - 110px)',
    overflowY: 'auto',
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
    background: '#dc3545',
    color: '#fff',
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
    borderRadius: 8
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
    color: '#856404',
    fontWeight: 'bold'
  },
  textoLiberado: {
    display: 'block',
    marginTop: 8,
    color: '#14b8a6',
    fontWeight: 'bold'
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
    background: '#0d6efd',
    color: '#fff',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 8
  },
  btnVoltar: {
    background: '#6f42c1',
    color: '#fff',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 8
  },
  btnEditar: {
    background: '#ffc107',
    color: '#111',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 8
  },
  btnExcluir: {
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer'
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
    background: '#6c757d',
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
    width: 58,
    height: 58,
    borderRadius: '50%',
    background: '#14b8a6',
    color: '#fff',
    border: 'none',
    fontSize: 30,
    boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
    zIndex: 3000
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
    border: '1px solid rgba(15,118,110,0.18)',
    borderRadius: 18,
    padding: '0 18px',
    minWidth: 210,
    width: 210,
    height: 56,
    fontSize: 17,
    fontWeight: 900,
    boxShadow: '0 10px 24px rgba(15,23,42,0.18)',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'visible'
  },
  menuItemIcone: {
    display: 'inline-flex',
    width: 26,
    minWidth: 26,
    justifyContent: 'center',
    fontSize: 22,
    lineHeight: 1
  },
  menuItemTexto: {
    display: 'inline-block',
    color: '#0f172a',
    fontSize: 17,
    fontWeight: 900,
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
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '4px 7px',
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
    background: '#dcfce7',
    borderColor: '#86efac'
  },
  cardNotaUrgente: {
    background: '#fef3c7',
    borderColor: '#facc15'
  },
  cardNotaCritico: {
    background: '#fee2e2',
    borderColor: '#f87171'
  },
  badgePrioridade: {
    borderRadius: 999,
    padding: '4px 8px',
    fontSize: 12,
    fontWeight: '900'
  },
  badgeNormal: {
    background: '#bbf7d0',
    color: '#166534'
  },
  badgeUrgente: {
    background: '#fde68a',
    color: '#92400e'
  },
  badgeCritico: {
    background: '#fecaca',
    color: '#991b1b'
  }

}
