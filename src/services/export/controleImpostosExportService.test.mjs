import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  criarDadosCsvControleImpostos,
  criarLinhasPdfControleImpostos,
  criarModeloExportacaoControleImpostos,
  criarNomeArquivoControleImpostos,
  criarPdfControleImpostos,
  exportarControleImpostosCsv,
  formatarDataExportacao,
  formatarMoedaExportacao
} from './controleImpostosExportService.js'
import { createCsvBlob } from './reportExportService.js'

function registro(overrides = {}) {
  return {
    id: 'imposto-1',
    imposto_tipo: 'simples_nacional',
    impostoLabel: 'Simples Nacional',
    descricao: 'DAS competência mensal',
    competenciaFiscal: 'Agosto/2026',
    data_vencimento: '2026-08-20',
    valor_previsto_relatorio: 1234.56,
    valor_pago_atual_relatorio: 234.5,
    saldo_restante_relatorio: 1000.06,
    statusOperacional: 'parcial',
    status_relatorio: 'parcial',
    parcialmente_pago: true,
    filialNome: 'Dona Flor Andradina',
    centroNome: 'Tributos sobre Vendas',
    ...overrides
  }
}

function modelo(registros = [registro()], filtros = {}) {
  return criarModeloExportacaoControleImpostos({
    registros,
    filtros: {
      dataInicial: '2026-08-01',
      dataFinal: '2026-08-31',
      campoPeriodoLabel: 'Vencimento',
      filialNome: 'Dona Flor Andradina',
      filtroLabel: 'A vencer',
      busca: '',
      ...filtros
    },
    emitidoEm: new Date('2026-08-20T12:30:00-03:00')
  })
}

test('prepara um registro com totais, datas e moeda PT-BR', () => {
  const resultado = modelo()
  assert.equal(resultado.linhas.length, 1)
  assert.deepEqual(resultado.totais, { quantidade: 1, previsto: 1234.56, pago: 234.5, saldo: 1000.06 })
  assert.equal(formatarDataExportacao('2026-08-20'), '20/08/2026')
  assert.equal(formatarMoedaExportacao(1234.56), 'R$ 1.234,56')
  assert.match(resultado.filtros.join(' | '), /Dona Flor Andradina/)
})

test('gera PDF A4 paisagem com um registro e conteúdo válido', () => {
  const doc = criarPdfControleImpostos(modelo())
  const bytes = new Uint8Array(doc.output('arraybuffer'))
  assert.equal(doc.internal.pageSize.getWidth() > doc.internal.pageSize.getHeight(), true)
  assert.equal(doc.getNumberOfPages(), 1)
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-')
  assert.ok(bytes.length > 5000)
})

test('gera PDF multipágina sem perder ou repetir linhas preparadas', () => {
  const registros = Array.from({ length: 120 }, (_, index) => registro({
    id: `imposto-${index + 1}`,
    descricao: `Descrição longa e acentuada do imposto número ${index + 1}; conferência "mensal"\nsegunda linha`,
    valor_previsto_relatorio: index + 1,
    valor_pago_atual_relatorio: index / 2,
    saldo_restante_relatorio: (index + 1) - (index / 2)
  }))
  const resultado = modelo(registros)
  const linhasPdf = criarLinhasPdfControleImpostos(resultado)
  const doc = criarPdfControleImpostos(resultado)
  assert.equal(linhasPdf.length, 120)
  assert.equal(new Set(resultado.linhas.map((linha) => linha.id)).size, 120)
  assert.ok(doc.getNumberOfPages() > 1)
})

test('CSV e PDF compartilham exatamente o mesmo recorte e valores', () => {
  const resultado = modelo([
    registro(),
    registro({ id: 'imposto-2', descricao: 'FGTS', valor_previsto_relatorio: 400, valor_pago_atual_relatorio: 400, saldo_restante_relatorio: 0 })
  ])
  const csv = criarDadosCsvControleImpostos(resultado)
  const pdf = criarLinhasPdfControleImpostos(resultado)
  assert.equal(csv.rows.length, pdf.length)
  assert.deepEqual(csv.rows.map((row) => row.slice(0, 3)), pdf.map((row) => row.slice(0, 3)))
  assert.deepEqual(csv.rows.map((row) => row.slice(4, 7)), [[1234.56, 234.5, 1000.06], [400, 400, 0]])
  assert.deepEqual(pdf.map((row) => row.slice(4, 7)), [
    ['R$ 1.234,56', 'R$ 234,50', 'R$ 1.000,06'],
    ['R$ 400,00', 'R$ 400,00', 'R$ 0,00']
  ])
})

test('CSV preserva BOM, separador e escapa ponto e vírgula, aspas e quebra de linha', async () => {
  const resultado = modelo([registro({ descricao: 'DAS; ajuste "especial"\ncom acentuação' })])
  const dados = criarDadosCsvControleImpostos(resultado)
  const blob = createCsvBlob(dados.headers, dados.rows)
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const texto = new TextDecoder().decode(bytes)
  assert.deepEqual(Array.from(bytes.slice(0, 3)), [0xef, 0xbb, 0xbf])
  assert.match(texto, /^"Imposto";"Descrição";/)
  assert.match(texto, /"DAS; ajuste ""especial"" com acentuação"/)
  assert.doesNotMatch(texto, /especial""\r?\ncom/)
})

test('filtros por filial, período, status e busca aparecem no modelo', () => {
  const resultado = modelo([registro()], { busca: 'DAS agosto' })
  const texto = resultado.filtros.join(' | ')
  assert.match(texto, /01\/08\/2026 a 31\/08\/2026/)
  assert.match(texto, /Filial: Dona Flor Andradina/)
  assert.match(texto, /Situação\/classificação: A vencer/)
  assert.match(texto, /Busca: DAS agosto/)
})

test('zero resultados não gera arquivo silenciosamente', () => {
  const vazio = modelo([])
  assert.throws(() => criarPdfControleImpostos(vazio), /Nenhum imposto encontrado/)
  assert.throws(() => exportarControleImpostosCsv({ modelo: vazio, filename: 'vazio.csv' }), /Nenhum imposto encontrado/)
})

test('nome de arquivo é determinístico e seguro', () => {
  assert.equal(
    criarNomeArquivoControleImpostos({ dataInicial: '2026-08-01', dataFinal: '2026-08-31', extensao: 'pdf' }),
    'controle-impostos-2026-08-01-a-2026-08-31.pdf'
  )
})

test('UI oferece CSV/PDF, trata erro e usa somente a lista filtrada', async () => {
  const pagina = await readFile(new URL('../../pages/ControleImpostosPage.jsx', import.meta.url), 'utf8')
  assert.match(pagina, /registros: impostosEncontrados/)
  assert.match(pagina, /label: 'Exportar CSV'/)
  assert.match(pagina, /label: 'PDF Executivo'/)
  assert.match(pagina, /role="alert"/)
})

test('autoridade fiscal é exclusivamente imposto_tipo estruturado', () => {
  assert.throws(
    () => modelo([registro({ imposto_tipo: '', descricao: 'FGTS escrito apenas na descrição' })]),
    /sem classificação estruturada/
  )
  const outro = modelo([registro({ imposto_tipo: 'outro', impostoLabel: 'FGTS por texto' })])
  assert.equal(outro.linhas[0].imposto, 'Outro imposto')
})
