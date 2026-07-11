import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AuthSecurityGate from './components/auth/AuthSecurityGate.jsx'
import { AppProvider } from './context/AppContext.jsx'
import AppErrorBoundary from './components/feedback/AppErrorBoundary.jsx'
import { registerGlobalChunkErrorHandlers } from './utils/chunkRecovery.js'

registerGlobalChunkErrorHandlers()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppProvider>
        <AuthSecurityGate>
          <App />
        </AuthSecurityGate>
      </AppProvider>
    </AppErrorBoundary>
  </React.StrictMode>
)
