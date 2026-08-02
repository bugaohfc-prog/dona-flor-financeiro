import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calcularFimPeriodoFerias,
  calcularProximaParcelaFerias,
  calcularRetornoPeriodoFerias,
  derivarStatusPeriodoFerias,
  normalizarDataCivilFerias,
  periodosFeriasSeSobrepoem,
  resumirCicloFerias,
  rotularStatusCicloFerias
} from './funcionariosFeriasRules.js'

const ciclo = {
  id: 'ciclo',
  dias_direito: 30,
  periodo_aquisitivo_fim: '2025-07-31',
  data_limite_gozo: '2026-07-31',
  status: 'pendente',
  arquivado: false
}

function periodo(id, inicio, dias, extras = {}) {
  return {
    id,
    numero_parcela: Number(id.replace(/\D/g, '')) || 1,
    data_inicio: inicio,
    quantidade_dias: dias,
    data_fim_calculada: calcularFimPeriodoFerias(inicio, dias),
    data_retorno_trabalho: calcularRetornoPeriodoFerias(inicio, dias),
    status: 'agendada',
    arquivado: false,
    ...extras
  }
}

test('datas civis calculam fim e retorno sem deslocamento e aceitam ano bissexto', () => {
  assert.equal(normalizarDataCivilFerias('2028-02-29T23:30:00-03:00'), '2028-02-29')
  assert.equal(normalizarDataCivilFerias('2027-02-29'), '')
  assert.equal(calcularFimPeriodoFerias('2028-02-28', 3), '2028-03-01')
  assert.equal(calcularRetornoPeriodoFerias('2028-02-28', 3), '2028-03-02')
})

test('deriva periodo agendado, em gozo e gozado pela mesma data civil', () => {
  const item = periodo('p1', '2026-08-10', 10)
  assert.equal(derivarStatusPeriodoFerias(item, '2026-08-01'), 'agendada')
  assert.equal(derivarStatusPeriodoFerias(item, '2026-08-15'), 'em_gozo')
  assert.equal(derivarStatusPeriodoFerias(item, '2026-08-20'), 'gozada')
})

test('preserva cancelamento, arquivamento e legado concluido como estados explicitos', () => {
  const item = periodo('p1', '2026-08-10', 10)
  assert.equal(derivarStatusPeriodoFerias({ ...item, status: 'cancelada' }, '2026-08-01'), 'cancelada')
  assert.equal(derivarStatusPeriodoFerias({ ...item, arquivado: true }, '2026-08-01'), 'arquivada')
  assert.equal(derivarStatusPeriodoFerias({ ...item, status: 'concluida' }, '2026-08-01'), 'gozada')
})

test('separa programados, em gozo, gozados, saldo livre e saldo ainda nao gozado', () => {
  const resumo = resumirCicloFerias({
    ciclo,
    dataReferencia: '2026-07-15',
    periodos: [
      periodo('p1', '2026-06-01', 5),
      periodo('p2', '2026-07-10', 10),
      periodo('p3', '2026-08-01', 5)
    ]
  })
  assert.deepEqual({
    programados: resumo.diasProgramados,
    emGozo: resumo.diasEmGozo,
    gozados: resumo.diasGozados,
    livre: resumo.saldoLivreParaProgramar,
    naoGozado: resumo.saldoAindaNaoGozado
  }, { programados: 5, emGozo: 10, gozados: 5, livre: 10, naoGozado: 25 })
  assert.equal(resumo.statusOperacional, 'em_gozo')
})

test('deriva ciclo em aquisicao, disponivel, parcial, programado, concluido e vencido', () => {
  assert.equal(resumirCicloFerias({ ciclo, dataReferencia: '2025-07-01' }).statusOperacional, 'em_aquisicao')
  assert.equal(resumirCicloFerias({ ciclo, dataReferencia: '2026-01-01' }).statusOperacional, 'disponivel')
  assert.equal(resumirCicloFerias({ ciclo, periodos: [periodo('p1', '2026-06-01', 10)], dataReferencia: '2026-07-01' }).statusOperacional, 'parcial')
  assert.equal(resumirCicloFerias({ ciclo, periodos: [periodo('p1', '2026-08-01', 30)], dataReferencia: '2026-07-01' }).statusOperacional, 'programada')
  assert.equal(resumirCicloFerias({ ciclo, periodos: [periodo('p1', '2026-06-01', 30)], dataReferencia: '2026-07-01' }).statusOperacional, 'concluida')
  assert.equal(resumirCicloFerias({ ciclo, dataReferencia: '2026-08-01' }).statusOperacional, 'vencida')
})

test('cancelar ou arquivar libera reserva e reativar volta a reservar', () => {
  const ativo = periodo('p1', '2026-08-01', 10)
  const cancelado = { ...ativo, status: 'cancelada' }
  const arquivado = { ...ativo, arquivado: true }
  assert.equal(resumirCicloFerias({ ciclo, periodos: [ativo], dataReferencia: '2026-07-01' }).saldoLivreParaProgramar, 20)
  assert.equal(resumirCicloFerias({ ciclo, periodos: [cancelado], dataReferencia: '2026-07-01' }).saldoLivreParaProgramar, 30)
  assert.equal(resumirCicloFerias({ ciclo, periodos: [arquivado], dataReferencia: '2026-07-01' }).saldoLivreParaProgramar, 30)
  assert.equal(resumirCicloFerias({ ciclo, periodos: [{ ...arquivado, arquivado: false }], dataReferencia: '2026-07-01' }).saldoLivreParaProgramar, 20)
})

test('proxima parcela usa vaga ativa e identifica limite de tres', () => {
  const itens = [periodo('p1', '2026-08-01', 5), periodo('p3', '2026-09-01', 5)]
  assert.equal(calcularProximaParcelaFerias(itens), 2)
  assert.equal(calcularProximaParcelaFerias([...itens, periodo('p2', '2026-10-01', 5)]), null)
})

test('detecta sobreposicao pelo intervalo civil semiaberto', () => {
  const primeiro = periodo('p1', '2026-08-01', 10)
  assert.equal(periodosFeriasSeSobrepoem(primeiro, periodo('p2', '2026-08-11', 2)), false)
  assert.equal(periodosFeriasSeSobrepoem(primeiro, periodo('p2', '2026-08-09', 2)), true)
})

test('rotulo canonico remove divergencia entre status persistido e calculado', () => {
  const resumo = resumirCicloFerias({ ciclo: { ...ciclo, status: 'pendente' }, periodos: [periodo('p1', '2026-08-01', 30)], dataReferencia: '2026-07-01' })
  assert.equal(rotularStatusCicloFerias(resumo.statusOperacional), 'Programada')
})

test('alteracao isolada da admissao nao reescreve ciclos historicos neste lote', () => {
  const periodos = [periodo('p1', '2026-08-01', 10)]
  const antes = resumirCicloFerias({ ciclo: { ...ciclo, data_admissao: '2020-01-10' }, periodos, dataReferencia: '2026-07-01' })
  const depois = resumirCicloFerias({ ciclo: { ...ciclo, data_admissao: '2021-03-20' }, periodos, dataReferencia: '2026-07-01' })

  assert.deepEqual(depois, antes)
})
