import assert from 'node:assert/strict'
import test from 'node:test'
import { executarAtualizacaoCentral } from './centralDoDiaRefresh.js'
test('refresh executa financeiro, notas e Pessoas mesmo com erro parcial', async () => {
  const chamadas = []
  const resultados = await executarAtualizacaoCentral([
    async () => chamadas.push('financeiro'),
    async () => { chamadas.push('notas'); throw new Error('falha-notas') },
    async () => chamadas.push('pessoas')
  ])

  assert.deepEqual(chamadas.sort(), ['financeiro', 'notas', 'pessoas'])
  assert.deepEqual(resultados.map((item) => item.status).sort(), ['fulfilled', 'fulfilled', 'rejected'])
})
