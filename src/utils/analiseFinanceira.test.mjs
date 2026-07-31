import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  calcularComparacaoPeriodo,
  calcularIndicadoresAnalise,
  calcularPeriodoAnterior,
  calcularProjecoesAnalise,
  filtrarRegistrosAnalise,
  identificarExcecoesAnalise,
  montarLinhasAnaliseFinanceira,
  rotuloStatusGerencial,
} from './analiseFinanceira.js'
import {
  gerarConteudoCsvAnaliseFinanceira,
  gerarHtmlExcelAnaliseFinanceira,
  gerarHtmlImpressaoAnaliseFinanceira,
  metadadosExportacaoRelatorio,
} from './relatoriosContasExport.js'
import { gerarCopilotFinanceiro } from '../services/ai/copilotEngine.js'
import menuSections from '../config/menuSections.js'
import { getLazyRouteName, lazyRouteImports } from '../routes/lazyRoutes.js'

const ler = (caminho) => readFile(new URL(caminho, import.meta.url), 'utf8')

function conta(overrides = {}) {
  return {
    id: 'conta-1', empresa_id: 'empresa-1', descricao: 'Fornecedor', data_vencimento: '2026-07-10',
    valor_previsto_relatorio: 1000, valor_pago_atual_relatorio: 400, valor_pago_periodo_relatorio: 400,
    saldo_restante_relatorio: 600, status_financeiro_relatorio: 'vencida', status_relatorio: 'vencida',
    oculto: false, excluido: false, deletado: false, ...overrides,
  }
}

function massaAfStg() {
  return [
    conta({ id: 'energia', descricao: 'Energia', valor_previsto_relatorio: 800, valor_pago_atual_relatorio: 300, saldo_restante_relatorio: 500, parcialmente_pago: true }),
    conta({ id: 'aluguel', descricao: 'Aluguel', valor_previsto_relatorio: 2000, valor_pago_atual_relatorio: 0, saldo_restante_relatorio: 2000 }),
    conta({ id: 'imposto', descricao: 'Imposto', valor_previsto_relatorio: 1500, valor_pago_atual_relatorio: 0, saldo_restante_relatorio: 1500 }),
    conta({ id: 'fornecedor', descricao: 'Fornecedor', valor_previsto_relatorio: 1800, valor_pago_atual_relatorio: 600, saldo_restante_relatorio: 1200, parcialmente_pago: true }),
    conta({ id: 'servicos', descricao: 'Serviços', valor_previsto_relatorio: 1600, valor_pago_atual_relatorio: 0, saldo_restante_relatorio: 1600 }),
    conta({ id: 'futura', descricao: 'Futura', data_vencimento: '2026-07-31', valor_previsto_relatorio: 400, valor_pago_atual_relatorio: 0, saldo_restante_relatorio: 400, status_financeiro_relatorio: 'futura', status_relatorio: 'futura' }),
  ]
}

test('menu possui somente um item Análise Financeira', () => {
  const itens = menuSections.flatMap((secao) => secao.items).filter((item) => item.label === 'Análise Financeira')
  assert.equal(itens.length, 1)
  assert.equal(itens[0].tela, 'relatorios-contas')
  assert.equal(itens[0].desc, 'Painel gerencial, indicadores e detalhamento de contas')
})

test('aliases relatorios e relatorios-contas resolvem para a mesma implementação', () => {
  assert.equal(getLazyRouteName('relatorios'), 'analiseFinanceira')
  assert.equal(getLazyRouteName('relatorios-contas'), 'analiseFinanceira')
  assert.equal(typeof lazyRouteImports.analiseFinanceira, 'function')
})

test('comparação anterior preserva a duração e é imediatamente anterior', () => {
  assert.deepEqual(calcularPeriodoAnterior({ dataInicial: '2026-07-01', dataFinal: '2026-07-31' }), {
    dataInicial: '2026-05-31', dataFinal: '2026-06-30',
  })
  assert.deepEqual(calcularComparacaoPeriodo({ previsto: 150 }, { previsto: 100 }), { diferenca: 50, percentual: 50, direcao: 'alta' })
})

test('pagamento parcial alimenta KPIs pela verdade financeira normalizada', () => {
  const indicadores = calcularIndicadoresAnalise([conta()], '2026-07-31')
  assert.equal(indicadores.previsto, 1000)
  assert.equal(indicadores.pago, 400)
  assert.equal(indicadores.saldo, 600)
  assert.equal(indicadores.vencido, 600)
})

test('massa AF-STG preserva os totais gerenciais validados', () => {
  const indicadores = calcularIndicadoresAnalise(massaAfStg(), '2026-07-31')
  assert.deepEqual(indicadores, {
    previsto: 8100,
    pago: 900,
    saldo: 7200,
    vencido: 6800,
    encargos: 0,
    descontos: 0,
    quantidade: 6,
    taxaPagamento: 11.1,
    semDataPagamento: 0,
  })
})

test('rótulo parcial preserva situação principal', () => {
  assert.equal(rotuloStatusGerencial(conta({ parcialmente_pago: true })), 'Vencida · parcialmente paga')
  assert.equal(rotuloStatusGerencial(conta({ parcialmente_pago: true, status_financeiro_relatorio: 'futura' })), 'Em aberto · parcialmente paga')
})

test('Copilot usa exatamente o dataset filtrado e os campos normalizados', () => {
  const filtradas = filtrarRegistrosAnalise([
    conta(),
    conta({ id: 'outra', empresa_id: 'empresa-2', valor_previsto_relatorio: 9999 }),
  ], { status: 'todas' })
  const inteligencia = gerarCopilotFinanceiro({ contasFiltradas: filtradas, empresaId: 'empresa-1' })
  assert.equal(inteligencia.totals.total, 1000)
  assert.equal(inteligencia.totals.pago, 400)
  assert.equal(inteligencia.totals.pendente, 600)
  assert.equal(inteligencia.totals.vencido, 600)
})

test('Copilot não duplica obrigação e soma movimentos na base por pagamento', () => {
  const movimentos = [
    conta({ id: 'conta-1:p1', conta_id_relatorio: 'conta-1', movimento_pagamento_relatorio: true, valor_pago_periodo_relatorio: 50 }),
    conta({ id: 'conta-1:p2', conta_id_relatorio: 'conta-1', movimento_pagamento_relatorio: true, valor_pago_periodo_relatorio: 30 }),
  ]
  const inteligencia = gerarCopilotFinanceiro({ contasFiltradas: movimentos, empresaId: 'empresa-1' })
  assert.equal(inteligencia.totals.total, 1000)
  assert.equal(inteligencia.totals.pago, 80)
  assert.equal(inteligencia.totals.pendente, 600)
})

test('projeções 30, 60 e 90 dias são estimativas coerentes do histórico filtrado', () => {
  const projecoes = calcularProjecoesAnalise([conta()], { dataInicial: '2026-07-01', dataFinal: '2026-07-30', metaMensal: 600 })
  assert.equal(projecoes.previsao30, 600)
  assert.equal(projecoes.previsao60, 1200)
  assert.equal(projecoes.previsao90, 1800)
  assert.equal(projecoes.relacaoMeta, 100)
})

test('exceções identificam concentração excessiva pelo saldo normalizado', () => {
  const excecoes = identificarExcecoesAnalise([
    conta({ id: 'a', centro_custo_id: 'centro-a', saldo_restante_relatorio: 800 }),
    conta({ id: 'b', centro_custo_id: 'centro-b', saldo_restante_relatorio: 200 }),
  ])
  assert.deepEqual(excecoes.concentracoesExcessivas, [
    { centroCustoId: 'centro-a', saldo: 800, percentual: 80 },
  ])
})

test('linha Energia exporta previsto pago saldo e status normalizados', () => {
  const [energia] = montarLinhasAnaliseFinanceira(massaAfStg(), {
    base: 'vencimento',
    formatarValor: (valor) => String(valor),
    formatarData: (valor) => valor,
  })
  assert.equal(energia.valorPrevisto, 800)
  assert.equal(energia.valorPago, 300)
  assert.equal(energia.saldoRestante, 500)
  assert.equal(energia.statusGerencial, 'Vencida · parcialmente paga')
})

test('base vencimento não deixa totalPagoPeriodo zero sobrescrever pago 900', () => {
  const contexto = {
    base: 'Por vencimento',
    totalRegistros: 6,
    resumoFinanceiro: { totalPrevisto: 8100, totalPago: 900, totalPagoPeriodo: 0, saldoEmAberto: 7200, totalVencido: 6800 },
  }
  const metadados = new Map(metadadosExportacaoRelatorio(contexto))
  assert.equal(metadados.get('Total pago'), 900)
})

test('base pagamento usa exclusivamente o movimento pago dentro do período', () => {
  const contexto = {
    base: 'Por pagamento',
    resumoFinanceiro: { totalPrevisto: 8100, totalPago: 900, totalPagoPeriodo: 300, saldoEmAberto: 7200 },
  }
  const metadados = new Map(metadadosExportacaoRelatorio(contexto))
  assert.equal(metadados.get('Total pago'), 300)
  const [linha] = montarLinhasAnaliseFinanceira([
    conta({ valor_pago_atual_relatorio: 900, valor_pago_periodo_relatorio: 300 }),
  ], { base: 'pagamento' })
  assert.equal(linha.valorPago, 300)
  assert.equal(linha.valorPagoAtual, 900)
})

test('CSV Excel e PDFs compartilham linhas completas e não imprimem valores inválidos', () => {
  const linhas = montarLinhasAnaliseFinanceira(massaAfStg(), {
    base: 'vencimento',
    formatarValor: (valor) => String(valor),
    formatarData: (valor) => valor,
  })
  const contexto = { base: 'Por vencimento', totalRegistros: 6, resumoFinanceiro: { totalPrevisto: 8100, totalPago: 900, saldoEmAberto: 7200, totalVencido: 6800 } }
  const grupos = [{ titulo: 'vencida', linhas: linhas.slice(0, 5) }, { titulo: 'futura', linhas: linhas.slice(5) }]
  const resumo = { quantidade: 6, previsto: 8100, pago: 900, saldo: 7200, vencido: 6800 }
  const artefatos = [
    gerarConteudoCsvAnaliseFinanceira(linhas, contexto),
    gerarHtmlExcelAnaliseFinanceira(linhas, contexto),
    gerarHtmlImpressaoAnaliseFinanceira({ linhas, grupos, contexto, resumo, modo: 'compacto' }),
    gerarHtmlImpressaoAnaliseFinanceira({ linhas, grupos, contexto, resumo, modo: 'gerencial' }),
  ]
  for (const artefato of artefatos) assert.doesNotMatch(artefato, /undefined|null|NaN/)
  assert.match(artefatos[0], /"Previsto";"Pago";"Saldo";"Movimento no período"/)
  assert.match(artefatos[1], /Análise Financeira — HTML compatível com Excel/)
  assert.match(artefatos[2], /<h1>Análise Financeira<\/h1>/)
  assert.match(artefatos[2], /Energia[\s\S]*R\$\s*800,00[\s\S]*R\$\s*300,00[\s\S]*R\$\s*500,00/)
  assert.match(artefatos[3], /<h2>Vencidas/)
  assert.match(artefatos[3], /<h2>A vencer/)
})

test('controller usa a mesma fonte para atual e comparação com critérios ajustados', async () => {
  const fonte = await ler('../hooks/useAnaliseFinanceiraController.js')
  assert.equal((fonte.match(/useRelatorioFinanceiro\(/g) || []).length, 2)
  assert.match(fonte, /criterios: criteriosAnteriores/)
  assert.match(fonte, /const criteriosAnteriores = useMemo\(\(\) => \(\{ \.\.\.criterios, \.\.\.periodoAnterior \}\)/)
})

test('página mantém loading, erro e vazio explícitos', async () => {
  const fonte = await ler('../pages/AnaliseFinanceiraPage.jsx')
  assert.match(fonte, /Análise indisponível/)
  assert.match(fonte, /Carregando análise/)
  assert.match(fonte, /Nenhum registro no recorte/)
})

test('exportações recebem exatamente registros e indicadores do controller', async () => {
  const fonte = await ler('../pages/AnaliseFinanceiraPage.jsx')
  assert.match(fonte, /montarLinhasAnaliseFinanceira\(controller\.registros/)
  assert.match(fonte, /exportarRelatorioContasCsv\(linhas, controller\.contextoExportacao\)/)
  assert.match(fonte, /exportarRelatorioContasExcel\(linhas, controller\.contextoExportacao\)/)
})

test('Copilot é seção fixa por props e não depende de provider global', async () => {
  const [pagina, widgets, shell] = await Promise.all([
    ler('../pages/AnaliseFinanceiraPage.jsx'),
    ler('../components/copilot/widgets/CopilotWidgets.jsx'),
    ler('../components/shell/AppShell.jsx'),
  ])
  assert.match(pagina, /Inteligência gerencial/)
  assert.match(widgets, /\{ intelligence \}/)
  assert.doesNotMatch(widgets, /useCopilot|CopilotProvider/)
  assert.doesNotMatch(shell, /copilot|Copilot/i)
})

test('layout possui breakpoint mobile e não mantém drawer flutuante', async () => {
  const css = await ler('../pages/AnaliseFinanceiraPage.css')
  assert.match(css, /@media\(max-width:640px\)/)
  assert.doesNotMatch(css, /position:fixed|copilot-drawer|copilot-floating-button/)
})

test('mobile confina a largura da página e a rolagem ao detalhamento', async () => {
  const [pagina, css] = await Promise.all([
    ler('../pages/AnaliseFinanceiraPage.jsx'),
    ler('../pages/AnaliseFinanceiraPage.css'),
  ])
  assert.match(pagina, /Detalhamento financeiro com rolagem horizontal/)
  assert.match(css, /\.analise-financeira-page\s*\{[\s\S]*?width:\s*100%[\s\S]*?overflow-x:\s*clip/)
  assert.match(css, /\.analise-table\s*\{[\s\S]*?max-width:\s*100%[\s\S]*?overflow-x:\s*auto/)
  assert.match(css, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(pagina, /<summary aria-label="Abrir opções de exportação">Exportar<\/summary>/)
})

test('não existem rotas ou imports para as implementações removidas', async () => {
  const [rotas, app] = await Promise.all([ler('../routes/lazyRoutes.js'), ler('../App.jsx')])
  const fonte = `${rotas}\n${app}`
  assert.doesNotMatch(fonte, /RelatoriosContasPage|pages\/Relatorios\.jsx|LazyRelatorios\b|CopilotDrawer|CopilotFloatingButton/)
})
