/**
 * Admin preferences that genuinely drive the UI (not decorative toggles).
 *
 *   unreadBadge — show/hide the red unread-count on the sidebar "Messages"
 *                 entry and the bell dot in the admin header
 *   reduceMotion— turn off interface animation for this device, mirroring
 *                 the OS-level prefers-reduced-motion setting
 *
 * Stored in localStorage under one key. Changes are announced with a
 * `admin-prefs-change` window event so the always-mounted AdminLayout can
 * react without a reload.
 */

const KEY = 'admin_prefs'
const EVENT = 'admin-prefs-change'

export const DEFAULT_PREFS = { unreadBadge: true, reduceMotion: false }

export function readPrefs() {
  try {
    const stored = JSON.parse(window.localStorage?.getItem(KEY) || 'null')
    if (!stored || typeof stored !== 'object') return { ...DEFAULT_PREFS }
    return {
      unreadBadge: stored.unreadBadge !== false,
      reduceMotion: Boolean(stored.reduceMotion),
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

/** Applies device-wide side effects (currently the reduce-motion switch). */
export function applyPrefs(prefs) {
  const root = document.documentElement
  if (prefs.reduceMotion) root.dataset.motion = 'reduced'
  else delete root.dataset.motion
}

/** Merges a patch, persists it, applies it and notifies listeners. */
export function savePrefs(patch) {
  const next = { ...readPrefs(), ...patch }
  try {
    window.localStorage?.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable: the in-memory value still applies for this page */
  }
  applyPrefs(next)
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }))
  return next
}

export const PREFS_EVENT = EVENT

/** Read the saved preference once at startup (before React renders). */
export function initPrefs() {
  applyPrefs(readPrefs())
}
