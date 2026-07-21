import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { executarConsultaPaginada } from '../services/supabasePaginationService.js'
import {
  calcularResumoRelatorioFinanceiro,
  consolidarContasComPagamentos,
  criarControleConsultaRelatorio,
  filtrarDatasetRelatorio,
  normalizarCriteriosRelatorio,
  podeExportarRelatorio
} from './relatoriosFinanceiros.js'
import { metadadosExportacaoRelatorio } from './relatoriosContasExport.js'
import { montarMovimentosFluxoCaixa } from '../modules/contas/utils/fluxo-caixa/fluxoCaixaUtils.js'

const criterios = {
  empresaId: 'empresa-1',
  base: 'vencimento',
  dataInicial: '2026-07-01',
  dataFinal: '2026-07-31',
  status: 'todas',
  hoje: '2026-07-19'
}

function conta(id, extras = {}) {
  return {
    id,
    empresa_id: 'empresa-1',
    descricao: `Conta ${id}`,
    valor: 100,
    status: 'pendente',
    data_vencimento: '2026-07-20',
    oculto: false,
    excluido: false,
    deletado: false,
    ...extras
  }
}

test('paginacao financeira supera mil registros sem perda', async () => {
  const origem = Array.from({ length: 1255 }, (_, indice) => conta(String(indice + 1)))
  const resposta = await executarConsultaPaginada(
    () => ({ range: async (inicio, fim) => ({ data: origem.slice(inicio, fim + 1), error: null }) }),
    { tamanhoPagina: 500 }
  )
  assert.equal(resposta.data.length, 1255)
  assert.equal(new Set(resposta.data.map((item) => item.id)).size, 1255)
})

test('relatorio por vencimento inclui contas pagas e abertas do periodo', () => {
  const dados = consolidarContasComPagamentos([
    conta('aberta'),
    conta('paga', { status: 'pago', valor_pago: 100, data_pagamento: '2026-07-15' })
  ], [], criterios)
  assert.deepEqual(dados.map((item) => item.status_relatorio), ['futura', 'paga'])
})

test('dataset do relatorio e independente da lista operacional da tela Contas', () => {
  const operacional = [conta('aberta')]
  const consultado = consolidarContasComPagamentos([...operacional, conta('paga', { status: 'pago', data_pagamento: '2026-07-10' })], [], criterios)
  assert.equal(operacional.length, 1)
  assert.equal(consultado.length, 2)
})

test('base por vencimento usa data de vencimento como referencia', () => {
  const [resultado] = consolidarContasComPagamentos([conta('1', { data_vencimento: '2026-07-08', data_pagamento: '2026-08-01', status: 'pago' })], [], criterios)
  assert.equal(resultado.data_referencia_relatorio, '2026-07-08')
  assert.equal(resultado.valor_relatorio, 100)
})

test('base por pagamento usa data real do pagamento', () => {
  const [resultado] = consolidarContasComPagamentos(
    [conta('1', { status: 'pago', data_pagamento: '2026-07-12' })],
    [],
    { ...criterios, base: 'pagamento' }
  )
  assert.equal(resultado.data_referencia_relatorio, '2026-07-12')
  assert.equal(resultado.valor_pago_periodo_relatorio, 100)
})

test('conta paga sem data nao e atribuida ao periodo de pagamento', () => {
  const vencimento = consolidarContasComPagamentos([conta('1', { status: 'pago', data_pagamento: null })], [], criterios)
  const pagamento = consolidarContasComPagamentos([conta('1', { status: 'pago', data_pagamento: null })], [], { ...criterios, base: 'pagamento' })
  assert.equal(vencimento[0].data_pagamento_nao_informada, true)
  assert.equal(pagamento.length, 0)
})

test('pagamento parcial entra pela data efetiva', () => {
  const [resultado] = consolidarContasComPagamentos(
    [conta('1', { valor: 200 })],
    [{ id: 'p1', conta_id: '1', valor_pago: 50, data_pagamento: '2026-07-14', arquivado: false }],
    { ...criterios, base: 'pagamento' }
  )
  assert.equal(resultado.data_referencia_relatorio, '2026-07-14')
  assert.equal(resultado.valor_pago_periodo_relatorio, 50)
})

test('pagamento parcial nao duplica o valor integral da conta pai', () => {
  const [resultado] = consolidarContasComPagamentos(
    [conta('1', { valor: 200, status: 'pago', valor_pago: 200, data_pagamento: '2026-07-20' })],
    [{ id: 'p1', conta_id: '1', valor_pago: 50, data_pagamento: '2026-07-14', arquivado: false }],
    criterios
  )
  assert.equal(resultado.valor_pago_atual_relatorio, 50)
  assert.equal(resultado.saldo_restante_relatorio, 150)
})

test('filtros por filial centro status e origem atuam sobre o dataset', () => {
  const dados = consolidarContasComPagamentos([
    conta('manual', { filial_id: 'f1', centro_custo_id: 'c1' }),
    conta('recorrente', { filial_id: 'f2', centro_custo_id: 'c2', recorrencia_id: 'r1' }),
    conta('outra-empresa', { empresa_id: 'empresa-2', filial_id: 'f2', centro_custo_id: 'c2', recorrencia_id: 'r2' })
  ], [], criterios)
  const resultado = filtrarDatasetRelatorio(dados, { ...criterios, filialId: 'f2', centroCustoId: 'c2', origem: 'recorrente', status: 'abertas' })
  assert.deepEqual(resultado.map((item) => item.id), ['recorrente'])
})

test('contas ocultas so entram quando solicitadas', () => {
  assert.equal(consolidarContasComPagamentos([conta('oculta', { oculto: true })], [], criterios).length, 0)
  assert.equal(consolidarContasComPagamentos([conta('oculta', { oculto: true })], [], { ...criterios, incluirOcultas: true }).length, 1)
})

test('resumo financeiro usa centavos e saldo consolidado', () => {
  const dados = consolidarContasComPagamentos([
    conta('1', { valor: 99.9 }),
    conta('2', { valor: 0.1, status: 'pago', valor_pago: 0.1, data_pagamento: '2026-07-10' })
  ], [], criterios)
  const resumo = calcularResumoRelatorioFinanceiro(dados, criterios.hoje)
  assert.equal(resumo.totalPrevisto, 100)
  assert.equal(resumo.totalPago, 0.1)
  assert.equal(resumo.saldoEmAberto, 99.9)
})

test('exportacao registra empresa periodo base filtros e totais', () => {
  const metadados = new Map(metadadosExportacaoRelatorio({
    empresaNome: 'Empresa teste', periodo: '01/07/2026 a 31/07/2026', base: 'Por pagamento',
    filialNome: 'Filial 1', centroNome: 'Centro 1', status: 'Pagas', totalRegistros: 2,
    resumoFinanceiro: { totalPrevisto: 300, totalPagoPeriodo: 150, saldoEmAberto: 150 }
  }))
  assert.equal(metadados.get('Empresa'), 'Empresa teste')
  assert.equal(metadados.get('Base'), 'Por pagamento')
  assert.equal(metadados.get('Total pago'), 150)
})

test('loading erro e ausencia de consulta bloqueiam exportacao', () => {
  assert.equal(podeExportarRelatorio({ carregando: true, carregado: false, registros: [] }), false)
  assert.equal(podeExportarRelatorio({ erro: new Error('falha'), carregado: false, registros: [] }), false)
  assert.equal(podeExportarRelatorio({ carregado: true, registros: [conta('1')] }), true)
})

test('fluxo de caixa considera somente movimentos do ano solicitado', () => {
  const movimentos = montarMovimentosFluxoCaixa({
    ano: '2026',
    contasPagas: [
      conta('2026', { status: 'pago', data_pagamento: '2026-07-10', valor_pago: 100 }),
      conta('2025', { status: 'pago', data_pagamento: '2025-07-10', valor_pago: 100 })
    ],
    pagamentosParciais: [{ id: 'p2025', conta_id: '2025', valor_pago: 10, data_pagamento: '2025-01-02' }],
    contasPorId: new Map([['2025', conta('2025')]]),
    receitas: [{ id: 'r2025', status: 'ativo', data_receita: '2025-02-03', valor: 10 }]
  })
  assert.deepEqual(movimentos.map((item) => item.conta_id), ['2026'])
})

test('controle de consulta impede resposta antiga de substituir a atual', () => {
  const controle = criarControleConsultaRelatorio()
  const antiga = controle.iniciar()
  const atual = controle.iniciar()
  assert.equal(controle.estaAtual(antiga), false)
  assert.equal(controle.estaAtual(atual), true)
})

test('criterios exigem periodo valido e preservam empresa', () => {
  assert.equal(normalizarCriteriosRelatorio(criterios).empresaId, 'empresa-1')
  assert.throws(() => normalizarCriteriosRelatorio({ ...criterios, dataInicial: '', dataFinal: '' }))
})

test('services de relatorio nao chamam geracao recorrente', async () => {
  const fontes = await Promise.all([
    readFile(new URL('../services/relatoriosFinanceirosService.js', import.meta.url), 'utf8'),
    readFile(new URL('../modules/contas/services/fluxo-caixa/fluxoCaixaService.js', import.meta.url), 'utf8')
  ])
  assert.equal(fontes.some((fonte) => /planejarContasRecorrentes|atualizarPlanejamentoRecorrencias|insert\s*\(/.test(fonte)), false)
})
