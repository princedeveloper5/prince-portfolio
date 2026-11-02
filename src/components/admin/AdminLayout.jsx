import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Bell, Code, ExternalLink, Folder, Home, Mail, Menu, Settings, User, Users, X, LogOut } from 'lucide-react'
import { useAuth } from '../../AuthContext.jsx'
import { api } from '../../api.js'
import logoImg from '../../../my images/logo.png'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Home, label: 'Home page', path: '/admin/home' },
  { icon: Folder, label: 'Projects', path: '/admin/projects' },
  { icon: Code, label: 'Skills', path: '/admin/skills' },
  { icon: User, label: 'About', path: '/admin/about' },
  { icon: Mail, label: 'Messages', path: '/admin/contact' },
  { icon: Users, label: 'Users', path: '/admin/users', adminOnly: true },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
]

export default function AdminLayout({ children, currentPage = 'Dashboard' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let active = true
    const refresh = () => api('/api/stats', { auth: true }).then((data) => {
      if (active) setUnread(Number(data?.unreadMessages) || 0)
    }).catch(() => {})
    refresh()
    window.addEventListener('focus', refresh)
    return () => { active = false; window.removeEventListener('focus', refresh) }
  }, [location.pathname])

  const visibleItems = menuItems.filter((item) => !item.adminOnly || user?.role === 'admin')

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050B18] to-[#08152A] text-white">
      {menuOpen && <button aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-black/60 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-blue-500/30 bg-gradient-to-b from-[#08152A] to-[#050B18] transition-transform duration-200 ${menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex h-20 items-center gap-3 border-b border-blue-500/20 px-5">
          <img src={logoImg} alt="Mugisha Prince logo" className="h-11 w-11 rounded-full object-cover shadow-[0_0_24px_rgba(56,189,248,.3)]" />
          <div><p className="font-semibold">Mugisha Prince</p><p className="text-xs text-cyan-400">Portfolio manager</p></div>
          <button className="ml-auto rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="space-y-1 p-3" aria-label="Admin navigation">
          {visibleItems.map(({ icon: Icon, label, path }) => (
            <NavLink key={path} to={path} onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${isActive || (path === '/admin/projects' && location.pathname.startsWith('/admin/projects')) ? 'border border-blue-400/40 bg-blue-500/15 text-white' : 'text-slate-300 hover:bg-blue-500/10 hover:text-white'}`}>
              <Icon className="h-5 w-5 text-cyan-400" /><span className="font-medium">{label}</span>
              {label === 'Messages' && unread > 0 && <span className="ml-auto min-w-5 rounded-full bg-red-500 px-1.5 text-center text-xs text-white">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="absolute inset-x-3 bottom-4 space-y-1">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 hover:bg-blue-500/10 hover:text-white"><ExternalLink className="h-5 w-5 text-cyan-400" />View portfolio</a>
        </div>
      </aside>

      <div className="min-h-screen lg:ml-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-blue-500/30 bg-[#08152A]/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden" aria-label="Open menu"><Menu size={20} /></button>
            <div><h1 className="font-semibold">{currentPage}</h1><p className="hidden text-xs text-slate-400 sm:block">Manage your portfolio content</p></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => navigate('/admin/contact')} title={`${unread} unread messages`} className="relative rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"><Bell size={19} />{unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-400" />}</button>
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex max-w-[190px] items-center gap-2 rounded-xl border border-blue-500/30 bg-[#08152A] px-2 py-1.5 hover:border-cyan-400/50 sm:px-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-semibold">{(user?.name || 'MP').split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
                <span className="truncate text-sm">{user?.name || 'Administrator'}</span>
              </button>
              {dropdownOpen && <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-blue-500/30 bg-[#08152A] shadow-xl"><button onClick={() => { setDropdownOpen(false); logout() }} className="flex w-full items-center gap-2 px-4 py-3 text-left text-slate-200 hover:bg-red-500/10"><LogOut size={16} /> Sign out</button></div>}
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  )
}
