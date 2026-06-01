import { Suspense } from 'react'
import AppErrorBoundary from '../feedback/AppErrorBoundary.jsx'

export default function AppSuspenseBoundary({ children }) {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<div className="app-route-loading" role="status" aria-live="polite">Carregando tela...</div>}>
        {children}
      </Suspense>
    </AppErrorBoundary>
  )
}
