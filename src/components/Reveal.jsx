import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Scroll-reveal wrapper: fades/slides its child in the first time it enters
 * the viewport, then disconnects so the element stays put.
 *
 * Built on IntersectionObserver + a CSS class (no animation library), so it
 * adds no bundle weight and degrades gracefully:
 *   - prefers-reduced-motion  -> content shows instantly, no transition
 *   - IntersectionObserver    -> content stays hidden ONLY until observed;
 *                                if it is unsupported the content is shown
 *
 * Props:
 *   as      — element/component to render (default 'div')
 *   delay   — ms to wait before animating (for staggered grids)
 *   y       — starting vertical offset in px (default 28)
 *   once    — re-animate on every re-entry when false (default true)
 */
export default function Reveal({
  as: Tag = 'div',
  delay = 0,
  y = 28,
  className = '',
  children,
  ...rest
}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(() => prefersReducedMotion())

  useEffect(() => {
    // Already visible (reduced motion) — nothing to observe.
    if (shown) return undefined

    const node = ref.current
    if (!node) return undefined

    if (typeof IntersectionObserver === 'undefined') {
      // No observer support: never leave content invisible.
      setShown(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true)
            observer.disconnect()
          }
        })
      },
      // Fire a little before the element is fully in view so the motion
      // feels responsive rather than late.
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [shown])

  return (
    <Tag
      ref={ref}
      data-reveal=""
      data-revealed={shown ? 'true' : 'false'}
      className={`reveal${shown ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={{
        '--reveal-delay': `${delay}ms`,
        '--reveal-y': `${y}px`,
        ...rest.style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
