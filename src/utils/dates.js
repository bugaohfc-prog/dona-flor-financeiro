export function dataLocal(data) {
  if (!data) return null
  const valor = String(data).slice(0, 10)
  return new Date(valor + 'T00:00:00')
}

export function diferencaDias(data) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const alvo = dataLocal(data)
  if (!alvo) return 999999

  const diff = alvo - hoje
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

export function mesmoMesAtual(data) {
  const alvo = dataLocal(data)
  if (!alvo) return false

  const hoje = new Date()
  return alvo.getMonth() === hoje.getMonth() && alvo.getFullYear() === hoje.getFullYear()
}
