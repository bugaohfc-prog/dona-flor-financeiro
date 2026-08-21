import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  calcularResumoRelatorioFinanceiro,
  calcularVerdadeFinanceiraConta,
  consolidarContasComPagamentos,
} from './relatoriosFinanceiros.js'
import { calcularResumoFinanceiroContas } from './contasConsultasOperacionais.js'

const HOJE = '2026-07-19'
const CRITERIOS = {
  empresaId: 'empresa-1',
  base: 'vencimento',
  dataInicial: '2026-01-01',
  dataFinal: '2026-12-31',
  hoje: HOJE,
}

function contaBase(sobrescrever = {}) {
  return {
    id: 'conta-1',
    empresa_id: 'empresa-1',
    descricao: 'Conta de teste',
    valor: 1000,
    status: 'pendente',
    data_vencimento: '2026-07-20',
    excluido: false,
    deletado: false,
    oculto: false,
    ...sobrescrever,
  }
}

test('verdade canônica: conta pendente sem pagamento mantém previsto e saldo', () => {
  const verdade = calcularVerdadeFinanceiraConta(contaBase(), [], HOJE)

  assert.equal(verdade.valorPrevisto, 1000)
  assert.equal(verdade.valorPagoAtual, 0)
  assert.equal(verdade.saldoRestante, 1000)
  assert.equal(verdade.statusFinanceiro, 'futura')
})

test('verdade canônica: vencida com parcial usa somente o saldo como vencido', () => {
  const conta = contaBase({ data_vencimento: '2026-07-18' })
  const verdade = calcularVerdadeFinanceiraConta(
    conta,
    [{ id: 'pagamento-1', valor_pago: 400, data_pagamento: '2026-07-10' }],
    HOJE
  )
  const resumo = calcularResumoFinanceiroContas([{ ...conta, pagamentos_parciais: verdade.pagamentosAtivos }], HOJE)

  assert.equal(verdade.valorPagoAtual, 400)
  assert.equal(verdade.saldoRestante, 600)
  assert.equal(verdade.vencida, true)
  assert.equal(resumo.vencido, 600)
})

test('verdade canônica: quitação integral por parciais não permanece vencida', () => {
  const verdade = calcularVerdadeFinanceiraConta(
    contaBase({ data_vencimento: '2026-07-18' }),
    [
      { id: 'pagamento-1', valor_pago: 400 },
      { id: 'pagamento-2', valor_pago: 600 },
    ],
    HOJE
  )

  assert.equal(verdade.valorPagoAtual, 1000)
  assert.equal(verdade.saldoRestante, 0)
  assert.equal(verdade.statusFinanceiro, 'quitada_por_parciais')
  assert.equal(verdade.quitadaPorParciais, true)
  assert.equal(verdade.vencida, false)
})

test('verdade canônica: realizado diferente do previsto preserva encargos, descontos e diferença', () => {
  const verdade = calcularVerdadeFinanceiraConta(contaBase({
    status: 'pago',
    valor_pago: 1050,
    juros_multa: 75.1,
    desconto: 25.1,
  }), [], HOJE)

  assert.equal(verdade.valorPrevisto, 1000)
  assert.equal(verdade.valorPagoAtual, 1050)
  assert.equal(verdade.saldoRestante, 0)
  assert.equal(verdade.diferencaRealizadoPrevisto, 50)
  assert.equal(verdade.encargos, 75.1)
  assert.equal(verdade.descontos, 25.1)
})

test('verdade canônica: pagamento parcial arquivado não compõe realizado', () => {
  const verdade = calcularVerdadeFinanceiraConta(
    contaBase(),
    [
      { id: 'ativo', valor_pago: 250 },
      { id: 'arquivado', valor_pago: 400, arquivado: true },
    ],
    HOJE
  )

  assert.equal(verdade.pagoPorParciais, 250)
  assert.equal(verdade.valorPagoAtual, 250)
  assert.equal(verdade.saldoRestante, 750)
})

test('resumo operacional exclui contas ocultas, excluídas e deletadas', () => {
  const resumo = calcularResumoFinanceiroContas([
    contaBase({ id: 'ativa' }),
    contaBase({ id: 'oculta', oculto: true }),
    contaBase({ id: 'excluida', excluido: true }),
    contaBase({ id: 'excluida-em', excluido_em: '2026-07-01T10:00:00Z' }),
    contaBase({ id: 'deletada', deleted_at: '2026-07-01T10:00:00Z' }),
  ], HOJE)

  assert.deepEqual(resumo, {
    total: 1000,
    pago: 0,
    pendente: 1000,
    vencido: 0,
    encargos: 0,
    descontos: 0,
  })
})

test('resumo de ocultas reconcilia previsto, parcial e saldo sem incluir excluídas', () => {
  const resumo = calcularResumoFinanceiroContas([
    contaBase({
      id: 'oculta',
      oculto: true,
      pagamentos_parciais: [{ id: 'parcial', valor_pago: 400 }],
    }),
    contaBase({ id: 'oculta-excluida', oculto: true, excluido: true }),
  ], HOJE, { modo: 'ocultas' })

  assert.deepEqual(resumo, {
    total: 1000,
    pago: 400,
    pendente: 600,
    vencido: 0,
    encargos: 0,
    descontos: 0,
  })
})

test('resumo de excluídas preserva os valores financeiros reconciliados', () => {
  const resumo = calcularResumoFinanceiroContas([
    contaBase({
      id: 'excluida',
      excluido: true,
      pagamentos_parciais: [{ id: 'parcial', valor_pago: 400 }],
    }),
  ], HOJE, { modo: 'excluidas' })

  assert.equal(resumo.total, 1000)
  assert.equal(resumo.pago, 400)
  assert.equal(resumo.pendente, 600)
})

test('registro definitivamente deletado nunca entra em nenhum modo de resumo', () => {
  const deletadas = [
    contaBase({ id: 'deletada-flag', oculto: true, excluido: true, deletado: true }),
    contaBase({ id: 'deletada-data', oculto: true, excluido_em: '2026-07-01', deleted_at: '2026-07-02' }),
  ]

  for (const modo of ['operacional', 'ocultas', 'excluidas']) {
    assert.deepEqual(
      calcularResumoFinanceiroContas(deletadas, HOJE, { modo }),
      { total: 0, pago: 0, pendente: 0, vencido: 0, encargos: 0, descontos: 0 }
    )
  }
})

test('relatório ativo também exclui conta removida antes de resumir', () => {
  const registros = consolidarContasComPagamentos([
    contaBase({ id: 'ativa' }),
    contaBase({ id: 'excluida', excluido: true }),
  ], [], CRITERIOS)
  const resumo = calcularResumoRelatorioFinanceiro(registros, HOJE)

  assert.equal(registros.length, 1)
  assert.equal(resumo.totalPrevisto, 1000)
})

test('vários movimentos da mesma obrigação contam o previsto uma única vez', () => {
  const criteriosPagamento = {
    ...CRITERIOS,
    base: 'pagamento',
    dataInicial: '2026-01-01',
    dataFinal: '2026-12-31',
  }
  const conta = contaBase({ status: 'pago', valor_pago: 1000, data_pagamento: '2026-06-30' })
  const movimentos = consolidarContasComPagamentos(
    [conta],
    [
      { id: 'p1', conta_id: conta.id, valor_pago: 400, data_pagamento: '2026-05-10' },
      { id: 'p2', conta_id: conta.id, valor_pago: 600, data_pagamento: '2026-06-20' },
    ],
    criteriosPagamento
  )
  const resumo = calcularResumoRelatorioFinanceiro(movimentos, HOJE)

  assert.equal(movimentos.length, 2)
  assert.equal(resumo.totalPrevisto, 1000)
  assert.equal(resumo.totalPago, 1000)
  assert.equal(resumo.totalPagoPeriodo, 1000)
})

test('Contas, App/Dashboard e Relatórios mantêm paridade financeira', () => {
  const contas = [
    contaBase({
      id: 'vencida-parcial',
      data_vencimento: '2026-07-18',
      pagamentos_parciais: [{ id: 'p1', conta_id: 'vencida-parcial', valor_pago: 400 }],
    }),
    contaBase({ id: 'paga', status: 'pago', valor: 500, valor_pago: 450 }),
  ]
  const pagamentos = contas.flatMap((conta) => conta.pagamentos_parciais || [])
  const resumoContasDashboard = calcularResumoFinanceiroContas(contas, HOJE)
  const registros = consolidarContasComPagamentos(contas, pagamentos, CRITERIOS)
  const resumoRelatorio = calcularResumoRelatorioFinanceiro(registros, HOJE)

  assert.deepEqual(
    {
      previsto: resumoContasDashboard.total,
      realizado: resumoContasDashboard.pago,
      saldo: resumoContasDashboard.pendente,
      vencido: resumoContasDashboard.vencido,
    },
    {
      previsto: resumoRelatorio.totalPrevisto,
      realizado: resumoRelatorio.totalPago,
      saldo: resumoRelatorio.saldoEmAberto,
      vencido: resumoRelatorio.totalVencido,
    }
  )

  const app = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8')
  assert.match(app, /calcularResumoFinanceiroContas\(contasFiltradas\)/)
  assert.match(app, /const \{ total, pago, vencido, pendente, encargos, descontos \} = resumoFinanceiro/)

  const dashboard = readFileSync(new URL('../components/dashboard/DashboardHome.jsx', import.meta.url), 'utf8')
  assert.match(dashboard, /useRelatorioFinanceiro\(\{ empresaId, criterios: criteriosFinanceiros \}\)/)
  assert.match(dashboard, /resumirDashboardFinanceiro\(fonteFinanceira\.registros/)
})

test('campos canônicos consumidos por Impostos e Copilot permanecem coerentes', () => {
  const conta = contaBase({
    data_vencimento: '2026-07-18',
    pagamentos_parciais: [{ id: 'p1', conta_id: 'conta-1', valor_pago: 400 }],
  })
  const [registro] = consolidarContasComPagamentos(conta ? [conta] : [], conta.pagamentos_parciais, CRITERIOS)
  const verdade = calcularVerdadeFinanceiraConta(conta, conta.pagamentos_parciais, HOJE)

  assert.equal(registro.valor_previsto_relatorio, verdade.valorPrevisto)
  assert.equal(registro.valor_pago_atual_relatorio, verdade.valorPagoAtual)
  assert.equal(registro.saldo_restante_relatorio, verdade.saldoRestante)
  assert.equal(registro.status_relatorio, verdade.statusFinanceiro)

  const impostos = readFileSync(new URL('../pages/ControleImpostosPage.jsx', import.meta.url), 'utf8')
  const impostosExportacao = readFileSync(new URL('../services/export/controleImpostosExportService.js', import.meta.url), 'utf8')
  const contratoImpostos = `${impostos}\n${impostosExportacao}`
  const copilot = readFileSync(new URL('../services/ai/copilotEngine.js', import.meta.url), 'utf8')
  assert.match(contratoImpostos, /valor_previsto_relatorio/)
  assert.match(contratoImpostos, /valor_pago_atual_relatorio/)
  assert.match(contratoImpostos, /saldo_restante_relatorio/)
  assert.match(copilot, /valor_previsto_relatorio/)
  assert.match(copilot, /valor_pago_atual_relatorio/)
  assert.match(copilot, /saldo_restante_relatorio/)
})

test('Resultado filtrado usa o resumo compartilhado e exibe saldo e vencido', () => {
  const pagina = readFileSync(new URL('../pages/ContasPage.jsx', import.meta.url), 'utf8')

  assert.doesNotMatch(pagina, /function calcularResumoResultadoFiltrado/)
  assert.match(pagina, /filtroStatus === 'ocultas'/)
  assert.match(pagina, /filtroStatus === 'excluidas'/)
  assert.match(pagina, /calcularResumoFinanceiroContas\(contasFiltradas, undefined, \{ modo: modoResumoFinanceiro \}\)/)
  assert.match(pagina, /<b>Saldo em aberto<\/b>/)
  assert.match(pagina, /<b>Vencido<\/b>/)
})
