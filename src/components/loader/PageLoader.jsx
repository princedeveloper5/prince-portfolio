import { useEffect, useState } from 'react'
import Logo from '../Logo'
import './PageLoader.css'

const STATUS_MESSAGES = [
  'Preparing your experience...',
  'Loading assets...',
  'Almost ready...',
]

export default function PageLoader({ ready = false }) {
  const [shouldHide, setShouldHide] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (ready) {
      const timer = setTimeout(() => {
        setShouldHide(true)
      }, 420)
      return () => clearTimeout(timer)
    } else {
      setShouldHide(false)
    }
  }, [ready])

  useEffect(() => {
    if (ready) return
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length)
    }, 900)
    return () => clearInterval(interval)
  }, [ready])

  if (shouldHide) {
    return null
  }

  return (
    <div
      className={`page-loader${shouldHide ? ' page-loader--hiding' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy={!ready}
      aria-label="Loading Mugisha Prince portfolio"
    >
      <div className="page-loader__bg" aria-hidden="true" />
      <div className="page-loader__glow" aria-hidden="true" />
      <div className="page-loader__content">
        <div className="page-loader__monogram">
          <div className="page-loader__ring" aria-hidden="true" />
          <div className="page-loader__shine" aria-hidden="true" />
          <Logo className="page-loader__logo" />
        </div>
        <div className="page-loader__brand">
          <h1 className="page-loader__name">Mugisha Prince</h1>
          <p className="page-loader__title">SOFTWARE DEVELOPER</p>
        </div>
        <div className="page-loader__progress" aria-hidden="true">
          <div className="page-loader__progress-bar" />
        </div>
        <p className="page-loader__status">{STATUS_MESSAGES[messageIndex]}</p>
      </div>
    </div>
  )
}
