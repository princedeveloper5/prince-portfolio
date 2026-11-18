import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api.js'

const AuthContext = createContext(null)
const readStoredUser = () => {
  try { return window.localStorage?.getItem('admin_user') || '' } catch { return '' }
}
const clearStoredUser = () => {
  try { window.localStorage?.removeItem('admin_user') } catch { /* in-memory session can still be cleared */ }
}
const writeStoredUser = (userData) => {
  try { window.localStorage?.setItem('admin_user', JSON.stringify(userData)) } catch { /* keep this session in memory */ }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = readStoredUser()
    const token = getToken()
    if (token === 'offline-session') {
      clearStoredUser()
      setToken('')
    } else if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        clearStoredUser()
        setToken('')
      }
    } else if (!storedUser) {
      setToken('')
    }
    setLoading(false)
  }, [])

  // A401 from the API means the stored session is no longer valid.
  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      setToken('')
      clearStoredUser()
    }
    window.addEventListener('auth-expired', onExpired)
    return () => window.removeEventListener('auth-expired', onExpired)
  }, [])

  const persistSession = (token, userData) => {
    setToken(token)
    writeStoredUser(userData)
    setUser(userData)
  }

  const login = async (email, password) => {
    const data = await api('/api/login', { method: 'POST', body: { email, password } })
    if (data.requiresTwoFactor) return data
    persistSession(data.token, data.user)
    return { success: true }
  }

  const verifyTwoFactor = async (challengeId, code) => {
    const data = await api('/api/login/verify', { method: 'POST', body: { challengeId, code } })
    persistSession(data.token, data.user)
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    setToken('')
    clearStoredUser()
  }

  const forgotPassword = async (email) => {
    return api('/api/password-reset/request', { method: 'POST', body: { email } })
  }

  return (
    <AuthContext.Provider value={{ user, login, verifyTwoFactor, logout, forgotPassword, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
