import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { api } from '../api.js'
import Reveal from './Reveal'

export default function FeaturedProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(() => {
    setLoading(true)
    api('/api/projects').then((rows) => {
      setProjects(Array.isArray(rows) ? rows.filter((project) => project.status === 'Published').slice(0, 3) : [])
      setError('')
    }).catch((err) => setError(err.message || 'Could not load projects.')).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load(); window.addEventListener('focus', load); return () => window.removeEventListener('focus', load) }, [load])

  return (
    <section id="featured-work" className="featured-work bg-navy-900 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="section-heading mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between" y={30}>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-electric-400">Selected work</p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">Featured Projects</h2>
          </div>
          <p className="max-w-md text-gray-400 sm:text-right">Thoughtful solutions, built with care and shaped by real problems.</p>
        </Reveal>
        {loading ? <p className="py-12 text-center text-gray-400">Loading published projects…</p> : error ? <div role="alert" className="py-10 text-center text-amber-300"><p>{error}</p><button onClick={load} className="mt-3 underline">Try again</button></div> : projects.length ? (
          <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <Reveal key={project.id} delay={index * 120} y={36}>
                <article className="project-card hover-lift group h-full overflow-hidden rounded-2xl border border-navy-600/70 bg-navy-800 transition hover:border-electric-400/50">
                  <div className="project-card__image relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-navy-700 to-navy-900">
                    {project.image ? <img src={project.image} alt={`${project.title} preview`} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <span className="text-3xl font-bold text-electric-400">&lt;/&gt;</span>}
                    <span className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-navy-900/75 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">{project.category}</span>
                  </div>
                  <div className="flex h-[calc(100%-13rem)] flex-col p-6"><h3 className="mb-2 text-xl font-semibold text-white">{project.title}</h3><p className="mb-5 line-clamp-3 text-sm leading-relaxed text-gray-400">{project.description}</p>
                    <div className="mb-5 flex flex-wrap gap-2">{(project.technologies || []).slice(0, 5).map((technology) => <span key={technology} className="rounded-md bg-electric-400/10 px-2 py-1 text-xs text-electric-400">{technology}</span>)}</div>
                    <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-navy-600/70 pt-4 text-sm">
                      <Link to={`/projects/${project.id}`} className="inline-flex items-center gap-2 font-medium text-electric-400 hover:gap-3">View project <ArrowRight size={15} /></Link>
                      {project.liveDemoUrl && <a href={project.liveDemoUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-gray-400 hover:text-white" aria-label={`Open ${project.title} live demo`}><ExternalLink size={15} /></a>}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        ) : <p className="py-10 text-center text-gray-400">No projects are published yet. Check back soon.</p>}
        <Reveal className="text-center" delay={80}><Link to="/projects" className="btn-secondary">View All Projects <ArrowRight size={16} /></Link></Reveal>
      </div>
    </section>
  )
}
