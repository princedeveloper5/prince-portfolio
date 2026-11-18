import { useEffect, useState } from 'react'
import { api } from '../api.js'
import Reveal from './Reveal'

function Stat({ value, label }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let frame
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / 1000, 1)
      setCount(Math.round(value * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <div className="stat-item"><p className="text-electric-400 text-3xl md:text-4xl font-bold tabular-nums">{count}<span className="ml-1 text-xl">+</span></p><p className="mt-1 text-sm text-gray-400 md:text-base">{label}</p></div>
}

export default function Stats() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    let active = true
    const load = () => api('/api/public/stats').then((data) => { if (active) setStats(data) }).catch(() => {})
    load()
    window.addEventListener('focus', load)
    return () => { active = false; window.removeEventListener('focus', load) }
  }, [])
  if (!stats) return null
  const items = [
    { value: stats.publishedProjects, label: 'Published Projects' },
    { value: stats.totalSkills, label: 'Skills Listed' },
    { value: stats.totalVisits, label: 'Portfolio Visits' },
  ]
  return <section aria-label="Portfolio statistics" className="px-4 pb-14 sm:px-6 lg:px-8"><div className="stats-panel mx-auto grid max-w-5xl grid-cols-1 divide-y divide-navy-600/70 rounded-2xl border border-navy-600/70 bg-navy-800/60 py-6 text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">{items.map((item, index) => <Reveal key={item.label} delay={index * 110} y={22}><Stat {...item} /></Reveal>)}</div></section>
}
