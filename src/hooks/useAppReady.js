import { useEffect, useState } from 'react'

export function useAppReady({ minDelay = 650 } = {}) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    let timeoutId

    const markReady = () => {
      if (cancelled) return
      timeoutId = window.setTimeout(() => {
        if (cancelled) return
        setReady(true)
      }, minDelay)
    }

    const handleLoad = () => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready
          .catch(() => {})
          .finally(markReady)
        return
      }
      markReady()
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad, { once: true })
    }

    return () => {
      cancelled = true
      window.removeEventListener('load', handleLoad)
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [minDelay])

  const retry = () => {
    setError(null)
    setReady(false)
    window.setTimeout(() => {
      setReady(true)
    }, 400)
  }

  return { ready, error, retry }
}
