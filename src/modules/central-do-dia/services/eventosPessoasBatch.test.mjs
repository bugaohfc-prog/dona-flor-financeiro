import assert from 'node:assert/strict'
import test from 'node:test'
import {
  executarConsultasEventosPessoas,
  FONTES_EVENTOS_PESSOAS
} from './eventosPessoasBatch.js'
function criarConsultas({ falhar = '' } = {}) {
  const chamadas = []
  const consultas = Object.fromEntries(FONTES_EVENTOS_PESSOAS.map((fonte) => [
    fonte,
    async ({ empresaId }) => {
      chamadas.push({ fonte, empresaId })
      if (fonte === falhar) return { data: null, error: new Error(`falha-${fonte}`) }
      return { data: [{ fonte }], error: null }
    }
  ]))
  return { consultas, chamadas }
}

test('carga de Pessoas executa cinco consultas em lote independentemente do volume', async () => {
  const { consultas, chamadas } = criarConsultas()
  const resultado = await executarConsultasEventosPessoas({ consultas, parametros: { empresaId: 'empresa-1' } })

  assert.equal(resultado.quantidadeConsultas, 5)
  assert.equal(chamadas.length, 5)
  assert.deepEqual(chamadas.map((item) => item.fonte), FONTES_EVENTOS_PESSOAS)
  assert.ok(chamadas.every((item) => item.empresaId === 'empresa-1'))
})

test('falha parcial preserva as quatro fontes bem-sucedidas', async () => {
  const { consultas } = criarConsultas({ falhar: 'exames' })
  const resultado = await executarConsultasEventosPessoas({ consultas, parametros: { empresaId: 'empresa-1' } })

  assert.deepEqual(resultado.fontesComErro, ['exames'])
  assert.equal(resultado.dados.exames.length, 0)
  assert.equal(resultado.dados.funcionarios.length, 1)
  assert.equal(resultado.dados.ciclosFerias.length, 1)
  assert.equal(resultado.dados.periodosFerias.length, 1)
  assert.equal(resultado.dados.folha.length, 1)
})

test('nova tentativa repete somente o lote constante e pode recuperar a fonte', async () => {
  let tentativa = 0
  let chamadas = 0
  const consultas = Object.fromEntries(FONTES_EVENTOS_PESSOAS.map((fonte) => [
    fonte,
    async () => {
      chamadas += 1
      if (fonte === 'folha' && tentativa === 0) throw new Error('indisponivel')
      return { data: [{ fonte }] }
    }
  ]))

  const primeira = await executarConsultasEventosPessoas({ consultas, parametros: {} })
  tentativa = 1
  const segunda = await executarConsultasEventosPessoas({ consultas, parametros: {} })

  assert.deepEqual(primeira.fontesComErro, ['folha'])
  assert.deepEqual(segunda.fontesComErro, [])
  assert.equal(chamadas, 10)
})
