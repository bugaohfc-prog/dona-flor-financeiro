import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MESES_FLUXO_CAIXA,
  TITULO_MODELO_FLUXO_CAIXA,
  agregarFluxoCaixaMensal,
  agregarMovimentosPorFilial,
  agregarSaidasPorRubrica,
  montarAbaModeloFluxoCaixa,
  montarMovimentosFluxoCaixa
} from './fluxoCaixaUtils.js'
import {
  RUBRICA_FATURAMENTO_BRUTO,
  RUBRICA_TOTAL_GERAL,
  RUBRICAS_SAIDA_FLUXO_CAIXA
} from './classificarRubricaFluxoCaixa.js'
import {
  createFluxoCaixaWorksheetXml,
  createFluxoCaixaXlsxBlob
} from '../../../../services/export/reportExportService.js'

function criarModelo(movimentos = []) {
  return montarAbaModeloFluxoCaixa({
    empresa: 'Empresa de teste',
    cnpj: '00.000.000/0001-00',
    endereco: 'Endereço de teste',
    resultado: agregarFluxoCaixaMensal(movimentos),
    rubricas: agregarSaidasPorRubrica(movimentos)
  })
}

test('modelo do cliente mantém exatamente 12 meses e as rubricas na ordem oficial', () => {
  const modelo = criarModelo()

  assert.equal(modelo.titulo, TITULO_MODELO_FLUXO_CAIXA)
  assert.equal(modelo.meses.length, 12)
  assert.deepEqual(modelo.meses, MESES_FLUXO_CAIXA.map((mes) => mes.nome.toUpperCase()))
  assert.deepEqual(modelo.despesas.map((rubrica) => rubrica.nome), RUBRICAS_SAIDA_FLUXO_CAIXA)
  assert.equal(modelo.faturamento.length, 12)
  assert.equal(modelo.totais.length, 12)
  assert.equal('totalAnual' in modelo, false)
  assert.equal('geradoEm' in modelo, false)
  assert.equal('observacao' in modelo, false)
  assert.equal('quantidadeMovimentos' in modelo, false)
})

test('worksheet usa fórmulas, faixa escura, moeda pt-BR, zeros contábeis e impressão em paisagem', async () => {
  const modelo = criarModelo([
    { tipo: 'entrada', mes: 1, valor: 1000 },
    { tipo: 'saida', mes: 1, valor: 250, rubrica: RUBRICAS_SAIDA_FLUXO_CAIXA[0] }
  ])
  const worksheet = createFluxoCaixaWorksheetXml(modelo)
  const workbook = new TextDecoder().decode(await createFluxoCaixaXlsxBlob([
    { name: 'Consolidado Geral', model: modelo }
  ]).arrayBuffer())

  assert.match(worksheet, /<mergeCell ref="A1:M1"\/>/)
  assert.match(worksheet, /<f>B6-SUM\(B7:B18\)<\/f><v>750<\/v>/)
  assert.match(worksheet, /<f>M6-SUM\(M7:M18\)<\/f>/)
  assert.match(worksheet, /SÓCIO\/PROPRIETÁRIO:/)
  assert.match(worksheet, /orientation="landscape"/)
  assert.match(worksheet, /fitToWidth="1"/)
  assert.match(workbook, /fgColor rgb="FF595959"/)
  assert.match(workbook, /fgColor rgb="FF7F7F7F"/)
  assert.match(workbook, /color rgb="FFFFFFFF"/)
  assert.match(workbook, /#,##0\.00;&quot;-&quot;/)
  assert.doesNotMatch(worksheet, /Total anual|Gerado em|Quantidade de movimentos|Observação/)
})

test('workbook preserva nomes válidos e diferencia abas com nomes repetidos', async () => {
  const modelo = criarModelo()
  const blob = createFluxoCaixaXlsxBlob([
    { name: 'Consolidado Geral', model: modelo },
    { name: 'Filial / Nome muito longo que excede trinta e um caracteres', model: modelo },
    { name: 'Filial / Nome muito longo que excede trinta e um caracteres', model: modelo }
  ])
  const conteudo = new TextDecoder().decode(await blob.arrayBuffer())

  assert.match(conteudo, /name="Consolidado Geral"/)
  assert.doesNotMatch(conteudo, /name="[^"]*[\\/?*\[\]:][^"]*"/)
  assert.match(conteudo, / \(2\)"/)
  assert.match(conteudo, /_xlnm\.Print_Area/)
  assert.match(conteudo, /&quot;R\$&quot; #,##0\.00/)
})

test('consolidado é matematicamente igual à soma das unidades sem duplicação', () => {
  const movimentos = [
    { id: 'r1', tipo: 'entrada', mes: 1, valor: 300, filial_id: 'a', filial_nome: 'Filial A' },
    { id: 's1', tipo: 'saida', mes: 1, valor: 80, filial_id: 'a', filial_nome: 'Filial A', rubrica: RUBRICAS_SAIDA_FLUXO_CAIXA[0] },
    { id: 'r2', tipo: 'entrada', mes: 1, valor: 200, filial_id: 'b', filial_nome: 'Filial B' },
    { id: 's2', tipo: 'saida', mes: 1, valor: 20, filial_id: '', filial_nome: 'Sem filial', rubrica: RUBRICAS_SAIDA_FLUXO_CAIXA[1] }
  ]
  const consolidado = criarModelo(movimentos)
  const grupos = agregarMovimentosPorFilial(movimentos, [
    { id: 'a', nome: 'Filial A' },
    { id: 'b', nome: 'Filial B' }
  ]).map((grupo) => montarAbaModeloFluxoCaixa({
    empresa: grupo.filialNome,
    resultado: grupo.resultado,
    rubricas: grupo.rubricas
  }))

  for (let mes = 0; mes < 12; mes += 1) {
    assert.equal(
      consolidado.totais[mes],
      grupos.reduce((total, grupo) => total + grupo.totais[mes], 0)
    )
  }
})

test('pagamento parcial e residual quitado não são duplicados no modelo', () => {
  const conta = {
    id: 'conta-1',
    status: 'pago',
    valor: 200,
    valor_pago: 200,
    data_pagamento: '2026-01-20',
    filial_id: 'filial-1',
    descricao: 'Fornecedor'
  }
  const movimentos = montarMovimentosFluxoCaixa({
    contasPagas: [conta],
    pagamentosParciais: [
      { id: 'parcial-1', conta_id: conta.id, valor_pago: 50, data_pagamento: '2026-01-10' }
    ],
    contasPorId: new Map([[conta.id, conta]]),
    filiaisPorId: new Map([['filial-1', { nome: 'Filial 1' }]]),
    ano: 2026
  })
  const modelo = criarModelo(movimentos)
  const totalDespesasJaneiro = modelo.despesas.reduce((total, rubrica) => total + rubrica.valores[0], 0)

  assert.equal(movimentos.length, 2)
  assert.equal(totalDespesasJaneiro, 200)
  assert.equal(modelo.totais[0], -200)
  assert.equal(modelo.despesas.length + 2, 14)
  assert.equal(RUBRICA_FATURAMENTO_BRUTO, 'FATURAMENTO BRUTO')
  assert.equal(RUBRICA_TOTAL_GERAL, 'TOTAL GERAL')
})
