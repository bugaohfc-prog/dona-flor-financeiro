import test from 'node:test'
import assert from 'node:assert/strict'
import {
  adicionarGruposPadraoAoEstado,
  calcularHorizonteRecorrencias,
  criarEstadoInicialGruposPeriodo,
  planejarContasRecorrentes
} from './recorrenciaPlanejamento.js'

const serie = (sobrescritas = {}) => ({
  id: 'serie-1', ativo: true, tipo_recorrencia: 'mensal', dia_vencimento: 31,
  data_inicio: '2026-07-01', descricao: 'Imposto', valor: 100, ...sobrescritas
})

test('horizonte cobre data-base mais noventa dias ate o fim do mes', () => {
  const horizonte = calcularHorizonteRecorrencias('2026-07-15', 90)
  assert.deepEqual(horizonte.chavesMeses, ['2026-07', '2026-08', '2026-09', '2026-10'])
  assert.equal(horizonte.fim.toISOString().slice(0, 10), '2026-10-31')
})

test('horizonte atravessa mudanca de ano', () => {
  assert.deepEqual(calcularHorizonteRecorrencias('2026-11-20').chavesMeses, ['2026-11', '2026-12', '2027-01', '2027-02'])
})

test('monta vencimentos seguros nos dias 29, 30 e 31', () => {
  for (const dia of [29, 30, 31]) {
    const plano = planejarContasRecorrentes({ dataBase: '2027-01-10', seriesRecorrentes: [serie({ dia_vencimento: dia })] })
    assert.equal(plano.ocorrencias[1].dataVencimento, '2027-02-28')
  }
})

test('respeita inicio futuro, serie inativa e frequencia nao mensal', () => {
  const plano = planejarContasRecorrentes({
    dataBase: '2026-07-01',
    seriesRecorrentes: [
      serie({ id: 'futura', data_inicio: '2026-08-15', dia_vencimento: 10 }),
      serie({ id: 'inativa', ativo: false }),
      serie({ id: 'anual', tipo_recorrencia: 'anual' })
    ]
  })
  assert.deepEqual(plano.ocorrencias.map((item) => item.dataVencimento), ['2026-09-10'])
})

test('planeja varios meses em lote e segunda execucao gera zero duplicidades', () => {
  const primeiro = planejarContasRecorrentes({ dataBase: '2026-07-15', seriesRecorrentes: [serie()] })
  assert.equal(primeiro.ocorrencias.length, 4)
  const existentes = primeiro.ocorrencias.map((item, indice) => ({ id: `c-${indice}`, recorrencia_id: 'serie-1', data_vencimento: item.dataVencimento }))
  const segundo = planejarContasRecorrentes({ dataBase: '2026-07-15', seriesRecorrentes: [serie()], contasExistentes: existentes })
  assert.equal(segundo.ocorrencias.length, 0)
})

test('deduplica somente por recorrencia e vencimento', () => {
  const plano = planejarContasRecorrentes({
    dataBase: '2026-07-15', seriesRecorrentes: [serie()],
    contasExistentes: [{ recorrencia_id: 'serie-1', data_vencimento: '2026-07-31', descricao: 'Outra' }]
  })
  assert.equal(plano.ocorrencias.some((item) => item.dataVencimento === '2026-07-31'), false)
})

test('preserva imposto e avanca competencia inclusive dezembro e janeiro', () => {
  const plano = planejarContasRecorrentes({
    dataBase: '2026-12-05', seriesRecorrentes: [serie({ data_inicio: '2026-01-01' })],
    contasExistentes: [{
      recorrencia_id: 'serie-1', data_vencimento: '2026-12-31', imposto_tipo: 'simples_nacional', competencia: '2026-11-01'
    }]
  })
  const janeiro = plano.ocorrencias.find((item) => item.dataVencimento === '2027-01-31')
  assert.equal(janeiro.impostoTipo, 'simples_nacional')
  assert.equal(janeiro.competencia, '2026-12-01')
  const fevereiro = plano.ocorrencias.find((item) => item.dataVencimento === '2027-02-28')
  assert.equal(fevereiro.competencia, '2027-01-01')
})

test('recorrencia nao fiscal permanece sem metadados fiscais e existentes nao sao alteradas', () => {
  const existente = { recorrencia_id: 'serie-1', data_vencimento: '2026-07-31', imposto_tipo: 'inss', competencia: '2026-06-01' }
  const plano = planejarContasRecorrentes({ dataBase: '2026-07-15', seriesRecorrentes: [serie({ id: 'serie-2' })], contasExistentes: [existente] })
  assert.equal(plano.ocorrencias[0].impostoTipo, null)
  assert.equal(plano.ocorrencias[0].competencia, null)
  assert.equal(existente.imposto_tipo, 'inss')
})

test('abre inicialmente meses do horizonte e o mes destacado', () => {
  const grupos = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2027-01'].map((chave) => ({ chave }))
  const estado = criarEstadoInicialGruposPeriodo({ grupos, dataBase: '2026-07-15', chaveDestacada: '2027-01' })
  assert.deepEqual(Object.keys(estado), ['2026-07', '2026-08', '2026-09', '2026-10', '2027-01'])
})

test('preserva recolhimento manual ao adicionar grupos e abre destaque', () => {
  const estado = adicionarGruposPadraoAoEstado({ '2026-07': false }, {
    grupos: [{ chave: '2026-07' }, { chave: '2026-08' }, { chave: '2027-01' }],
    dataBase: '2026-07-15', chaveDestacada: '2027-01'
  })
  assert.equal(estado['2026-07'], false)
  assert.equal(estado['2026-08'], true)
  assert.equal(estado['2027-01'], true)
})
