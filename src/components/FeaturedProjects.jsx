import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

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
    <section className="bg-navy-900 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center"><h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Featured Projects</h2><p className="mx-auto max-w-2xl text-gray-400">A selection of recent work and practical projects.</p></div>
        {loading ? <p className="py-12 text-center text-gray-400">Loading published projects…</p> : error ? <div role="alert" className="py-10 text-center text-amber-300"><p>{error}</p><button onClick={load} className="mt-3 underline">Try again</button></div> : projects.length ? (
          <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => <article key={project.id} className="group overflow-hidden rounded-xl border border-navy-600 bg-navy-800 transition hover:border-electric-400/50">
              <div className="flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-navy-700 to-navy-900">
                {project.image ? <img src={project.image} alt={`${project.title} preview`} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <span className="text-3xl font-bold text-electric-400">&lt;/&gt;</span>}
              </div>
              <div className="p-6"><p className="mb-2 text-xs uppercase tracking-wide text-electric-400">{project.category}</p><h3 className="mb-2 text-xl font-semibold text-white">{project.title}</h3><p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-400">{project.description}</p>
                <div className="mb-5 flex flex-wrap gap-2">{(project.technologies || []).slice(0, 5).map((technology) => <span key={technology} className="rounded-md bg-electric-400/10 px-2 py-1 text-xs text-electric-400">{technology}</span>)}</div>
                <div className="flex gap-4 text-sm">{project.liveDemoUrl && <a href={project.liveDemoUrl} target="_blank" rel="noreferrer" className="text-electric-400 hover:underline">Live demo ↗</a>}{project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-white">Source ↗</a>}</div>
              </div>
            </article>)}
          </div>
        ) : <p className="py-10 text-center text-gray-400">No projects are published yet. Check back soon.</p>}
        <div className="text-center"><Link to="/projects" className="btn-secondary">View All Projects <span>→</span></Link></div>
      </div>
    </section>
  )
}
