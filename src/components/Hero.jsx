import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, Code2, Mail, MapPin } from 'lucide-react'
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
    <section className="home-hero relative isolate overflow-hidden px-4 pb-16 pt-32 sm:px-6 sm:pb-20 sm:pt-36 lg:px-8 lg:pb-24 lg:pt-40">
      <div aria-hidden="true" className="hero-grid absolute inset-0 -z-10" />
      <div aria-hidden="true" className="absolute -right-24 top-20 -z-10 h-72 w-72 rounded-full bg-electric-500/10 blur-[100px] sm:h-96 sm:w-96" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        <div className="relative z-10 order-1">
          <div className="hero-rise mb-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 sm:text-sm" style={{ '--hero-delay': '30ms' }}>
            <span className="h-px w-8 bg-electric-400" aria-hidden="true" />
            <Code2 className="h-4 w-4 shrink-0 text-electric-400" aria-hidden="true" />
            <span>{content.title}</span>
            <span className="text-gray-500" aria-hidden="true">/</span>
            <MapPin className="h-3.5 w-3.5 shrink-0 text-electric-400" aria-hidden="true" />
            <span>{location}</span>
          </div>

          <h1 className="max-w-4xl font-bold leading-[1.04] tracking-tight">
            <span className="hero-rise block text-3xl text-gray-300 sm:text-4xl" style={{ '--hero-delay': '100ms' }}>
              {content.greeting}
            </span>
            <span className="hero-rise mt-2 block break-words text-5xl text-white sm:text-6xl lg:text-[5.25rem]" style={{ '--hero-delay': '190ms' }}>
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

          <a href="#featured-work" className="hero-rise mt-12 inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-electric-400" style={{ '--hero-delay': '450ms' }}>
            Scroll to explore <ArrowDown size={15} aria-hidden="true" />
          </a>

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

        <div className="hero-visual relative order-2 mx-auto w-full max-w-[280px] sm:max-w-[350px] lg:max-w-[420px] lg:justify-self-end">
          <div aria-hidden="true" className="hero-fade absolute -inset-5 rounded-[2rem] bg-electric-500/10 blur-2xl" style={{ '--hero-delay': '120ms' }} />
          <div className="hero-fade relative mx-auto aspect-[4/5] w-full max-h-[500px] overflow-hidden rounded-[1.25rem] border border-electric-400/20 bg-[#9bb9ec] shadow-[0_32px_100px_-55px_rgba(22,139,255,0.7)]" style={{ '--hero-delay': '180ms' }}>
            <div aria-hidden="true" className="absolute inset-3 z-10 rounded-[0.85rem] border border-white/25" />
            <div className="hero-float absolute inset-0">
              {photoOk ? (
                <img
                  src={resolveProfileImage(content.profileImage)}
                  alt={content.name || 'Mugisha Prince'}
                  className="hero-portrait absolute inset-0 h-full w-full object-cover object-[center_22%]"
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
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-navy-900/90 via-navy-900/45 to-transparent px-6 pb-6 pt-16">
              <p className="text-sm font-semibold text-white">{content.name}</p>
              <p className="mt-1 text-xs tracking-wide text-gray-300">{location}</p>
            </div>
          </div>
          <div aria-hidden="true" className="absolute -bottom-4 -left-4 -z-10 h-20 w-20 rounded-full border border-electric-400/25" />
          <div className="hero-note absolute -right-4 top-8 z-20 rounded-xl border border-navy-600/70 bg-navy-800/90 px-4 py-3 shadow-xl sm:-right-10">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Based in</span>
            <span className="mt-1 block text-sm font-semibold text-white">{location}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
