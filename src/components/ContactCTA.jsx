import { Link } from 'react-router-dom'

export default function ContactCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-navy-900 to-navy-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-navy-800 rounded-2xl border border-electric-400/30 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-electric-400/5 to-transparent"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Have an Idea? <span className="text-electric-400">Let's Build Something Useful.</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              I'm always open to discussing new projects, creative ideas, or opportunities to collaborate.
              Let's turn your vision into reality.
            </p>
            <Link to="/contact" className="btn-primary">
              Contact Me
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
