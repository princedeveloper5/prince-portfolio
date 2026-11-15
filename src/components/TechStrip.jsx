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
    <section aria-label="Technical skills" className="border-y border-navy-600/30 bg-navy-900/50 py-10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 sm:px-6 lg:px-8">
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
    </section>
  )
}
