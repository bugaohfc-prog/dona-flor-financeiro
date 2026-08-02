import assert from 'node:assert/strict'
import test from 'node:test'
import { calcularProximoPeriodico } from './funcionariosExamesPeriodicosRules.js'

test('periodicidade civil preserva dia na mudanca de mes e ano', () => {
  assert.equal(calcularProximoPeriodico('2025-12-31'), '2026-12-31')
  assert.equal(calcularProximoPeriodico('2025-01-01'), '2026-01-01')
})

test('periodicidade civil trata ano bissexto de forma deterministica', () => {
  assert.equal(calcularProximoPeriodico('2024-02-29'), '2025-03-01')
  assert.equal(calcularProximoPeriodico('2028-02-29'), '2029-03-01')
})

test('data civil em texto nao depende do horario da execucao', () => {
  assert.equal(calcularProximoPeriodico('2026-07-31T23:59:59-03:00'), '2027-07-31')
  assert.equal(calcularProximoPeriodico('2026-08-01T00:00:01+14:00'), '2027-08-01')
})
