import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MESES_FLUXO_CAIXA,
  TITULO_MODELO_FLUXO_CAIXA,
  agregarFluxoCaixaMensal,
  agregarMovimentosPorFilial,
  agregarSaidasPorRubrica,
  filtrarFiliaisElegiveisFluxo,
  montarAbaModeloFluxoCaixa,
  montarMovimentosFluxoCaixa
} from './fluxoCaixaUtils.js'
import {
  RUBRICA_ALUGUEL,
  RUBRICA_FATURAMENTO_BRUTO,
  RUBRICA_FOLHA_PAGAMENTO,
  RUBRICA_IMPOSTOS_FOLHA,
  RUBRICA_PRO_LABORE,
  RUBRICA_TOTAL_GERAL,
  RUBRICAS_SAIDA_FLUXO_CAIXA,
  classificarRubricaFluxoCaixa
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

test('CC empresarial confiável prevalece sobre observações e filial', () => {
  assert.equal(classificarRubricaFluxoCaixa({
    descricao: 'Hindeburg', centro_custo_nome: 'RH', filial_nome: 'Qualquer filial empresarial'
  }).rubrica, RUBRICA_FOLHA_PAGAMENTO)
  assert.equal(classificarRubricaFluxoCaixa({
    descricao: 'Pro-labore Joanna', centro_custo_nome: 'Pró-labore', filial_nome: 'Dona Flor Andradina'
  }).rubrica, RUBRICA_PRO_LABORE)
  assert.equal(classificarRubricaFluxoCaixa({
    descricao: 'Aluguel Loja Matriz Andradina - sem IRRF',
    observacao: 'INSS/IRRF conforme contrato', centro_custo_nome: 'Ocupação'
  }).rubrica, RUBRICA_ALUGUEL)
  assert.equal(classificarRubricaFluxoCaixa({
    descricao: 'FGTS competência mensal', centro_custo_nome: 'Impostos e Taxas'
  }).rubrica, RUBRICA_IMPOSTOS_FOLHA)
})

test('filial Pessoais e CC Pessoais são excluídos antes de formar movimentos', () => {
  const filiaisPorId = new Map([
    ['empresa', { nome: 'Matriz' }],
    ['pessoal', { nome: 'Pessoais' }]
  ])
  const contaFilialPessoal = {
    id: 'conta-filial-pessoal', status: 'pago', valor: 120, valor_pago: 130,
    juros_multa: 10, data_pagamento: '2026-07-10', filial_id: 'pessoal',
    descricao: 'Conta particular', df_centros_custo: { nome: 'RH' }
  }
  const contaCentroPessoal = {
    id: 'conta-centro-pessoal', status: 'pago', valor: 80, valor_pago: 80,
    data_pagamento: '2026-07-11', filial_id: 'empresa', descricao: 'Despesa pessoal',
    df_centros_custo: { nome: 'Pessoal' }
  }
  const movimentos = montarMovimentosFluxoCaixa({
    contasPagas: [contaFilialPessoal, contaCentroPessoal],
    pagamentosParciais: [
      { id: 'parcial-pessoal', conta_id: contaFilialPessoal.id, valor_pago: 20, data_pagamento: '2026-07-05' }
    ],
    receitas: [
      { id: 'receita-pessoal', status: 'ativo', valor: 500, data_receita: '2026-07-01', filial_id: 'pessoal' }
    ],
    contasPorId: new Map([
      [contaFilialPessoal.id, contaFilialPessoal],
      [contaCentroPessoal.id, contaCentroPessoal]
    ]),
    filiaisPorId,
    ano: 2026
  })

  assert.deepEqual(movimentos, [])
})

test('seletor, grupos e consolidado recebem somente dados empresariais', () => {
  const filiais = [
    { id: 'empresa', nome: 'Matriz' },
    { id: 'pessoal', nome: 'Pessoais' }
  ]
  assert.deepEqual(filtrarFiliaisElegiveisFluxo(filiais).map((filial) => filial.id), ['empresa'])

  const contaEmpresa = {
    id: 'conta-empresa', status: 'pago', valor: 100, valor_pago: 100,
    data_pagamento: '2026-07-12', filial_id: 'empresa', descricao: 'Fornecedor',
    df_centros_custo: { nome: 'Mercadoria' }
  }
  const movimentos = montarMovimentosFluxoCaixa({
    contasPagas: [contaEmpresa],
    receitas: [
      { id: 'receita-empresa', status: 'ativo', valor: 300, data_receita: '2026-07-01', filial_id: 'empresa' },
      { id: 'receita-pessoal', status: 'ativo', valor: 900, data_receita: '2026-07-01', filial_id: 'pessoal' }
    ],
    contasPorId: new Map([[contaEmpresa.id, contaEmpresa]]),
    filiaisPorId: new Map(filiais.map((filial) => [filial.id, filial])),
    ano: 2026
  })
  const resultado = agregarFluxoCaixaMensal(movimentos)
  const grupos = agregarMovimentosPorFilial([
    ...movimentos,
    { id: 'defesa-pessoal', tipo: 'saida', mes: 7, valor: 999, filial_id: 'pessoal', filial_nome: 'Pessoais' }
  ], filiais)

  assert.equal(resultado.totais.entradas, 300)
  assert.equal(resultado.totais.saidas, 100)
  assert.equal(resultado.totais.saldo, 200)
  assert.deepEqual(grupos.map((grupo) => grupo.filialId), ['empresa'])
})
