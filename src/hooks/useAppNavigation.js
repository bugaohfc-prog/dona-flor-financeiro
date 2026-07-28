import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import {
  criarEstadoNavegacao,
  estadoPertenceAoEscopo,
  gerarUrlDaTela,
  lerTelaDaUrl,
  normalizarContextoNavegacao,
  normalizarTelaNavegacao,
  obterTituloTela,
  registrarNavegacaoNoHistorico,
  removerDestaqueContexto,
  deveCriarEntradaHistorico,
} from '../utils/navigation.js'

const GRUPOS_MENU_PADRAO = {
  dashboard: true,
  financeiro: true,
  pessoas: true,
  administracao: true,
  conta: true
}

export function useAppNavigation(telaInicial = 'dashboard') {
  const telaInformadaNaUrlRef = useRef(
    typeof window !== 'undefined' && new URL(window.location.href).searchParams.has('tela')
  )
  const [menuAberto, setMenuAberto] = useState(false)
  const [menuNavegacaoAberto, setMenuNavegacaoAberto] = useState(false)
  const [sidebarCompacta, setSidebarCompacta] = useState(false)
  const [gruposMenu, setGruposMenu] = useState(GRUPOS_MENU_PADRAO)
  const estadoInicial = typeof window === 'undefined'
    ? criarEstadoNavegacao({ tela: telaInicial })
    : criarEstadoNavegacao({
        ...window.history.state,
        tela: lerTelaDaUrl(window.location.href),
      })
  const [telaAtual, setTelaAtualState] = useState(estadoInicial.tela)
  const [origemNavegacao, setOrigemNavegacao] = useState(estadoInicial.origem)
  const [contextoNavegacao, setContextoNavegacao] = useState(estadoInicial.contexto)
  const [revisaoNavegacao, setRevisaoNavegacao] = useState(0)
  const telaAtualRef = useRef(estadoInicial.tela)
  const contextoNavegacaoRef = useRef(estadoInicial.contexto)
  const escopoNavegacaoRef = useRef(estadoInicial.escopo)
  const menuNavegacaoTriggerRef = useRef(null)

  const fecharMenus = useCallback(() => {
    setMenuAberto(false)
    setMenuNavegacaoAberto(false)
  }, [])

  const aplicarEstadoNavegacao = useCallback((estado) => {
    telaAtualRef.current = estado.tela
    contextoNavegacaoRef.current = estado.contexto
    escopoNavegacaoRef.current = estado.escopo
    startTransition(() => {
      setTelaAtualState(estado.tela)
      setOrigemNavegacao(estado.origem)
      setContextoNavegacao(estado.contexto)
      setRevisaoNavegacao((revisao) => revisao + 1)
    })
  }, [])

  const navegarPara = useCallback((tela, opcoes = {}) => {
    fecharMenus()
    const proximaTela = normalizarTelaNavegacao(tela)
    const mudouTela = deveCriarEntradaHistorico(telaAtualRef.current, proximaTela)
    const contextoInformado = Object.prototype.hasOwnProperty.call(opcoes, 'contexto')
    const contexto = contextoInformado
      ? normalizarContextoNavegacao(opcoes.contexto)
      : (mudouTela ? null : contextoNavegacaoRef.current)
    const origemInformada = Object.prototype.hasOwnProperty.call(opcoes, 'origem')
    const estado = criarEstadoNavegacao({
      tela: proximaTela,
      origem: origemInformada ? opcoes.origem : telaAtualRef.current,
      contexto,
      escopo: opcoes.invalidarContextoAnterior === true
        ? `${Date.now()}-${Math.random().toString(36).slice(2)}`
        : escopoNavegacaoRef.current,
    })

    if (typeof window !== 'undefined') {
      const estadoAtual = criarEstadoNavegacao({
        ...window.history.state,
        tela: telaAtualRef.current,
        contexto: contextoNavegacaoRef.current,
        scrollY: window.scrollY,
        escopo: escopoNavegacaoRef.current,
      })
      registrarNavegacaoNoHistorico({
        historico: window.history,
        urlAtual: window.location.href,
        estadoAtual,
        proximoEstado: estado,
        substituir: opcoes.replace === true,
      })
    }

    aplicarEstadoNavegacao(estado)
    if (mudouTela && typeof window !== 'undefined') {
      window.requestAnimationFrame(() => window.scrollTo(0, 0))
    }
  }, [aplicarEstadoNavegacao, fecharMenus])

  const atualizarContextoAtual = useCallback((contexto) => {
    const valorContexto = typeof contexto === 'function'
      ? contexto(contextoNavegacaoRef.current)
      : contexto
    const contextoAtualizado = normalizarContextoNavegacao(valorContexto)
    if (JSON.stringify(contextoAtualizado) === JSON.stringify(contextoNavegacaoRef.current)) return
    contextoNavegacaoRef.current = contextoAtualizado
    setContextoNavegacao(contextoAtualizado)
    if (typeof window === 'undefined') return
    const estado = criarEstadoNavegacao({
      ...window.history.state,
      tela: telaAtualRef.current,
      contexto: contextoAtualizado,
      scrollY: window.scrollY,
      escopo: escopoNavegacaoRef.current,
    })
    window.history.replaceState(estado, '', gerarUrlDaTela(window.location.href, estado.tela))
  }, [])

  const consumirDestaqueContexto = useCallback(() => {
    atualizarContextoAtual((contextoAtual) => removerDestaqueContexto(contextoAtual))
  }, [atualizarContextoAtual])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const telaUrl = lerTelaDaUrl(window.location.href)
    const estado = criarEstadoNavegacao({
      ...window.history.state,
      tela: telaUrl,
    })
    window.history.replaceState(estado, '', gerarUrlDaTela(window.location.href, telaUrl))
    aplicarEstadoNavegacao(estado)

    function aoVoltar(event) {
      if (!estadoPertenceAoEscopo(event.state, escopoNavegacaoRef.current)) {
        const estadoSeguro = criarEstadoNavegacao({
          tela: 'dashboard',
          escopo: escopoNavegacaoRef.current,
        })
        window.history.replaceState(
          estadoSeguro,
          '',
          gerarUrlDaTela(window.location.href, 'dashboard')
        )
        fecharMenus()
        aplicarEstadoNavegacao(estadoSeguro)
        return
      }
      const proximoEstado = criarEstadoNavegacao({
        ...event.state,
        tela: event.state?.tela || lerTelaDaUrl(window.location.href),
      })
      fecharMenus()
      aplicarEstadoNavegacao(proximoEstado)
      window.requestAnimationFrame(() => window.scrollTo(0, proximoEstado.scrollY))
    }

    window.addEventListener('popstate', aoVoltar)
    return () => window.removeEventListener('popstate', aoVoltar)
  }, [aplicarEstadoNavegacao, fecharMenus])

  useEffect(() => {
    if (typeof document !== 'undefined') document.title = obterTituloTela(telaAtual)
  }, [telaAtual])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

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

  return {
    menuAberto,
    setMenuAberto,
    menuNavegacaoAberto,
    setMenuNavegacaoAberto,
    sidebarCompacta,
    setSidebarCompacta,
    gruposMenu,
    setGruposMenu,
    telaAtual,
    origemNavegacao,
    contextoNavegacao,
    revisaoNavegacao,
    telaInformadaNaUrl: telaInformadaNaUrlRef.current,
    atualizarContextoAtual,
    consumirDestaqueContexto,
    menuNavegacaoTriggerRef,
    fecharMenus,
    navegarPara
  }
}
