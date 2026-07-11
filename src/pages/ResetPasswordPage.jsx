import { useState } from 'react'
import { supabase } from '../lib/supabase'

const MIN_PASSWORD_LENGTH = 12

function mensagemErroSegura(error) {
  const mensagem = String(error?.message || error?.details || '').toLowerCase()

  if (mensagem.includes('jwt') || mensagem.includes('unauthorized') || mensagem.includes('401')) {
    return 'Sua sessão de troca de senha expirou. Solicite um novo link.'
  }

  if (mensagem.includes('weak') || mensagem.includes('password')) {
    return `Use uma senha com pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }

  return 'Não foi possível atualizar a senha agora. Tente novamente.'
}

export default function ResetPasswordPage({
  modo = 'recuperacao',
  sessao,
  erroLink = '',
  onComplete,
  onExit
}) {
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [tipoMensagem, setTipoMensagem] = useState('erro')

  const primeiroAcesso = modo === 'primeiro-acesso'
  const possuiSessao = Boolean(sessao?.user?.id)

  async function salvarSenha(event) {
    event.preventDefault()
    setMensagem('')

    if (!possuiSessao) {
      setTipoMensagem('erro')
      setMensagem('O link não possui uma sessão válida. Solicite um novo acesso.')
      return
    }

    if (novaSenha.length < MIN_PASSWORD_LENGTH) {
      setTipoMensagem('erro')
      setMensagem(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }

    if (novaSenha !== confirmacao) {
      setTipoMensagem('erro')
      setMensagem('As senhas não conferem.')
      return
    }

    setSalvando(true)

    try {
      const { data, error } = await supabase.functions.invoke('concluir-troca-senha', {
        body: { novaSenha }
      })

      if (error) throw error
      if (data?.ok === false) throw new Error(data?.message || 'Falha ao atualizar a senha.')

      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        console.warn('Senha atualizada, mas a sessão não foi renovada imediatamente:', refreshError.message)
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.warn('Senha atualizada, mas os metadados do usuário não foram recarregados imediatamente:', userError.message)
      }

      setTipoMensagem('sucesso')
      setMensagem('Senha atualizada com sucesso.')

      await onComplete?.(userData?.user || refreshData?.session?.user || sessao.user)
    } catch (error) {
      console.warn('Falha ao concluir troca de senha:', error)
      setTipoMensagem('erro')
      setMensagem(mensagemErroSegura(error))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={salvarSenha}>
        <div style={styles.brand}>DNA Gestão</div>
        <h1 style={styles.title}>
          {primeiroAcesso ? 'Defina sua senha definitiva' : 'Redefina sua senha'}
        </h1>
        <p style={styles.subtitle}>
          {primeiroAcesso
            ? 'Por segurança, a senha provisória não pode continuar sendo usada.'
            : 'Crie uma nova senha para recuperar o acesso à sua conta.'}
        </p>

        {!possuiSessao && (
          <div style={styles.errorBox}>
            {erroLink || 'Este link expirou, já foi utilizado ou não é válido.'}
          </div>
        )}

        {possuiSessao && (
          <>
            <label style={styles.label}>
              <span>Nova senha</span>
              <input
                style={styles.input}
                type="password"
                value={novaSenha}
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                onChange={(event) => setNovaSenha(event.target.value)}
                placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
                disabled={salvando}
                required
              />
            </label>

            <label style={styles.label}>
              <span>Confirmar nova senha</span>
              <input
                style={styles.input}
                type="password"
                value={confirmacao}
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                onChange={(event) => setConfirmacao(event.target.value)}
                placeholder="Digite novamente"
                disabled={salvando}
                required
              />
            </label>

            <small style={styles.help}>
              Use uma senha exclusiva, longa e diferente da senha provisória.
            </small>

            {mensagem && (
              <div style={tipoMensagem === 'sucesso' ? styles.successBox : styles.errorBox}>
                {mensagem}
              </div>
            )}

            <button style={styles.primaryButton} type="submit" disabled={salvando}>
              {salvando ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </>
        )}

        <button style={styles.secondaryButton} type="button" onClick={onExit} disabled={salvando}>
          Sair e voltar ao login
        </button>
      </form>
    </div>
  )
}

const styles = {
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
    maxWidth: 430,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    padding: 24,
    borderRadius: 18,
    background: '#fff',
    boxShadow: '0 12px 34px rgba(0, 0, 0, 0.12)'
  },
  brand: {
    color: '#198754',
    fontWeight: 800,
    letterSpacing: 0.4
  },
  title: {
    margin: 0,
    color: '#1f2937',
    fontSize: 26
  },
  subtitle: {
    margin: 0,
    color: '#6b7280',
    lineHeight: 1.5
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    color: '#374151',
    fontWeight: 700,
    fontSize: 14
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: 12,
    border: '1px solid #d1d5db',
    borderRadius: 10,
    fontSize: 15
  },
  help: {
    color: '#6b7280',
    lineHeight: 1.4
  },
  errorBox: {
    padding: 11,
    borderRadius: 10,
    background: '#fef2f2',
    color: '#991b1b',
    fontSize: 14,
    lineHeight: 1.4
  },
  successBox: {
    padding: 11,
    borderRadius: 10,
    background: '#ecfdf5',
    color: '#065f46',
    fontSize: 14,
    lineHeight: 1.4
  },
  primaryButton: {
    width: '100%',
    padding: 12,
    border: 'none',
    borderRadius: 10,
    background: '#198754',
    color: '#fff',
    fontWeight: 800,
    fontSize: 15,
    cursor: 'pointer'
  },
  secondaryButton: {
    width: '100%',
    padding: 11,
    border: '1px solid #d1d5db',
    borderRadius: 10,
    background: '#fff',
    color: '#374151',
    fontWeight: 700,
    cursor: 'pointer'
  }
}
