import { useEffect, useRef, useState } from 'react'
import Logo from '../Logo'
import './PageLoader.css'

const STATUS_MESSAGES = [
  'please wait...',
  'Page is loading'
]

const HIDE_TRANSITION_MS = 420

/**
 * Full-viewport branded loading screen for the portfolio.
 *
 * Phases: "visible" -> "hiding" (CSS fade-out runs) -> "gone" (unmounted),
 * so the loader never covers the app after loading completes.
 *
 * Props:
 *   ready  — every readiness gate passed; triggers the fade-out
 *   error  — null | { kind, message }; shows the retry state instead
 *   onRetry— invoked by the Retry button (wired by the entry point)
 */
export default function PageLoader({ ready = false, error = null, onRetry }) {
  const [phase, setPhase] = useState('visible') // visible | hiding | gone
  const [messageIndex, setMessageIndex] = useState(0)
  // Live-region content present at first render is often not announced, so
  // the status text is written one tick after mount.
  const [announced, setAnnounced] = useState(false)
  const retryRef = useRef(null)

  useEffect(() => {
    setAnnounced(true)
  }, [])

  // Fade out once ready, then unmount after the CSS transition.
  useEffect(() => {
    if (!ready || error) {
      setPhase('visible')
      return undefined
    }
    setPhase('hiding')
    const timer = window.setTimeout(() => setPhase('gone'), HIDE_TRANSITION_MS)
    return () => window.clearTimeout(timer)
  }, [ready, error])

  // Rotate the decorative status line while loading (aria-hidden, so no
  // screen-reader chatter).
  useEffect(() => {
    if (phase !== 'visible' || error) return undefined
    const interval = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length)
    }, 900)
    return () => window.clearInterval(interval)
  }, [phase, error])

  // Move focus to Retry when the error state appears so keyboard and
  // screen-reader users land on the recovery action.
  useEffect(() => {
    if (error && phase === 'visible') {
      retryRef.current?.focus()
    }
  }, [error, phase])

  if (phase === 'gone') return null

  const isError = Boolean(error)
  const hideClass = phase === 'hiding' ? ' page-loader--hiding' : ''

  return (
    <div
      className={`page-loader${hideClass}`}
      aria-busy={!ready && !isError}
      data-phase={phase}
      data-state={isError ? 'error' : 'loading'}
    >
      <div className="page-loader__bg" aria-hidden="true" />
      <div className="page-loader__glow" aria-hidden="true" />

      <div className="page-loader__content">
        <div className="page-loader__monogram" aria-hidden="true">
          <div className="page-loader__ring" />
          <div className="page-loader__shine" />
          <Logo className="page-loader__logo" />
        </div>

        <div className="page-loader__brand">
          {/* Brand name, not a page heading: the page's h1 belongs to Home. */}
          <div className="page-loader__name">Mugisha Prince</div>
          <p className="page-loader__title">FullStack DEVELOPER</p>
        </div>

        {isError ? (
          <div className="page-loader__error" role="alert">
            <p className="page-loader__error-text">
              {error.message || 'Something went wrong while loading.'}
            </p>
            <button
              ref={retryRef}
              type="button"
              className="page-loader__retry"
              onClick={onRetry}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Indeterminate progress: real percentage is unknown. */}
            <div className="page-loader__progress" aria-hidden="true">
              <div className="page-loader__progress-bar" />
            </div>
            {/* Rotating copy is decorative — hidden so the live region below
                makes one stable announcement instead of one every 900ms. */}
            <p className="page-loader__status" aria-hidden="true">
              {STATUS_MESSAGES[messageIndex]}
            </p>
          </>
        )}
      </div>

      {/* Single stable announcement for assistive technologies. */}
      <span className="page-loader__sr-only" role="status" aria-live="polite">
        {!announced
          ? ''
          : isError
            ? 'Loading failed. A retry option is available.'
            : 'Loading the portfolio. Please wait.'}
      </span>
    </div>
  )
}
