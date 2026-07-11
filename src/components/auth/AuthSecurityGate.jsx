import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ResetPasswordPage from '../../pages/ResetPasswordPage.jsx'

const RESET_PASSWORD_PATH = '/reset-password'
const AUTH_URL_GRACE_MS = 8000

function caminhoAtualEhRecuperacao() {
  return window.location.pathname.replace(/\/+$/, '') === RESET_PASSWORD_PATH
}

function urlPossuiParametrosAuth() {
  const hash = String(window.location.hash || '').toLowerCase()
  const search = String(window.location.search || '').toLowerCase()

  return [
    'access_token=',
    'refresh_token=',
    'type=recovery',
    'type=invite',
    'token_hash=',
    'code='
  ].some((fragmento) => hash.includes(fragmento) || search.includes(fragmento))
}

function mensagemErroDaUrl() {
  const hashParams = new URLSearchParams(String(window.location.hash || '').replace(/^#/, ''))
  const searchParams = new URLSearchParams(window.location.search)

  return (
    hashParams.get('error_description')
    || searchParams.get('error_description')
    || hashParams.get('error')
    || searchParams.get('error')
    || ''
  )
}

function usuarioPrecisaTrocarSenha(usuario) {
  return Boolean(
    usuario?.app_metadata?.must_change_password === true
    || usuario?.user_metadata?.must_change_password === true
  )
}

function limparUrlAuth() {
  window.history.replaceState({}, document.title, '/')
}

export default function AuthSecurityGate({ children }) {
  const [sessao, setSessao] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [recuperacaoAtiva, setRecuperacaoAtiva] = useState(caminhoAtualEhRecuperacao)
  const [aguardandoUrlAuth, setAguardandoUrlAuth] = useState(
    caminhoAtualEhRecuperacao() && urlPossuiParametrosAuth()
  )
  const [urlAuthExpirada, setUrlAuthExpirada] = useState(false)

  const erroUrl = useMemo(mensagemErroDaUrl, [])

  useEffect(() => {
    let ativo = true

    async function carregarSessaoInicial() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (!ativo) return

        if (error) {
          console.warn('Não foi possível validar a sessão de autenticação:', error.message)
          setSessao(null)
        } else {
          setSessao(data?.session || null)
          if (data?.session) setAguardandoUrlAuth(false)
        }
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarSessaoInicial()

    const { data: listener } = supabase.auth.onAuthStateChange((event, proximaSessao) => {
      if (!ativo) return

      if (event === 'PASSWORD_RECOVERY') {
        setRecuperacaoAtiva(true)
      }

      if (proximaSessao) {
        setAguardandoUrlAuth(false)
        setUrlAuthExpirada(false)
      }

      setSessao(proximaSessao || null)
      setCarregando(false)
    })

    return () => {
      ativo = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!recuperacaoAtiva || !aguardandoUrlAuth || sessao) return undefined

    const timeout = window.setTimeout(() => {
      setAguardandoUrlAuth(false)
      setUrlAuthExpirada(true)
    }, AUTH_URL_GRACE_MS)

    return () => window.clearTimeout(timeout)
  }, [aguardandoUrlAuth, recuperacaoAtiva, sessao])

  const concluirTrocaSenha = useCallback(async (usuarioAtualizado) => {
    const { data } = await supabase.auth.getSession()
    const sessaoBase = data?.session || sessao
    const sessaoAtualizada = sessaoBase && usuarioAtualizado
      ? { ...sessaoBase, user: usuarioAtualizado }
      : sessaoBase

    setSessao(sessaoAtualizada || null)
    setRecuperacaoAtiva(false)
    setAguardandoUrlAuth(false)
    setUrlAuthExpirada(false)
    limparUrlAuth()
  }, [sessao])

  const sairParaLogin = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      setSessao(null)
      setRecuperacaoAtiva(false)
      setAguardandoUrlAuth(false)
      setUrlAuthExpirada(false)
      limparUrlAuth()
    }
  }, [])

  if (carregando || (recuperacaoAtiva && aguardandoUrlAuth && !sessao)) {
    return (
      <div style={loadingStyles.page}>
        <div style={loadingStyles.card}>
          <h2 style={loadingStyles.title}>Validando acesso...</h2>
          <p style={loadingStyles.text}>Aguarde enquanto confirmamos sua sessão com segurança.</p>
        </div>
      </div>
    )
  }

  if (recuperacaoAtiva) {
    return (
      <ResetPasswordPage
        modo="recuperacao"
        sessao={sessao}
        erroLink={erroUrl || (urlAuthExpirada ? 'O link expirou ou já foi utilizado.' : '')}
        onComplete={concluirTrocaSenha}
        onExit={sairParaLogin}
      />
    )
  }

  if (sessao?.user && usuarioPrecisaTrocarSenha(sessao.user)) {
    return (
      <ResetPasswordPage
        modo="primeiro-acesso"
        sessao={sessao}
        onComplete={concluirTrocaSenha}
        onExit={sairParaLogin}
      />
    )
  }

  return children
}

const loadingStyles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 20,
    background: '#f8f9fa',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 18,
    background: '#fff',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.10)',
    textAlign: 'center'
  },
  title: {
    margin: '0 0 8px',
    color: '#1f2937'
  },
  text: {
    margin: 0,
    color: '#6b7280'
  }
}
