import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'
import { Eye, EyeOff } from 'lucide-react'
import logoImg from '../../my images/logo.png'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }
    if (!password) {
      setError('Password is required')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#0f1629] to-[#0a0e27]"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-electric-400/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-electric-400/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="text-center lg:text-left space-y-6">
              <div className="flex justify-center lg:justify-start">
                <img
                  src={logoImg}
                  alt="Mugisha Prince logo"
                  className="w-16 h-16 rounded-xl object-cover shadow-lg shadow-electric-400/25"
                />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white">Mugisha Prince</h1>
                <h2 className="text-xl md:text-2xl font-semibold text-electric-400">Admin Panel</h2>
              </div>
              
              <p className="text-gray-400 text-lg max-w-md mx-auto lg:mx-0">
                Sign in to manage your portfolio content.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <div className="bg-[#0f172a] border border-navy-600/50 rounded-xl p-8 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-6">Admin Login</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 bg-[#0a0e27] border border-navy-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-electric-400/50 focus:border-electric-400 transition-colors"
                        autoComplete="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full px-4 py-3 bg-[#0a0e27] border border-navy-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-electric-400/50 focus:border-electric-400 transition-colors pr-12"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2" role="alert">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-electric-400 hover:bg-electric-500 text-navy-900 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-electric-400/50"
                    >
                      {loading ? 'Signing in...' : 'Login'}
                    </button>
                  </form>

                  <div className="mt-4 text-center">
                    <Link
                      to="/admin/forgot-password"
                      className="text-sm text-electric-400 hover:text-electric-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 pb-6 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-500 text-sm text-center lg:text-left">
            © {new Date().getFullYear()} Mugisha Prince
          </p>
        </div>
      </div>
    </div>
  )
}
