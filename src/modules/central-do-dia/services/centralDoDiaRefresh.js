export async function executarAtualizacaoCentral(callbacks = []) {
  const tarefas = (callbacks || [])
    .filter((callback) => typeof callback === 'function')
    .map((callback) => Promise.resolve().then(callback))
  return Promise.allSettled(tarefas)
}
