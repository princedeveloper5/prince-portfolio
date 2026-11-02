import { useEffect, useState } from 'react'

// The portfolio's initial route uses bundled content. Network calls such as
// visit tracking and optional images are intentionally not readiness blockers.
export function useAppReady({ minDelay = 320, maxWait = 1200 } = {}) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    let readyTimer

    const markReady = () => {
      if (cancelled || readyTimer) return
      readyTimer = window.setTimeout(() => {
        if (!cancelled) setReady(true)
      }, minDelay)
    }

    // Fonts improve the first paint, but should never keep the visitor waiting.
    const fontTimer = window.setTimeout(markReady, maxWait)
    if (document.fonts?.ready) {
      document.fonts.ready.then(markReady, markReady)
    } else if (document.readyState === 'complete') {
      markReady()
    } else {
      window.addEventListener('load', markReady, { once: true })
    }

    return () => {
      cancelled = true
      window.removeEventListener('load', markReady)
      window.clearTimeout(fontTimer)
      window.clearTimeout(readyTimer)
    }
  }, [maxWait, minDelay])

  return { ready }
}
