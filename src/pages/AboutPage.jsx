import { useState } from 'react'
import { Briefcase, Download, Mail, MapPin } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const INFO = [
  { icon: MapPin, label: 'Location', value: 'Rwanda' },
  { icon: Mail, label: 'Email', value: 'mugishaprince@gmail.com' },
  { icon: Briefcase, label: 'Experience', value: '1+ year (learning & building)' },
]

export default function AboutPage() {
  const [photoOk, setPhotoOk] = useState(true)

  return (
    <div className="bg-navy-900 min-h-screen">
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left — intro */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">About Me</h1>

              <p className="text-gray-400 leading-relaxed mb-5 max-w-xl">
                I'm Mugisha Prince, a passionate software developer from Rwanda. I enjoy building web
                applications that solve real problems and make life easier.
              </p>
              <p className="text-gray-400 leading-relaxed mb-9 max-w-xl">
                I'm currently learning and improving my skills in modern web technologies. I love
                turning ideas into real products and I'm always eager to learn something new.
              </p>

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

              <a href="#" className="btn-primary" title="Add your CV file to enable this link">
                <Download className="w-4 h-4" />
                Download CV
              </a>
            </div>

            {/* Right — portrait */}
            <div className="relative mx-auto max-w-md lg:max-w-none w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-electric-400/20 to-electric-600/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gradient-to-br from-navy-800 to-navy-900 rounded-3xl border border-navy-600 overflow-hidden">
                <div className="aspect-[4/5] relative">
                  {photoOk ? (
                    <img
                      src="/mugisha-prince.png"
                      alt="Mugisha Prince"
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
