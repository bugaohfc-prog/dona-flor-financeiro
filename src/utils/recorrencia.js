import { dataLocal } from './dates'
import { primeiraLetraMaiuscula } from './format'

export function montarDataRecorrente(ano, mes, dia) {
  const ultimoDiaMes = new Date(ano, mes, 0).getDate()
  const diaSeguro = Math.min(Number(dia || 1), ultimoDiaMes)
  return `${ano}-${String(mes).padStart(2, '0')}-${String(diaSeguro).padStart(2, '0')}`
}

export function deveGerarRecorrenciaNoMes(recorrencia, ano, mes) {
  if (!recorrencia?.ativo) return false
  if ((recorrencia.tipo_recorrencia || recorrencia.frequencia || 'mensal') !== 'mensal') return false

  const inicio = recorrencia.data_inicio ? dataLocal(recorrencia.data_inicio) : null
  if (!inicio) return true

  const primeiroDiaMes = new Date(ano, mes - 1, 1)
  const ultimoDiaMes = new Date(ano, mes, 0)

  return inicio <= ultimoDiaMes && primeiroDiaMes >= new Date(inicio.getFullYear(), inicio.getMonth(), 1)
}

export function obterTipoRecorrenciaConta(conta) {
  const tipo = conta?.df_contas_recorrentes?.tipo_recorrencia || conta?.tipo_recorrencia || ''
  return String(tipo || 'mensal')
}

export function ehContaRecorrente(conta) {
  return Boolean(
    conta?.recorrencia_id ||
    conta?.df_contas_recorrentes?.tipo_recorrencia ||
    conta?.tipo_recorrencia
  )
}

export function formatarTipoRecorrencia(tipo) {
  const normalizado = String(tipo || 'mensal').toLowerCase()
  const mapa = {
    mensal: 'Mensal',
    semanal: 'Semanal',
    anual: 'Anual',
    quinzenal: 'Quinzenal'
  }
  return mapa[normalizado] || primeiraLetraMaiuscula(normalizado)
}
