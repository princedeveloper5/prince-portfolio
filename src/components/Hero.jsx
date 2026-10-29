import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, isOfflineError } from '../api.js'

const DEFAULTS = {
  greeting: "Hello, I'm",
  name: 'Mugisha Prince',
  title: 'Software Developer',
  description:
    'I build modern web applications and solve real problems with clean, efficient code. Passionate about learning, creating and growing in the tech industry.',
  profileImage: '/mugisha-prince.png',
}

export default function Hero() {
  const [content, setContent] = useState(DEFAULTS)
  const [photoOk, setPhotoOk] = useState(true)

  useEffect(() => {
    let cancelled = false
    api('/api/home')
      .then((data) => {
        if (cancelled || !data) return
        setContent({
          greeting: data.greeting?.trim() || DEFAULTS.greeting,
          name: data.name?.trim() || DEFAULTS.name,
          title: data.title?.trim() || DEFAULTS.title,
          description: data.description?.trim() || DEFAULTS.description,
          profileImage: data.profileImage || DEFAULTS.profileImage,
        })
        setPhotoOk(true)
      })
      .catch((err) => {
        // Server offline (or empty) → keep the built-in hero text.
        if (!isOfflineError(err)) console.warn('Hero content:', err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="pt-32 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
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

          <div className="relative mx-auto max-w-md lg:max-w-none w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-electric-400/25 to-electric-600/25 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-navy-800 to-navy-900 rounded-3xl border border-navy-600 overflow-hidden">
              <div className="aspect-[4/5] relative">
                {photoOk ? (
                  <img
                    src={content.profileImage || DEFAULTS.profileImage}
                    alt={content.name || 'Mugisha Prince'}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                    onError={() => setPhotoOk(false)}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-32 h-32 bg-gradient-to-br from-electric-400 to-electric-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-navy-900 text-4xl font-bold">MP</span>
                      </div>
                      <p className="text-gray-400 text-sm">Portrait placeholder</p>
                      <p className="text-gray-500 text-xs mt-1">Add your photo here</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-4 right-4 w-20 h-20 bg-electric-400/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-8 left-4 w-16 h-16 bg-electric-600/10 rounded-full blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
