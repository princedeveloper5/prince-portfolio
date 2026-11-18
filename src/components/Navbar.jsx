import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  ArrowUpRight,
  Code2,
  FolderKanban,
  House,
  Mail,
  Menu,
  Moon,
  Sun,
  UserRound,
  X,
} from 'lucide-react'
import { FaFacebookF, FaGithub, FaInstagram, FaLinkedinIn } from 'react-icons/fa'
import Logo from './Logo'
import { api } from '../api.js'

const primaryLinks = [
  { name: 'Home', path: '/', Icon: House },
  { name: 'About', path: '/about', Icon: UserRound },
  { name: 'Projects', path: '/projects', Icon: FolderKanban },
  { name: 'Skills', path: '/skills', Icon: Code2 },
]

const socialDefinitions = [
  { name: 'GitHub', field: 'githubUrl', Icon: FaGithub },
  { name: 'LinkedIn', field: 'linkedinUrl', Icon: FaLinkedinIn },
  { name: 'Instagram', field: 'instagramUrl', Icon: FaInstagram },
  { name: 'Facebook', field: 'facebookUrl', Icon: FaFacebookF },
]

const validExternalUrl = (value) => /^https?:\/\//i.test(String(value || '').trim())

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const [theme, setTheme] = useState(() => {
    try { return window.localStorage?.getItem('theme') === 'light' ? 'light' : 'dark' } catch { return 'dark' }
  })
  const [brandName, setBrandName] = useState('Mugisha Prince')
  const [socialLinks, setSocialLinks] = useState([])
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { window.localStorage?.setItem('theme', theme) } catch { /* Keep the current page usable when storage is blocked. */ }
  }, [theme])

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setScrolled(window.scrollY > 12)
    }
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    let active = true
    const load = () => {
      api('/api/home')
        .then((data) => { if (active && data?.name) setBrandName(data.name) })
        .catch(() => {})
      api('/api/about')
        .then((data) => {
          if (!active) return
          setSocialLinks(socialDefinitions.filter(({ field }) => validExternalUrl(data?.[field])).map(({ name, field, Icon }) => ({ name, Icon, href: data[field] })))
        })
        .catch(() => {})
    }
    load()
    window.addEventListener('focus', load)
    return () => { active = false; window.removeEventListener('focus', load) }
  }, [])

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  useEffect(() => setIsOpen(false), [location.pathname, location.search])

  useEffect(() => {
    if (!isOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [isOpen])

  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark')
  const linkClass = ({ isActive }) => `nav-link inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-400 ${isActive ? 'is-active text-electric-400' : 'text-gray-300 hover:text-electric-400'}`
  const mobileLinkClass = ({ isActive }) => `mobile-menu__item flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-400 ${isActive ? 'is-active text-electric-400 bg-navy-700' : 'text-gray-300 hover:bg-navy-700 hover:text-electric-400'}`

  return (
    <header
      className="nav-shell fixed inset-x-0 top-0 z-50 border-b border-navy-600/50 bg-navy-900/95 backdrop-blur-xl"
      data-scrolled={scrolled ? 'true' : 'false'}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[76px] items-center justify-between gap-4">
          <Link to="/" className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-electric-400" aria-label={`${brandName}, home`}>
            <Logo className="h-10 w-10" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white sm:text-base">{brandName}</span>
              <span className="hidden text-xs text-gray-400 sm:block">Software Developer</span>
            </span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
            {primaryLinks.map(({ name, path, Icon }) => (
              <NavLink key={name} to={path} end={path === '/'} className={linkClass}>
                <Icon size={16} aria-hidden="true" />
                <span>{name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-1 border-r border-navy-600/70 pr-3 sm:flex" aria-label="Social profiles">
              {socialLinks.map(({ name, Icon, href }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${brandName} on ${name} (opens in a new tab)`}
                  title={name}
                  className="nav-icon-button"
                >
                  <Icon size={18} aria-hidden="true" />
                </a>
              ))}
            </div>

            <Link to="/contact" className="nav-contact hidden items-center gap-2 rounded-full bg-electric-400 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-electric-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-400 lg:inline-flex">
              <Mail size={16} aria-hidden="true" />
              <span>Let’s talk</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="nav-icon-button"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              aria-pressed={theme === 'light'}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
            </button>

            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className="nav-icon-button lg:hidden"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
            >
              {isOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <>
          <button type="button" aria-label="Close navigation menu" className="mobile-menu-backdrop lg:hidden" onClick={() => setIsOpen(false)} />
          <div id="mobile-navigation" className="mobile-menu lg:hidden">
            <nav aria-label="Mobile navigation" className="mx-auto max-w-7xl px-4 pb-5 pt-3 sm:px-6">
              {[...primaryLinks, { name: 'Contact', path: '/contact', Icon: Mail }].map(({ name, path, Icon }, index) => (
                <NavLink
                  key={name}
                  to={path}
                  end={path === '/'}
                  onClick={() => setIsOpen(false)}
                  style={{ '--menu-delay': `${index * 45}ms` }}
                  className={mobileLinkClass}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{name}</span>
                  <ArrowUpRight className="ml-auto opacity-50" size={16} aria-hidden="true" />
                </NavLink>
              ))}
              {socialLinks.length > 0 && (
                <div className="mt-4 flex gap-2 border-t border-navy-600/60 pt-4 sm:hidden">
                  {socialLinks.map(({ name, Icon, href }) => (
                    <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="nav-mobile-social">
                      <Icon size={17} aria-hidden="true" />
                      <span>{name}</span>
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
