import { lazy } from 'react'

export const lazyRouteImports = {
  dashboard: () => import('./DashboardRouteComposition'),
  contas: () => import('../pages/ContasPage'),
  relatorios: () => import('../pages/Relatorios'),
  notas: () => import('../pages/NotasPage'),
  masterPanel: () => import('../pages/MasterPanelPage'),
  onboarding: () => import('../pages/OnboardingPage'),
  billing: () => import('../pages/BillingPage'),
  filiais: () => import('../pages/FiliaisPage'),
  usuarios: () => import('../pages/UsuariosPage'),
  copilotDrawer: () => import('../components/copilot/CopilotDrawer')
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

  if (!importer || preloadedRoutes.has(routeName)) {
    return Promise.resolve()
  }

  preloadedRoutes.add(routeName)

  return importer().catch((error) => {
    preloadedRoutes.delete(routeName)

    console.warn(
      `Falha ao pré-carregar módulo ${routeName}:`,
      error?.message || error
    )
  })
}

export function preloadRoutes(routeNames = []) {
  return Promise.allSettled(
    routeNames.map((routeName) => preloadRoute(routeName))
  )
}
