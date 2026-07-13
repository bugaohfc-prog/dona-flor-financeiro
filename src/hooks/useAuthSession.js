import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  OITO_HORAS_MS,
  TRINTA_MINUTOS_MS,
  VINTE_CINCO_MINUTOS_MS,
  lerSessaoSegura,
  salvarSessaoSegura
} from '../services/sessionSecurityService.js'

const INTERVALO_GRAVACAO_ATIVIDADE_MS = 15 * 1000
const SESSION_BOOTSTRAP_TIMEOUT_MS = 10000

function comTimeoutSessao(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error('SESSION_BOOTSTRAP_TIMEOUT')), SESSION_BOOTSTRAP_TIMEOUT_MS)
    })
  ])
}

export function useAuthSession({
  onClearAuthData,
  onSessionWarning,
  onShowMessage,
  onNavigateHome
} = {}) {
  const avisoSessaoMostradoRef = useRef(false)
  const encerrandoSessaoRef = useRef(false)
  const ultimaGravacaoAtividadeRef = useRef(0)
  const [usuarioLogado, setUsuarioLogado] = useState(null)
  const [carregandoAuth, setCarregandoAuth] = useState(true)

  const reiniciarControleSessao = useCallback((session, opcoes = {}) => {
    const agora = Date.now()
    const sessaoAtual = lerSessaoSegura()
    const mesmoUsuario = sessaoAtual.usuarioId === session?.user?.id
    const preservarInicio = opcoes.preservarInicio && mesmoUsuario && sessaoAtual.inicio
    const preservarAtividade = opcoes.preservarAtividade && mesmoUsuario && sessaoAtual.ultimaAtividade

    salvarSessaoSegura({
      usuarioId: session?.user?.id || null,
      inicio: preservarInicio ? sessaoAtual.inicio : agora,
      ultimaAtividade: preservarAtividade ? sessaoAtual.ultimaAtividade : agora,
      expiraEm: session?.expires_at || null
    })

    ultimaGravacaoAtividadeRef.current = agora
    avisoSessaoMostradoRef.current = false
  }, [])

  const salvarAtividadeSessao = useCallback((forcar = false) => {
    const agora = Date.now()

    if (
      !forcar
      && ultimaGravacaoAtividadeRef.current
      && agora - ultimaGravacaoAtividadeRef.current < INTERVALO_GRAVACAO_ATIVIDADE_MS
    ) {
      return
    }

    const sessao = lerSessaoSegura()

    salvarSessaoSegura({
      usuarioId: sessao.usuarioId || null,
      inicio: sessao.inicio || agora,
      ultimaAtividade: agora,
      expiraEm: sessao.expiraEm || null
    })

    ultimaGravacaoAtividadeRef.current = agora
    avisoSessaoMostradoRef.current = false
  }, [])

  const registrarAtividadeSessao = useCallback(() => {
    salvarAtividadeSessao(false)
  }, [salvarAtividadeSessao])

  const continuarSessao = useCallback(() => {
    salvarAtividadeSessao(true)
  }, [salvarAtividadeSessao])

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
      let timeoutAviso = null

      try {
        const sessaoPromise = supabase.auth.getSession()

        timeoutAviso = window.setTimeout(() => {
          console.warn('Validação de sessão demorando mais que o esperado. Aguardando recuperação do Supabase.')
        }, 8000)

        const { data, error } = await comTimeoutSessao(sessaoPromise)

        if (!ativo) return

        if (error) {
          console.warn('Falha transitória ao validar sessão:', error?.message || error)
          return
        }

        if (!data?.session) {
          onClearAuthData?.()
          setUsuarioLogado(null)
          return
        }

        const sessaoSegura = lerSessaoSegura()
        const inicioSessao = Number(sessaoSegura.inicio || 0)
        const usuarioSessao = sessaoSegura.usuarioId || null
        const sessaoLocalAntiga = !inicioSessao || Date.now() - inicioSessao >= OITO_HORAS_MS

        if (usuarioSessao !== data.session.user.id || sessaoLocalAntiga) {
          reiniciarControleSessao(data.session)
        }

        setUsuarioLogado(data.session.user)
      } catch (error) {
        if (!ativo) return
        console.warn('Falha transitória ao validar sessão:', error?.message || error)
      } finally {
        if (timeoutAviso) window.clearTimeout(timeoutAviso)
        if (ativo) setCarregandoAuth(false)
      }
    }

    verificarSessao()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setCarregandoAuth(false)

      const proximoUsuario = session?.user || null

      if (session && event === 'SIGNED_IN') {
        reiniciarControleSessao(session)
      }

      if (session && ['TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        reiniciarControleSessao(session, { preservarInicio: true, preservarAtividade: true })
      }

      setUsuarioLogado((usuarioAtual) => {
        if (usuarioAtual?.id && proximoUsuario?.id && usuarioAtual.id === proximoUsuario.id) {
          return {
            ...usuarioAtual,
            email: proximoUsuario.email || usuarioAtual.email,
            user_metadata: proximoUsuario.user_metadata || usuarioAtual.user_metadata,
            app_metadata: proximoUsuario.app_metadata || usuarioAtual.app_metadata
          }
        }

        return proximoUsuario
      })

      if (!session) {
        onClearAuthData?.()
      }
    })

    return () => {
      ativo = false
      listener.subscription.unsubscribe()
    }
  }, [onClearAuthData, reiniciarControleSessao])

  useEffect(() => {
    if (!usuarioLogado?.id) return undefined

    const agora = Date.now()
    const sessaoAtual = lerSessaoSegura()

    salvarSessaoSegura({
      usuarioId: usuarioLogado.id,
      inicio: sessaoAtual.usuarioId === usuarioLogado.id ? sessaoAtual.inicio || agora : agora,
      ultimaAtividade: agora,
      expiraEm: sessaoAtual.expiraEm || null
    })
    ultimaGravacaoAtividadeRef.current = agora

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
        onSessionWarning?.(continuarSessao)
      }
    }

    const eventos = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
    eventos.forEach((evento) => window.addEventListener(evento, registrarAtividadeSessao, { passive: true }))

    const intervalo = window.setInterval(verificarExpiracao, 60 * 1000)

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, registrarAtividadeSessao))
      window.clearInterval(intervalo)
    }
  }, [continuarSessao, encerrarSessao, onSessionWarning, registrarAtividadeSessao, usuarioLogado?.id])

  return {
    usuarioLogado,
    setUsuarioLogado,
    carregandoAuth,
    setCarregandoAuth,
    encerrarSessao,
    registrarAtividadeSessao
  }
}
