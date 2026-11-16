import React, { useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './AuthContext.jsx'
import './index.css'
import { initPrefs } from './adminPrefs.js'
import PageLoader from './components/loader/PageLoader.jsx'
import { useAppReady } from './hooks/useAppReady.js'

// Applies the saved "reduce motion" preference before the first render.
initPrefs()

function Root() {
  const { ready, error, retry, markContentLoaded, markContentError } = useAppReady({
    minDelay: 320,
    maxWait: 1200,
    contentTimeout: 8000,
  })

  const handleRetry = useCallback(() => {
    if (error?.kind === 'content') {
      // The browser caches a failed dynamic import as rejected, so an
      // in-place retry would hit the same cached failure. Reload instead.
      window.location.reload()
      return
    }
    // Task errors re-run their promise in place.
    retry()
  }, [error, retry])

  return (
    <>
      <HashRouter>
        <AuthProvider>
          <App onContentLoaded={markContentLoaded} onContentError={markContentError} />
        </AuthProvider>
      </HashRouter>
      <PageLoader ready={ready} error={error} onRetry={handleRetry} />
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
