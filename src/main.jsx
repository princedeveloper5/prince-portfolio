import React, { useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './AuthContext.jsx'
import './index.css'
import { initPrefs } from './adminPrefs.js'
import PageLoader from './components/loader/PageLoader.jsx'
import { useAppReady } from './hooks/useAppReady.js'

// Applies the saved "reduce motion" preference before the first render.
initPrefs()

// Keep existing shared/bookmarked hash URLs working after switching to
// normal paths (for example, /#/projects/12 -> /projects/12).
if (window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', `${window.location.hash.slice(1)}${window.location.search}`)
}

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
      <BrowserRouter>
        <AuthProvider>
          <App onContentLoaded={markContentLoaded} onContentError={markContentError} />
        </AuthProvider>
      </BrowserRouter>
      <PageLoader ready={ready} error={error} onRetry={handleRetry} />
    </>
  )
}

document.getElementById('root').tabIndex = -1

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
