export const TELA_PADRAO = 'dashboard'

export const TELAS_NAVEGACAO_PERMITIDAS = new Set([
  'dashboard',
  'agenda',
  'notas',
  'contas',
  'receitas',
  'fluxo-caixa',
  'relatorios-contas',
  'relatorios',
  'recorrencias',
  'controle-impostos',
  'configuracoes',
  'importar',
  'lixeira',
  'auditoria',
  'usuarios',
  'filiais',
  'billing',
  'onboarding',
  'master-empresas',
  'funcionarios',
  'ferias',
  'fechamento-folha',
  'relatorios-gestao-pessoas',
  'relatorios-pessoas',
  'relatorios-ferias',
])

const TITULOS_TELA = Object.freeze({
  dashboard: 'Dashboard | DNA Gestão',
  contas: 'Contas | DNA Gestão',
  'controle-impostos': 'Controle de Impostos | DNA Gestão',
  recorrencias: 'Recorrências | DNA Gestão',
  relatorios: 'Análise Financeira | DNA Gestão',
  'relatorios-contas': 'Análise Financeira | DNA Gestão',
})

export function telaNavegacaoPermitida(tela) {
  return TELAS_NAVEGACAO_PERMITIDAS.has(String(tela || '').trim())
}

export function normalizarTelaNavegacao(tela, fallback = TELA_PADRAO) {
  const telaNormalizada = String(tela || '').trim()
  if (telaNavegacaoPermitida(telaNormalizada)) return telaNormalizada
  return telaNavegacaoPermitida(fallback) ? String(fallback).trim() : TELA_PADRAO
}

function resolverUrl(url) {
  if (url instanceof URL) return new URL(url.toString())
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
  return new URL(String(url || '/'), base)
}

export function lerTelaDaUrl(url) {
  const endereco = resolverUrl(url)
  return normalizarTelaNavegacao(endereco.searchParams.get('tela'))
}

export function gerarUrlDaTela(urlAtual, tela) {
  const endereco = resolverUrl(urlAtual)
  endereco.searchParams.set('tela', normalizarTelaNavegacao(tela))
  return `${endereco.pathname}${endereco.search}${endereco.hash}`
}

export function obterTituloTela(tela) {
  return TITULOS_TELA[normalizarTelaNavegacao(tela)] || 'DNA Gestão'
}

export function deveCriarEntradaHistorico(telaAtual, proximaTela) {
  return normalizarTelaNavegacao(telaAtual) !== normalizarTelaNavegacao(proximaTela)
}

export function normalizarContextoNavegacao(contexto) {
  if (!contexto || typeof contexto !== 'object' || Array.isArray(contexto)) return null
  const entradas = Object.entries(contexto).filter(([, valor]) => valor !== undefined)
  return entradas.length ? Object.fromEntries(entradas) : null
}

export function sincronizarContextoContas(contextoAtual, {
  filtroStatus = '',
  filtroHorizonte = '',
  dataInicial = '',
  dataFinal = '',
  filial = '',
  centroCusto = '',
  telaRetorno = '',
} = {}) {
  return normalizarContextoNavegacao({
    ...(contextoAtual || {}),
    filtroStatus,
    filtroHorizonte,
    dataInicial,
    dataFinal,
    filial,
    centroCusto,
    telaRetorno,
  })
}

export function removerDestaqueContexto(contextoAtual) {
  if (!contextoAtual) return null
  const {
    contaId: _contaId,
    conta: _conta,
    contaOrigem: _contaOrigem,
    ...contextoRestante
  } = contextoAtual
  return normalizarContextoNavegacao(contextoRestante)
}

export function resolverEstadoEntradaContas(contextoNavegacao, origemNavegacao = '') {
  const contexto = normalizarContextoNavegacao(contextoNavegacao)
  if (!contexto) {
    return {
      alvoConta: null,
      origemAlvo: '',
      telaRetorno: '',
    }
  }

  const alvoConta = contexto.conta || contexto.contaId || null
  const retornoInformado = Object.prototype.hasOwnProperty.call(contexto, 'telaRetorno')
    ? contexto.telaRetorno
    : origemNavegacao

  return {
    alvoConta,
    origemAlvo: alvoConta
      ? (contexto.contaOrigem || contexto.origem || origemNavegacao || '')
      : '',
    telaRetorno: retornoInformado && retornoInformado !== 'contas'
      ? retornoInformado
      : '',
  }
}

export function criarEstadoNavegacao({
  tela,
  origem = '',
  contexto = null,
  scrollY = 0,
  escopo = '',
} = {}) {
  return {
    tela: normalizarTelaNavegacao(tela),
    origem: telaNavegacaoPermitida(origem) ? String(origem).trim() : '',
    contexto: normalizarContextoNavegacao(contexto),
    scrollY: Number.isFinite(Number(scrollY)) ? Math.max(0, Number(scrollY)) : 0,
    escopo: String(escopo || ''),
  }
}

export function estadoPertenceAoEscopo(estado, escopoAtual) {
  const escopo = String(escopoAtual || '')
  return !escopo || String(estado?.escopo || '') === escopo
}

export function registrarNavegacaoNoHistorico({
  historico,
  urlAtual,
  estadoAtual,
  proximoEstado,
  substituir = false,
} = {}) {
  if (!historico?.replaceState) return { criouEntrada: false, substituiu: false }

  const urlDestino = gerarUrlDaTela(urlAtual, proximoEstado?.tela)
  if (substituir) {
    historico.replaceState(proximoEstado, '', urlDestino)
    return { criouEntrada: false, substituiu: true }
  }

  historico.replaceState(
    estadoAtual,
    '',
    gerarUrlDaTela(urlAtual, estadoAtual?.tela)
  )
  if (deveCriarEntradaHistorico(estadoAtual?.tela, proximoEstado?.tela)) {
    historico.pushState(proximoEstado, '', urlDestino)
    return { criouEntrada: true, substituiu: false }
  }

  historico.replaceState(proximoEstado, '', urlDestino)
  return { criouEntrada: false, substituiu: true }
}
