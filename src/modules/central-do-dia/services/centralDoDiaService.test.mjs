import assert from 'node:assert/strict'
import test from 'node:test'
import { listarAtividadeRecenteCentral } from './centralDoDiaService.js'

function criarSupabaseMock() {
  const chamadas = []
  const consulta = {
    select(campos) { chamadas.push(['select', campos]); return this },
    eq(campo, valor) { chamadas.push(['eq', campo, valor]); return this },
    order(campo, opcoes) { chamadas.push(['order', campo, opcoes]); return this },
    limit(valor) { chamadas.push(['limit', valor]); return Promise.resolve({ data: [], error: null }) }
  }
  return {
    chamadas,
    cliente: {
      from(tabela) { chamadas.push(['from', tabela]); return consulta }
    }
  }
}

test('consulta somente a tabela de eventos, filtrada por empresa, ordenada e limitada', async () => {
  const mock = criarSupabaseMock()
  const resposta = await listarAtividadeRecenteCentral({ supabase: mock.cliente, empresaId: 'empresa-1' })

  assert.deepEqual(resposta, { data: [], error: null })
  assert.equal(mock.chamadas[0][1], 'df_auditoria_eventos')
  assert.deepEqual(mock.chamadas.find(([tipo]) => tipo === 'eq'), ['eq', 'empresa_id', 'empresa-1'])
  assert.deepEqual(mock.chamadas.find(([tipo]) => tipo === 'order'), ['order', 'criado_em', { ascending: false }])
  assert.deepEqual(mock.chamadas.find(([tipo]) => tipo === 'limit'), ['limit', 12])
})

test('não inicia consulta sem empresa', async () => {
  const mock = criarSupabaseMock()
  const resposta = await listarAtividadeRecenteCentral({ supabase: mock.cliente, empresaId: '' })

  assert.equal(resposta.data.length, 0)
  assert.ok(resposta.error instanceof Error)
  assert.equal(mock.chamadas.length, 0)
})
