export function primeiraLetraMaiuscula(texto) {
  if (!texto) return ''
  return String(texto).charAt(0).toUpperCase() + String(texto).slice(1)
}

export function formatarValor(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

export function formatarData(data) {
  if (!data) return '-'
  return new Date(String(data).slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR')
}

export function formatarDataParaBanco(valor) {
  if (!valor) return null

  const texto = String(valor).trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return texto
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const [dia, mes, ano] = texto.split('/')
    return `${ano}-${mes}-${dia}`
  }

  return texto.slice(0, 10)
}

export function limitarDataInput(valor) {
  if (!valor) return ''
  const texto = String(valor)
  if (texto.includes('-')) return texto.slice(0, 10)
  const numeros = texto.replace(/\D/g, '').slice(0, 8)
  if (numeros.length <= 2) return numeros
  if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`
  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4, 8)}`
}

export function converterValor(valorDigitado) {
  return Number(String(valorDigitado).replace(',', '.'))
}

export function money(value) {
  return formatarValor(value)
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function dateBR(value) {
  return formatarData(value)
}

export function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
