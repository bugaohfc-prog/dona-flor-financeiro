import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext.jsx'

export default function Login({ onLogin }) {
  const { showToast } = useApp()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()

    if (!email || !senha) {
      showToast('Informe e-mail e senha', 'erro')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    setLoading(false)

    if (error) {
      showToast('E-mail ou senha inválidos', 'erro')
      return
    }

    const { error: erroVinculo } = await supabase.rpc('vincular_usuario_logado')
    if (erroVinculo) {
      console.warn('Não foi possível executar vínculo automático:', erroVinculo.message)
    }

    onLogin(data.user)
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
    maxWidth: 360,
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
    fontSize: 15
  },
  ajuda: {
    color: '#666',
    textAlign: 'center',
    marginTop: 8
  }
}
