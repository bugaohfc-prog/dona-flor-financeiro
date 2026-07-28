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

export function criarEstadoNavegacao({
  tela,
  origem = '',
  contexto = null,
  scrollY = 0,
} = {}) {
  return {
    tela: normalizarTelaNavegacao(tela),
    origem: telaNavegacaoPermitida(origem) ? String(origem).trim() : '',
    contexto: normalizarContextoNavegacao(contexto),
    scrollY: Number.isFinite(Number(scrollY)) ? Math.max(0, Number(scrollY)) : 0,
  }
}
