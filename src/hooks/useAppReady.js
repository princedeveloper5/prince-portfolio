import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Application readiness for the branded page loader.
 *
 * Gates (all optional, all time-capped so a visitor never waits forever):
 *  1. Font readiness — capped by `maxWait` (fonts improve first paint but
 *     must never block the site).
 *  2. A content signal — the first route chunk + first render call
 *     `markContentLoaded()`. Capped by `contentTimeout` so an optional image
 *     or slow API can never hold the loader open indefinitely.
 *  3. Required tasks — `registerTask()` runs an essential async operation
 *     (e.g. required profile data from a future backend) that controls the
 *     loading state. Failures surface as a retryable error instead of an
 *     infinite spinner. Optional work must NOT be registered here.
 *
 * Returns:
 *   ready            — true once every gate has passed (or timed out)
 *   error            — null | { kind: 'content' | 'task', message }
 *   retry            — clears the error and re-arms the gates (re-running
 *                      registered tasks in place)
 *   markContentLoaded / markContentError — content signal from inside Suspense
 *   registerTask     — register a required async task; returns unregister fn
 */
export function useAppReady({
  minDelay = 320,
  maxWait = 1200,
  contentTimeout = 8000,
} = {}) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  // Refs keep gate state stable across StrictMode's double-invoked effects
  // without re-running initialization.
  const stateRef = useRef(null)
  if (!stateRef.current) {
    stateRef.current = {
      cancelled: false,
      finished: false,
      failed: false,
      fontsDone: false,
      contentDone: false,
      taskSeq: 0,
      tasks: new Map(), // id -> { run, done }
      timers: {},
      startedAt: 0,
    }
  }

  const finishIfSatisfied = useCallback(() => {
    const s = stateRef.current
    if (s.cancelled || s.finished || s.failed) return
    if (!s.fontsDone || !s.contentDone) return
    for (const task of s.tasks.values()) {
      if (!task.done) return
    }
    s.finished = true
    const elapsed = Date.now() - s.startedAt
    const wait = Math.max(0, minDelay - elapsed)
    window.clearTimeout(s.timers.finish)
    s.timers.finish = window.setTimeout(() => {
      if (!s.cancelled) setReady(true)
    }, wait)
  }, [minDelay])

  const fail = useCallback((kind, message) => {
    const s = stateRef.current
    if (s.cancelled || s.finished || s.failed) return
    s.failed = true
    window.clearTimeout(s.timers.finish)
    setError({ kind, message })
  }, [])

  const markContentLoaded = useCallback(() => {
    const s = stateRef.current
    if (s.cancelled || s.contentDone) return
    s.contentDone = true
    window.clearTimeout(s.timers.content)
    finishIfSatisfied()
  }, [finishIfSatisfied])

  const markContentError = useCallback(
    (message) => fail('content', message || 'The page content could not be loaded.'),
    [fail],
  )

  const runTask = useCallback(
    (id, task) => {
      const s = stateRef.current
      // Deferred so a synchronous throw inside task.run() becomes a
      // rejection instead of escaping the retry path.
      Promise.resolve()
        .then(() => task.run())
        .then(
          () => {
            if (s.cancelled || !s.tasks.has(id)) return
            s.tasks.get(id).done = true
            finishIfSatisfied()
          },
          (err) => {
            if (s.cancelled || !s.tasks.has(id)) return
            fail('task', err?.message || 'An essential request failed.')
          },
        )
    },
    [finishIfSatisfied, fail],
  )

  const registerTask = useCallback(
    (task) => {
      const s = stateRef.current
      const id = task.id || `task-${++s.taskSeq}`
      s.tasks.set(id, { run: task.run, done: false })
      runTask(id, task)
      return () => s.tasks.delete(id)
    },
    [runTask],
  )

  const armGates = useCallback(() => {
    const s = stateRef.current
    s.cancelled = false
    s.finished = false
    s.failed = false
    // NOTE: fontsDone/contentDone are one-way flags — a signal that already
    // fired (e.g. before a task-error retry) must not be wiped, otherwise
    // the content gate would fall back to the contentTimeout on every retry.
    s.startedAt = Date.now()

    // Gate 1 — fonts, capped by maxWait.
    window.clearTimeout(s.timers.fonts)
    s.timers.fonts = window.setTimeout(() => {
      if (s.cancelled || s.fontsDone) return
      s.fontsDone = true
      finishIfSatisfied()
    }, maxWait)

    const fontsSettled = () => {
      if (s.cancelled || s.fontsDone) return
      s.fontsDone = true
      window.clearTimeout(s.timers.fonts)
      finishIfSatisfied()
    }

    if (s.onLoad) {
      window.removeEventListener('load', s.onLoad)
      s.onLoad = null
    }
    if (document.fonts?.ready) {
      document.fonts.ready.then(fontsSettled, fontsSettled)
    } else if (document.readyState === 'complete') {
      fontsSettled()
    } else {
      s.onLoad = () => {
        window.removeEventListener('load', s.onLoad)
        s.onLoad = null
        fontsSettled()
      }
      window.addEventListener('load', s.onLoad, { once: true })
    }

    // Gate 2 — content signal, capped by contentTimeout. Long enough for a
    // slow first chunk, but it guarantees no indefinite wait: optional
    // slowness never blocks the site, and a genuine failure surfaces via
    // markContentError() from the error boundary before this fires.
    if (!s.contentDone) {
      window.clearTimeout(s.timers.content)
      s.timers.content = window.setTimeout(() => {
        if (s.cancelled || s.contentDone) return
        s.contentDone = true
        finishIfSatisfied()
      }, contentTimeout)
    }

    // Re-evaluate gates that were already satisfied by an earlier attempt
    // (retry with no pending tasks must still reach `ready`).
    finishIfSatisfied()
  }, [finishIfSatisfied, maxWait, contentTimeout])

  const retry = useCallback(() => {
    const s = stateRef.current
    setError(null)
    setReady(false)
    // Re-run required tasks in place; content errors are handled by the
    // caller (a full reload, since the browser caches failed imports).
    for (const [id, task] of [...s.tasks.entries()]) {
      task.done = false
      runTask(id, task)
    }
    armGates()
  }, [armGates, runTask])

  useEffect(() => {
    armGates()
    const s = stateRef.current
    return () => {
      s.cancelled = true
      window.clearTimeout(s.timers.fonts)
      window.clearTimeout(s.timers.content)
      window.clearTimeout(s.timers.finish)
      if (s.onLoad) {
        window.removeEventListener('load', s.onLoad)
        s.onLoad = null
      }
    }
  }, [armGates])

  return { ready, error, retry, markContentLoaded, markContentError, registerTask }
}
