export function formatarData(data) {
  const texto = String(data || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return 'Não informada'
  const [ano, mes, dia] = texto.split('-')
  return `${dia}/${mes}/${ano}`
}

export function formatarDataHora(data) {
  if (!data) return 'Não informada'
  const valor = new Date(data)
  if (Number.isNaN(valor.getTime())) return 'Não informada'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(valor)
}

export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(valor) || 0)
}

export function formatarNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return '-'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number(valor) || 0)
}

export function normalizarTexto(valor) {
  return String(valor || '').trim()
}

export function normalizarBusca(valor) {
  return normalizarTexto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function parseNumeroFormulario(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const texto = String(valor).trim()
  const partesHora = texto.match(/^(\d+)\s*:\s*([0-5]\d)$/)
  const numero = partesHora
    ? Number(partesHora[1]) + (Number(partesHora[2]) / 60)
    : Number(texto.replace(',', '.'))
  return Number.isFinite(numero) ? numero : null
}

export function formatarValorFormulario(valor) {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return ''
  return numero.toFixed(2)
}
