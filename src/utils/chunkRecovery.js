const CHUNK_RELOAD_KEY = 'dna_gestao_chunk_reload_attempted'

export function isChunkLoadError(error) {
  const message = String(error?.message || error || '')
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Failed to load module script|ChunkLoadError|Loading chunk|dynamically imported module/i.test(message)
}

export function clearChunkReloadAttempt() {
  try {
    window.sessionStorage.removeItem(CHUNK_RELOAD_KEY)
  } catch {
    // sessionStorage can be unavailable in restricted browser contexts.
  }
}

export function handleChunkLoadError(error, context = 'app') {
  if (!isChunkLoadError(error)) return false

  console.error(`[dna-gestao] falha_chunk_${context}`, error)

  try {
    const attempted = window.sessionStorage.getItem(CHUNK_RELOAD_KEY)
    if (!attempted) {
      window.sessionStorage.setItem(CHUNK_RELOAD_KEY, context)
      window.location.reload()
      return true
    }
  } catch (storageError) {
    console.warn('[dna-gestao] falha_session_storage_chunk_reload', storageError)
  }

  return false
}

export function registerGlobalChunkErrorHandlers() {
  if (typeof window === 'undefined') return () => {}

  const onUnhandledRejection = (event) => {
    if (handleChunkLoadError(event.reason, 'unhandled_rejection')) {
      event.preventDefault?.()
    }
  }

  const onError = (event) => {
    if (handleChunkLoadError(event.error || event.message, 'window_error')) {
      event.preventDefault?.()
    }
  }

  window.addEventListener('unhandledrejection', onUnhandledRejection)
  window.addEventListener('error', onError)

  return () => {
    window.removeEventListener('unhandledrejection', onUnhandledRejection)
    window.removeEventListener('error', onError)
  }
}
