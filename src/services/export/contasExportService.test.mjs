import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  criarDadosCsvContas,
  criarLinhasPdfContas,
  criarModeloExportacaoContas,
  criarNomeArquivoContas,
  criarPdfContas
} from './contasExportService.js'
import { createCsvBlob } from './reportExportService.js'

const HOJE = '2026-08-20'

function conta(overrides = {}) {
  return {
    id: 'conta-1',
    descricao: 'Fornecedor principal',
    valor: 1000,
    valor_pago: 0,
    status: 'pendente',
    data_vencimento: '2026-08-25',
    filial_id: 'filial-1',
    centro_custo_id: 'centro-1',
    df_filiais: { nome: 'Dona Flor Andradina' },
    df_centros_custo: { nome: 'Administrativo' },
    pagamentosParciaisTotal: 0,
    ...overrides
  }
}

function modelo(registros = [conta()], filtros = {}) {
  return criarModeloExportacaoContas({
    registros,
    filtros: {
      dataInicial: '2026-08-01',
      dataFinal: '2026-08-31',
      statusLabel: 'Em aberto',
      filialNome: 'Todas as filiais',
      centroNome: 'Todos',
      ...filtros
    },
    hoje: HOJE,
    emitidoEm: new Date('2026-08-20T12:30:00-03:00')
  })
}

test('normaliza a mesma verdade financeira com pagamento parcial consolidado', () => {
  const resultado = modelo([conta({ pagamentosParciaisTotal: 400 })])
  assert.deepEqual(resultado.totais, {
    quantidade: 1, total: 1000, pago: 400, saldo: 600, saldoVencido: 0,
    vencidas: 0, vencendoHoje: 0, aVencer: 1
  })
  assert.equal(resultado.linhas[0].status, 'parcial')
  assert.equal(resultado.linhas[0].origem, 'Manual')
})

test('totaliza em centavos e mantém sintético consistente com analítico', () => {
  const resultado = modelo([
    conta({ id: 'a', valor: 0.1, pagamentosParciaisTotal: 0.03 }),
    conta({ id: 'b', valor: 0.2, pagamentosParciaisTotal: 0.07 })
  ])
  assert.equal(resultado.totais.total, 0.3)
  assert.equal(resultado.totais.pago, 0.1)
  assert.equal(resultado.totais.saldo, 0.2)
  assert.equal(resultado.linhas.reduce((total, linha) => total + Math.round(linha.saldo * 100), 0), 20)
})

test('agrupa por filial e calcula saldo vencido sem duplicar contas', () => {
  const resultado = modelo([
    conta({ id: 'v1', data_vencimento: '2026-08-10', valor: 500, pagamentosParciaisTotal: 100 }),
    conta({ id: 'v2', filial_id: 'filial-2', df_filiais: { nome: 'Dona Flor Araçatuba' }, data_vencimento: HOJE, valor: 300 }),
    conta({ id: 'v3', filial_id: 'filial-2', df_filiais: { nome: 'Dona Flor Araçatuba' }, data_vencimento: '2026-09-01', valor: 200 })
  ])
  assert.equal(resultado.resumoFiliais.length, 2)
  assert.equal(resultado.resumoFiliais.find((linha) => linha.filial.includes('Andradina')).saldoVencido, 400)
  assert.deepEqual(
    { vencidas: resultado.totais.vencidas, hoje: resultado.totais.vencendoHoje, futuras: resultado.totais.aVencer },
    { vencidas: 1, hoje: 1, futuras: 1 }
  )
  assert.equal(new Set(resultado.linhas.map((linha) => linha.id)).size, 3)
})

test('usa rótulo humano para origem recorrente sem expor id técnico', () => {
  const resultado = modelo([conta({ recorrencia_id: 'uuid-tecnico-secreto' })])
  assert.equal(resultado.linhas[0].origem, 'Recorrente')
  assert.doesNotMatch(JSON.stringify(criarLinhasPdfContas(resultado)), /uuid-tecnico-secreto/)
})

test('CSV e PDF usam exatamente o mesmo conjunto normalizado', async () => {
  const resultado = modelo([
    conta({ id: '1' }),
    conta({ id: '2', descricao: 'Água; energia "matriz"\nrateio', valor: 250 })
  ])
  const csv = criarDadosCsvContas(resultado)
  const pdf = criarLinhasPdfContas(resultado)
  assert.equal(csv.rows.length, 2)
  assert.equal(pdf.length, 2)
  assert.deepEqual(csv.rows.map((linha) => linha[1]), resultado.linhas.map((linha) => linha.descricao))
  const bytesCsv = new Uint8Array(await createCsvBlob(csv.headers, csv.rows).arrayBuffer())
  const textoCsv = new TextDecoder().decode(bytesCsv)
  assert.deepEqual(Array.from(bytesCsv.slice(0, 3)), [0xef, 0xbb, 0xbf])
  assert.match(textoCsv, /^"Vencimento";"Descrição";/)
  assert.match(textoCsv, /"Água; energia ""matriz"" rateio"/)
})

test('gera PDF A4 paisagem, multipágina e preserva textos longos acentuados', () => {
  const registros = Array.from({ length: 90 }, (_, indice) => conta({
    id: `conta-${indice}`,
    descricao: `Descrição extensa número ${indice} com acentuação e conteúdo para quebra de linha controlada`,
    df_filiais: { nome: `Filial com nome corporativo muito longo ${indice % 3}` },
    df_centros_custo: { nome: 'Centro de custo administrativo e operacional muito longo' }
  }))
  const documento = criarPdfContas(modelo(registros))
  const bytes = new Uint8Array(documento.output('arraybuffer'))
  assert.equal(documento.internal.pageSize.getWidth() > documento.internal.pageSize.getHeight(), true)
  assert.ok(documento.getNumberOfPages() > 1)
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-')
  assert.ok(bytes.length > 5000)
})

test('zero registros gera erro claro e um registro gera documento', () => {
  assert.throws(() => criarPdfContas(modelo([])), /Nenhuma conta|Nenhum registro/)
  assert.equal(criarPdfContas(modelo()).getNumberOfPages() >= 1, true)
})

test('normalização é read-only e filtros ativos aparecem no cabeçalho', () => {
  const original = conta({ pagamentosParciaisTotal: 125 })
  const snapshot = structuredClone(original)
  const resultado = modelo([original], { busca: 'fornecedor', filialNome: 'Andradina' })
  assert.deepEqual(original, snapshot)
  assert.match(resultado.filtros.join(' | '), /Andradina/)
  assert.match(resultado.filtros.join(' | '), /Busca: fornecedor/)
})

test('nome de arquivo é seguro e UI mantém Excel com CSV e PDF Executivo', async () => {
  assert.equal(
    criarNomeArquivoContas({ dataInicial: '2026-08-01', dataFinal: '2026-08-31', extensao: 'pdf' }),
    'contas-a-pagar-2026-08-01-a-2026-08-31.pdf'
  )
  const pagina = await readFile(new URL('../../pages/ContasPage.jsx', import.meta.url), 'utf8')
  const app = await readFile(new URL('../../App.jsx', import.meta.url), 'utf8')
  assert.match(pagina, /label: 'PDF Executivo'/)
  assert.match(pagina, /label: 'Excel'/)
  assert.match(pagina, /label: 'CSV'/)
  assert.match(pagina, /role="alert"/)
  assert.match(app, /registros: contasFiltradas/)
  assert.match(app, /exportarContasPdf/)
})
