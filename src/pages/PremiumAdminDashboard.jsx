import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Folder, 
  Code, 
  User, 
  Mail, 
  Users, 
  Settings, 
  Bell,
  ChevronDown,
  Home,
  LogOut
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import DashboardContent from '../components/dashboard/DashboardContent'
import logoImg from '../../my images/logo.png'
import { useNavigate, useLocation } from 'react-router-dom'

const sidebarVariants = {
  hidden: { x: -280 },
  visible: { 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20
    }
  }
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Home, label: 'Home', path: '/admin/home' },
  { icon: Folder, label: 'Projects', path: '/admin/projects' },
  { icon: Code, label: 'Skills', path: '/admin/skills' },
  { icon: User, label: 'About', path: '/admin/about' },
  { icon: Mail, label: 'Contact', path: '/admin/contact' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
]

export default function PremiumAdminDashboard() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050B18] to-[#08152A] text-white">
      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-[#08152A] to-[#050B18] border-r border-blue-500/30 z-50"
        style={{ boxShadow: '0 0 40px rgba(37, 99, 235, 0.1)' }}
      >
        <div className="p-6 border-b border-blue-500/20">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-12 h-12 rounded-full overflow-hidden shadow-lg"
              style={{ boxShadow: '0 0 30px rgba(56, 189, 248, 0.4)' }}
            >
              <img src={logoImg} alt="Mugisha Prince logo" className="w-full h-full object-cover" />
            </motion.div>
            <div>
              <div className="font-semibold text-white">Mugisha Prince</div>
              <div className="text-xs text-cyan-400">Admin Panel</div>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path
            return (
              <motion.button
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4 }}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-cyan-500/10 text-white border border-blue-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-blue-500/10'
                }`}
                style={isActive ? { boxShadow: '0 0 20px rgba(37, 99, 235, 0.2)' } : {}}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r"
                    style={{ boxShadow: '0 0 10px rgba(56, 189, 248, 0.8)' }}
                  />
                )}
                <item.icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 rounded-full bg-cyan-400"
                    style={{ boxShadow: '0 0 10px rgba(56, 189, 248, 0.8)' }}
                  />
                )}
              </motion.button>
            )
          })}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className="ml-72">
        {/* Top Navigation */}
        <motion.header
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="h-16 bg-gradient-to-r from-[#08152A]/80 to-[#050B18]/80 backdrop-blur-xl border-b border-blue-500/30 flex items-center justify-between px-6"
          style={{ boxShadow: '0 4px 40px rgba(37, 99, 235, 0.1)' }}
        >
          <div>
            <h1 className="text-lg font-semibold text-white">Dashboard</h1>
            <p className="text-sm text-cyan-400">Welcome back, Mugisha Prince!</p>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/contact')}
              title="View messages"
              className="relative p-2 text-slate-300 hover:text-white transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" style={{ boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)' }}></span>
            </motion.button>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#08152A] border border-blue-500/30 hover:border-cyan-400/50 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">MP</span>
                </div>
                <span className="text-white text-sm">{user?.name || 'Mugisha Prince'}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-[#08152A] border border-blue-500/30 rounded-xl shadow-2xl overflow-hidden"
                  >
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.header>

        {/* Dashboard Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <DashboardContent />
        </main>
      </div>
    </div>
  )
}
