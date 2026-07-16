import test from 'node:test'
import assert from 'node:assert/strict'
import {
  INDICE_RECORRENCIA_ATIVA,
  ehConflitoRecorrenciaAtiva,
  executarPlanejamentoRecorrencias
} from './recorrenciaPlanejamento.js'

const conflito = () => ({ code: '23505', constraint: INDICE_RECORRENCIA_ATIVA })

test('23505 esperado não rejeita o planejamento', async () => {
  const resultado = await executarPlanejamentoRecorrencias({
    planejar: async () => [{ id: 'a' }],
    inserir: async () => ({ data: null, error: conflito() }),
    reconciliar: async () => []
  })
  assert.equal(resultado.erro, null)
  assert.equal(resultado.parcial, false)
})

test('erro de rede retorna erro não bloqueante', async () => {
  const erro = new Error('rede indisponível')
  const resultado = await executarPlanejamentoRecorrencias({
    planejar: async () => [{ id: 'a' }],
    inserir: async () => ({ data: null, error: erro }),
    reconciliar: async () => []
  })
  assert.equal(resultado.erro, erro)
})

test('duas operações concorrentes reconciliam sem duplicidade', async () => {
  let insercoes = 0
  const resultado = await executarPlanejamentoRecorrencias({
    planejar: async () => [{ identidade: 's|2026-08-01' }],
    inserir: async () => {
      insercoes += 1
      return insercoes === 1 ? { error: conflito() } : { data: [] }
    },
    reconciliar: async () => []
  })
  assert.equal(insercoes, 1)
  assert.deepEqual(resultado.jaExistentes, [{ identidade: 's|2026-08-01' }])
})

test('segundo 23505 termina parcial e não bloqueante', async () => {
  let insercoes = 0
  const resultado = await executarPlanejamentoRecorrencias({
    planejar: async () => [{ identidade: 'a' }, { identidade: 'b' }],
    inserir: async () => { insercoes += 1; return { error: conflito() } },
    reconciliar: async () => [{ identidade: 'b' }]
  })
  assert.equal(insercoes, 2)
  assert.equal(resultado.parcial, true)
  assert.equal(resultado.erro, null)
})

test('não existe terceira tentativa', async () => {
  let insercoes = 0
  await executarPlanejamentoRecorrencias({
    planejar: async () => [{ identidade: 'a' }],
    inserir: async () => { insercoes += 1; return { error: conflito() } },
    reconciliar: async () => [{ identidade: 'a' }]
  })
  assert.equal(insercoes, 2)
})

test('inserção parcial seguida de conflito é reconciliada', async () => {
  const resultado = await executarPlanejamentoRecorrencias({
    planejar: async () => [{ identidade: 'a' }, { identidade: 'b' }],
    inserir: async () => ({ error: conflito() }),
    reconciliar: async () => [{ identidade: 'b' }]
  })
  assert.deepEqual(resultado.jaExistentes, [{ identidade: 'a' }])
})

test('23505 de outro índice permanece erro real', async () => {
  const erro = { code: '23505', constraint: 'outro_indice' }
  const resultado = await executarPlanejamentoRecorrencias({
    planejar: async () => [{ identidade: 'a' }],
    inserir: async () => ({ error: erro }),
    reconciliar: async () => []
  })
  assert.equal(resultado.erro, erro)
  assert.equal(ehConflitoRecorrenciaAtiva(erro), false)
})

test('criação aciona planejamento explicitamente', async () => {
  let chamadas = 0
  await executarPlanejamentoRecorrencias({ motivo: 'criacao', planejar: async () => { chamadas += 1; return [] } })
  assert.equal(chamadas, 1)
})

test('atualização aciona planejamento explicitamente', async () => {
  let chamadas = 0
  await executarPlanejamentoRecorrencias({ motivo: 'atualizacao', planejar: async () => { chamadas += 1; return [] } })
  assert.equal(chamadas, 1)
})

test('reativação aciona planejamento explicitamente', async () => {
  let chamadas = 0
  await executarPlanejamentoRecorrencias({ motivo: 'reativacao', planejar: async () => { chamadas += 1; return [] } })
  assert.equal(chamadas, 1)
})

test('carregamento inicial não é motivo válido para planejamento', async () => {
  let chamadas = 0
  const resultado = await executarPlanejamentoRecorrencias({ motivo: 'carregamento', planejar: async () => { chamadas += 1; return [] } })
  assert.equal(chamadas, 0)
  assert.equal(resultado.ignorado, true)
})

test('sincronização realtime não é motivo válido para planejamento', async () => {
  let chamadas = 0
  const resultado = await executarPlanejamentoRecorrencias({ motivo: 'realtime', planejar: async () => { chamadas += 1; return [] } })
  assert.equal(chamadas, 0)
  assert.equal(resultado.ignorado, true)
})
