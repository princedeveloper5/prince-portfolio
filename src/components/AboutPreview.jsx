import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api } from '../api.js'
import Reveal from './Reveal'

const DEFAULTS = {
  aboutPreviewTitle: 'Driven by Curiosity. Built Through Code.',
  aboutPreviewText: 'I enjoy turning ideas into useful, user-friendly software and continue to grow by learning and building real projects.',
}

export default function AboutPreview() {
  const [content, setContent] = useState(DEFAULTS)
  useEffect(() => {
    let active = true
    const load = () => api('/api/home').then((data) => {
      if (active && data) setContent({ aboutPreviewTitle: data.aboutPreviewTitle || DEFAULTS.aboutPreviewTitle, aboutPreviewText: data.aboutPreviewText || DEFAULTS.aboutPreviewText })
    }).catch(() => {})
    load()
    window.addEventListener('focus', load)
    return () => { active = false; window.removeEventListener('focus', load) }
  }, [])
  return (
    <section className="about-preview bg-navy-900/50 py-20 sm:py-24">
      <Reveal className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:px-8" y={34}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-electric-400">A little about me</p>
        <div>
          <h2 className="mb-5 max-w-3xl text-3xl font-bold leading-tight text-white md:text-4xl">{content.aboutPreviewTitle}</h2>
          <p className="mb-7 max-w-3xl whitespace-pre-line text-lg leading-relaxed text-gray-400">{content.aboutPreviewText}</p>
          <Link to="/about" className="inline-flex items-center gap-2 font-semibold text-electric-400 transition hover:gap-3">More about me <ArrowRight size={17} /></Link>
        </div>
      </Reveal>
    </section>
  )
}
