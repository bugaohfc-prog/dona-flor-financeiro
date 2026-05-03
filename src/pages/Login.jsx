import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    setLoading(false)

    if (error) {
      alert('Erro no login')
      return
    }

    onLogin(data.user)
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />

      <button disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
