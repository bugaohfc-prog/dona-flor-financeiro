export function estaVencida(data, status) {
  if (!data || status === 'pago') return false

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const vencimento = new Date(`${data}T00:00:00`)
  vencimento.setHours(0, 0, 0, 0)

  return vencimento < hoje
}

export function pegarMes(data) {
  if (!data) return ''
  return String(data).slice(0, 7)
}
