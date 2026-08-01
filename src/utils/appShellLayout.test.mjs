import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  resolverAcoesFlutuantesAppShell,
  resolverLayoutAppShell,
  ROTAS_COM_ACOES_FLUTUANTES,
} from './appShellLayout.js'
import { TELAS_NAVEGACAO_PERMITIDAS } from './navigation.js'

const diretorioAtual = dirname(fileURLToPath(import.meta.url))
const raizProjeto = resolve(diretorioAtual, '..', '..')

const lerFonte = (caminho) => readFile(resolve(raizProjeto, caminho), 'utf8')
const contarOcorrencias = (fonte, expressao) => [...fonte.matchAll(expressao)].length

test('Dashboard usa o layout próprio e mantém os elementos de impressão', () => {
  const layout = resolverLayoutAppShell('dashboard')

  assert.deepEqual(layout, {
    modoFrame: false,
    envolverConteudoEmMain: false,
    mostrarElementosImpressao: true,
  })
  assert.equal(Object.isFrozen(layout), true)
})

test('telas comuns usam frame, conteúdo principal e não exibem impressão', () => {
  for (const tela of TELAS_NAVEGACAO_PERMITIDAS) {
    if (tela === 'dashboard') continue

    const layout = resolverLayoutAppShell(tela)
    assert.deepEqual(layout, {
      modoFrame: true,
      envolverConteudoEmMain: true,
      mostrarElementosImpressao: false,
    })
    assert.equal(Object.isFrozen(layout), true)
  }
})

test('App possui uma única composição de AppShell e não mantém o frame legado', async () => {
  const fonte = await lerFonte('src/App.jsx')

  assert.equal(contarOcorrencias(fonte, /<AppShell(?:\s|>)/g), 1)
  assert.equal(fonte.includes('renderAppFrame'), false)
  assert.equal(fonte.includes('<AppProviders'), false)
  assert.equal(fonte.includes('<AppFrameStyles'), false)
  assert.equal(fonte.includes('<DesktopRefinementStyles'), false)
  assert.equal(fonte.includes('<MobileFinalStyles'), false)
  assert.equal(fonte.includes('<MobileUxPatchStyles'), false)
  assert.equal(fonte.includes('<CopilotStyles'), false)
})

test('guardas de rota antecedem o shell autenticado', async () => {
  const fonte = await lerFonte('src/App.jsx')
  const indiceGuardas = fonte.indexOf('return <AppRouteGuards')
  const indiceShell = fonte.indexOf('<AppShell')

  assert.notEqual(indiceGuardas, -1)
  assert.notEqual(indiceShell, -1)
  assert.ok(indiceGuardas < indiceShell)
})

test('AppShell centraliza providers, suspense, estilos e slots globais', async () => {
  const fonte = await lerFonte('src/components/shell/AppShell.jsx')

  assert.equal(contarOcorrencias(fonte, /<AppProviders(?:\s|>)/g), 1)
  assert.equal(contarOcorrencias(fonte, /<AppSuspenseBoundary(?:\s|>)/g), 1)

  for (const elemento of [
    '<AppShellStyles',
    '<AppFrameStyles',
    '<DesktopRefinementStyles',
    '<MobileFinalStyles',
    '<MobileUxPatchStyles',
    '{topShell}',
    '{sidebar}',
    '{mobileMenu}',
    '{modals}',
    '{overlays}',
  ]) {
    assert.equal(fonte.includes(elemento), true, `${elemento} deve pertencer ao AppShell`)
  }

  assert.equal(fonte.includes('<main className="app-frame-content">'), true)
  assert.equal(fonte.includes('print-header'), true)
  assert.equal(fonte.includes('print-footer'), true)
})

test('conteúdo de rota possui um único boundary fornecido pelo AppShell', async () => {
  const app = await lerFonte('src/App.jsx')
  const inicio = app.indexOf('function renderConteudoTelaAtual()')
  const fim = app.indexOf('const layoutAppShell = resolverLayoutAppShell', inicio)
  const composicaoRotas = app.slice(inicio, fim)

  assert.notEqual(inicio, -1)
  assert.notEqual(fim, -1)
  assert.equal(composicaoRotas.includes('<AppSuspenseBoundary'), false)
})

test('acesso negado é avaliado antes da seleção das páginas Lazy', async () => {
  const fonte = await lerFonte('src/App.jsx')
  const inicio = fonte.indexOf('function renderConteudoTelaAtual()')
  const fim = fonte.indexOf('const layoutAppShell = resolverLayoutAppShell', inicio)
  const composicaoRotas = fonte.slice(inicio, fim)
  const indiceNegado = composicaoRotas.indexOf('if (!acessoTelaAtual.permitido)')
  const indicePrimeiraPagina = composicaoRotas.indexOf("if (telaAtual === 'contas')")

  assert.notEqual(indiceNegado, -1)
  assert.notEqual(indicePrimeiraPagina, -1)
  assert.ok(indiceNegado < indicePrimeiraPagina)
  assert.equal(
    composicaoRotas.slice(0, indiceNegado).includes('<Lazy'),
    false,
    'nenhuma página protegida deve ser selecionada antes da guarda',
  )
})

test('todas as telas válidas mantêm composição explícita e Dashboard não é fallback', async () => {
  const fonte = await lerFonte('src/App.jsx')
  const inicio = fonte.indexOf('function renderConteudoTelaAtual()')
  const fim = fonte.indexOf('const layoutAppShell = resolverLayoutAppShell', inicio)
  const composicaoRotas = fonte.slice(inicio, fim)

  for (const tela of TELAS_NAVEGACAO_PERMITIDAS) {
    assert.equal(
      composicaoRotas.includes(`telaAtual === '${tela}'`),
      true,
      `a tela ${tela} deve ter composição explícita`,
    )
  }

  assert.equal(
    contarOcorrencias(composicaoRotas, /<LazyDashboardRouteComposition(?:\s|>)/g),
    1,
  )
  assert.match(
    composicaoRotas,
    /if \(telaAtual === 'dashboard'\)[\s\S]*?<LazyDashboardRouteComposition/,
  )
  assert.match(composicaoRotas, /if \(telaAtual === 'dashboard'\)[\s\S]*?return null/)
})

test('App fornece ao shell o contrato explícito de layout e elementos globais', async () => {
  const fonte = await lerFonte('src/App.jsx')
  const inicio = fonte.indexOf('<AppShell')
  const composicaoShell = fonte.slice(inicio)

  for (const prop of [
    'modoFrame={layoutAppShell.modoFrame}',
    'envolverConteudoEmMain={layoutAppShell.envolverConteudoEmMain}',
    'mostrarElementosImpressao={layoutAppShell.mostrarElementosImpressao}',
    'topShell={renderTopShell()}',
    'sidebar={renderSidebar()}',
    'mobileMenu={renderMobileMenu()}',
    'fab={renderFabGlobal()}',
    'modals={renderModaisGlobais()}',
    'overlays={renderOverlaysLayer()}',
  ]) {
    assert.equal(composicaoShell.includes(prop), true, `${prop} deve ser fornecida ao AppShell`)
  }

  assert.equal(composicaoShell.includes('{renderConteudoTelaAtual()}'), true)
})

test('ações flutuantes permanecem disponíveis sem camada bloqueante', () => {
  const politica = resolverAcoesFlutuantesAppShell({})

  assert.deepEqual(politica, {
    bloqueioInteracaoAtivo: false,
    mostrarFab: true,
  })
  assert.equal(Object.isFrozen(politica), true)
})

test('FAB aparece somente nas rotas operacionais com ação contextual clara', () => {
  assert.deepEqual(ROTAS_COM_ACOES_FLUTUANTES, ['dashboard', 'agenda', 'notas'])
  for (const telaAtual of ROTAS_COM_ACOES_FLUTUANTES) {
    assert.deepEqual(resolverAcoesFlutuantesAppShell({ telaAtual }), {
      bloqueioInteracaoAtivo: false,
      mostrarFab: true,
    })
  }

  for (const telaAtual of ['contas', 'relatorios-contas', 'relatorios', 'controle-impostos', 'configuracoes', 'usuarios', 'fluxo-caixa']) {
    assert.deepEqual(resolverAcoesFlutuantesAppShell({ telaAtual }), {
      bloqueioInteracaoAtivo: false,
      mostrarFab: false,
    })
  }
})

test('modal de conta bloqueia o FAB', () => {
  assert.deepEqual(resolverAcoesFlutuantesAppShell({ modalConta: true }), {
    bloqueioInteracaoAtivo: true,
    mostrarFab: false,
  })
})

test('modal de nota bloqueia o FAB', () => {
  assert.deepEqual(resolverAcoesFlutuantesAppShell({ modalNota: true }), {
    bloqueioInteracaoAtivo: true,
    mostrarFab: false,
  })
})

test('modal de centro de custo bloqueia o FAB', () => {
  assert.deepEqual(resolverAcoesFlutuantesAppShell({ modalCentro: true }), {
    bloqueioInteracaoAtivo: true,
    mostrarFab: false,
  })
})

test('modal de perfil bloqueia o FAB', () => {
  assert.deepEqual(resolverAcoesFlutuantesAppShell({ modalPerfilUsuario: true }), {
    bloqueioInteracaoAtivo: true,
    mostrarFab: false,
  })
})

test('menu móvel bloqueia o FAB', () => {
  assert.deepEqual(resolverAcoesFlutuantesAppShell({ menuNavegacaoAberto: true }), {
    bloqueioInteracaoAtivo: true,
    mostrarFab: false,
  })
})

test('confirmação ativa bloqueia o FAB', () => {
  assert.deepEqual(resolverAcoesFlutuantesAppShell({ confirmacaoAtiva: true }), {
    bloqueioInteracaoAtivo: true,
    mostrarFab: false,
  })
})

test('loading global bloqueante bloqueia o FAB', () => {
  assert.deepEqual(resolverAcoesFlutuantesAppShell({ globalLoading: true }), {
    bloqueioInteracaoAtivo: true,
    mostrarFab: false,
  })
})

test('toast e navegação comum não fazem parte das condições bloqueantes', () => {
  assert.deepEqual(
    resolverAcoesFlutuantesAppShell({
      toast: { mensagem: 'Informação' },
      telaAtual: 'notas',
      acessoNegado: true,
    }),
    {
      bloqueioInteracaoAtivo: false,
      mostrarFab: true,
    },
  )
})

test('App usa a política central com os estados reais e fecha o menu rápido', async () => {
  const fonte = await lerFonte('src/App.jsx')

  assert.equal(fonte.includes('resolverAcoesFlutuantesAppShell({'), true)
  for (const estado of [
    'telaAtual,',
    'modalConta,',
    'modalNota,',
    'modalCentro,',
    'modalPerfilUsuario,',
    'menuNavegacaoAberto,',
    'confirmacaoAtiva: Boolean(confirmacao?.aberto)',
    'globalLoading: Boolean(globalLoading)',
  ]) {
    assert.equal(fonte.includes(estado), true, `${estado} deve alimentar a política central`)
  }

  assert.match(
    fonte,
    /politicaAcoesFlutuantesAppShell\.bloqueioInteracaoAtivo[\s\S]*?setMenuAberto\(false\)/,
  )
  assert.equal(
    fonte.includes('mostrarFab={politicaAcoesFlutuantesAppShell.mostrarFab}'),
    true,
  )
})

test('AppShell remove o FAB do DOM enquanto a política bloquear', async () => {
  const fonte = await lerFonte('src/components/shell/AppShell.jsx')

  assert.equal(fonte.includes('mostrarFab = true'), true)
  assert.equal(fonte.includes('{mostrarFab ? fab : null}'), true)
})

test('proteção interativa não depende de z-index, opacidade ou pointer-events', async () => {
  const [politica, shell] = await Promise.all([
    lerFonte('src/utils/appShellLayout.js'),
    lerFonte('src/components/shell/AppShell.jsx'),
  ])
  const implementacao = `${politica}\n${shell}`

  assert.doesNotMatch(implementacao, /z-?index/i)
  assert.doesNotMatch(implementacao, /opacity/i)
  assert.doesNotMatch(implementacao, /pointer-events/i)
})
