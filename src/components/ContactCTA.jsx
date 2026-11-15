import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import Reveal from './Reveal'

const DEFAULTS = {
  contactCtaTitle: "Have an idea? Let's build something useful.",
  contactCtaText: "I'm open to discussing projects, creative ideas, and opportunities to collaborate.",
}

export default function ContactCTA() {
  const [content, setContent] = useState(DEFAULTS)
  useEffect(() => {
    let active = true
    const load = () => api('/api/home').then((data) => {
      if (active && data) setContent({ contactCtaTitle: data.contactCtaTitle || DEFAULTS.contactCtaTitle, contactCtaText: data.contactCtaText || DEFAULTS.contactCtaText })
    }).catch(() => {})
    load()
    window.addEventListener('focus', load)
    return () => { active = false; window.removeEventListener('focus', load) }
  }, [])
  return (
    <section className="bg-gradient-to-br from-navy-900 to-navy-800 py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal className="relative overflow-hidden rounded-2xl border border-electric-400/30 bg-navy-800 p-8 md:p-12" y={40}>
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-electric-400/5 to-transparent" />
          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">{content.contactCtaTitle}</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-400">{content.contactCtaText}</p>
            <Link to="/contact" className="btn-primary">Contact Me <span>→</span></Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
