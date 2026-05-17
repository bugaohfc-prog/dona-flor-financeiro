import { lazy } from 'react'

export const lazyRouteImports = {
  dashboard: () => import('../components/routes/DashboardRouteComposition.jsx')
}

export const LazyDashboardRouteComposition = lazy(lazyRouteImports.dashboard)
