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
