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
    <section className="contact-cta bg-gradient-to-br from-navy-900 to-navy-800 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal className="relative overflow-hidden rounded-[1.75rem] border border-electric-400/25 bg-navy-800 p-8 text-left md:p-14" y={40}>
          <div aria-hidden="true" className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-electric-400/10 blur-3xl" />
          <div className="relative z-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-electric-400">Let’s work together</p>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">{content.contactCtaTitle}</h2>
            <p className="mb-8 max-w-2xl text-lg text-gray-400">{content.contactCtaText}</p>
            <Link to="/contact" className="btn-primary">Contact Me <span aria-hidden="true">↗</span></Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
