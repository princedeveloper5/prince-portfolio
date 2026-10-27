import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const ADMIN_CREDENTIALS = {
  email: 'admin@mugishaprince.com',
  // This is just for demo - in production this would come from backend
  password: 'Admin123!',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('admin_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('admin_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      const userData = { email, role: 'admin', name: 'Mugisha Prince' }
      setUser(userData)
      localStorage.setItem('admin_user', JSON.stringify(userData))
      return { success: true }
    }
    
    throw new Error('Invalid email or password')
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('admin_user')
  }

  const forgotPassword = async (email) => {
    await new Promise(resolve => setTimeout(resolve, 600))
    // Don't reveal if email exists
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
