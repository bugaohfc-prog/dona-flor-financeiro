import test from 'node:test'
import assert from 'node:assert/strict'
import {
  INDICE_RECORRENCIA_ATIVA,
  inserirPlanejamentoComRepeticaoUnica,
  planejarContasRecorrentes
} from './recorrenciaPlanejamento.js'

const conflitoEsperado = (sobrescritas = {}) => ({
  code: '23505',
  constraint: INDICE_RECORRENCIA_ATIVA,
  message: `duplicate key value violates unique constraint "${INDICE_RECORRENCIA_ATIVA}"`,
  ...sobrescritas
})

test('23505 do indice esperado aciona a recarga do planejamento', async () => {
  let recargas = 0
  await inserirPlanejamentoComRepeticaoUnica({
    ocorrencias: [{ id: 'julho' }],
    inserir: async () => ({ error: conflitoEsperado() }),
    recarregarEPlanejar: async () => { recargas += 1; return [] }
  })
  assert.equal(recargas, 1)
})

test('recarga com tudo inserido pela outra sessao conclui sem segunda insercao', async () => {
  let insercoes = 0
  const resultado = await inserirPlanejamentoComRepeticaoUnica({
    ocorrencias: [{ id: 'julho' }, { id: 'agosto' }],
    inserir: async () => { insercoes += 1; return { error: conflitoEsperado() } },
    recarregarEPlanejar: async () => []
  })
  assert.equal(insercoes, 1)
  assert.deepEqual(resultado, { criadas: [], repetiu: true })
})

test('conflito esperado sem ocorrencias restantes nao produz erro ao usuario', async () => {
  const resultado = await inserirPlanejamentoComRepeticaoUnica({
    ocorrencias: [{ id: 'julho' }],
    inserir: async () => ({ data: null, error: conflitoEsperado() }),
    recarregarEPlanejar: async () => []
  })
  assert.equal(resultado.repetiu, true)
  assert.equal(resultado.criadas.length, 0)
})

test('recarga parcial entrega somente ocorrencias ausentes para a segunda tentativa', async () => {
  const lotes = []
  await inserirPlanejamentoComRepeticaoUnica({
    ocorrencias: [{ id: 'julho' }, { id: 'agosto' }],
    inserir: async (itens) => {
      lotes.push(itens)
      return lotes.length === 1 ? { error: conflitoEsperado() } : { data: itens, error: null }
    },
    recarregarEPlanejar: async () => [{ id: 'agosto' }]
  })
  assert.deepEqual(lotes[1], [{ id: 'agosto' }])
})

test('segunda tentativa retorna somente as contas restantes criadas', async () => {
  let tentativa = 0
  const resultado = await inserirPlanejamentoComRepeticaoUnica({
    ocorrencias: [{ id: 'julho' }, { id: 'agosto' }],
    inserir: async (itens) => {
      tentativa += 1
      return tentativa === 1 ? { error: conflitoEsperado() } : { data: itens, error: null }
    },
    recarregarEPlanejar: async () => [{ id: 'agosto' }]
  })
  assert.deepEqual(resultado.criadas, [{ id: 'agosto' }])
})

test('conflito repetido na segunda tentativa e propagado sem terceiro envio', async () => {
  let insercoes = 0
  await assert.rejects(
    inserirPlanejamentoComRepeticaoUnica({
      ocorrencias: [{ id: 'julho' }],
      inserir: async () => { insercoes += 1; return { error: conflitoEsperado() } },
      recarregarEPlanejar: async () => [{ id: 'julho' }]
    }),
    (erro) => erro.code === '23505'
  )
  assert.equal(insercoes, 2)
})

test('23505 de outro indice e propagado sem recarga', async () => {
  let recargas = 0
  await assert.rejects(
    inserirPlanejamentoComRepeticaoUnica({
      ocorrencias: [{ id: 'julho' }],
      inserir: async () => ({ error: conflitoEsperado({ constraint: 'outro_indice', message: 'outro conflito' }) }),
      recarregarEPlanejar: async () => { recargas += 1; return [] }
    }),
    (erro) => erro.constraint === 'outro_indice'
  )
  assert.equal(recargas, 0)
})

test('erro diferente de 23505 e propagado sem recarga', async () => {
  const erroRede = { code: 'NETWORK_ERROR', message: 'falha de rede' }
  await assert.rejects(
    inserirPlanejamentoComRepeticaoUnica({
      ocorrencias: [{ id: 'julho' }],
      inserir: async () => ({ error: erroRede }),
      recarregarEPlanejar: async () => { throw new Error('nao deveria recarregar') }
    }),
    (erro) => erro === erroRede
  )
})

test('falha nao concorrente na segunda tentativa e propagada', async () => {
  let tentativa = 0
  const erroRls = { code: '42501', message: 'acesso negado' }
  await assert.rejects(
    inserirPlanejamentoComRepeticaoUnica({
      ocorrencias: [{ id: 'julho' }],
      inserir: async () => {
        tentativa += 1
        return tentativa === 1 ? { error: conflitoEsperado() } : { error: erroRls }
      },
      recarregarEPlanejar: async () => [{ id: 'julho' }]
    }),
    (erro) => erro === erroRls
  )
  assert.equal(tentativa, 2)
})

test('planejamento normal permanece idempotente depois da primeira insercao', () => {
  const serie = { id: 'serie-1', ativo: true, tipo_recorrencia: 'mensal', dia_vencimento: 10, data_inicio: '2026-07-01' }
  const primeiro = planejarContasRecorrentes({ dataBase: '2026-07-15', seriesRecorrentes: [serie] })
  const existentes = primeiro.ocorrencias.map(({ dataVencimento }) => ({ recorrencia_id: serie.id, data_vencimento: dataVencimento }))
  const segundo = planejarContasRecorrentes({ dataBase: '2026-07-15', seriesRecorrentes: [serie], contasExistentes: existentes })
  assert.equal(segundo.ocorrencias.length, 0)
})
