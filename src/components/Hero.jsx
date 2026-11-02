import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, isOfflineError } from '../api.js'

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
  const [photoOk, setPhotoOk] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      api('/api/home')
        .then((data) => {
          if (cancelled || !data) return
          setContent({
            greeting: data.greeting?.trim() || DEFAULTS.greeting,
            name: data.name?.trim() || DEFAULTS.name,
            title: data.title?.trim() || DEFAULTS.title,
            description: data.description?.trim() || DEFAULTS.description,
            profileImage: resolveProfileImage(data.profileImage),
          })
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
    <section className="pt-24 sm:pt-28 pb-8 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-10 items-center">
          <div className="relative z-10 order-1">
            <h1 className="font-bold leading-tight">
              <span className="block text-3xl md:text-4xl text-white">{content.greeting}</span>
              <span className="block text-4xl md:text-6xl text-electric-400">{content.name}</span>
              <span className="block text-2xl md:text-3xl text-white font-semibold mt-2">
                {content.title}
              </span>
            </h1>

            <p className="mt-6 text-gray-400 text-lg leading-relaxed max-w-xl">{content.description}</p>

            <div className="flex flex-wrap gap-4 mt-8">
              <Link to="/projects" className="btn-primary">
                View My Projects
              </Link>
              <Link to="/contact" className="btn-secondary">
                Contact Me
              </Link>
            </div>
          </div>

          <div className="relative order-2 mx-auto w-full max-w-[250px] sm:max-w-[300px] lg:max-w-[390px] lg:justify-self-end">
            <div aria-hidden="true" className="absolute left-1/2 top-[38%] h-[62%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric-500/30 blur-[70px] sm:blur-[90px]" />
            <div aria-hidden="true" className="absolute inset-x-[12%] top-[18%] h-[55%] rounded-full bg-cyan-400/20 blur-[55px]" />
            <div className="relative mx-auto aspect-[4/5] w-full max-h-[390px]">
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
          </div>
        </div>
      </div>
    </section>
  )
}
