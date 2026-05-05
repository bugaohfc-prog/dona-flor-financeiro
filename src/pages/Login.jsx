import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const SENHA_SEGURA_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [modo, setModo] = useState('login')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setModo('nova-senha')
        setMensagem('Crie uma nova senha segura para continuar.')
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  function validarSenhaSegura(valor) {
    return SENHA_SEGURA_REGEX.test(valor)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setMensagem('')

    if (!email || !senha) {
      alert('Informe e-mail e senha')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha
    })

    setLoading(false)

    if (error) {
      alert('E-mail ou senha inválidos')
      return
    }

    const { error: erroVinculo } = await supabase.rpc('vincular_usuario_logado')
    if (erroVinculo) {
      console.warn('Não foi possível executar vínculo automático:', erroVinculo.message)
    }

    onLogin(data.user)
  }

  async function enviarRecuperacaoSenha(e) {
    e.preventDefault()
    setMensagem('')

    const emailNormalizado = email.trim().toLowerCase()
    if (!emailNormalizado || !emailNormalizado.includes('@')) {
      alert('Informe um e-mail válido para recuperar a senha.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(emailNormalizado, {
      redirectTo: window.location.origin
    })
    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setMensagem('Se este e-mail estiver cadastrado, o Supabase enviará um link para criar/redefinir a senha.')
  }

  async function salvarNovaSenha(e) {
    e.preventDefault()
    setMensagem('')

    if (!validarSenhaSegura(novaSenha)) {
      alert('A senha precisa ter no mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.')
      return
    }

    if (novaSenha !== confirmarSenha) {
      alert('As senhas não conferem.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.updateUser({ password: novaSenha })
    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setMensagem('Senha atualizada com sucesso.')
    onLogin(data.user)
  }

  if (modo === 'recuperar') {
    return (
      <div style={styles.page}>
        <form style={styles.card} onSubmit={enviarRecuperacaoSenha}>
          <h1 style={styles.titulo}>Recuperar acesso</h1>
          <p style={styles.subtitulo}>Informe seu e-mail para receber o link de criação/redefinição de senha.</p>

          <input
            style={styles.input}
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button style={styles.botao} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link'}
          </button>

          {mensagem && <small style={styles.mensagem}>{mensagem}</small>}

          <button type="button" style={styles.botaoSecundario} onClick={() => setModo('login')}>
            Voltar para login
          </button>
        </form>
      </div>
    )
  }

  if (modo === 'nova-senha') {
    return (
      <div style={styles.page}>
        <form style={styles.card} onSubmit={salvarNovaSenha}>
          <h1 style={styles.titulo}>Criar nova senha</h1>
          <p style={styles.subtitulo}>Use uma senha forte para proteger o acesso.</p>

          <input
            style={styles.input}
            type="password"
            placeholder="Nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
          />

          <small style={styles.ajudaSenha}>
            Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.
          </small>

          <button style={styles.botao} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar senha'}
          </button>

          {mensagem && <small style={styles.mensagem}>{mensagem}</small>}
        </form>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleLogin}>
        <h1 style={styles.titulo}>Dona Flor Financeiro</h1>
        <p style={styles.subtitulo}>Acesse sua conta para continuar</p>

        <input
          style={styles.input}
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button style={styles.botao} disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <button type="button" style={styles.linkBotao} onClick={() => setModo('recuperar')}>
          Esqueci minha senha / primeiro acesso
        </button>

        {mensagem && <small style={styles.mensagem}>{mensagem}</small>}

        <small style={styles.ajuda}>
          Login seguro via Supabase Auth.
        </small>
      </form>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8f9fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    fontFamily: 'Arial'
  },
  card: {
    width: '100%',
    maxWidth: 380,
    background: '#fff',
    borderRadius: 18,
    padding: 20,
    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  titulo: {
    margin: 0,
    fontSize: 26
  },
  subtitulo: {
    margin: '0 0 10px',
    color: '#666',
    fontSize: 14
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    fontSize: 15
  },
  botao: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    border: 'none',
    background: '#198754',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    cursor: 'pointer'
  },
  botaoSecundario: {
    width: '100%',
    padding: 11,
    borderRadius: 10,
    border: '1px solid #d6d6d6',
    background: '#fff',
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
    cursor: 'pointer'
  },
  linkBotao: {
    border: 'none',
    background: 'transparent',
    color: '#198754',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: 6
  },
  ajuda: {
    color: '#666',
    textAlign: 'center',
    marginTop: 8
  },
  ajudaSenha: {
    color: '#666',
    lineHeight: 1.4
  },
  mensagem: {
    color: '#198754',
    textAlign: 'center',
    lineHeight: 1.4
  }
}
