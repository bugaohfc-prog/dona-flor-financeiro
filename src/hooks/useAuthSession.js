import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  OITO_HORAS_MS,
  TRINTA_MINUTOS_MS,
  VINTE_CINCO_MINUTOS_MS,
  lerSessaoSegura,
  salvarSessaoSegura
} from '../services/sessionSecurityService.js'

export function useAuthSession({
  onClearAuthData,
  onSessionWarning,
  onShowMessage,
  onNavigateHome
} = {}) {
  const avisoSessaoMostradoRef = useRef(false)
  const encerrandoSessaoRef = useRef(false)
  const [usuarioLogado, setUsuarioLogado] = useState(null)
  const [carregandoAuth, setCarregandoAuth] = useState(true)

  const registrarAtividadeSessao = useCallback(() => {
    const sessao = lerSessaoSegura()

    salvarSessaoSegura({
      inicio: sessao.inicio || Date.now(),
      ultimaAtividade: Date.now()
    })

    avisoSessaoMostradoRef.current = false
  }, [])

  const encerrarSessao = useCallback(async (mensagem, tipo = 'erro') => {
    if (encerrandoSessaoRef.current) return

    encerrandoSessaoRef.current = true
    onClearAuthData?.()
    setUsuarioLogado(null)
    setCarregandoAuth(false)
    onNavigateHome?.()

    try {
      await supabase.auth.signOut()
    } finally {
      if (mensagem) onShowMessage?.(mensagem, tipo)
      window.setTimeout(() => { encerrandoSessaoRef.current = false }, 1200)
    }
  }, [onClearAuthData, onNavigateHome, onShowMessage])

  useEffect(() => {
    let ativo = true

    async function verificarSessao() {
      try {
        const timeoutSessao = new Promise((resolve) => {
          window.setTimeout(
            () => resolve({ data: { session: null }, error: new Error('Timeout ao validar sessão') }),
            8000
          )
        })

        const { data, error } = await Promise.race([
          supabase.auth.getSession(),
          timeoutSessao
        ])

        if (!ativo) return

        if (error || !data?.session) {
          onClearAuthData?.()
          setUsuarioLogado(null)
          return
        }

        setUsuarioLogado(data.session.user)
      } catch (error) {
        if (!ativo) return
        console.warn('Falha ao validar sessão:', error?.message || error)
        onClearAuthData?.()
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
        onClearAuthData?.()
      }
    })

    return () => {
      ativo = false
      listener.subscription.unsubscribe()
    }
  }, [onClearAuthData])

  useEffect(() => {
    if (!usuarioLogado) return undefined

    const agora = Date.now()
    const sessaoAtual = lerSessaoSegura()

    salvarSessaoSegura({
      inicio: sessaoAtual.inicio || agora,
      ultimaAtividade: agora
    })

    function verificarExpiracao() {
      const sessao = lerSessaoSegura()
      const inicio = Number(sessao.inicio || Date.now())
      const ultimaAtividade = Number(sessao.ultimaAtividade || Date.now())
      const agoraVerificacao = Date.now()
      const tempoTotal = agoraVerificacao - inicio
      const tempoInativo = agoraVerificacao - ultimaAtividade

      if (tempoTotal >= OITO_HORAS_MS) {
        encerrarSessao('Sua sessão expirou por segurança. Faça login novamente.')
        return
      }

      if (tempoInativo >= TRINTA_MINUTOS_MS) {
        encerrarSessao('Sua sessão foi encerrada por inatividade. Faça login novamente.')
        return
      }

      if (tempoInativo >= VINTE_CINCO_MINUTOS_MS && !avisoSessaoMostradoRef.current) {
        avisoSessaoMostradoRef.current = true
        onSessionWarning?.(registrarAtividadeSessao)
      }
    }

    const eventos = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
    eventos.forEach((evento) => window.addEventListener(evento, registrarAtividadeSessao, { passive: true }))

    const intervalo = window.setInterval(verificarExpiracao, 60 * 1000)

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, registrarAtividadeSessao))
      window.clearInterval(intervalo)
    }
  }, [encerrarSessao, onSessionWarning, registrarAtividadeSessao, usuarioLogado])

  return {
    usuarioLogado,
    setUsuarioLogado,
    carregandoAuth,
    setCarregandoAuth,
    encerrarSessao,
    registrarAtividadeSessao
  }
}
