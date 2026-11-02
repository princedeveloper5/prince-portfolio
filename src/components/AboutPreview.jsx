import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

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
    <section className="bg-navy-900/50 py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">{content.aboutPreviewTitle}</h2>
        <p className="mx-auto mb-8 max-w-3xl whitespace-pre-line text-lg leading-relaxed text-gray-400">{content.aboutPreviewText}</p>
        <Link to="/about" className="btn-secondary">More About Me <span>→</span></Link>
      </div>
    </section>
  )
}
