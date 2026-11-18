import { Link } from 'react-router-dom'
import { SITE_CONTACT, SITE_SOCIALS } from '../siteConfig.js'
import { useEffect, useState } from 'react'
import { FaFacebookF, FaGithub, FaInstagram, FaLinkedinIn, FaTwitter } from 'react-icons/fa'
import { api } from '../api.js'
import Logo from './Logo'

const SOCIAL_ICONS = { github: FaGithub, linkedin: FaLinkedinIn, twitter: FaTwitter, instagram: FaInstagram, facebook: FaFacebookF }

const links = [
  ['Home', '/'], ['About', '/about'], ['Projects', '/projects'], ['Skills', '/skills'], ['Contact', '/contact'],
]

export default function Footer() {
  const [contact, setContact] = useState(SITE_CONTACT)
  const [socialUrls, setSocialUrls] = useState({})
  const [profile, setProfile] = useState({ name: 'Mugisha Prince', title: 'Software Developer', description: 'Passionate about building modern web applications and solving real-world problems through technology.' })

  useEffect(() => {
    let cancelled = false
    const load = () => {
      api('/api/home').then((data) => {
        if (!cancelled && data) setProfile((current) => ({ name: data.name || current.name, title: data.title || current.title, description: data.description || current.description }))
      }).catch(() => {})
      api('/api/about').then((data) => {
        if (!cancelled && data) setContact((current) => ({
          email: data.email?.trim() || current.email,
          phone: data.phone?.trim() || current.phone,
          location: data.location?.trim() || current.location,
        }))
        if (!cancelled) setSocialUrls({ github: data.githubUrl || '', linkedin: data.linkedinUrl || '', twitter: data.twitterUrl || '', instagram: data.instagramUrl || '', facebook: data.facebookUrl || '' })
      }).catch(() => {})
    }
    load()
    window.addEventListener('focus', load)
    return () => {
      cancelled = true
      window.removeEventListener('focus', load)
    }
  }, [])

  return (
    <footer className="site-footer bg-navy-900 border-t border-navy-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4"><Logo className="w-10 h-10" /><span className="text-white font-semibold text-lg">{profile.name}</span></div>
            <p className="text-gray-400 text-sm leading-relaxed">{profile.title} — {profile.description}</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">{links.map(([label, path]) => <li key={path}><Link to={path} className="text-gray-400 hover:text-electric-400 transition-colors text-sm">{label}</Link></li>)}</ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Connect</h3>
            <div className="flex gap-4">
              {SITE_SOCIALS.map((social) => ({ ...social, href: socialUrls[social.icon] || social.href })).filter(({ href }) => href).map(({ name, href, icon }) => {
                const Icon = SOCIAL_ICONS[icon]
                return Icon ? (
                  <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-electric-400 transition-colors" aria-label={name}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </a>
                ) : null
              })}
              <a href={`mailto:${contact.email}`} className="text-gray-400 hover:text-electric-400 transition-colors" aria-label={`Email ${contact.email}`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z"/><path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-navy-600 mt-8 pt-8 text-center"><p className="text-gray-400 text-sm">© {new Date().getFullYear()} {profile.name}. All rights reserved.</p></div>
      </div>
    </footer>
  )
}
