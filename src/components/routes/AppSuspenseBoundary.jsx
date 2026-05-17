import { Suspense } from 'react'

export default function AppSuspenseBoundary({ children }) {
  return (
    <Suspense fallback={<div className="app-route-loading">Carregando módulo...</div>}>
      {children}
    </Suspense>
  )
}
