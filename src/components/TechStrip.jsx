import { useEffect, useState } from 'react'
import { api } from '../api.js'

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
        {skills.slice(0, 12).map((skill) => <span key={skill.id} className="rounded-full border border-electric-400/20 bg-navy-800/70 px-4 py-2 text-sm font-medium text-gray-300">{skill.name}</span>)}
      </div>
    </section>
  )
}
