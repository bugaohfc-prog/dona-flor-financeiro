import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { resolverLayoutAppShell } from './appShellLayout.js'
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
    '<CopilotStyles',
    '{topShell}',
    '{sidebar}',
    '{mobileMenu}',
    '{fab}',
    '{copilot}',
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
    'copilot={renderCopilotFinanceiro()}',
    'modals={renderModaisGlobais()}',
    'overlays={renderOverlaysLayer()}',
  ]) {
    assert.equal(composicaoShell.includes(prop), true, `${prop} deve ser fornecida ao AppShell`)
  }

  assert.equal(composicaoShell.includes('{renderConteudoTelaAtual()}'), true)
})
