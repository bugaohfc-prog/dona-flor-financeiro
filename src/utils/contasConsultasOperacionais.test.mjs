import test from 'node:test'
import assert from 'node:assert/strict'
import { executarConsultaPaginada } from '../services/supabasePaginationService.js'
import { criarControleOperacao } from './recorrenciaPlanejamento.js'
import {
  calcularPeriodoPagas,
  calcularResumoFinanceiroContas,
  carregarFonteContextualContas,
  contaEstaAtiva,
  contasParaExportacao,
  deveConsultarSobDemanda,
  filtrarContasPorModo,
  interpretarTermoBuscaContas,
  invalidarConsultaContas,
  mesclarPaginaContas,
  obterPeriodoConsultaPagas,
  restaurarModoAoLimparBusca,
  selecionarFonteContas,
  selecionarFonteContextualContas
} from './contasConsultasOperacionais.js'

function conta(id, status, data, extras = {}) {
  return { id, status, data_vencimento: data, oculto: false, excluido: false, deletado: false, ...extras }
}

test('paginacao retorna mais de 1000 registros sem perda', async () => {
  const origem = Array.from({ length: 1205 }, (_, i) => conta(i + 1, 'pendente', `2026-08-${String((i % 28) + 1).padStart(2, '0')}`))
  const resposta = await executarConsultaPaginada(() => ({ range: async (inicio, fim) => ({ data: origem.slice(inicio, fim + 1), error: null }) }), { tamanhoPagina: 500 })
  assert.equal(resposta.data.length, 1205)
  assert.equal(new Set(resposta.data.map((item) => item.id)).size, 1205)
})

test('paginacao preserva ordenacao estavel da consulta', async () => {
  const origem = [conta('a', 'pendente', '2026-07-20'), conta('b', 'pendente', '2026-07-20'), conta('c', 'pendente', '2026-08-01')]
  const resposta = await executarConsultaPaginada(() => ({ range: async (inicio, fim) => ({ data: origem.slice(inicio, fim + 1), error: null }) }), { tamanhoPagina: 2 })
  assert.deepEqual(resposta.data.map((item) => item.id), ['a', 'b', 'c'])
})

test('visao inicial inclui vencidas e futuras', () => {
  const dados = [conta('v', 'pendente', '2026-07-18'), conta('f', 'pendente', '2027-01-10')]
  assert.deepEqual(filtrarContasPorModo(dados, 'pendentes', '2026-07-19').map((item) => item.id), ['v', 'f'])
})

test('visao inicial exclui pagas', () => {
  assert.deepEqual(filtrarContasPorModo([conta('p', 'pago', '2026-07-18')], 'pendentes', '2026-07-19'), [])
})

test('consulta de pagas nao ocorre antes da aba', () => {
  assert.equal(deveConsultarSobDemanda({ modo: 'pendentes' }), null)
  assert.equal(deveConsultarSobDemanda({ modo: 'pagas' }), 'pagas')
})

test('pagas respeita mes, ano e intervalo', () => {
  assert.deepEqual(calcularPeriodoPagas('mes_atual', { dataReferencia: '2026-07-19T12:00:00' }), { dataInicial: '2026-07-01', dataFinal: '2026-07-31', hoje: '2026-07-19' })
  assert.deepEqual(calcularPeriodoPagas('ano', { dataReferencia: '2026-07-19T12:00:00', ano: '2025' }), { dataInicial: '2025-01-01', dataFinal: '2025-12-31', hoje: '2026-07-19' })
  assert.deepEqual(calcularPeriodoPagas('intervalo', { dataReferencia: '2026-07-19T12:00:00', dataInicial: '2024-01-02', dataFinal: '2024-02-03' }), { dataInicial: '2024-01-02', dataFinal: '2024-02-03', hoje: '2026-07-19' })
})

test('busca global pode exibir paga vencida aberta e futura', () => {
  const busca = [conta('p', 'pago', '2026-01-01'), conta('v', 'pendente', '2026-01-01'), conta('a', 'pendente', '2026-07-19'), conta('f', 'pendente', '2027-01-01')]
  assert.equal(selecionarFonteContas({ operacionais: [], busca, termo: 'energia', modo: 'todas' }).length, 4)
})

test('limpar busca restaura Em aberto', () => {
  assert.equal(restaurarModoAoLimparBusca(true, ''), 'pendentes')
})

test('excluidas e deletadas nunca aparecem', () => {
  const dados = [conta('e', 'pendente', '2026-08-01', { excluido: true }), conta('d', 'pendente', '2026-08-01', { deletado: true })]
  assert.equal(dados.some(contaEstaAtiva), false)
  assert.equal(filtrarContasPorModo(dados, 'todas').length, 0)
})

test('ocultas aparecem somente no modo correto', () => {
  const oculta = conta('o', 'pendente', '2026-08-01', { oculto: true })
  assert.equal(filtrarContasPorModo([oculta], 'pendentes').length, 0)
  assert.equal(filtrarContasPorModo([oculta], 'ocultas').length, 1)
})

test('troca de empresa invalida resposta antiga', () => {
  const controle = criarControleOperacao()
  const a = controle.iniciar('empresa-a')
  controle.iniciar('empresa-b')
  assert.equal(controle.estaAtual(a), false)
})

test('busca rapida ignora resposta obsoleta', () => {
  const controle = criarControleOperacao()
  const antiga = controle.iniciar('busca-antiga')
  const atual = controle.iniciar('busca-atual')
  assert.equal(controle.estaAtual(antiga), false)
  assert.equal(controle.estaAtual(atual), true)
})

test('conta futura recem-salva permanece na fonte operacional', () => {
  const futura = conta('nova', 'pendente', '2030-12-31')
  assert.deepEqual(filtrarContasPorModo([futura], 'pendentes', '2026-07-19').map((item) => item.id), ['nova'])
})

test('exportacao usa somente resultado visivel', () => {
  const visiveis = [conta('1', 'pendente', '2026-08-01')]
  assert.deepEqual(contasParaExportacao(visiveis).map((item) => item.id), ['1'])
})

test('carregamento inicial nao dispara consulta secundaria nem geracao recorrente', () => {
  assert.equal(deveConsultarSobDemanda({ modo: 'pendentes', termo: '' }), null)
  assert.deepEqual(mesclarPaginaContas([conta('1', 'pendente', '2026-08-01')], [conta('1', 'pendente', '2026-08-01')]), [conta('1', 'pendente', '2026-08-01')])
})
test('consumidores legados recebem fonte contextual, nao a operacional', () => {
  const operacionais = [conta('aberta', 'pendente', '2026-07-20')]
  const contextuais = [...operacionais, conta('paga', 'pago', '2026-07-10')]
  assert.deepEqual(selecionarFonteContextualContas({ consumidor: 'agenda', operacionais, contextuais }), operacionais)
  for (const consumidor of ['dashboard', 'relatorios-contas', 'controle-impostos', 'recorrencias', 'copilot']) {
    assert.deepEqual(selecionarFonteContextualContas({ consumidor, operacionais, contextuais }), contextuais)
  }
})

test('dashboard calcula Pago pela fonte contextual completa', () => {
  const contextuais = [
    conta('aberta', 'pendente', '2026-07-20', { valor: 100 }),
    conta('paga', 'pago', '2026-07-10', { valor: 80, valor_pago: 75 })
  ]
  const resumo = calcularResumoFinanceiroContas(contextuais, '2026-07-19')
  assert.equal(resumo.pago, 75)
  assert.equal(resumo.pendente, 100)
  assert.equal(resumo.total, 180)
})

test('relatorio e impostos carregam historico pago somente sob demanda', async () => {
  let chamadas = 0
  const carregar = async () => {
    chamadas += 1
    return { data: [conta('paga', 'pago', '2026-07-10')], error: null }
  }
  assert.deepEqual(await carregarFonteContextualContas('contas', carregar), { carregada: false, data: [] })
  assert.equal(chamadas, 0)
  for (const consumidor of ['relatorios-contas', 'controle-impostos']) {
    const resposta = await carregarFonteContextualContas(consumidor, carregar)
    assert.equal(resposta.carregada, true)
    assert.equal(resposta.data[0].status, 'pago')
  }
  assert.equal(chamadas, 2)
})

test('busca normaliza valores brasileiros e decimais', () => {
  assert.equal(interpretarTermoBuscaContas('99,90').valor, 99.9)
  assert.equal(interpretarTermoBuscaContas('99.90').valor, 99.9)
  assert.equal(interpretarTermoBuscaContas('1.299,90').valor, 1299.9)
  assert.equal(interpretarTermoBuscaContas('R$ 1.299,90').valor, 1299.9)
})

test('busca normaliza datas brasileira e ISO', () => {
  assert.equal(interpretarTermoBuscaContas('19/07/2026').data, '2026-07-19')
  assert.equal(interpretarTermoBuscaContas('2026-07-19').data, '2026-07-19')
  assert.equal(interpretarTermoBuscaContas('julho').data, null)
})

test('limpar busca invalida resposta que ja estava em andamento', () => {
  const controle = criarControleOperacao()
  const antiga = controle.iniciar('busca:energia')
  invalidarConsultaContas(controle)
  assert.equal(controle.estaAtual(antiga), false)
})

test('periodo de Pagas nao usa datas dos filtros gerais', () => {
  const periodo = obterPeriodoConsultaPagas({
    periodoPagas: 'intervalo',
    dataInicialPagas: '2026-01-01',
    dataFinalPagas: '2026-01-31',
    dataInicial: '2024-01-01',
    dataFinal: '2024-12-31',
    dataReferencia: '2026-07-19T12:00:00'
  })
  assert.equal(periodo.dataInicial, '2026-01-01')
  assert.equal(periodo.dataFinal, '2026-01-31')
})

test('orquestracao contextual nao dispara recorrencias', async () => {
  let geracoes = 0
  const resposta = await carregarFonteContextualContas('dashboard', async () => ({
    data: [conta('paga', 'pago', '2026-07-10')],
    error: null
  }))
  assert.equal(resposta.carregada, true)
  assert.equal(geracoes, 0)
})
