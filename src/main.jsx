import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './AuthContext.jsx'
import './index.css'
import PageLoader from './components/loader/PageLoader.jsx'
import { useAppReady } from './hooks/useAppReady.js'

function Root() {
  const { ready } = useAppReady({ minDelay: 320, maxWait: 1200 })

  return (
    <>
      <HashRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HashRouter>
      <PageLoader ready={ready} />
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
