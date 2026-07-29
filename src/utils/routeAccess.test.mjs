import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import menuSections from '../config/menuSections.js'
import {
  CATEGORIA_ACESSO_POR_TELA,
  avaliarAcessoTela,
  construirPermissoesAcessoTelas,
  filtrarMenuPorAcesso,
} from './routeAccess.js'
import {
  TELAS_NAVEGACAO_PERMITIDAS,
  normalizarTelaNavegacao,
} from './navigation.js'

const raiz = new URL('../', import.meta.url)

const OPERADOR = Object.freeze({
  perfil: 'operador',
  isMaster: false,
  canManageCompanies: false,
  canManageUsers: false,
  canAccessSettings: false,
  canImport: false,
  canManageTrash: false,
  canEditSettings: false,
  canAccessPeople: false,
})

const GERENTE = Object.freeze({
  ...OPERADOR,
  perfil: 'gerente',
  canAccessSettings: true,
})

const ADMIN = Object.freeze({
  ...OPERADOR,
  perfil: 'admin',
  canManageUsers: true,
  canAccessSettings: true,
  canImport: true,
  canManageTrash: true,
  canEditSettings: true,
  canAccessPeople: true,
})

const MASTER = Object.freeze({
  ...ADMIN,
  perfil: 'master',
  isMaster: true,
  canManageCompanies: true,
})

async function ler(caminho) {
  return readFile(new URL(caminho, raiz), 'utf8')
}

function telasMenu(secoes) {
  return secoes.flatMap((secao) => secao.items.map((item) => item.tela))
}

test('política possui classificação para toda tela válida da navegação', () => {
  assert.deepEqual(
    Object.keys(CATEGORIA_ACESSO_POR_TELA).sort(),
    [...TELAS_NAVEGACAO_PERMITIDAS].sort(),
  )
})

test('operador acessa telas gerais e financeiras operacionais', () => {
  const telas = [
    'dashboard',
    'agenda',
    'notas',
    'contas',
    'receitas',
    'recorrencias',
    'controle-impostos',
    'fluxo-caixa',
    'relatorios',
    'relatorios-contas',
  ]

  telas.forEach((tela) => {
    assert.equal(avaliarAcessoTela(tela, OPERADOR).permitido, true, tela)
  })
})

test('operador não acessa telas administrativas, pessoas ou master', () => {
  const telas = [
    'usuarios',
    'auditoria',
    'lixeira',
    'billing',
    'onboarding',
    'importar',
    'filiais',
    'configuracoes',
    'funcionarios',
    'ferias',
    'fechamento-folha',
    'relatorios-gestao-pessoas',
    'relatorios-pessoas',
    'relatorios-ferias',
    'master-empresas',
  ]

  telas.forEach((tela) => {
    const acesso = avaliarAcessoTela(tela, OPERADOR)
    assert.equal(acesso.permitido, false, tela)
    assert.equal(acesso.titulo, 'Acesso restrito')
    assert.ok(acesso.mensagem)
  })
})

test('gerente acessa configurações somente com capacidade explícita', () => {
  assert.equal(avaliarAcessoTela('configuracoes', GERENTE).permitido, true)
  assert.equal(
    avaliarAcessoTela('configuracoes', { ...GERENTE, canAccessSettings: false }).permitido,
    false,
  )
  assert.equal(avaliarAcessoTela('onboarding', GERENTE).permitido, false)
  assert.equal(avaliarAcessoTela('billing', GERENTE).permitido, false)
})

test('admin acessa administração da empresa, pessoas e Billing em leitura', () => {
  const telas = [
    'usuarios',
    'auditoria',
    'lixeira',
    'billing',
    'onboarding',
    'importar',
    'filiais',
    'configuracoes',
    'funcionarios',
    'ferias',
    'fechamento-folha',
  ]
  telas.forEach((tela) => {
    assert.equal(avaliarAcessoTela(tela, ADMIN).permitido, true, tela)
  })
  assert.equal(avaliarAcessoTela('master-empresas', ADMIN).permitido, false)
})

test('Billing é visível ao admin e mantém edição exclusiva do Master', async () => {
  assert.equal(avaliarAcessoTela('billing', ADMIN).permitido, true)
  assert.equal(avaliarAcessoTela('billing', MASTER).permitido, true)

  const [app, permissoes] = await Promise.all([
    ler('App.jsx'),
    ler('services/permissoesService.js'),
  ])
  assert.match(app, /podeEditar=\{podeEditarBilling\(permissoesUsuario\)\}/)
  assert.match(
    permissoes,
    /export function podeEditarBilling\(permissoes = \{\}\) \{\s*return permissoes\?\.isMaster === true\s*\}/,
  )
})

test('Master acessa todas as telas navegáveis', () => {
  TELAS_NAVEGACAO_PERMITIDAS.forEach((tela) => {
    assert.equal(avaliarAcessoTela(tela, MASTER).permitido, true, tela)
  })
})

test('canManageCompanies controla acesso ao painel Master', () => {
  assert.equal(avaliarAcessoTela('master-empresas', MASTER).permitido, true)
  assert.equal(
    avaliarAcessoTela('master-empresas', { ...MASTER, canManageCompanies: false }).permitido,
    false,
  )
})

test('construtor preserva todas as capacidades explicitamente falsas', () => {
  const permissoes = construirPermissoesAcessoTelas({
    perfilEmpresa: 'admin',
    canManageCompanies: false,
    canManageUsers: false,
    canAccessSettings: false,
    canImport: false,
    canManageTrash: false,
    canEditSettings: false,
    canAccessPeople: false,
  })

  assert.deepEqual({
    canManageCompanies: permissoes.canManageCompanies,
    canManageUsers: permissoes.canManageUsers,
    canAccessSettings: permissoes.canAccessSettings,
    canImport: permissoes.canImport,
    canManageTrash: permissoes.canManageTrash,
    canEditSettings: permissoes.canEditSettings,
    canAccessPeople: permissoes.canAccessPeople,
  }, {
    canManageCompanies: false,
    canManageUsers: false,
    canAccessSettings: false,
    canImport: false,
    canManageTrash: false,
    canEditSettings: false,
    canAccessPeople: false,
  })
})

test('Admin com canManageUsers false perde menu, rota e autorização de consulta', () => {
  const restrito = construirPermissoesAcessoTelas({
    ...ADMIN,
    canManageUsers: false,
  })
  const menu = new Set(telasMenu(filtrarMenuPorAcesso(menuSections, restrito)))

  assert.equal(menu.has('usuarios'), false)
  assert.equal(menu.has('auditoria'), false)
  assert.equal(avaliarAcessoTela('usuarios', restrito).permitido, false)
  assert.equal(avaliarAcessoTela('auditoria', restrito).permitido, false)
})

test('Admin respeita restrições explícitas de importação e lixeira', () => {
  const restrito = construirPermissoesAcessoTelas({
    ...ADMIN,
    canImport: false,
    canManageTrash: false,
  })

  assert.equal(avaliarAcessoTela('importar', restrito).permitido, false)
  assert.equal(avaliarAcessoTela('lixeira', restrito).permitido, false)
})

test('Admin respeita restrições explícitas de configuração e pessoas', () => {
  const restrito = construirPermissoesAcessoTelas({
    ...ADMIN,
    canEditSettings: false,
    canAccessPeople: false,
  })

  assert.equal(avaliarAcessoTela('filiais', restrito).permitido, false)
  assert.equal(avaliarAcessoTela('onboarding', restrito).permitido, false)
  assert.equal(avaliarAcessoTela('funcionarios', restrito).permitido, false)
  assert.equal(avaliarAcessoTela('relatorios-gestao-pessoas', restrito).permitido, false)
})

test('Gerente com canAccessSettings false não autoriza Configurações', () => {
  const restrito = construirPermissoesAcessoTelas({
    ...GERENTE,
    canAccessSettings: false,
  })

  assert.equal(avaliarAcessoTela('configuracoes', restrito).permitido, false)
})

test('capacidades ausentes mantêm fallbacks dos quatro perfis', () => {
  const operador = construirPermissoesAcessoTelas({ perfilEmpresa: 'operador' })
  const gerente = construirPermissoesAcessoTelas({ perfilEmpresa: 'gerente' })
  const admin = construirPermissoesAcessoTelas({ perfilEmpresa: 'admin' })
  const master = construirPermissoesAcessoTelas({
    perfilEmpresa: 'master',
    isMaster: true,
  })

  assert.equal(operador.canManageUsers, false)
  assert.equal(operador.canAccessSettings, false)
  assert.equal(gerente.canAccessSettings, true)
  assert.equal(gerente.canEditSettings, false)
  assert.equal(admin.canManageUsers, true)
  assert.equal(admin.canImport, true)
  assert.equal(admin.canManageTrash, true)
  assert.equal(master.canManageCompanies, true)
  assert.equal(master.canManageUsers, true)
  assert.equal(master.canAccessPeople, true)
})

test('Master respeita capacidade explicitamente restritiva', () => {
  const restrito = construirPermissoesAcessoTelas({
    perfilEmpresa: 'master',
    isMaster: true,
    canManageCompanies: false,
    canManageUsers: false,
    canAccessSettings: false,
    canImport: false,
    canManageTrash: false,
    canEditSettings: false,
    canAccessPeople: false,
  })

  assert.equal(avaliarAcessoTela('master-empresas', restrito).permitido, false)
  assert.equal(avaliarAcessoTela('usuarios', restrito).permitido, false)
  assert.equal(avaliarAcessoTela('configuracoes', restrito).permitido, false)
  assert.equal(avaliarAcessoTela('importar', restrito).permitido, false)
  assert.equal(avaliarAcessoTela('lixeira', restrito).permitido, false)
  assert.equal(avaliarAcessoTela('onboarding', restrito).permitido, false)
  assert.equal(avaliarAcessoTela('funcionarios', restrito).permitido, false)
})

test('menu e guarda de rota usam a mesma função de política', () => {
  for (const permissoes of [OPERADOR, GERENTE, ADMIN, MASTER]) {
    const exibidas = new Set(telasMenu(filtrarMenuPorAcesso(menuSections, permissoes)))
    telasMenu(menuSections).forEach((tela) => {
      assert.equal(
        exibidas.has(tela),
        avaliarAcessoTela(tela, permissoes).permitido,
        `${permissoes.perfil}:${tela}`,
      )
    })
  }
})

test('rota protegida é bloqueada antes de montar páginas lazy', async () => {
  const app = await ler('App.jsx')
  const indiceGuarda = app.indexOf('if (!acessoTelaAtual.permitido)')
  const indicePrimeiraRota = app.indexOf("if (telaAtual === 'contas')")

  assert.ok(indiceGuarda > 0)
  assert.ok(indicePrimeiraRota > indiceGuarda)
  assert.equal(avaliarAcessoTela('usuarios', OPERADOR).permitido, false)
  assert.match(app.slice(indiceGuarda, indicePrimeiraRota), /<AccessDeniedPage/)
})

test('preload e buscas administrativas exigem autorização da mesma rota', async () => {
  const app = await ler('App.jsx')
  assert.match(
    app,
    /const preloadTelaLazy[\s\S]*?avaliarAcessoTela\(tela, permissoesAcessoTelas\)\.permitido[\s\S]*?preloadRoute/,
  )
  assert.match(
    app,
    /acessoTelaAtual\.permitido[\s\S]*?\['usuarios', 'auditoria'\]\.includes\(telaAtual\)[\s\S]*?buscarUsuariosEmpresa/,
  )
  assert.match(
    app,
    /if \(permitirCarregarLixeira\) \{[\s\S]*?buscarLixeira/,
  )
  assert.match(
    app,
    /avaliarAcessoTela\('lixeira', permissoesCarga\)/,
  )
})

test('App usa o construtor central sem sobrescrever capacidades falsas', async () => {
  const app = await ler('App.jsx')
  const inicio = app.indexOf('const permissoesAcessoTelas = useMemo')
  const fim = app.indexOf('const acessoTelaAtual', inicio)
  const trecho = app.slice(inicio, fim)

  assert.match(trecho, /construirPermissoesAcessoTelas/)
  assert.doesNotMatch(trecho, /canImport:|canManageTrash:|canEditSettings:|canAccessPeople:/)
  assert.doesNotMatch(app, /canManageUsers \|\||canAccessSettings \|\|/)
  assert.doesNotMatch(
    app,
    /canManageCompanies: true|canManageUsers: true|canAccessSettings: true/,
  )
})

test('destinatários carregam somente na tela Configurações autorizada', async () => {
  const app = await ler('App.jsx')
  assert.match(
    app,
    /const acessoConfiguracoes = useMemo\([\s\S]*?avaliarAcessoTela\('configuracoes', permissoesAcessoTelas\)/,
  )
  assert.match(
    app,
    /autoCarregar: Boolean\([\s\S]*?telaAtual === 'configuracoes'[\s\S]*?acessoConfiguracoes\.permitido/,
  )
})

test('URL válida sem permissão permanece válida e recebe acesso negado', () => {
  assert.equal(normalizarTelaNavegacao('usuarios'), 'usuarios')
  assert.equal(avaliarAcessoTela('usuarios', OPERADOR).permitido, false)
  assert.equal(avaliarAcessoTela('valor-inexistente', OPERADOR).codigo, 'TELA_INVALIDA')
})

test('AccessDeniedPage oferece conteúdo seguro, semântico e acionável', async () => {
  const fonte = await ler('components/feedback/AccessDeniedPage.jsx')
  assert.match(fonte, /titulo = 'Acesso restrito'/)
  assert.match(fonte, /<h1[^>]*id="access-denied-title"/)
  assert.match(fonte, /aria-labelledby="access-denied-title"/)
  assert.match(fonte, /<button type="button"/)
  assert.match(fonte, />\s*Voltar ao Painel\s*</)
  assert.doesNotMatch(fonte, /Supabase|RLS|perfilGlobal|canManage/)
})

test('App remove guardas duplicados e preserva navegação e finanças', async () => {
  const app = await ler('App.jsx')
  assert.equal((app.match(/<AccessDeniedPage/g) || []).length, 1)
  assert.doesNotMatch(app, /<h2[^>]*>Acesso restrito<\/h2>/)
  assert.match(app, /useAppNavigation/)
  assert.match(app, /calcularResumoFinanceiroContas/)
  assert.match(app, /<AppRouteGuards \{\.\.\.routeGuardProps\} \/>/)
})
