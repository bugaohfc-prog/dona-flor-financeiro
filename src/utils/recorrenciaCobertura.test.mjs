import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { calcularCoberturaRecorrencias, resolverHorizonteCobertura } from './recorrenciaCobertura.js'

const serie = (extra = {}) => ({ id: 'r1', empresa_id: 'e1', descricao: 'Aluguel', valor: 100, valor_variavel: false, dia_vencimento: 15, tipo_recorrencia: 'mensal', ativo: true, data_inicio: '2026-01-01', filial_id: 'f1', centro_custo_id: 'c1', ...extra })
const conta = (extra = {}) => ({ id: crypto.randomUUID(), empresa_id: 'e1', descricao: 'Aluguel', valor: 100, data_vencimento: '2026-07-15', recorrencia_id: 'r1', filial_id: 'f1', centro_custo_id: 'c1', status: 'pendente', ...extra })

test('horizonte de 90 dias e inclusivo', () => {
  assert.deepEqual(resolverHorizonteCobertura('90', '2026-07-19'), { inicio: '2026-07-19', fim: '2026-10-17', tipo: '90' })
  const resultado = calcularCoberturaRecorrencias({ series: [serie({ dia_vencimento: 19 })], contas: [], horizonte: { inicio: '2026-07-19', fim: '2026-10-17' } })
  assert.deepEqual(resultado.ocorrencias.map((item) => item.dataVencimento), ['2026-07-19', '2026-08-19', '2026-09-19'])
})

test('horizontes atravessam mes e ano no calendario local', () => {
  assert.deepEqual(resolverHorizonteCobertura('30', '2026-12-15'), { inicio: '2026-12-15', fim: '2027-01-14', tipo: '30' })
  assert.deepEqual(resolverHorizonteCobertura('proximo_mes', '2026-12-15'), { inicio: '2027-01-01', fim: '2027-01-31', tipo: 'proximo_mes' })
})

test('dias 29 30 e 31 respeitam fim do mes e fevereiro bissexto', () => {
  const resultado = calcularCoberturaRecorrencias({ series: [serie({ dia_vencimento: 31 })], contas: [], horizonte: { inicio: '2028-01-01', fim: '2028-04-30' } })
  assert.deepEqual(resultado.ocorrencias.map((item) => item.dataVencimento), ['2028-01-31', '2028-02-29', '2028-03-31', '2028-04-30'])
})

test('inicio e fim da recorrencia limitam ocorrencias', () => {
  const resultado = calcularCoberturaRecorrencias({ series: [serie({ data_inicio: '2026-08-01', data_fim: '2026-09-30' })], contas: [], horizonte: { inicio: '2026-07-01', fim: '2026-10-31' } })
  assert.deepEqual(resultado.ocorrencias.map((item) => item.dataVencimento), ['2026-08-15', '2026-09-15'])
})

test('classifica coberta faltante e duplicada', () => {
  const resultado = calcularCoberturaRecorrencias({ series: [serie()], contas: [conta(), conta({ id: 'duplicada' })], horizonte: { inicio: '2026-07-01', fim: '2026-09-30' } })
  assert.deepEqual(resultado.ocorrencias.map((item) => item.cobertura), ['duplicada', 'faltante', 'faltante'])
  assert.deepEqual(resultado.resumo, { esperadas: 3, cobertas: 0, faltantes: 2, duplicadas: 1, inconsistencias: 0 })
})

test('conta vinculada paga continua cobrindo a ocorrencia', () => {
  const resultado = calcularCoberturaRecorrencias({ series: [serie()], contas: [conta({ status: 'pago' })], horizonte: { inicio: '2026-07-01', fim: '2026-07-31' } })
  assert.equal(resultado.ocorrencias[0].cobertura, 'coberta')
})

test('conta excluida ou deletada nao cobre', () => {
  const resultado = calcularCoberturaRecorrencias({ series: [serie()], contas: [conta({ excluido: true }), conta({ deletado: true })], horizonte: { inicio: '2026-07-01', fim: '2026-07-31' } })
  assert.equal(resultado.ocorrencias[0].cobertura, 'faltante')
})

test('sugestao manual forte informa criterios', () => {
  const manual = conta({ recorrencia_id: null })
  const resultado = calcularCoberturaRecorrencias({ series: [serie()], contas: [manual], horizonte: { inicio: '2026-07-01', fim: '2026-07-31' } })
  assert.equal(resultado.ocorrencias[0].sugestoes[0].confianca, 'forte')
  assert.ok(resultado.ocorrencias[0].sugestoes[0].criterios.includes('mesmo valor'))
})

test('sugestao manual possivel aceita descricao diferente com data e organizacao', () => {
  const manual = conta({ recorrencia_id: null, descricao: 'Despesa mensal', valor: 80 })
  const resultado = calcularCoberturaRecorrencias({ series: [serie()], contas: [manual], horizonte: { inicio: '2026-07-01', fim: '2026-07-31' } })
  assert.equal(resultado.ocorrencias[0].sugestoes[0].confianca, 'possivel')
})

test('sugestao manual pode usar competencia explicita da serie', () => {
  const referencia = conta({ id: 'referencia', data_vencimento: '2026-06-15', competencia: '2026-05-01', imposto_tipo: 'inss' })
  const manual = conta({ id: 'manual', recorrencia_id: null, data_vencimento: '2026-08-20', competencia: '2026-06-01' })
  const resultado = calcularCoberturaRecorrencias({ series: [serie()], contas: [referencia, manual], horizonte: { inicio: '2026-07-01', fim: '2026-07-31' } })
  assert.equal(resultado.ocorrencias[0].sugestoes[0].confianca, 'possivel')
  assert.ok(resultado.ocorrencias[0].sugestoes[0].criterios.includes('mesma competência'))
})

test('valor fixo exige compatibilidade e variavel nao exige igualdade', () => {
  const manual = conta({ recorrencia_id: null, valor: 999 })
  const fixa = calcularCoberturaRecorrencias({ series: [serie()], contas: [manual], horizonte: { inicio: '2026-07-01', fim: '2026-07-31' } })
  const variavel = calcularCoberturaRecorrencias({ series: [serie({ valor_variavel: true })], contas: [manual], horizonte: { inicio: '2026-07-01', fim: '2026-07-31' } })
  assert.equal(fixa.ocorrencias[0].sugestoes[0].confianca, 'possivel')
  assert.equal(variavel.ocorrencias[0].sugestoes[0].confianca, 'forte')
})

test('filial ou centro incompativel impede sugestao manual', () => {
  const manual = conta({ recorrencia_id: null, filial_id: 'outra' })
  const resultado = calcularCoberturaRecorrencias({ series: [serie()], contas: [manual], horizonte: { inicio: '2026-07-01', fim: '2026-07-31' } })
  assert.deepEqual(resultado.ocorrencias[0].sugestoes, [])
})

test('service usa paginacao reutilizavel acima do limite padrao', async () => {
  const fonte = await readFile(new URL('../services/recorrenciaCoberturaService.js', import.meta.url), 'utf8')
  assert.equal((fonte.match(/executarConsultaPaginada/g) || []).length >= 3, true)
  assert.match(fonte, /order\('data_vencimento'.*order\('id'/s)
})

test('hook protege troca de empresa e resposta obsoleta', async () => {
  const fonte = await readFile(new URL('../hooks/useRecorrenciaCobertura.js', import.meta.url), 'utf8')
  assert.match(fonte, /criarControleConsultaRelatorio/)
  assert.match(fonte, /estaAtual\(token\)/)
  assert.match(fonte, /obsoleta: true/)
  assert.match(fonte, /empresaId/)
})

test('central de cobertura nao possui qualquer mutacao ou geracao', async () => {
  const service = await readFile(new URL('../services/recorrenciaCoberturaService.js', import.meta.url), 'utf8')
  const fontes = await Promise.all(['../hooks/useRecorrenciaCobertura.js', '../pages/RecorrenciasFinanceirasPage.jsx'].map((arquivo) => readFile(new URL(arquivo, import.meta.url), 'utf8')))
  assert.equal(/\.insert\s*\(|\.update\s*\(|\.delete\s*\(|\.upsert\s*\(/.test(service), false)
  assert.equal([service, ...fontes].some((fonte) => /executarPlanejamento|gerarRecorrenc|vincularRecorrenc/.test(fonte)), false)
})
