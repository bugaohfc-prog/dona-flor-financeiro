import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { podeEditarBilling } from '../services/permissoesService.js'
import {
  senhaProvisoriaValida,
  TAMANHO_MINIMO_SENHA_PROVISORIA,
} from '../services/usuariosService.js'
import {
  calcularResumoFinanceiroContas,
  criarAlvoContaParaNavegacao,
  origemPermiteContaForaDoFiltro,
} from './contasConsultasOperacionais.js'
import {
  obterEstadoRetencaoLixeira,
  podeExcluirDefinitivo,
} from './lixeira.js'
import { telaRetornoSessaoSegura } from './session.js'

const lerFonte = (arquivo) => readFile(new URL(arquivo, import.meta.url), 'utf8')

test('lixeira exige 60 dias e a interface revalida antes da exclusão definitiva', async () => {
  const excluidoEm = new Date('2026-05-01T12:00:00.000Z')
  const antes = new Date('2026-06-29T11:59:59.000Z')
  const limite = new Date('2026-06-30T12:00:00.000Z')

  assert.equal(podeExcluirDefinitivo(excluidoEm, antes), false)
  assert.equal(podeExcluirDefinitivo(excluidoEm, limite), true)
  assert.equal(obterEstadoRetencaoLixeira(excluidoEm, antes).diasRestantes, 2)

  const [pagina, app, hookNotas] = await Promise.all([
    lerFonte('../pages/LixeiraPage.jsx'),
    lerFonte('../App.jsx'),
    lerFonte('../hooks/useNotas.js'),
  ])
  assert.match(pagina, /disabled=\{!liberada\}/)
  assert.match(pagina, /retencao\.diasRestantes/)
  assert.match(app, /\.select\('id, excluido, excluido_em'\)/)
  assert.match(app, /\.lte\('excluido_em', limiteExclusao\)/)
  assert.match(hookNotas, /obterEstadoRetencaoLixeira\(notaAtual\?\.excluido_em\)/)
})

test('billing fica editável somente para Master', async () => {
  assert.equal(podeEditarBilling({ isMaster: true, perfilEmpresa: 'admin' }), true)
  assert.equal(podeEditarBilling({ isMaster: false, perfilEmpresa: 'admin' }), false)
  assert.equal(podeEditarBilling({ isMaster: false, perfilEmpresa: 'gerente' }), false)

  const app = await lerFonte('../App.jsx')
  assert.match(app, /podeEditar=\{podeEditarBilling\(permissoesUsuario\)\}/)
  assert.match(app, /if \(!temPermissao\(\['admin'\]\)\)/)
})

test('senha provisória exige no mínimo 12 caracteres no serviço e no handler', async () => {
  assert.equal(TAMANHO_MINIMO_SENHA_PROVISORIA, 12)
  assert.equal(senhaProvisoriaValida('12345678901'), false)
  assert.equal(senhaProvisoriaValida('123456789012'), true)

  const app = await lerFonte('../App.jsx')
  assert.match(app, /if \(!senhaProvisoriaValida\(senhaProvisoria\)\)/)
})

test('Controle de Impostos cria alvo exato e permite retorno sem perder o foco', async () => {
  const conta = { id: 'conta-imposto-1', descricao: 'Imposto' }
  const alvo = criarAlvoContaParaNavegacao(conta, 'controle-impostos', 123)
  assert.deepEqual(alvo, {
    tipo: 'conta',
    id: 'conta-imposto-1',
    conta,
    origem: 'controle-impostos',
    nonce: 123,
  })
  assert.equal(origemPermiteContaForaDoFiltro('controle-impostos'), true)

  const [impostos, contas] = await Promise.all([
    lerFonte('../pages/ControleImpostosPage.jsx'),
    lerFonte('../pages/ContasPage.jsx'),
  ])
  assert.match(impostos, /navegarParaConta\?\.\(conta\)/)
  assert.match(contas, /Voltar ao Controle de Impostos/)
})

test('sessão aceita recorrências e controle de impostos como retornos seguros', () => {
  assert.equal(telaRetornoSessaoSegura('recorrencias'), 'recorrencias')
  assert.equal(telaRetornoSessaoSegura('controle-impostos'), 'controle-impostos')
  assert.equal(telaRetornoSessaoSegura('nao-existe'), 'dashboard')
})

test('resumo de Contas usa pagamentos parciais, saldo e quitação derivada', () => {
  const resumo = calcularResumoFinanceiroContas([
    {
      id: 'parcial-vencida',
      valor: 200,
      status: 'pendente',
      data_vencimento: '2026-07-01',
      pagamentosParciaisTotal: 80,
    },
    {
      id: 'quitada-parciais',
      valor: 100,
      status: 'pendente',
      data_vencimento: '2026-07-01',
      pagamentosParciaisTotal: 100,
    },
  ], '2026-07-28')

  assert.deepEqual(resumo, {
    total: 300,
    pago: 180,
    pendente: 120,
    vencido: 120,
    encargos: 0,
    descontos: 0,
  })
})
