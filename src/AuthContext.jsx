import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('admin_user')
    const token = getToken()
    if (token === 'offline-session') {
      localStorage.removeItem('admin_user')
      setToken('')
    } else if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('admin_user')
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
      localStorage.removeItem('admin_user')
    }
    window.addEventListener('auth-expired', onExpired)
    return () => window.removeEventListener('auth-expired', onExpired)
  }, [])

  const persistSession = (token, userData) => {
    setToken(token)
    localStorage.setItem('admin_user', JSON.stringify(userData))
    setUser(userData)
  }

  const login = async (email, password) => {
    const data = await api('/api/login', { method: 'POST', body: { email, password } })
    persistSession(data.token, data.user)
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    setToken('')
    localStorage.removeItem('admin_user')
  }

  const forgotPassword = async (email) => {
    return api('/api/password-reset/request', { method: 'POST', body: { email } })
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, forgotPassword, loading, isAuthenticated: !!user }}>
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
