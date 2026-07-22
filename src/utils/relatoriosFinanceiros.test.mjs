import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { executarConsultaPaginada } from '../services/supabasePaginationService.js'
import {
  calcularResumoRelatorioFinanceiro,
  consolidarContasComPagamentos,
  criarControleConsultaRelatorio,
  criarMovimentosPagamentoConta,
  derivarStatusFinanceiroConta,
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
  assert.equal(resultado.valor_pago_atual_relatorio, 200)
  assert.equal(resultado.saldo_restante_relatorio, 0)
})

test('parciais em meses distintos afetam o saldo atual mas somente o realizado do periodo', () => {
  const pagamentos = [
    { id: 'jan', conta_id: '1', valor_pago: 50, data_pagamento: '2026-01-10', arquivado: false },
    { id: 'jun', conta_id: '1', valor_pago: 30, data_pagamento: '2026-06-10', arquivado: false }
  ]
  const [obrigacao] = consolidarContasComPagamentos(
    [conta('1', { valor: 200, data_vencimento: '2026-06-01' })],
    pagamentos,
    { ...criterios, dataInicial: '2026-06-01', dataFinal: '2026-06-30' }
  )
  const movimentosJunho = consolidarContasComPagamentos(
    [conta('1', { valor: 200, data_vencimento: '2026-06-01' })],
    pagamentos,
    { ...criterios, base: 'pagamento', dataInicial: '2026-06-01', dataFinal: '2026-06-30' }
  )

  assert.equal(obrigacao.valor_pago_atual_relatorio, 80)
  assert.equal(obrigacao.saldo_restante_relatorio, 120)
  assert.deepEqual(movimentosJunho.map((item) => [item.data_referencia_relatorio, item.valor_relatorio]), [['2026-06-10', 30]])
})

test('parcial e quitacao final geram movimentos separados sem saldo', () => {
  const contaPaga = conta('1', { valor: 200, status: 'pago', valor_pago: 200, data_pagamento: '2026-06-20' })
  const pagamentos = [{ id: 'p1', conta_id: '1', valor_pago: 50, data_pagamento: '2026-01-10', arquivado: false }]
  const movimentos = criarMovimentosPagamentoConta(contaPaga, pagamentos)
  const [obrigacao] = consolidarContasComPagamentos([contaPaga], pagamentos, criterios)

  assert.deepEqual(movimentos.map((item) => [item.tipo, item.valorCentavos / 100]), [['parcial', 50], ['residual', 150]])
  assert.equal(obrigacao.valor_pago_atual_relatorio, 200)
  assert.equal(obrigacao.saldo_restante_relatorio, 0)
})

test('parciais que totalizam a conta nao geram residual duplicado', () => {
  const movimentos = criarMovimentosPagamentoConta(
    conta('1', { valor: 200, status: 'pago', valor_pago: 200, data_pagamento: '2026-06-20' }),
    [
      { id: 'p1', conta_id: '1', valor_pago: 50, data_pagamento: '2026-01-10', arquivado: false },
      { id: 'p2', conta_id: '1', valor_pago: 150, data_pagamento: '2026-06-10', arquivado: false }
    ]
  )
  assert.deepEqual(movimentos.map((item) => item.tipo), ['parcial', 'parcial'])
  assert.equal(movimentos.reduce((total, item) => total + item.valorCentavos, 0), 20000)
})

test('pagamento com desconto preserva valor realizado abaixo do previsto', () => {
  const pagaComDesconto = conta('desconto', {
    valor: 100,
    valor_pago: 90,
    desconto: 10,
    status: 'pago',
    data_pagamento: '2026-07-10'
  })
  const [obrigacao] = consolidarContasComPagamentos([pagaComDesconto], [], criterios)
  const movimentos = criarMovimentosPagamentoConta(pagaComDesconto, [])

  assert.equal(obrigacao.valor_pago_atual_relatorio, 90)
  assert.equal(obrigacao.saldo_restante_relatorio, 0)
  assert.equal(obrigacao.desconto, 10)
  assert.equal(obrigacao.valor_pago_inferido_relatorio, false)
  assert.deepEqual(movimentos.map((item) => item.valorCentavos), [9000])
})

test('pagamento com acrescimo preserva valor realizado acima do previsto', () => {
  const pagaComAcrescimo = conta('acrescimo', {
    valor: 100,
    valor_pago: 110,
    juros_multa: 10,
    status: 'pago',
    data_pagamento: '2026-07-10'
  })
  const [obrigacao] = consolidarContasComPagamentos([pagaComAcrescimo], [], criterios)
  assert.equal(obrigacao.valor_pago_atual_relatorio, 110)
  assert.equal(obrigacao.saldo_restante_relatorio, 0)
  assert.equal(obrigacao.juros_multa, 10)
})

test('valor previsto e usado como fallback identificado somente sem valor pago', () => {
  const antiga = conta('antiga', { valor: 200, valor_pago: null, status: 'pago', data_pagamento: '2026-07-10' })
  const [obrigacao] = consolidarContasComPagamentos([antiga], [], criterios)
  const [movimento] = criarMovimentosPagamentoConta(antiga, [])

  assert.equal(obrigacao.valor_pago_atual_relatorio, 200)
  assert.equal(obrigacao.valor_pago_inferido_relatorio, true)
  assert.equal(obrigacao.origem_valor_pago_relatorio, 'valor_previsto_inferido')
  assert.equal(movimento.valorInferido, true)
  assert.equal(movimento.origemValor, 'valor_previsto_inferido')
})

test('conta aberta quitada por parciais recebe status derivado e baixa pendente', () => {
  const pagamentos = [
    { id: 'p1', conta_id: '1', valor_pago: 40, data_pagamento: '2026-07-05', arquivado: false },
    { id: 'p2', conta_id: '1', valor_pago: 60, data_pagamento: '2026-07-10', arquivado: false }
  ]
  const [obrigacao] = consolidarContasComPagamentos(
    [conta('1', { valor: 100, data_vencimento: '2026-07-01', status: 'pendente' })],
    pagamentos,
    criterios
  )

  assert.equal(derivarStatusFinanceiroConta(obrigacao, null, criterios.hoje), 'quitada_por_parciais')
  assert.equal(obrigacao.status_financeiro_relatorio, 'quitada_por_parciais')
  assert.equal(obrigacao.saldo_restante_relatorio, 0)
  assert.equal(obrigacao.baixa_pendente_relatorio, true)
  assert.equal(obrigacao.rotulo_status_relatorio, 'Quitada por parciais — baixa pendente')
  assert.deepEqual(filtrarDatasetRelatorio([obrigacao], { ...criterios, status: 'vencidas' }), [])
  assert.deepEqual(filtrarDatasetRelatorio([obrigacao], { ...criterios, status: 'pagas' }).map((item) => item.id), ['1'])
})

test('quitacao por parciais nao executa atualizacao automatica', async () => {
  const fontes = await Promise.all([
    readFile(new URL('./relatoriosFinanceiros.js', import.meta.url), 'utf8'),
    readFile(new URL('../services/relatoriosFinanceirosService.js', import.meta.url), 'utf8')
  ])
  assert.equal(fontes.some((fonte) => /\.update\s*\(|\.insert\s*\(|\.upsert\s*\(/.test(fonte)), false)
})

test('filtros financeiros dependentes de parciais sao aplicados apos reconciliacao', async () => {
  const service = await readFile(new URL('../services/relatoriosFinanceirosService.js', import.meta.url), 'utf8')
  const consultaGeral = service.slice(
    service.indexOf('export async function consultarRelatorioFinanceiro'),
    service.indexOf('export async function consultarVencidosFinanceiros')
  )
  assert.equal(/\.eq\(['"]status['"],\s*['"]pago['"]\)/.test(consultaGeral), false)
  assert.equal(/\.neq\(['"]status['"],\s*['"]pago['"]\)/.test(consultaGeral), false)
})

test('fluxo e base por pagamento preservam valor real com desconto', () => {
  const pagaComDesconto = conta('1', {
    valor: 100,
    valor_pago: 90,
    desconto: 10,
    status: 'pago',
    data_pagamento: '2026-07-20'
  })
  const basePagamento = consolidarContasComPagamentos(
    [pagaComDesconto],
    [],
    { ...criterios, base: 'pagamento' }
  )
  const fluxo = montarMovimentosFluxoCaixa({ ano: '2026', contasPagas: [pagaComDesconto] })
    .filter((item) => item.tipo === 'saida')
  assert.equal(basePagamento.reduce((total, item) => total + item.valor_relatorio, 0), 90)
  assert.equal(fluxo.reduce((total, item) => total + item.valor, 0), 90)
})

test('exportacao recebe status derivado e identificacao de fallback', () => {
  const [quitada] = consolidarContasComPagamentos(
    [conta('quitada', { valor: 100 })],
    [{ id: 'p1', conta_id: 'quitada', valor_pago: 100, data_pagamento: '2026-07-10', arquivado: false }],
    criterios
  )
  const [inferida] = consolidarContasComPagamentos(
    [conta('inferida', { valor: 200, status: 'pago', valor_pago: null, data_pagamento: '2026-07-10' })],
    [],
    criterios
  )
  assert.equal(quitada.status_relatorio, 'quitada_por_parciais')
  assert.equal(quitada.rotulo_status_relatorio, 'Quitada por parciais — baixa pendente')
  assert.equal(inferida.valor_pago_inferido_relatorio, true)
  assert.equal(inferida.origem_valor_pago_relatorio, 'valor_previsto_inferido')
})

test('varios pagamentos permanecem em linhas e datas separadas para exportacao', () => {
  const movimentos = consolidarContasComPagamentos(
    [conta('1', { valor: 200 })],
    [
      { id: 'p1', conta_id: '1', valor_pago: 25, data_pagamento: '2026-07-03', arquivado: false },
      { id: 'p2', conta_id: '1', valor_pago: 35, data_pagamento: '2026-07-21', arquivado: false }
    ],
    { ...criterios, base: 'pagamento' }
  )

  assert.deepEqual(movimentos.map((item) => ({
    data: item.data_referencia_relatorio,
    valor: item.valor_relatorio,
    tipo: item.tipo_pagamento_relatorio
  })), [
    { data: '2026-07-03', valor: 25, tipo: 'parcial' },
    { data: '2026-07-21', valor: 35, tipo: 'parcial' }
  ])
})

test('resumo financeiro usa saldo para pendente e vencido', () => {
  const [obrigacao] = consolidarContasComPagamentos(
    [conta('1', { valor: 200, data_vencimento: '2026-07-01' })],
    [{ id: 'p1', conta_id: '1', valor_pago: 50, data_pagamento: '2026-07-10', arquivado: false }],
    criterios
  )
  const resumo = calcularResumoRelatorioFinanceiro([obrigacao], criterios.hoje)
  assert.equal(resumo.totalPrevisto, 200)
  assert.equal(resumo.totalPago, 50)
  assert.equal(resumo.saldoEmAberto, 150)
  assert.equal(resumo.totalVencido, 150)
})

test('fluxo de caixa reconcilia o mesmo total da base por pagamento', () => {
  const contaQuitada = conta('1', {
    valor: 200,
    status: 'pago',
    valor_pago: 200,
    data_pagamento: '2026-06-20',
    data_vencimento: '2026-06-01'
  })
  const pagamentos = [{ id: 'p1', conta_id: '1', valor_pago: 50, data_pagamento: '2026-01-10', arquivado: false }]
  const basePagamento = consolidarContasComPagamentos(
    [contaQuitada],
    pagamentos,
    { ...criterios, base: 'pagamento', dataInicial: '2026-01-01', dataFinal: '2026-12-31' }
  )
  const movimentosFluxo = montarMovimentosFluxoCaixa({
    ano: '2026',
    contasPagas: [contaQuitada],
    pagamentosParciais: pagamentos,
    contasPorId: new Map([['1', contaQuitada]])
  }).filter((item) => item.tipo === 'saida')

  const totalRelatorio = basePagamento.reduce((total, item) => total + item.valor_relatorio, 0)
  const totalFluxo = movimentosFluxo.reduce((total, item) => total + item.valor, 0)
  assert.equal(totalRelatorio, 200)
  assert.equal(totalFluxo, totalRelatorio)
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

test('fluxo de caixa preserva fallback historico somente ate maio de 2026', () => {
  const movimentos = montarMovimentosFluxoCaixa({
    ano: '2026',
    contasPagas: [
      conta('historica', { status: 'pago', valor_pago: 100, data_pagamento: null, data_vencimento: '2026-05-20' }),
      conta('recente', { status: 'pago', valor_pago: 100, data_pagamento: null, data_vencimento: '2026-06-20' })
    ]
  })

  assert.deepEqual(movimentos.map((item) => [item.conta_id, item.origem_data, item.valor]), [
    ['historica', 'vencimento_historico', 100]
  ])
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
