import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  TELAS_NAVEGACAO_PERMITIDAS,
  criarEstadoNavegacao,
  deveCriarEntradaHistorico,
  estadoPertenceAoEscopo,
  gerarUrlDaTela,
  lerTelaDaUrl,
  normalizarTelaNavegacao,
  obterTituloTela,
  registrarNavegacaoNoHistorico,
  removerDestaqueContexto,
  sincronizarContextoContas,
} from './navigation.js'
import {
  TELAS_RETORNO_SESSAO,
  telaRetornoSessaoSegura,
} from './session.js'

const raiz = new URL('../', import.meta.url)

async function ler(caminho) {
  return readFile(new URL(caminho, raiz), 'utf8')
}

function criarHistoricoMock(urlInicial = '/?tela=dashboard', estadoInicial = null) {
  const entradas = [{ url: urlInicial, state: estadoInicial }]
  let indice = 0
  let pushes = 0
  return {
    get state() {
      return entradas[indice]?.state
    },
    get entradas() {
      return entradas
    },
    get pushes() {
      return pushes
    },
    replaceState(state, _titulo, url) {
      entradas[indice] = { state, url }
    },
    pushState(state, _titulo, url) {
      entradas.splice(indice + 1)
      entradas.push({ state, url })
      indice += 1
      pushes += 1
    },
    voltar() {
      indice = Math.max(0, indice - 1)
      return entradas[indice]
    },
  }
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
    escopo: '',
  }), {
    tela: 'contas',
    origem: 'dashboard',
    contexto: { filtroStatus: 'vencidas', contaId: 'conta-1' },
    scrollY: 320,
    escopo: '',
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
  assert.match(fonte, /registrarNavegacaoNoHistorico/)
  assert.match(fonte, /addEventListener\('popstate'/)
  assert.match(fonte, /lerTelaDaUrl\(window\.location\.href\)/)
  assert.match(fonte, /document\.title = obterTituloTela\(telaAtual\)/)
})

test('replace altera tela, URL e estado sem criar entrada', () => {
  const historico = criarHistoricoMock()
  const estadoAtual = criarEstadoNavegacao({ tela: 'dashboard' })
  const proximoEstado = criarEstadoNavegacao({
    tela: 'onboarding',
    origem: 'dashboard',
    contexto: { etapa: 'empresa' },
  })

  const resultado = registrarNavegacaoNoHistorico({
    historico,
    urlAtual: 'https://dna.test/?tela=dashboard&empresa=7',
    estadoAtual,
    proximoEstado,
    substituir: true,
  })

  assert.deepEqual(resultado, { criouEntrada: false, substituiu: true })
  assert.equal(historico.pushes, 0)
  assert.equal(historico.state.tela, 'onboarding')
  assert.equal(historico.entradas[0].url, '/?tela=onboarding&empresa=7')
})

test('troca de empresa invalida entradas de contexto do escopo anterior', () => {
  assert.equal(estadoPertenceAoEscopo({ escopo: 'empresa-a' }, 'empresa-b'), false)
  assert.equal(estadoPertenceAoEscopo({ escopo: 'empresa-b' }, 'empresa-b'), true)
  assert.equal(estadoPertenceAoEscopo({ escopo: 'empresa-a' }, ''), true)
})

test('Back recupera os filtros manuais mais recentes de Contas', () => {
  const contextoNovo = sincronizarContextoContas(
    { contaId: 'conta-9', origem: 'dashboard' },
    {
      filtroStatus: 'vencidas',
      filtroHorizonte: '90-dias',
      dataInicial: '2026-07-01',
      dataFinal: '2026-09-30',
      filial: 'filial-2',
      centroCusto: 'centro-4',
      telaRetorno: 'dashboard',
    }
  )
  const estadoContas = criarEstadoNavegacao({
    tela: 'contas',
    origem: 'dashboard',
    contexto: contextoNovo,
  })
  const historico = criarHistoricoMock('/?tela=contas', estadoContas)
  registrarNavegacaoNoHistorico({
    historico,
    urlAtual: 'https://dna.test/?tela=contas',
    estadoAtual: estadoContas,
    proximoEstado: criarEstadoNavegacao({ tela: 'recorrencias', origem: 'contas' }),
  })

  const restaurado = historico.voltar().state
  assert.equal(restaurado.contexto.filtroStatus, 'vencidas')
  assert.equal(restaurado.contexto.filtroHorizonte, '90-dias')
  assert.equal(restaurado.contexto.filial, 'filial-2')
  assert.equal(restaurado.contexto.contaId, 'conta-9')
})

test('sincronizar filtros preserva o alvo até ele ser consumido', () => {
  const contexto = sincronizarContextoContas({
    conta: { id: 'conta-1' },
    contaId: 'conta-1',
    contaOrigem: 'controle-impostos',
    metadado: 'preservado',
  }, {
    filtroStatus: 'pagas',
    filtroHorizonte: 'todos',
    telaRetorno: 'controle-impostos',
  })

  assert.equal(contexto.contaId, 'conta-1')
  assert.equal(contexto.metadado, 'preservado')
  assert.equal(contexto.filtroStatus, 'pagas')
})

test('consumir destaque mantém filtros, retorno e demais metadados', () => {
  const contexto = removerDestaqueContexto({
    conta: { id: 'conta-1' },
    contaId: 'conta-1',
    contaOrigem: 'agenda',
    filtroStatus: 'vencidas',
    filtroHorizonte: '30-dias',
    telaRetorno: 'agenda',
    metadado: 'preservado',
  })

  assert.equal('conta' in contexto, false)
  assert.equal('contaId' in contexto, false)
  assert.equal('contaOrigem' in contexto, false)
  assert.equal(contexto.filtroStatus, 'vencidas')
  assert.equal(contexto.telaRetorno, 'agenda')
  assert.equal(contexto.metadado, 'preservado')
})

test('App usa o núcleo para onboarding, troca de empresa e logout', async () => {
  const fonte = await ler('App.jsx')
  assert.doesNotMatch(fonte, /setTelaAtualState/)
  assert.match(fonte, /navegarPara\('onboarding', \{ replace: true/)
  assert.match(fonte, /navegarPara\('dashboard', \{ replace: true, origem: 'onboarding'/)
  assert.match(fonte, /limparDadosTenant\(\)[\s\S]*?navegarPara\('dashboard', \{[\s\S]*?invalidarContextoAnterior: true/)
  assert.match(fonte, /const sairDoSistema[\s\S]*?navegarPara\('dashboard', \{ replace: true/)
  assert.doesNotMatch(fonte, /sairDoSistema[\s\S]{0,500}setTelaAtualState\('contas'\)/)
})

test('sessão expirada salva o destino sem substituir tela ou URL', async () => {
  const fonte = await ler('App.jsx')
  const inicio = fonte.indexOf('const navegarParaLoginCallback')
  const fim = fonte.indexOf('const mostrarAvisoCallback', inicio)
  const trecho = fonte.slice(inicio, fim)
  assert.match(trecho, /SESSION_RETURN_SCREEN_KEY/)
  assert.doesNotMatch(trecho, /navegarPara\(|setTelaAtualState|history\./)
})

test('App sincroniza filtros de Contas preservando o contexto existente', async () => {
  const fonte = await ler('App.jsx')
  assert.match(fonte, /atualizarContextoAtual\(\(contextoAtual\) => sincronizarContextoContas\(contextoAtual/)
  assert.match(fonte, /sincronizacaoContextoContasSuspensaRef/)
  assert.match(fonte, /filtroStatus,[\s\S]*?filtroHorizonte,[\s\S]*?telaRetorno: telaRetornoContas/)
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
