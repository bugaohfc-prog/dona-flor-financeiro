import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { classificarFaixaFinanceira, criarPeriodosFinanceiros, filtrarAgendaFinanceira, resumirConsumidoresFinanceiros } from './consumidoresFinanceiros.js'
import { gerarCopilotFinanceiro } from '../services/ai/copilotEngine.js'

const base = (sobrescrita = {}) => ({
  id: crypto.randomUUID(), empresa_id: 'empresa-a', data_vencimento: '2026-07-22', valor: 100,
  valor_previsto_relatorio: 100, valor_pago_atual_relatorio: 0, saldo_restante_relatorio: 100,
  status_relatorio: 'futura', ...sobrescrita
})

test('Dashboard usa fonte independente dos filtros de Contas', async () => {
  const fonte = await readFile(new URL('../components/dashboard/DashboardHome.jsx', import.meta.url), 'utf8')
  assert.match(fonte, /useRelatorioFinanceiro/)
  assert.doesNotMatch(fonte, /contasFiltradas/)
})

test('realizado usa valor pago real', () => {
  const resumo = resumirConsumidoresFinanceiros([base({ valor_pago_atual_relatorio: 90, saldo_restante_relatorio: 0, status_relatorio: 'paga' })], { dataBase: '2026-07-21' })
  assert.equal(resumo.realizado, 90)
})

test('vencido usa saldo restante', () => {
  const resumo = resumirConsumidoresFinanceiros([base({ data_vencimento: '2026-07-20', valor_pago_atual_relatorio: 30, saldo_restante_relatorio: 70, status_relatorio: 'vencida' })], { dataBase: '2026-07-21' })
  assert.equal(resumo.vencido, 70)
})

test('quitada por parciais não entra em pendentes ou vencidas', () => {
  const conta = base({ data_vencimento: '2026-07-01', saldo_restante_relatorio: 0, valor_pago_atual_relatorio: 100, status_relatorio: 'quitada_por_parciais' })
  assert.equal(classificarFaixaFinanceira(conta, '2026-07-21'), 'quitada')
  assert.deepEqual(filtrarAgendaFinanceira([conta], { dataBase: '2026-07-21' }), [])
})

test('indicadores 7, 30 e 90 dias não se sobrepõem', () => {
  const contas = [
    base({ data_vencimento: '2026-07-28' }),
    base({ data_vencimento: '2026-07-29' }),
    base({ data_vencimento: '2026-08-20' }),
    base({ data_vencimento: '2026-08-21' }),
    base({ data_vencimento: '2026-10-19' }),
    base({ data_vencimento: '2026-10-20' })
  ]
  assert.deepEqual(contas.map((conta) => classificarFaixaFinanceira(conta, '2026-07-21')), ['proximos7', 'proximos30', 'proximos30', 'proximos90', 'proximos90', 'futuroLongo'])
})

test('intervalos atravessam virada de mês e ano no calendário local', () => {
  const periodos = criarPeriodosFinanceiros('2026-12-28')
  assert.equal(periodos.proximos7.fim, '2027-01-04')
  assert.equal(periodos.proximos90.fim, '2027-03-28')
})

test('Agenda exclui pagas e quitadas', () => {
  const abertas = base()
  assert.deepEqual(filtrarAgendaFinanceira([abertas, base({ status_relatorio: 'paga', saldo_restante_relatorio: 0 })], { dataBase: '2026-07-21' }), [abertas])
})

test('Agenda operacional reconhece quitação consolidada por parciais', async () => {
  const { normalizarContasCentral } = await import('../modules/central-do-dia/domain/centralDoDiaRules.js')
  const itens = normalizarContasCentral([base({ status: 'pendente', statusOperacionalDerivado: 'paga', saldoPendenteParcial: 0 })], { dataBaseISO: '2026-07-21' })
  assert.deepEqual(itens, [])
})

test('Agenda preserva identificação da conta recém-criada', () => {
  const conta = base({ id: 'nova-conta' })
  assert.equal(filtrarAgendaFinanceira([conta], { dataBase: '2026-07-21' })[0].id, 'nova-conta')
})

test('Impostos consulta pagas e abertas por período', async () => {
  const fonte = await readFile(new URL('../pages/ControleImpostosPage.jsx', import.meta.url), 'utf8')
  assert.match(fonte, /useRelatorioFinanceiro/)
  assert.match(fonte, /status: 'todas'/)
  assert.match(fonte, /dataInicial/)
})

test('Impostos não trata erro como lista vazia', async () => {
  const fonte = await readFile(new URL('../pages/ControleImpostosPage.jsx', import.meta.url), 'utf8')
  assert.match(fonte, /ContasContextualGuard/)
  assert.match(fonte, /fonteFinanceira\.erro/)
})

test('exportação de impostos exige consulta completa', async () => {
  const fonte = await readFile(new URL('../pages/ControleImpostosPage.jsx', import.meta.url), 'utf8')
  assert.match(fonte, /podeExportarRelatorio/)
  assert.match(fonte, /exportacaoDisponivel/)
})

test('Copilot recebe somente empresa e período atuais', () => {
  const inteligencia = gerarCopilotFinanceiro({ contas: [base(), base({ empresa_id: 'empresa-b', valor: 900, valor_previsto_relatorio: 900 })], empresaId: 'empresa-a', periodo: { inicio: '2026-01-01', fim: '2026-12-31' } })
  assert.equal(inteligencia.totals.total, 100)
  assert.deepEqual(inteligencia.periodo, { inicio: '2026-01-01', fim: '2026-12-31' })
})

test('Copilot sinaliza base insuficiente', () => {
  assert.equal(gerarCopilotFinanceiro({ contas: [], empresaId: 'empresa-a' }).dadosInsuficientes, true)
})

test('hook financeiro invalida resposta obsoleta', async () => {
  const fonte = await readFile(new URL('../hooks/useRelatorioFinanceiro.js', import.meta.url), 'utf8')
  assert.match(fonte, /estaAtual\(token\)/)
  assert.match(fonte, /obsoleta: true/)
})

test('consumidores não disparam geração recorrente', async () => {
  const arquivos = await Promise.all([
    '../components/dashboard/DashboardHome.jsx', '../pages/ControleImpostosPage.jsx',
    '../components/copilot/core/CopilotProvider.jsx', '../modules/central-do-dia/domain/centralDoDiaRules.js'
  ].map((arquivo) => readFile(new URL(arquivo, import.meta.url), 'utf8')))
  assert.equal(arquivos.some((conteudo) => /planejar|gerarRecorrenc|executarPlanejamento/.test(conteudo)), false)
})
