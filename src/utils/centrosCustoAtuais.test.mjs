import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { classificarRubricaFluxoCaixa } from '../modules/contas/utils/fluxo-caixa/classificarRubricaFluxoCaixa.js'
import { CENTROS_CUSTO_ATUAIS, ehCentroTributosTaxas } from './centrosCustoAtuais.js'

const ler = (caminho) => readFile(new URL(caminho, import.meta.url), 'utf8')

test('sugestões de novas contas usam os centros atuais', () => {
  assert.equal(
    classificarRubricaFluxoCaixa({ descricao: 'Salário mensal' }).centroCustoSugerido,
    CENTROS_CUSTO_ATUAIS.FOLHA_BENEFICIOS
  )
  assert.equal(
    classificarRubricaFluxoCaixa({ descricao: 'Compra de fornecedor' }).centroCustoSugerido,
    CENTROS_CUSTO_ATUAIS.MERCADORIAS_COMPRAS
  )
  assert.equal(
    classificarRubricaFluxoCaixa({ descricao: 'FGTS competência mensal' }).centroCustoSugerido,
    CENTROS_CUSTO_ATUAIS.ENCARGOS_TRABALHISTAS
  )
  assert.equal(
    classificarRubricaFluxoCaixa({ descricao: 'Simples Nacional' }).centroCustoSugerido,
    CENTROS_CUSTO_ATUAIS.TRIBUTOS_VENDAS
  )
  assert.equal(
    classificarRubricaFluxoCaixa({ descricao: 'INSS Parcelamento' }).centroCustoSugerido,
    CENTROS_CUSTO_ATUAIS.PARCELAMENTOS_TRIBUTARIOS
  )
})

test('AccountModal encontra o centro atual mesmo quando o alias antigo ainda está disponível', () => {
  const centros = [
    { id: 'legado', nome: 'RH' },
    { id: 'atual', nome: CENTROS_CUSTO_ATUAIS.FOLHA_BENEFICIOS }
  ]
  const sugestao = classificarRubricaFluxoCaixa({ descricao: 'Salário mensal' })
  const selecionado = centros.find((centro) => centro.nome === sugestao.centroCustoSugerido)

  assert.equal(selecionado?.id, 'atual')
})

test('Controle de Impostos prioriza o nome atual e aceita o legado somente na leitura', () => {
  assert.equal(ehCentroTributosTaxas(CENTROS_CUSTO_ATUAIS.TRIBUTOS_TAXAS), true)
  assert.equal(ehCentroTributosTaxas('Impostos e Taxas'), true)
  assert.equal(ehCentroTributosTaxas('Encargos Trabalhistas'), false)
})

test('aliases antigos continuam classificando histórico sem virar sugestão', () => {
  const folha = classificarRubricaFluxoCaixa({ descricao: 'Hindeburg', centro_custo_nome: 'RH' })
  const compras = classificarRubricaFluxoCaixa({ descricao: 'Compra', centro_custo_nome: 'Mercadoria' })
  const impostos = classificarRubricaFluxoCaixa({ descricao: 'Guia genérica', centro_custo_nome: 'Impostos e Taxas' })

  assert.equal(folha.centroCustoSugerido, CENTROS_CUSTO_ATUAIS.FOLHA_BENEFICIOS)
  assert.equal(compras.centroCustoSugerido, CENTROS_CUSTO_ATUAIS.MERCADORIAS_COMPRAS)
  assert.equal(impostos.centroCustoSugerido, CENTROS_CUSTO_ATUAIS.TRIBUTOS_VENDAS)
})

test('onboarding cria Administrativo e fluxos atuais não sugerem nomes antigos', async () => {
  const [onboarding, classificador, contaModal, impostos] = await Promise.all([
    ler('../pages/OnboardingPage.jsx'),
    ler('../modules/contas/utils/fluxo-caixa/classificarRubricaFluxoCaixa.js'),
    ler('../components/modals/AccountModal.jsx'),
    ler('../pages/ControleImpostosPage.jsx')
  ])
  const mapaSugestoes = classificador.slice(
    classificador.indexOf('const RUBRICA_CENTRO_SUGERIDO'),
    classificador.indexOf('const termos')
  )

  assert.match(onboarding, /CENTROS_CUSTO_ATUAIS\.ADMINISTRATIVO/)
  assert.doesNotMatch(onboarding, /['"]Operacional['"]/);
  assert.doesNotMatch(mapaSugestoes, /['"](?:RH|Mercadoria|Impostos e Taxas)['"]/);
  assert.doesNotMatch(contaModal, /['"](?:RH|Mercadoria|Impostos e Taxas)['"]/)
  assert.match(impostos, /imposto_tipo/)
  assert.doesNotMatch(impostos, /ehCentroTributosTaxas/)
})
