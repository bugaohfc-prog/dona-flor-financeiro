import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  calcularPremiacaoFolha,
  horasFolhaParaPersistencia,
  horasFolhaParaTexto,
  planejarInclusaoCompraFolha,
  resolverValorLancamentoFolha,
  totalItensFinanceirosFolha
} from './folhaDomain.js'
import {
  montarControleComprasFolha,
  montarFechamentoFolhaContabilidade
} from './folhaExport.js'
import { createXlsxBlob } from '../../../../services/export/reportExportService.js'

const funcionarios = [
  { id: 'func-1', nome: 'SMOKE-FOLHA', filial_id: 'filial-1' },
  { id: 'func-2', nome: 'SMOKE-FOLHA', filial_id: 'filial-2' }
]
const filiais = [
  { id: 'filial-1', nome: 'Matriz' },
  { id: 'filial-2', nome: 'Matriz' }
]
const lancamentos = [
  { id: 'compras-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'desconto', categoria: 'compras_vales', valor: 100, arquivado: false },
  { id: 'plano-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'desconto', categoria: 'plano_saude', valor: 45.67, arquivado: false },
  { id: 'premio-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'credito', categoria: 'premiacao', quantidade: 10000, percentual: 2, valor: 200, arquivado: false },
  { id: 'he50-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'credito', categoria: 'hora_extra_50', valor: 0, arquivado: false },
  { id: 'he60-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'credito', categoria: 'hora_extra_60', valor: 0, arquivado: false },
  { id: 'he100-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'credito', categoria: 'hora_extra_100', valor: 0, arquivado: false },
  { id: 'falta-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'desconto', categoria: 'falta_injustificada', valor: 0, arquivado: false },
  { id: 'obs-1', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'informativo', categoria: 'observacao_administrativa', valor: null, observacao_administrativa: 'SMOKE-FOLHA CONTABILIDADE', arquivado: false },
  { id: 'compras-2', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-2', filial_id: 'filial-2', natureza: 'desconto', categoria: 'compras_vales', valor: 30, arquivado: false },
  { id: 'ignorado', empresa_id: 'emp-1', competencia_id: 'comp-1', funcionario_id: 'func-1', filial_id: 'filial-1', natureza: 'desconto', categoria: 'compras_vales', valor: 999, arquivado: true }
]
const itensLancamentos = [
  { id: 'c1', lancamento_id: 'compras-1', funcionario_id: 'func-1', categoria: 'compras_vales', valor: 40, arquivado: false },
  { id: 'c2', lancamento_id: 'compras-1', funcionario_id: 'func-1', categoria: 'compras_vales', valor: 60, arquivado: false },
  { id: 'c3', lancamento_id: 'compras-1', funcionario_id: 'func-1', categoria: 'compras_vales', valor: 500, arquivado: true },
  { id: 'he50', lancamento_id: 'he50-1', funcionario_id: 'func-1', categoria: 'hora_extra_50', quantidade: 4 + 20 / 60, valor: 0, arquivado: false },
  { id: 'he60', lancamento_id: 'he60-1', funcionario_id: 'func-1', categoria: 'hora_extra_60', quantidade: 5.5, valor: 0, arquivado: false },
  { id: 'he100', lancamento_id: 'he100-1', funcionario_id: 'func-1', categoria: 'hora_extra_100', quantidade: 4 + 28 / 60, valor: 0, arquivado: false },
  { id: 'f1', lancamento_id: 'falta-1', funcionario_id: 'func-1', categoria: 'falta_injustificada', quantidade: 1, data_referencia: '2026-07-02', valor: 0, arquivado: false },
  { id: 'f2', lancamento_id: 'falta-1', funcionario_id: 'func-1', categoria: 'falta_injustificada', quantidade: 1, data_referencia: '2026-07-03', valor: 0, arquivado: false },
  { id: 'f3', lancamento_id: 'falta-1', funcionario_id: 'func-1', categoria: 'falta_injustificada', quantidade: 1, data_referencia: '2026-07-03', valor: 0, arquivado: false },
  { id: 'f4', lancamento_id: 'falta-1', funcionario_id: 'func-1', categoria: 'falta_injustificada', quantidade: 1, data_referencia: '2026-07-04', valor: 0, arquivado: true }
]
const params = { empresaId: 'emp-1', competenciaId: 'comp-1', competencia: '2026-07', funcionarios, filiais, lancamentos, itensLancamentos }

test('transição do lançamento legado preserva primeira compra antes da nova', () => {
  const pai = { id: 'pai', valor: 40, descricao: 'Compra original' }
  const plano = planejarInclusaoCompraFolha({ lancamento: pai, itens: [], novaCompra: { valor: 60 } })
  assert.deepEqual(plano.map((item) => item.valor), [40, 60])
  assert.equal(totalItensFinanceirosFolha(plano), 100)
  assert.equal(resolverValorLancamentoFolha({ ...pai, valor: 100 }, plano.map((item, index) => ({ ...item, id: `${index}`, lancamento_id: 'pai' }))), 100)
})

test('item arquivado sai do total e reativado volta', () => {
  const itens = [{ valor: 40, arquivado: false }, { valor: 60, arquivado: true }]
  assert.equal(totalItensFinanceirosFolha(itens), 40)
  assert.equal(totalItensFinanceirosFolha(itens.map((item) => ({ ...item, arquivado: false }))), 100)
})

test('premiação usa somente vendas vezes percentual', () => {
  assert.equal(calcularPremiacaoFolha(10000, 2), 200)
})

test('horas fazem ida e volta sem perda nos casos do smoke', () => {
  for (const hora of ['04:20', '05:30', '04:28']) {
    assert.equal(horasFolhaParaTexto(horasFolhaParaPersistencia(hora)), hora)
  }
})

test('controle de compras usa uma aba, blocos por ID e compras dinâmicas', () => {
  const modelo = montarControleComprasFolha(params)
  assert.equal(modelo.aba, 'Controle de Compras')
  assert.equal(modelo.blocos.length, 2)
  assert.equal(modelo.maximoCompras, 2)
  assert.deepEqual(modelo.blocos[0].linhas[0].compras, [40, 60])
  assert.equal(modelo.blocos[0].linhas[0].total, 100)
  assert.equal(modelo.totalGeral, 130)
  assert.equal(modelo.sheet.landscape, true)
  assert.deepEqual(modelo.sheet.currencyColumns, [1, 2, 3])
})

test('fechamento contábil consolida valores, horas, faltas e observações sem duplicar', () => {
  const modelo = montarFechamentoFolhaContabilidade(params)
  assert.equal(modelo.aba, 'Fechamento de Folha')
  assert.equal(modelo.blocos.length, 2)
  const linha = modelo.blocos[0].linhas[0]
  assert.equal(linha.compras, 100)
  assert.equal(linha.planoSaude, 45.67)
  assert.equal(linha.premiacao, 200)
  assert.equal(linha.he50, '04:20')
  assert.equal(linha.he60, '05:30')
  assert.equal(linha.he100, '04:28')
  assert.equal(linha.faltas, 3)
  assert.deepEqual(linha.datasFaltas, ['2026-07-02', '2026-07-03'])
  assert.deepEqual(linha.observacoes, ['SMOKE-FOLHA CONTABILIDADE'])
  assert.deepEqual(modelo.sheet.currencyColumns, [1, 2, 3])
  const controle = montarControleComprasFolha(params)
  assert.equal(linha.compras, controle.blocos[0].linhas[0].total)
})

test('workbooks Excel são arquivos únicos, monetários e ajustados em paisagem', async () => {
  for (const modelo of [montarControleComprasFolha(params), montarFechamentoFolhaContabilidade(params)]) {
    const blob = createXlsxBlob([modelo.sheet])
    const bytes = new Uint8Array(await blob.arrayBuffer())
    assert.deepEqual(Array.from(bytes.slice(0, 4)), [0x50, 0x4b, 0x03, 0x04])
    const conteudo = new TextDecoder().decode(bytes)
    assert.match(conteudo, /orientation="landscape"/)
    assert.match(conteudo, /fitToWidth="1"/)
    assert.match(conteudo, /numFmtId="164"/)
    assert.equal(modelo.arquivo.endsWith('.xlsx'), true)
  }
})

test('arquitetura da Folha não usa styles globais nem DOM responsivo duplicado', async () => {
  const [app, pagina, css, patterns, global] = await Promise.all([
    readFile(new URL('../../../../App.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../../../pages/FechamentoFolhaPage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../../../pages/FechamentoFolhaPage.css', import.meta.url), 'utf8'),
    readFile(new URL('../../../../components/shared/PagePatterns.css', import.meta.url), 'utf8'),
    readFile(new URL('../../../../styles.css', import.meta.url), 'utf8')
  ])
  assert.doesNotMatch(app, /<LazyFechamentoFolhaPage[\s\S]{0,120}styles=/)
  assert.match(pagina, /import '\.\/FechamentoFolhaPage\.css'/)
  assert.doesNotMatch(pagina, /style=\{|styles\.|estilosLocais/)
  assert.doesNotMatch(patterns, /\.folha-/)
  assert.doesNotMatch(global, /\.folha-/)
  assert.doesNotMatch(css, /!important/)
  assert.doesNotMatch(pagina, /folha-(desktop|mobile)-(list|table|cards)/)
  assert.match(css, /@media \(max-width: 560px\)/)
  assert.match(pagina, /competenciaLancamentosCarregadaId === competenciaSelecionadaId/)
  assert.match(pagina, /salvandoCompraRapida/)
})
