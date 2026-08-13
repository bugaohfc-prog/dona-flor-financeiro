function criarDataCivil(dataReferencia) {
  if (!dataReferencia) return null
  if (dataReferencia instanceof Date) {
    return Number.isNaN(dataReferencia.getTime()) ? null : dataReferencia
  }
  const texto = String(dataReferencia).trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null

  const [ano, mes, dia] = texto.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))

  if (
    Number.isNaN(data.getTime()) ||
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) return null

  return data
}

function formatarDataISO(data) {
  const ano = data.getUTCFullYear()
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0')
  const dia = String(data.getUTCDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function calcularProximoPeriodico(dataReferencia) {
  const data = criarDataCivil(dataReferencia)
  if (!data) return null

  const proximaData = new Date(data)
  proximaData.setUTCFullYear(proximaData.getUTCFullYear() + 1)
  return formatarDataISO(proximaData)
}
