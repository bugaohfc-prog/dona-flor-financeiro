import { startTransition, useCallback, useEffect, useState } from 'react'

const GRUPOS_MENU_PADRAO = {
  principal: true,
  financeiro: true,
  analise: true,
  sistema: true
}

export function useAppNavigation(telaInicial = 'dashboard') {
  const [menuAberto, setMenuAberto] = useState(false)
  const [menuNavegacaoAberto, setMenuNavegacaoAberto] = useState(false)
  const [sidebarCompacta, setSidebarCompacta] = useState(false)
  const [gruposMenu, setGruposMenu] = useState(GRUPOS_MENU_PADRAO)
  const [telaAtual, setTelaAtualState] = useState(telaInicial)

  const fecharMenus = useCallback(() => {
    setMenuAberto(false)
    setMenuNavegacaoAberto(false)
  }, [])

  const navegarPara = useCallback((tela) => {
    fecharMenus()
    startTransition(() => {
      setTelaAtualState(tela)
    })

    if (typeof window !== 'undefined' && window.history.state?.tela !== tela) {
      window.history.pushState({ tela }, '', window.location.href)
    }
  }, [fecharMenus])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    window.history.replaceState({ tela: telaInicial }, '', window.location.href)

    function aoVoltar(event) {
      const proximaTela = event.state?.tela || telaInicial
      fecharMenus()
      startTransition(() => {
        setTelaAtualState(proximaTela)
      })
    }

    window.addEventListener('popstate', aoVoltar)
    return () => window.removeEventListener('popstate', aoVoltar)
  }, [fecharMenus, telaInicial])

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
    fecharMenus,
    navegarPara
  }
}
