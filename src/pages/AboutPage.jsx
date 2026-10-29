import { useEffect, useState } from 'react'
import { Briefcase, Download, Mail, MapPin } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { api, isOfflineError } from '../api.js'

const DEFAULT_ABOUT = {
  name: 'Mugisha Prince',
  title: 'Software Developer',
  description:
    "I'm Mugisha Prince, a passionate software developer from Rwanda. I enjoy building web applications that solve real problems and make life easier.\n\nI'm currently learning and improving my skills in modern web technologies. I love turning ideas into real products and I'm always eager to learn something new.",
  email: 'mugishaprince@gmail.com',
  phone: '+250 788 123 456',
  location: 'Kigali, Rwanda',
}

const EXPERIENCE = '1+ year (learning & building)'

export default function AboutPage() {
  const [photoOk, setPhotoOk] = useState(true)
  const [about, setAbout] = useState(DEFAULT_ABOUT)

  useEffect(() => {
    let cancelled = false
    api('/api/about')
      .then((data) => {
        if (cancelled || !data) return
        setAbout({
          ...DEFAULT_ABOUT,
          ...Object.fromEntries(
            Object.entries({
              name: data.name,
              title: data.title,
              description: data.description,
              email: data.email,
              phone: data.phone,
              location: data.location,
            }).filter(([, v]) => v && String(v).trim()),
          ),
        })
      })
      .catch((err) => {
        if (!isOfflineError(err)) console.warn('About:', err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const paragraphs = String(about.description || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const INFO = [
    { icon: MapPin, label: 'Location', value: about.location || 'Rwanda' },
    { icon: Mail, label: 'Email', value: about.email || DEFAULT_ABOUT.email },
    { icon: Briefcase, label: 'Experience', value: EXPERIENCE },
  ]

  return (
    <div className="bg-navy-900 min-h-screen">
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left — intro */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">About Me</h1>

              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className={`text-gray-400 leading-relaxed max-w-xl ${index === 0 ? 'mb-5' : 'mb-9'}`}
                >
                  {paragraph}
                </p>
              ))}

              <div className="space-y-5 mb-9">
                {INFO.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="w-11 h-11 shrink-0 bg-navy-800 border border-navy-600 rounded-lg flex items-center justify-center text-electric-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{label}</p>
                      <p className="text-gray-400 text-sm">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CV: enabled once a real file exists in /public, otherwise clearly disabled */}
              {ABOUT_CV_URL ? (
                <a href={ABOUT_CV_URL} download className="btn-primary">
                  <Download className="w-4 h-4" />
                  Download CV
                </a>
              ) : (
                <span
                  className="btn-primary opacity-50 cursor-not-allowed pointer-events-none"
                  title="Add your CV to /public and set ABOUT_CV_URL to enable this"
                  aria-disabled="true"
                >
                  <Download className="w-4 h-4" />
                  Download CV
                </span>
              )}
            </div>

            {/* Right — portrait */}
            <div className="relative mx-auto max-w-md lg:max-w-none w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-electric-400/20 to-electric-600/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gradient-to-br from-navy-800 to-navy-900 rounded-3xl border border-navy-600 overflow-hidden">
                <div className="aspect-[4/5] relative">
                  {photoOk ? (
                    <img
                      src="/mugisha-prince.png"
                      alt={about.name || 'Mugisha Prince'}
                      className="absolute inset-0 w-full h-full object-cover"
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
      </main>

      <Footer />
    </div>
  )
}

/**
 * Set this to a file placed in /public (e.g. '/mugisha-prince-cv.pdf')
 * and the Download CV button starts working.
 */
const ABOUT_CV_URL = ''
