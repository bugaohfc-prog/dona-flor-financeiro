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
import {
  avaliarAcessoTela,
  construirPermissoesAcessoTelas,
} from './routeAccess.js'
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
  assert.match(app, /excluirContaPermanentemente\(/)
  assert.match(hookNotas, /obterEstadoRetencaoLixeira\(notaAtual\?\.excluido_em\)/)
  assert.match(hookNotas, /excluirNotaPermanentemente\(/)
})

test('billing fica editável somente para Master', async () => {
  assert.equal(podeEditarBilling({ isMaster: true, perfilEmpresa: 'admin' }), true)
  assert.equal(podeEditarBilling({ isMaster: false, perfilEmpresa: 'admin' }), false)
  assert.equal(podeEditarBilling({ isMaster: false, perfilEmpresa: 'gerente' }), false)

  const app = await lerFonte('../App.jsx')
  assert.match(app, /podeEditar=\{podeEditarBilling\(permissoesUsuario\)\}/)
  assert.equal(avaliarAcessoTela('billing', { perfil: 'admin' }).permitido, true)
  assert.equal(avaliarAcessoTela('billing', { perfil: 'gerente' }).permitido, false)
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

test('Admin e Master respeitam canEditSettings false na gestão de centros', () => {
  for (const permissoes of [
    { perfilEmpresa: 'admin', canEditSettings: false },
    { perfilEmpresa: 'master', isMaster: true, canEditSettings: false },
  ]) {
    const acesso = construirPermissoesAcessoTelas(permissoes)
    assert.equal(acesso.canEditSettings, false)
  }
})

test('Admin e Master sem canEditSettings explícito preservam o fallback atual', () => {
  const admin = construirPermissoesAcessoTelas({ perfilEmpresa: 'admin' })
  const master = construirPermissoesAcessoTelas({
    perfilEmpresa: 'master',
    isMaster: true,
  })

  assert.equal(admin.canEditSettings, true)
  assert.equal(master.canEditSettings, true)
})

test('Gerente e Operador não recebem gestão de centros pelo perfil', () => {
  const gerente = construirPermissoesAcessoTelas({ perfilEmpresa: 'gerente' })
  const operador = construirPermissoesAcessoTelas({ perfilEmpresa: 'operador' })

  assert.equal(gerente.canEditSettings, false)
  assert.equal(operador.canEditSettings, false)
})

test('App fecha e limpa o modal de centros quando canEditSettings é revogado', async () => {
  const app = await lerFonte('../App.jsx')

  assert.match(
    app,
    /const podeGerenciarCentroCusto = useCallback\(\(\) => \{\s*return permissoesAcessoTelas\.canEditSettings\s*\}/,
  )
  assert.match(
    app,
    /if \(permissoesAcessoTelas\.canEditSettings\) return\s*setModalCentro\(false\)\s*setNovoCentro\(''\)/,
  )
  assert.match(app, /modalCentro=\{modalCentro && podeGerenciarCentroCusto\(\)\}/)
  assert.match(
    app,
    /function abrirModalCentro\(\) \{\s*if \(!podeGerenciarCentroCusto\(\)\)/,
  )
  assert.match(app, /setModalCentro=\{abrirModalCentro\}/)
  assert.match(app, /async function salvarCentro\(\) \{\s*if \(!podeGerenciarCentroCusto\(\)\)/)
  assert.match(app, /async function excluirCentro\(id\) \{\s*if \(!podeGerenciarCentroCusto\(\)\)/)
})

test('Admin e Master respeitam canManageTrash false na exclusão definitiva', async () => {
  for (const permissoes of [
    { perfilEmpresa: 'admin', canManageTrash: false },
    { perfilEmpresa: 'master', isMaster: true, canManageTrash: false },
  ]) {
    const acesso = construirPermissoesAcessoTelas(permissoes)
    assert.equal(acesso.canManageTrash, false)
  }

  const app = await lerFonte('../App.jsx')
  assert.match(
    app,
    /return temPermissao\(\['admin'\]\)\s*&& permissoesAcessoTelas\.canManageTrash === true/,
  )
})

test('exclusão autorizada preserva a retenção obrigatória de 60 dias', () => {
  const admin = construirPermissoesAcessoTelas({ perfilEmpresa: 'admin' })
  const master = construirPermissoesAcessoTelas({
    perfilEmpresa: 'master',
    isMaster: true,
  })
  const excluidoEm = new Date('2026-05-01T12:00:00.000Z')

  assert.equal(admin.canManageTrash, true)
  assert.equal(master.canManageTrash, true)
  assert.equal(
    podeExcluirDefinitivo(excluidoEm, new Date('2026-06-29T12:00:00.000Z')),
    false,
  )
  assert.equal(
    podeExcluirDefinitivo(excluidoEm, new Date('2026-06-30T12:00:00.000Z')),
    true,
  )
})
