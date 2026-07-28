import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  TELAS_NAVEGACAO_PERMITIDAS,
  criarEstadoNavegacao,
  deveCriarEntradaHistorico,
  gerarUrlDaTela,
  lerTelaDaUrl,
  normalizarTelaNavegacao,
  obterTituloTela,
} from './navigation.js'
import {
  TELAS_RETORNO_SESSAO,
  telaRetornoSessaoSegura,
} from './session.js'

const raiz = new URL('../', import.meta.url)

async function ler(caminho) {
  return readFile(new URL(caminho, raiz), 'utf8')
}

test('lê uma tela válida da URL', () => {
  assert.equal(lerTelaDaUrl('https://dna.test/?tela=contas'), 'contas')
})

test('normaliza tela ausente ou arbitrária para dashboard', () => {
  assert.equal(lerTelaDaUrl('https://dna.test/?tela=valor-inexistente'), 'dashboard')
  assert.equal(normalizarTelaNavegacao('javascript:alert(1)'), 'dashboard')
})

test('gera URL canônica sem alterar pathname, hash ou outros parâmetros', () => {
  assert.equal(
    gerarUrlDaTela('https://dna.test/app?empresa=7&tela=agenda#resumo', 'contas'),
    '/app?empresa=7&tela=contas#resumo'
  )
})

test('navegar para a mesma tela não exige nova entrada no histórico', () => {
  assert.equal(deveCriarEntradaHistorico('contas', 'contas'), false)
  assert.equal(deveCriarEntradaHistorico('dashboard', 'contas'), true)
})

test('estado do histórico preserva origem, contexto e rolagem', () => {
  assert.deepEqual(criarEstadoNavegacao({
    tela: 'contas',
    origem: 'dashboard',
    contexto: { filtroStatus: 'vencidas', contaId: 'conta-1' },
    scrollY: 320,
  }), {
    tela: 'contas',
    origem: 'dashboard',
    contexto: { filtroStatus: 'vencidas', contaId: 'conta-1' },
    scrollY: 320,
  })
})

test('tela segura de sessão e navegação compartilham a mesma autoridade', () => {
  assert.equal(TELAS_RETORNO_SESSAO, TELAS_NAVEGACAO_PERMITIDAS)
  assert.equal(telaRetornoSessaoSegura('controle-impostos'), 'controle-impostos')
  assert.equal(telaRetornoSessaoSegura('nao-autorizada'), 'dashboard')
})

test('títulos canônicos possuem fallback seguro', () => {
  assert.equal(obterTituloTela('dashboard'), 'Dashboard | DNA Gestão')
  assert.equal(obterTituloTela('contas'), 'Contas | DNA Gestão')
  assert.equal(obterTituloTela('controle-impostos'), 'Controle de Impostos | DNA Gestão')
  assert.equal(obterTituloTela('recorrencias'), 'Recorrências | DNA Gestão')
  assert.equal(obterTituloTela('agenda'), 'DNA Gestão')
})

test('hook sincroniza URL, pushState e restaura popstate', async () => {
  const fonte = await ler('hooks/useAppNavigation.js')
  assert.match(fonte, /history\.pushState\(estado/)
  assert.match(fonte, /addEventListener\('popstate'/)
  assert.match(fonte, /lerTelaDaUrl\(window\.location\.href\)/)
  assert.match(fonte, /document\.title = obterTituloTela\(telaAtual\)/)
})

test('Dashboard e Controle de Impostos enviam contexto ao abrir Contas', async () => {
  const fonte = await ler('App.jsx')
  assert.match(fonte, /abrirContasComPlanejamento[\s\S]*?navegarPara\('contas', \{[\s\S]*?filtroHorizonte/)
  assert.match(fonte, /origem: 'controle-impostos'[\s\S]*?contaId: alvo\.id/)
})

test('destaque de conta consumido é removido do contexto', async () => {
  const fonte = await ler('App.jsx')
  assert.match(fonte, /onContaFocusHandled=\{\(\) => \{[\s\S]*?consumirDestaqueContexto\(\)/)
})

test('menu móvel é diálogo modal com Escape, foco preso e devolução ao acionador', async () => {
  const fonte = await ler('components/layout/MobileMenu.jsx')
  assert.match(fonte, /role="dialog"/)
  assert.match(fonte, /aria-modal="true"/)
  assert.match(fonte, /event\.key === 'Escape'/)
  assert.match(fonte, /event\.key !== 'Tab'/)
  assert.match(fonte, /ativador\.focus\(\)/)
  assert.match(fonte, /mobile-menu-close/)
})

test('itens ativos dos menus móvel e desktop expõem aria-current', async () => {
  const [mobile, desktop] = await Promise.all([
    ler('components/layout/MobileMenu.jsx'),
    ler('components/layout/Sidebar.jsx'),
  ])
  assert.match(mobile, /aria-current=\{telaAtual === item\.tela \? 'page'/)
  assert.match(desktop, /aria-current=\{ativo \? 'page'/)
})

test('sidebar expõe semântica dos grupos e tipos de botão', async () => {
  const fonte = await ler('components/layout/Sidebar.jsx')
  assert.match(fonte, /aria-expanded=\{aberto\}/)
  assert.match(fonte, /aria-controls=\{conteudoId\}/)
  assert.match(fonte, /type="button"/)
})

test('permissões continuam sob responsabilidade dos guards existentes', async () => {
  const fonte = await ler('App.jsx')
  assert.match(fonte, /<AppRouteGuards \{\.\.\.routeGuardProps\} \/>/)
  assert.doesNotMatch(await ler('utils/navigation.js'), /perfil|permiss/i)
})
