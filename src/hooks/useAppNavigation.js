import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import {
  criarEstadoNavegacao,
  gerarUrlDaTela,
  lerTelaDaUrl,
  normalizarContextoNavegacao,
  normalizarTelaNavegacao,
  obterTituloTela,
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
  const telaAtualRef = useRef(estadoInicial.tela)
  const contextoNavegacaoRef = useRef(estadoInicial.contexto)
  const menuNavegacaoTriggerRef = useRef(null)

  const fecharMenus = useCallback(() => {
    setMenuAberto(false)
    setMenuNavegacaoAberto(false)
  }, [])

  const aplicarEstadoNavegacao = useCallback((estado) => {
    telaAtualRef.current = estado.tela
    contextoNavegacaoRef.current = estado.contexto
    startTransition(() => {
      setTelaAtualState(estado.tela)
      setOrigemNavegacao(estado.origem)
      setContextoNavegacao(estado.contexto)
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
    const estado = criarEstadoNavegacao({
      tela: proximaTela,
      origem: opcoes.origem || telaAtualRef.current,
      contexto,
    })

    if (typeof window !== 'undefined') {
      const estadoAtual = criarEstadoNavegacao({
        ...window.history.state,
        tela: telaAtualRef.current,
        contexto: contextoNavegacaoRef.current,
        scrollY: window.scrollY,
      })
      window.history.replaceState(
        estadoAtual,
        '',
        gerarUrlDaTela(window.location.href, estadoAtual.tela)
      )

      if (mudouTela) {
        window.history.pushState(estado, '', gerarUrlDaTela(window.location.href, proximaTela))
      } else {
        window.history.replaceState(estado, '', gerarUrlDaTela(window.location.href, proximaTela))
      }
    }

    aplicarEstadoNavegacao(estado)
    if (mudouTela && typeof window !== 'undefined') {
      window.requestAnimationFrame(() => window.scrollTo(0, 0))
    }
  }, [aplicarEstadoNavegacao, fecharMenus])

  const atualizarContextoAtual = useCallback((contexto) => {
    const contextoAtualizado = normalizarContextoNavegacao(contexto)
    if (JSON.stringify(contextoAtualizado) === JSON.stringify(contextoNavegacaoRef.current)) return
    contextoNavegacaoRef.current = contextoAtualizado
    setContextoNavegacao(contextoAtualizado)
    if (typeof window === 'undefined') return
    const estado = criarEstadoNavegacao({
      ...window.history.state,
      tela: telaAtualRef.current,
      contexto: contextoAtualizado,
      scrollY: window.scrollY,
    })
    window.history.replaceState(estado, '', gerarUrlDaTela(window.location.href, estado.tela))
  }, [])

  const consumirDestaqueContexto = useCallback(() => {
    const contextoAtual = contextoNavegacaoRef.current
    if (!contextoAtual) return
    const {
      contaId: _contaId,
      conta: _conta,
      contaOrigem: _contaOrigem,
      ...contextoRestante
    } = contextoAtual
    atualizarContextoAtual(contextoRestante)
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
    setTelaAtualState,
    origemNavegacao,
    contextoNavegacao,
    telaInformadaNaUrl: telaInformadaNaUrlRef.current,
    atualizarContextoAtual,
    consumirDestaqueContexto,
    menuNavegacaoTriggerRef,
    fecharMenus,
    navegarPara
  }
}
