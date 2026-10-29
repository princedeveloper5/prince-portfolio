import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api.js'

const AuthContext = createContext(null)

// Offline demo fallback — only used when the API server is unreachable.
// Real logins go through POST /api/login and are checked in the database.
const OFFLINE_CREDENTIALS = {
  email: 'admin@mugishaprince.com',
  password: 'Admin123!',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('admin_user')
    if (storedUser && getToken()) {
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
    try {
      const data = await api('/api/login', {
        method: 'POST',
        body: { email, password },
      })
      persistSession(data.token, data.user)
      return { success: true }
    } catch (error) {
      // Server down → allow the demo account so the panel isn't locked out.
      if (
        error.offline &&
        email === OFFLINE_CREDENTIALS.email &&
        password === OFFLINE_CREDENTIALS.password
      ) {
        persistSession('offline-session', {
          email,
          role: 'admin',
          name: 'Mugisha Prince',
        })
        return { success: true, offline: true }
      }
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setToken('')
    localStorage.removeItem('admin_user')
  }

  const forgotPassword = async () => {
    // Don't reveal whether the email exists.
    return { success: true }
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
