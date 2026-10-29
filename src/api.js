/**
 * Tiny fetch wrapper for the portfolio API.
 *
 * - JSON in/out (FormData is passed through untouched for image uploads)
 * - Attaches the JWT from localStorage when auth: true
 * - Throws Error with the server's message so pages can show it
 * - `isOfflineError(err)` tells pages when to fall back to static content
 */

const TOKEN_KEY = 'admin_token'

export const getToken = () => window.localStorage?.getItem(TOKEN_KEY) || ''
export const setToken = (token) =>
  token ? window.localStorage?.setItem(TOKEN_KEY, token) : window.localStorage?.removeItem(TOKEN_KEY)

export async function api(path, { method = 'GET', body, auth = false, signal } = {}) {
  const headers = {}
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  if (body && !isForm) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      signal,
    })
  } catch (err) {
    if (err && err.name === 'AbortError') throw err
    const offline = new Error('Cannot reach the server. Is it running?')
    offline.offline = true
    throw offline
  }

  let data = null
  try {
    const text = await response.text()
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!response.ok) {
    const error = new Error((data && data.error) || `Request failed (${response.status})`)
    error.status = response.status
    error.offline = response.status >= 500 && !data
    // Session no longer valid → AuthContext listens for this and logs out.
    if (response.status === 401 && !path.endsWith('/api/login')) {
      window.dispatchEvent(new Event('auth-expired'))
    }
    throw error
  }
  return data
}

export const isOfflineError = (err) => Boolean(err && (err.offline || err.status === undefined || err.status >= 500))

/** "2026-10-27 10:38:43" (UTC from SQLite) -> locale date string */
export function formatDate(value) {
  if (!value) return ''
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(' ', 'T')}Z`
    : value
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** "2 hours ago"-style label for the dashboard activity feed */
export function timeAgo(value) {
  if (!value) return 'just now'
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(' ', 'T')}Z`
    : value
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return String(value)
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDate(value)
}

/** Count one visit per browser session (used by the dashboard visitor stat). */
export function trackVisit() {
  try {
    if (window.sessionStorage?.getItem('visit_tracked')) return
    window.sessionStorage.setItem('visit_tracked', '1')
    fetch('/api/visit', { method: 'POST' }).catch(() => {})
  } catch {
    /* storage unavailable — skip counting */
  }
}
