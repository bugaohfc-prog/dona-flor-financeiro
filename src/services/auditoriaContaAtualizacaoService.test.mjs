import assert from 'node:assert/strict'
import test from 'node:test'
import {
  criarCorrelationIdAtualizacaoConta,
  montarPayloadAuditoriaAtualizacaoConta,
  registrarAuditoriaAtualizacaoConta
} from './auditoriaContaAtualizacaoService.js'

const CONTA_ID = '11111111-1111-4111-8111-111111111111'
const EMPRESA_ID = '22222222-2222-4222-8222-222222222222'
const OPERACAO_A = '33333333-3333-4333-8333-333333333333'
const OPERACAO_B = '44444444-4444-4444-8444-444444444444'

test('gera uma chave estável por operação e diferente em nova edição', () => {
  const primeira = criarCorrelationIdAtualizacaoConta(CONTA_ID, OPERACAO_A)
  const repeticao = criarCorrelationIdAtualizacaoConta(CONTA_ID, OPERACAO_A)
  const segunda = criarCorrelationIdAtualizacaoConta(CONTA_ID, OPERACAO_B)

  assert.equal(primeira, `financeiro.conta.atualizada:${CONTA_ID}:${OPERACAO_A}`)
  assert.equal(repeticao, primeira)
  assert.notEqual(segunda, primeira)
  assert.ok(primeira.length <= 180)
})

test('monta somente o payload sanitizado permitido para atualização', () => {
  const correlationId = criarCorrelationIdAtualizacaoConta(CONTA_ID, OPERACAO_A)
  const payload = montarPayloadAuditoriaAtualizacaoConta({
    empresaId: EMPRESA_ID,
    contaId: CONTA_ID,
    correlationId
  })

  assert.deepEqual(Object.keys(payload).sort(), [
    'acao', 'correlation_id', 'dados_antes', 'dados_depois', 'empresa_id',
    'entidade_id', 'entidade_tipo', 'metadados', 'modulo', 'origem',
    'severidade', 'status'
  ])
  assert.equal(payload.acao, 'financeiro.conta.atualizada')
  assert.equal(payload.entidade_tipo, 'df_contas')
  assert.equal(payload.entidade_id, CONTA_ID)
  assert.equal(payload.empresa_id, EMPRESA_ID)
  assert.equal(payload.correlation_id, correlationId)
  assert.deepEqual(payload.dados_antes, null)
  assert.deepEqual(payload.dados_depois, {
    campos: ['descricao', 'valor', 'vencimento', 'centro_custo', 'filial', 'imposto_tipo']
  })
  assert.deepEqual(payload.metadados, { conta_id: CONTA_ID })
})

test('preserva correlation_id em repetição e trata resposta ok false', async () => {
  const correlationId = criarCorrelationIdAtualizacaoConta(CONTA_ID, OPERACAO_A)
  const bodies = []
  const supabase = {
    functions: {
      invoke: async (_nome, options) => {
        bodies.push(options.body)
        return {
          data: { ok: false, code: 'EVENTO_DUPLICADO', message: 'Evento já registrado.' },
          error: null
        }
      }
    }
  }

  const originalWarn = console.warn
  console.warn = () => {}
  try {
    const primeira = await registrarAuditoriaAtualizacaoConta({
      supabase,
      empresaId: EMPRESA_ID,
      contaId: CONTA_ID,
      correlationId
    })
    const repeticao = await registrarAuditoriaAtualizacaoConta({
      supabase,
      empresaId: EMPRESA_ID,
      contaId: CONTA_ID,
      correlationId
    })

    assert.equal(primeira.code, 'EVENTO_DUPLICADO')
    assert.equal(repeticao.code, 'EVENTO_DUPLICADO')
    assert.equal(bodies.length, 2)
    assert.equal(bodies[0].correlation_id, correlationId)
    assert.equal(bodies[1].correlation_id, correlationId)
  } finally {
    console.warn = originalWarn
  }
})

test('trata response.error sem propagar falha para a edição financeira', async () => {
  const supabase = {
    functions: {
      invoke: async () => ({
        data: null,
        error: { code: 'FUNCTIONS_HTTP_ERROR', message: 'detalhe não confiável' }
      })
    }
  }

  const originalWarn = console.warn
  console.warn = () => {}
  try {
    const resultado = await registrarAuditoriaAtualizacaoConta({
      supabase,
      empresaId: EMPRESA_ID,
      contaId: CONTA_ID,
      correlationId: criarCorrelationIdAtualizacaoConta(CONTA_ID, OPERACAO_A)
    })

    assert.equal(resultado.code, 'FUNCTIONS_HTTP_ERROR')
    assert.equal(resultado.message, 'Falha de transporte ao registrar a auditoria da atualização.')
    assert.ok(resultado.error)
  } finally {
    console.warn = originalWarn
  }
})
