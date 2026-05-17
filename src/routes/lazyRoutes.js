import { lazy } from 'react'

export const lazyRouteImports = {
  dashboard: () => import('../components/routes/DashboardRouteComposition.jsx'),
  contas: () => import('../pages/ContasPage.jsx'),
  relatorios: () => import('../pages/Relatorios.jsx'),
  notas: () => import('../pages/NotasPage.jsx'),
  masterPanel: () => import('../pages/MasterPanelPage.jsx'),
  onboarding: () => import('../pages/OnboardingPage.jsx'),
  billing: () => import('../pages/BillingPage.jsx'),
  filiais: () => import('../pages/FiliaisPage.jsx'),
  usuarios: () => import('../pages/UsuariosPage.jsx'),
  copilotDrawer: () => import('../components/copilot/layout/CopilotDrawer.jsx')
}


export const routeImportByScreen = {
  dashboard: 'dashboard',
  contas: 'contas',
  relatorios: 'relatorios',
  notas: 'notas',
  master: 'masterPanel',
  onboarding: 'onboarding',
  billing: 'billing',
  filiais: 'filiais',
  usuarios: 'usuarios'
}

export function getLazyRouteName(screenName) {
  return routeImportByScreen[screenName] || null
}

export const LazyDashboardRouteComposition = lazy(lazyRouteImports.dashboard)
export const LazyContasPage = lazy(lazyRouteImports.contas)
export const LazyRelatorios = lazy(lazyRouteImports.relatorios)
export const LazyNotasPage = lazy(lazyRouteImports.notas)
export const LazyMasterPanelPage = lazy(lazyRouteImports.masterPanel)
export const LazyOnboardingPage = lazy(lazyRouteImports.onboarding)
export const LazyBillingPage = lazy(lazyRouteImports.billing)
export const LazyFiliaisPage = lazy(lazyRouteImports.filiais)
export const LazyUsuariosPage = lazy(lazyRouteImports.usuarios)
export const LazyCopilotDrawer = lazy(lazyRouteImports.copilotDrawer)


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
