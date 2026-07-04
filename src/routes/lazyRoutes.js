import { lazy } from 'react'
import { handleChunkLoadError } from '../utils/chunkRecovery.js'

export const lazyRouteImports = {
  dashboard: () => import('../components/routes/DashboardRouteComposition.jsx'),
  agenda: () => import('../pages/AgendaPage.jsx'),
  configuracoes: () => import('../pages/ConfiguracoesPage.jsx'),
  contas: () => import('../pages/ContasPage.jsx'),
  controleImpostos: () => import('../pages/ControleImpostosPage.jsx'),
  recorrenciasFinanceiras: () => import('../pages/RecorrenciasFinanceirasPage.jsx'),
  receitas: () => import('../pages/ReceitasPage.jsx'),
  fluxoCaixa: () => import('../pages/FluxoCaixaPage.jsx'),
  relatoriosContas: () => import('../pages/RelatoriosContasPage.jsx'),
  importar: () => import('../pages/ImportarPage.jsx'),
  lixeira: () => import('../pages/LixeiraPage.jsx'),
  relatorios: () => import('../pages/Relatorios.jsx'),
  notas: () => import('../pages/NotasPage.jsx'),
  masterPanel: () => import('../pages/MasterPanelPage.jsx'),
  onboarding: () => import('../pages/OnboardingPage.jsx'),
  billing: () => import('../pages/BillingPage.jsx'),
  filiais: () => import('../pages/FiliaisPage.jsx'),
  funcionarios: () => import('../pages/FuncionariosPage.jsx'),
  ferias: () => import('../pages/FeriasPage.jsx'),
  fechamentoFolha: () => import('../pages/FechamentoFolhaPage.jsx'),
  relatoriosGestaoPessoas: () => import('../pages/RelatoriosGestaoPessoasPage.jsx'),
  relatoriosPessoas: () => import('../pages/RelatoriosPessoasPage.jsx'),
  relatoriosFerias: () => import('../pages/RelatoriosFeriasPage.jsx'),
  usuarios: () => import('../pages/UsuariosPage.jsx'),
  copilotDrawer: () => import('../components/copilot/layout/CopilotDrawer.jsx')
}


export const routeImportByScreen = {
  dashboard: 'dashboard',
  agenda: 'agenda',
  configuracoes: 'configuracoes',
  contas: 'contas',
  'controle-impostos': 'controleImpostos',
  recorrencias: 'recorrenciasFinanceiras',
  receitas: 'receitas',
  'fluxo-caixa': 'fluxoCaixa',
  'relatorios-contas': 'relatoriosContas',
  importar: 'importar',
  lixeira: 'lixeira',
  relatorios: 'relatorios',
  notas: 'notas',
  master: 'masterPanel',
  'master-empresas': 'masterPanel',
  onboarding: 'onboarding',
  billing: 'billing',
  filiais: 'filiais',
  funcionarios: 'funcionarios',
  ferias: 'ferias',
  'fechamento-folha': 'fechamentoFolha',
  'relatorios-gestao-pessoas': 'relatoriosGestaoPessoas',
  'relatorios-pessoas': 'relatoriosPessoas',
  'relatorios-ferias': 'relatoriosFerias',
  usuarios: 'usuarios'
}

export function getLazyRouteName(screenName) {
  return routeImportByScreen[screenName] || null
}

function lazyWithRecovery(routeName) {
  return lazy(() => lazyRouteImports[routeName]().catch((error) => {
    const reloadStarted = handleChunkLoadError(error, routeName)
    if (reloadStarted) {
      return new Promise(() => {})
    }
    throw error
  }))
}

export const LazyDashboardRouteComposition = lazyWithRecovery('dashboard')
export const LazyAgendaPage = lazyWithRecovery('agenda')
export const LazyConfiguracoesPage = lazyWithRecovery('configuracoes')
export const LazyContasPage = lazyWithRecovery('contas')
export const LazyControleImpostosPage = lazyWithRecovery('controleImpostos')
export const LazyRecorrenciasFinanceirasPage = lazyWithRecovery('recorrenciasFinanceiras')
export const LazyReceitasPage = lazyWithRecovery('receitas')
export const LazyFluxoCaixaPage = lazyWithRecovery('fluxoCaixa')
export const LazyRelatoriosContasPage = lazyWithRecovery('relatoriosContas')
export const LazyImportarPage = lazyWithRecovery('importar')
export const LazyLixeiraPage = lazyWithRecovery('lixeira')
export const LazyRelatorios = lazyWithRecovery('relatorios')
export const LazyNotasPage = lazyWithRecovery('notas')
export const LazyMasterPanelPage = lazyWithRecovery('masterPanel')
export const LazyOnboardingPage = lazyWithRecovery('onboarding')
export const LazyBillingPage = lazyWithRecovery('billing')
export const LazyFiliaisPage = lazyWithRecovery('filiais')
export const LazyFuncionariosPage = lazyWithRecovery('funcionarios')
export const LazyFeriasPage = lazyWithRecovery('ferias')
export const LazyFechamentoFolhaPage = lazyWithRecovery('fechamentoFolha')
export const LazyRelatoriosGestaoPessoasPage = lazyWithRecovery('relatoriosGestaoPessoas')
export const LazyRelatoriosPessoasPage = lazyWithRecovery('relatoriosPessoas')
export const LazyRelatoriosFeriasPage = lazyWithRecovery('relatoriosFerias')
export const LazyUsuariosPage = lazyWithRecovery('usuarios')
export const LazyCopilotDrawer = lazyWithRecovery('copilotDrawer')


const preloadedRoutes = new Set()

export function preloadRoute(routeName) {
  const importer = lazyRouteImports[routeName]
  if (!importer || preloadedRoutes.has(routeName)) return Promise.resolve()

  preloadedRoutes.add(routeName)
  return importer().catch((error) => {
    preloadedRoutes.delete(routeName)
    console.warn(`Falha ao pré-carregar módulo ${routeName}:`, error?.message || error)
  })
}

export function preloadRoutes(routeNames = []) {
  return Promise.allSettled(routeNames.map((routeName) => preloadRoute(routeName)))
}
