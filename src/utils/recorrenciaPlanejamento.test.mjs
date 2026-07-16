import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calcularHorizonteRecorrencias,
  criarControleLoading,
  criarControleOperacao,
  executarCarregamentoContas,
  executarPlanejamentoRecorrencias,
  planejarContasRecorrentes
} from './recorrenciaPlanejamento.js'

const serie = (sobrescritas = {}) => ({
  id: 'serie-1',
  ativo: true,
  tipo_recorrencia: 'mensal',
  dia_vencimento: 31,
  data_inicio: '2026-07-01',
  descricao: 'ServiÃ§o recorrente',
  valor: 100,
  ...sobrescritas
})

test('carrega contas existentes sem executar planejamento', async () => {
  let planejou = false
  const resultado = await executarCarregamentoContas({
    carregarContas: async () => [{ id: 'conta-1' }],
    carregarSeries: async () => [serie()],
    enriquecerContas: async (contas) => contas,
    planejar: async () => { planejou = true }
  })
  assert.deepEqual(resultado.contas, [{ id: 'conta-1' }])
  assert.equal(planejou, false)
})

test('loading finaliza mesmo quando uma operaÃ§Ã£o de planejamento separada falha', async () => {
  let loading = true
  await executarCarregamentoContas({
    carregarContas: async () => [],
    carregarSeries: async () => [],
    enriquecerContas: async (contas) => contas,
    finalizar: () => { loading = false }
  })
  assert.equal(loading, false)
})

test('carregamento nÃ£o depende de promessa externa de planejamento', async () => {
  let resolverPlanejamento
  const planejamento = new Promise((resolve) => { resolverPlanejamento = resolve })
  const carregamento = executarCarregamentoContas({
    carregarContas: async () => [{ id: 'existente' }],
    carregarSeries: async () => [],
    enriquecerContas: async (contas) => contas
  })
  assert.deepEqual((await carregamento).contas, [{ id: 'existente' }])
  resolverPlanejamento()
  await planejamento
})

test('controle ignora empresa antiga apÃ³s troca', () => {
  const controle = criarControleOperacao()
  const operacaoA = controle.iniciar('empresa-a')
  controle.iniciar('empresa-b')
  assert.equal(controle.estaAtual(operacaoA), false)
})

test('controle ignora requisiÃ§Ã£o anterior da mesma empresa', () => {
  const controle = criarControleOperacao()
  const antiga = controle.iniciar('empresa-a')
  const nova = controle.iniciar('empresa-a')
  assert.equal(controle.estaAtual(antiga), false)
  assert.equal(controle.estaAtual(nova), true)
})

test('controle ignora atualizaÃ§Ã£o apÃ³s desmontagem', () => {
  const controle = criarControleOperacao()
  const operacao = controle.iniciar('empresa-a')
  controle.desmontar()
  assert.equal(controle.estaAtual(operacao), false)
})

test('horizonte mÃ­nimo cobre noventa dias atÃ© o fim do mÃªs', () => {
  const horizonte = calcularHorizonteRecorrencias('2026-07-15', 90)
  assert.deepEqual(horizonte.chavesMeses, ['2026-07', '2026-08', '2026-09', '2026-10'])
  assert.equal(horizonte.fim.toISOString().slice(0, 10), '2026-10-31')
})

test('contas existentes nÃ£o sÃ£o planejadas novamente', () => {
  const contasExistentes = [{ recorrencia_id: 'serie-1', data_vencimento: '2026-07-31' }]
  const plano = planejarContasRecorrentes({ dataBase: '2026-07-15', seriesRecorrentes: [serie()], contasExistentes })
  assert.equal(plano.ocorrencias.some((item) => item.dataVencimento === '2026-07-31'), false)
})

test('data inicial da sÃ©rie Ã© respeitada', () => {
  const plano = planejarContasRecorrentes({
    dataBase: '2026-07-15',
    seriesRecorrentes: [serie({ data_inicio: '2026-09-15', dia_vencimento: 10 })]
  })
  assert.deepEqual(plano.ocorrencias.map((item) => item.dataVencimento), ['2026-10-10'])
})

test('dias 29, 30 e 31 sÃ£o ajustados ao Ãºltimo dia do mÃªs', () => {
  for (const dia of [29, 30, 31]) {
    const plano = planejarContasRecorrentes({ dataBase: '2027-01-10', seriesRecorrentes: [serie({ dia_vencimento: dia })] })
    assert.equal(plano.ocorrencias[1].dataVencimento, '2027-02-28')
  }
})

test('descriÃ§Ã£o fiscal nÃ£o infere imposto', () => {
  const plano = planejarContasRecorrentes({
    dataBase: '2026-07-15',
    seriesRecorrentes: [serie({ descricao: 'INSS e Simples Nacional' })]
  })
  assert.equal(plano.ocorrencias[0].impostoTipo, null)
})

test('competÃªncia preserva deslocamento fiscal explÃ­cito', () => {
  const plano = planejarContasRecorrentes({
    dataBase: '2026-07-15',
    seriesRecorrentes: [serie()],
    contasExistentes: [{
      recorrencia_id: 'serie-1', data_vencimento: '2026-07-31', imposto_tipo: 'inss', competencia: '2026-06-01'
    }]
  })
  const agosto = plano.ocorrencias.find((item) => item.dataVencimento === '2026-08-31')
  assert.equal(agosto.impostoTipo, 'inss')
  assert.equal(agosto.competencia, '2026-07-01')
})

test('referÃªncia fiscal inconsistente Ã© sinalizada sem correÃ§Ã£o', () => {
  const plano = planejarContasRecorrentes({
    dataBase: '2026-07-15',
    seriesRecorrentes: [serie()],
    contasExistentes: [{ recorrencia_id: 'serie-1', data_vencimento: '2026-07-31', imposto_tipo: 'inss', competencia: 'invÃ¡lida' }]
  })
  assert.equal(plano.ocorrencias[0].impostoTipo, null)
  assert.equal(plano.inconsistencias.length, 1)
})
test('busca silenciosa que supera busca visivel nao deixa loading preso', () => {
  const controle = criarControleLoading()
  const visivel = controle.iniciar(true)
  const silenciosa = controle.iniciar(false)
  assert.equal(controle.finalizar(silenciosa), false)
  assert.equal(controle.finalizar(visivel), true)
})

test('loading antigo nao encerra enquanto busca visivel atual permanece ativa', () => {
  const controle = criarControleLoading()
  const antiga = controle.iniciar(true)
  const atual = controle.iniciar(true)
  assert.equal(controle.finalizar(antiga), false)
  assert.equal(controle.finalizar(atual), true)
})

test('desmontagem impede finalizacao tardia do loading', () => {
  const controle = criarControleLoading()
  const operacao = controle.iniciar(true)
  controle.desmontar()
  assert.equal(controle.finalizar(operacao), false)
})
