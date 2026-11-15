import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

const SHOW_AFTER_PX = 420

/**
 * Global scroll affordances for the public site:
 *   - a thin progress bar pinned under the navbar
 *   - a back-to-top button that fades in once the visitor has scrolled
 *
 * Both listen to the same passive scroll listener and respect
 * prefers-reduced-motion (the bar simply stops animating; the button still
 * works because it is a control, not decoration).
 */
export default function ScrollUI() {
  const [progress, setProgress] = useState(0)
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - doc.clientHeight
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, doc.scrollTop / scrollable)) : 0
      setProgress(ratio)
      setShowTop(doc.scrollTop > SHOW_AFTER_PX)
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const scrollToTop = () => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
    // Move focus back to the top of the document for keyboard users.
    document.getElementById('root')?.focus?.()
  }

  return (
    <>
      {/* Reading progress — thin, brand-coloured, purely decorative. */}
      <div
        className="scroll-progress"
        aria-hidden="true"
        data-active={progress > 0 && progress < 1 ? 'true' : 'false'}
      >
        <div
          className="scroll-progress__bar"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        title="Back to top"
        data-visible={showTop ? 'true' : 'false'}
        className="back-to-top"
      >
        <ArrowUp className="back-to-top__icon" aria-hidden="true" />
      </button>
    </>
  )
}
