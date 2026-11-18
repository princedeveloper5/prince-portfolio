import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import Reveal from './Reveal'

export default function TechStrip() {
  const [skills, setSkills] = useState([])
  useEffect(() => {
    let active = true
    const load = () => api('/api/skills').then((rows) => {
      if (active && Array.isArray(rows)) setSkills(rows)
    }).catch(() => {})
    load()
    window.addEventListener('focus', load)
    return () => { active = false; window.removeEventListener('focus', load) }
  }, [])
  if (!skills.length) return null
  return (
    <section aria-label="Technical skills" className="tech-strip border-y border-navy-600/30 bg-navy-900/50 py-12 sm:py-14">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[220px_1fr] lg:items-center lg:px-8">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-400">Tools I use</p><Link to="/skills" className="mt-2 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white">View all skills <span aria-hidden="true">→</span></Link></div>
        <div className="flex flex-wrap gap-2.5">
        {skills.slice(0, 12).map((skill, index) => (
          <Reveal key={skill.id} delay={index * 45} y={16}>
            <Link
              to="/skills"
              className="hover-lift block rounded-full border border-electric-400/20 bg-navy-800/70 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-electric-400/60 hover:text-white"
            >
              {skill.name}
            </Link>
          </Reveal>
        ))}
        </div>
      </div>
    </section>
  )
}
