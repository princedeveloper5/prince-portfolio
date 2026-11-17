import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Code2, Mail, MapPin } from 'lucide-react'
import { FaGithub, FaLinkedinIn } from 'react-icons/fa'
import { api, isOfflineError } from '../api.js'
import { SITE_CONTACT } from '../siteConfig.js'

const DEFAULTS = {
  greeting: "Hello, I'm",
  name: 'Mugisha Prince',
  title: 'Software Developer',
  description:
    'I build modern web applications and solve real problems with clean, efficient code. Passionate about learning, creating and growing in the tech industry.',
  profileImage: '/passport-2.png',
}

const resolveProfileImage = (image) =>
  !image || image === '/mugisha-prince.png' ? DEFAULTS.profileImage : image

export default function Hero() {
  const [content, setContent] = useState(DEFAULTS)
  const [location, setLocation] = useState(SITE_CONTACT.location)
  const [socials, setSocials] = useState([])
  const [photoOk, setPhotoOk] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      Promise.all([api('/api/home'), api('/api/about')])
        .then(([home, about]) => {
          if (cancelled) return
          if (home) {
            setContent({
              greeting: home.greeting?.trim() || DEFAULTS.greeting,
              name: home.name?.trim() || DEFAULTS.name,
              title: home.title?.trim() || DEFAULTS.title,
              description: home.description?.trim() || DEFAULTS.description,
              profileImage: resolveProfileImage(home.profileImage),
            })
          }
          setLocation(about?.location?.trim() || SITE_CONTACT.location)
          setSocials([
            { name: 'GitHub', href: about?.githubUrl, Icon: FaGithub },
            { name: 'LinkedIn', href: about?.linkedinUrl, Icon: FaLinkedinIn },
          ].filter((social) => /^https?:\/\//i.test(String(social.href || ''))))
          setPhotoOk(true)
        })
        .catch((err) => {
          if (!isOfflineError(err)) console.warn('Hero content:', err.message)
        })
    }
    load()
    window.addEventListener('focus', load)
    return () => {
      cancelled = true
      window.removeEventListener('focus', load)
    }
  }, [])

  return (
    <section className="relative isolate overflow-hidden px-4 pb-16 pt-32 sm:px-6 sm:pb-20 sm:pt-36 lg:px-8 lg:pb-24 lg:pt-40">
      <div aria-hidden="true" className="hero-grid absolute inset-0 -z-10" />
      <div aria-hidden="true" className="absolute -right-24 top-20 -z-10 h-72 w-72 rounded-full bg-electric-500/10 blur-[100px] sm:h-96 sm:w-96" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        <div className="relative z-10 order-1">
          <div className="hero-rise mb-6 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-electric-400/20 bg-navy-800/70 px-3.5 py-2 text-xs font-medium text-gray-300 sm:text-sm" style={{ '--hero-delay': '30ms' }}>
            <Code2 className="h-4 w-4 shrink-0 text-electric-400" aria-hidden="true" />
            <span>{content.title}</span>
            <span className="text-gray-500" aria-hidden="true">·</span>
            <MapPin className="h-3.5 w-3.5 shrink-0 text-electric-400" aria-hidden="true" />
            <span>{location}</span>
          </div>

          <h1 className="max-w-4xl font-bold leading-[1.04] tracking-tight">
            <span className="hero-rise block text-3xl text-gray-300 sm:text-4xl" style={{ '--hero-delay': '100ms' }}>
              {content.greeting}
            </span>
            <span className="hero-rise mt-2 block break-words text-5xl text-electric-400 sm:text-6xl lg:text-7xl" style={{ '--hero-delay': '190ms' }}>
              {content.name}
            </span>
          </h1>

          <p className="hero-rise mt-7 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg" style={{ '--hero-delay': '290ms' }}>
            {content.description}
          </p>

          <div className="hero-rise mt-8 flex flex-wrap gap-3" style={{ '--hero-delay': '390ms' }}>
            <Link to="/projects" className="btn-primary">
              Explore my work <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/contact" className="btn-secondary">
              <Mail size={17} aria-hidden="true" /> Let’s talk
            </Link>
          </div>

          {socials.length > 0 && (
            <div className="hero-rise mt-8 flex flex-wrap items-center gap-2" style={{ '--hero-delay': '490ms' }}>
              <span className="mr-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Find me on</span>
              {socials.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero-social-link"
                  aria-label={`${name} profile (opens in a new tab)`}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{name}</span>
                  <ArrowUpRight size={13} aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="relative order-2 mx-auto w-full max-w-[270px] sm:max-w-[330px] lg:max-w-[410px] lg:justify-self-end">
          <div aria-hidden="true" className="hero-fade absolute left-1/2 top-[42%] h-[72%] w-[105%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric-500/20 blur-[80px] sm:blur-[100px]" style={{ '--hero-delay': '120ms' }} />
          <div className="hero-fade relative mx-auto aspect-[4/5] w-full max-h-[470px] overflow-hidden rounded-[2rem] border border-electric-400/20 bg-gradient-to-br from-navy-800/70 via-navy-900/40 to-electric-500/10 shadow-[0_32px_100px_-55px_rgba(22,139,255,0.7)]" style={{ '--hero-delay': '180ms' }}>
            <div aria-hidden="true" className="absolute inset-3 rounded-[1.5rem] border border-white/5" />
            <div className="hero-float absolute inset-x-4 bottom-0 top-4 sm:inset-x-5 sm:top-5">
              {photoOk ? (
                <img
                  src={resolveProfileImage(content.profileImage)}
                  alt={content.name || 'Mugisha Prince'}
                  className="hero-portrait absolute inset-0 h-full w-full object-contain object-bottom"
                  onError={() => setPhotoOk(false)}
                />
              ) : (
                <div className="absolute inset-x-0 bottom-0 flex h-[78%] items-end justify-center">
                  <div className="flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-electric-400 to-electric-600 shadow-[0_0_70px_rgba(22,139,255,0.35)]">
                    <span className="text-4xl font-bold text-navy-900">MP</span>
                  </div>
                </div>
              )}
            </div>
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy-900/70 to-transparent" />
          </div>
          <div aria-hidden="true" className="absolute -bottom-5 -left-5 -z-10 h-24 w-24 rounded-full border border-electric-400/20" />
          <div aria-hidden="true" className="absolute -right-4 top-10 -z-10 h-14 w-14 rounded-2xl border border-electric-400/20" />
        </div>
      </div>
    </section>
  )
}
