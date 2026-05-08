import { useEffect, useRef, useState } from 'react'

export const SESSAO_STORAGE_KEY = 'df_sessao_segura'
export const OITO_HORAS_MS = 8 * 60 * 60 * 1000
export const TRINTA_MINUTOS_MS = 30 * 60 * 1000
export const VINTE_CINCO_MINUTOS_MS = 25 * 60 * 1000

export function lerSessaoSegura() {
  try {
    return JSON.parse(localStorage.getItem(SESSAO_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function salvarSessaoSegura(dados) {
  localStorage.setItem(SESSAO_STORAGE_KEY, JSON.stringify(dados))
}

export function limparSessaoSegura() {
  localStorage.removeItem(SESSAO_STORAGE_KEY)
}

/**
 * Hook-base preparado para a próxima etapa de desacoplamento.
 * Nesta fase ele fica disponível sem alterar o fluxo validado do App.jsx.
 */
export function useAuthSessionState() {
  const avisoSessaoMostradoRef = useRef(false)
  const encerrandoSessaoRef = useRef(false)
  const [usuarioLogado, setUsuarioLogado] = useState(null)
  const [carregandoAuth, setCarregandoAuth] = useState(true)

  return {
    avisoSessaoMostradoRef,
    encerrandoSessaoRef,
    usuarioLogado,
    setUsuarioLogado,
    carregandoAuth,
    setCarregandoAuth
  }
}
