import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Share2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import { api, isOfflineError, formatDate } from '../api.js'

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'az', label: 'Title A – Z' },
  { value: 'za', label: 'Title Z – A' },
]

const ACCENTS = ['#38bdf8', '#0ea5e9', '#0284c7', '#38bdf8']

/**
 * Map one API project onto the card shape used below.
 */
function fromApi(project, index) {
  const title = String(project.title || '')
  const lower = title.toLowerCase()
  const thumb = lower.includes('timetable') || lower.includes('schedule')
    ? 'schedule'
    : lower.includes('portfolio') || lower.includes('profile')
      ? 'profile'
      : lower.includes('task')
        ? 'tasks'
        : 'rows'

  return {
    id: project.id,
    title,
    description: project.description || '',
    problem: project.problem || '',
    features: project.features || '',
    category: project.category || 'Web Apps',
    technologies: Array.isArray(project.technologies) ? project.technologies : [],
    liveDemo: project.liveDemoUrl || '',
    github: project.githubUrl || '',
    accent: ACCENTS[index % ACCENTS.length],
    thumb,
    image: project.image || '',
    date: formatDate(project.createdAt),
    createdAt: project.createdAt || '',
    status: project.status || 'Published',
  }
}

/**
 * Real uploaded screenshot when the project has one, otherwise the
 * hand-drawn placeholder. Falls back to the drawing if the file 404s.
 */
function ProjectVisual({ project }) {
  const [imageFailed, setImageFailed] = useState(false)

  if (project.image && !imageFailed) {
    return (
      <img
        src={project.image}
        alt={`${project.title} preview`}
        loading="lazy"
        className="w-full h-auto block"
        onError={() => setImageFailed(true)}
      />
    )
  }
  return (
    <ProjectThumb
      accent={project.accent}
      variant={project.thumb}
      label={`${project.title} preview`}
    />
  )
}

function ExternalLinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.2 11.19.6.11.82-.25.82-.56 0-.28-.01-1.02-.02-2-3.34.71-4.04-1.59-4.04-1.59-.55-1.36-1.33-1.72-1.33-1.72-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.77.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.83 0-1.29.47-2.34 1.24-3.17-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.21a11.6 11.6 0 013-.4c1.02 0 2.05.14 3 .4 2.29-1.53 3.3-1.21 3.3-1.21.65 1.66.24 2.88.12 3.18.77.83 1.23 1.88 1.23 3.17 0 4.53-2.8 5.53-5.48 5.82.43.36.81 1.09.81 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.22.68.83.56C20.56 21.92 24 17.5 24 12.29 24 5.78 18.63.5 12 .5z" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  )
}

/**
 * Hand-drawn "app screenshot" placeholder so each card looks like the
 * mockup without needing real image assets.
 */
function ProjectThumb({ accent, variant, label }) {
  const rows = [0, 1, 2, 3]
  const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  const tasks = [0, 1, 2, 3, 4]
  const filledScheduleCells = new Set([1, 4, 7, 11])

  return (
    <svg className="w-full h-auto block" viewBox="0 0 400 230" role="img" aria-label={label}>
      <rect x="10" y="8" width="380" height="214" rx="10" fill="#ffffff" />
      <path d="M10 18a10 10 0 0110-10h360a10 10 0 0110 10v16H10z" fill="#e8edf5" />
      <circle cx="26" cy="21" r="4" fill="#f87171" />
      <circle cx="40" cy="21" r="4" fill="#fbbf24" />
      <circle cx="54" cy="21" r="4" fill="#34d399" />

      {/* Sidebar */}
      <rect x="10" y="34" width="76" height="188" fill="#f4f7fb" />
      <rect x="22" y="48" width="34" height="8" rx="4" fill={accent} />
      <rect x="22" y="70" width="52" height="6" rx="3" fill="#d7e0ee" />
      <rect x="22" y="86" width="44" height="6" rx="3" fill="#d7e0ee" />
      <rect x="22" y="102" width="50" height="6" rx="3" fill="#d7e0ee" />
      <rect x="22" y="118" width="38" height="6" rx="3" fill="#d7e0ee" />

      {/* Page header shared by every variant */}
      <rect x="98" y="48" width="104" height="10" rx="5" fill="#c9d6e9" />
      <rect x="330" y="44" width="42" height="16" rx="8" fill={accent} />

      {variant === 'rows' &&
        rows.map((i) => (
          <g key={i}>
            <rect x="98" y={74 + i * 32} width="272" height="24" rx="6" fill="#f6f9fd" stroke="#e6edf6" />
            <circle cx="114" cy={86 + i * 32} r="7" fill={accent} opacity="0.75" />
            <rect x="130" y={80 + i * 32} width="76" height="5" rx="2.5" fill="#c9d6e9" />
            <rect x="130" y={89 + i * 32} width="50" height="4" rx="2" fill="#dde5f1" />
            <rect x="322" y={82 + i * 32} width="34" height="8" rx="4" fill="#dde5f1" />
          </g>
        ))}

      {variant === 'schedule' &&
        cells.map((i) => (
          <rect
            key={i}
            x={98 + (i % 4) * 70}
            y={70 + Math.floor(i / 4) * 46}
            width="64"
            height="40"
            rx="6"
            fill={filledScheduleCells.has(i) ? accent : '#f6f9fd'}
            opacity={filledScheduleCells.has(i) ? 0.85 : 1}
            stroke="#e6edf6"
          />
        ))}

      {variant === 'profile' && (
        <g>
          <circle cx="146" cy="126" r="34" fill={accent} opacity="0.18" />
          <circle cx="146" cy="116" r="12" fill={accent} opacity="0.8" />
          <path d="M126 148a20 20 0 0140 0z" fill={accent} opacity="0.8" />
          <rect x="200" y="88" width="118" height="10" rx="5" fill="#c9d6e9" />
          <rect x="200" y="108" width="160" height="6" rx="3" fill="#dde5f1" />
          <rect x="200" y="122" width="140" height="6" rx="3" fill="#dde5f1" />
          <rect x="200" y="144" width="54" height="18" rx="9" fill={accent} />
          <rect x="262" y="144" width="54" height="18" rx="9" fill="#dde5f1" />
          <rect x="98" y="180" width="272" height="28" rx="6" fill="#f6f9fd" stroke="#e6edf6" />
        </g>
      )}

      {variant === 'tasks' &&
        tasks.map((i) => (
          <g key={i}>
            <rect x="98" y={72 + i * 28} width="272" height="22" rx="6" fill="#f6f9fd" stroke="#e6edf6" />
            <rect x="106" y={77 + i * 28} width="12" height="12" rx="3" fill={i < 2 ? accent : '#dde5f1'} />
            <rect x="126" y={81 + i * 28} width={130 - i * 14} height="5" rx="2.5" fill={i < 2 ? '#d4deeb' : '#c9d6e9'} />
            <rect x="330" y={79 + i * 28} width="26" height="8" rx="4" fill="#dde5f1" />
          </g>
        ))}
    </svg>
  )
}

/**
 * Real anchor when a URL exists; a visibly disabled chip when it doesn't,
 * so we never show a button that leads nowhere.
 */
function ProjectLink({ href, className, children }) {
  if (href && href !== '#') {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    )
  }
  return (
    <span
      className={`${className} opacity-50 cursor-not-allowed pointer-events-none`}
      title="Link not added yet — set it from the admin panel"
      aria-disabled="true"
    >
      {children}
    </span>
  )
}

/** Full-page view for /projects/:id, including drafts opened from admin. */
function ProjectDetail({ project, notFound, loading }) {
  const [shareMessage, setShareMessage] = useState('')

  const shareProject = async () => {
    const url = new URL(`/projects/${project.id}`, window.location.origin).toString()
    try {
      if (navigator.share) {
        await navigator.share({ title: project.title, text: project.description, url })
        setShareMessage('Project shared.')
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setShareMessage('Project link copied.')
      } else {
        setShareMessage('Copy this link from your browser address bar to share the project.')
      }
    } catch (error) {
      if (error.name !== 'AbortError') setShareMessage('Could not share this project. Copy the address bar link instead.')
    }
  }

  if (loading) {
    return <p className="py-16 text-center text-gray-400">Loading project…</p>
  }

  if (notFound || !project) {
    return (
      <div className="border border-dashed border-navy-600 rounded-xl py-16 px-6 text-center">
        <span className="inline-flex items-center justify-center w-14 h-14 bg-electric-400/10 text-electric-400 rounded-2xl mb-4">
          <FolderIcon />
        </span>
        <h1 className="text-2xl font-bold text-white mb-2">Project not found</h1>
        <p className="text-gray-400 mb-6">This project does not exist or was removed.</p>
        <Link to="/projects" className="btn-secondary text-sm">← Back to all projects</Link>
      </div>
    )
  }

  const isDraft = project.status !== 'Published'

  return (
    <article className="max-w-4xl">
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-electric-400 mb-8"
      >
        ← All projects
      </Link>

      {isDraft && (
        <div role="status" className="mb-6 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          This project is still a <strong>draft</strong>, so it is hidden from the public project list.
        </div>
      )}

      <p className="text-xs uppercase tracking-widest text-electric-400 mb-3">
        {project.category}{project.date ? ` · ${project.date}` : ''}
      </p>
      <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">{project.title}</h1>

      <Reveal className="mb-8 overflow-hidden rounded-xl border border-navy-600 bg-white" y={24}>
        <ProjectVisual project={project} />
      </Reveal>

      <Reveal className="mb-8" delay={80}>
        <p className="text-lg leading-relaxed text-gray-300 whitespace-pre-line">{project.description}</p>
      </Reveal>

      {project.problem && (
        <Reveal className="mb-8" delay={120}>
          <h2 className="text-xl font-semibold text-white mb-2">The problem</h2>
          <p className="leading-relaxed text-gray-400 whitespace-pre-line">{project.problem}</p>
        </Reveal>
      )}

      {project.features && (
        <Reveal className="mb-8" delay={120}>
          <h2 className="text-xl font-semibold text-white mb-2">What it does</h2>
          <p className="leading-relaxed text-gray-400 whitespace-pre-line">{project.features}</p>
        </Reveal>
      )}

      {project.technologies.length > 0 && (
        <Reveal className="mb-8" delay={160}>
          <h2 className="text-xl font-semibold text-white mb-3">Built with</h2>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span key={tech} className="px-3 py-1.5 bg-navy-800 border border-navy-600 text-gray-300 text-sm rounded-md">
                {tech}
              </span>
            ))}
          </div>
        </Reveal>
      )}

      <Reveal className="flex flex-wrap items-center gap-3 pt-2" delay={200}>
        {project.liveDemo && (
          <ProjectLink href={project.liveDemo} className="btn-primary text-sm">
            <ExternalLinkIcon /> Live Demo
          </ProjectLink>
        )}
        {project.github && (
          <ProjectLink href={project.github} className="btn-secondary text-sm">
            <GithubIcon /> GitHub
          </ProjectLink>
        )}
        <Link to="/contact" className="btn-secondary text-sm">Discuss this project</Link>
        <button type="button" onClick={shareProject} className="btn-secondary text-sm"><Share2 className="h-4 w-4" /> Share project</button>
      </Reveal>
      {shareMessage && <p className="mt-3 text-sm text-gray-400" role="status">{shareMessage}</p>}
    </article>
  )
}

export default function ProjectsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [allProjects, setAllProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  const [sort, setSort] = useState('newest')
  const [activeFilter, setActiveFilter] = useState(() => {
    const fromUrl = searchParams.get('category')
    return fromUrl || 'All'
  })

  const load = () => {
    setLoading(true)
    setLoadError('')
    api('/api/projects')
      .then((rows) => {
        if (!Array.isArray(rows)) return
        // The detail route needs drafts too (admin opens it from the list).
        setAllProjects(rows.map(fromApi))
      })
      .catch((err) => {
        setLoadError(isOfflineError(err) ? 'Projects are temporarily unavailable. Please try again.' : err.message)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    window.addEventListener('focus', load)
    return () => window.removeEventListener('focus', load)
  }, [])

  // Detail view: scroll the new page back to the top.
  useEffect(() => {
    if (id) window.scrollTo(0, 0)
  }, [id])

  // Keep the visible filters reflected in the URL so a filtered list can be
  // shared or bookmarked (replace: no history spam while typing).
  useEffect(() => {
    if (id) return
    const next = new URLSearchParams()
    if (query.trim()) next.set('q', query.trim())
    if (activeFilter !== 'All') next.set('category', activeFilter)
    const current = searchParams.toString()
    const incoming = next.toString()
    if (current !== incoming) setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeFilter, id])

  const published = useMemo(
    () => allProjects.filter((project) => project.status === 'Published'),
    [allProjects],
  )

  const filters = useMemo(
    () => ['All', ...new Set(published.map((project) => project.category.trim()).filter(Boolean))],
    [published],
  )

  useEffect(() => {
    if (!loading && activeFilter !== 'All' && !filters.includes(activeFilter)) setActiveFilter('All')
  }, [loading, activeFilter, filters])

  const detailProject = useMemo(
    () => (id ? allProjects.find((project) => String(project.id) === String(id)) : null),
    [allProjects, id],
  )

  const projects = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = published.filter((project) => {
      const matchesCategory = activeFilter === 'All' || project.category.trim() === activeFilter
      if (!matchesCategory) return false
      if (!needle) return true
      return (
        project.title.toLowerCase().includes(needle) ||
        project.description.toLowerCase().includes(needle) ||
        project.technologies.some((tech) => tech.toLowerCase().includes(needle))
      )
    })

    const sorted = [...filtered]
    sorted.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return String(a.createdAt).localeCompare(String(b.createdAt))
        case 'az':
          return a.title.localeCompare(b.title)
        case 'za':
          return b.title.localeCompare(a.title)
        case 'newest':
        default:
          return String(b.createdAt).localeCompare(String(a.createdAt))
      }
    })
    return sorted
  }, [published, activeFilter, query, sort])

  const hasActiveSearch = query.trim() !== '' || activeFilter !== 'All'

  const clearSearch = () => {
    setQuery('')
    setActiveFilter('All')
  }

  return (
    <div className="bg-navy-900 min-h-screen">
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {id ? (
            <ProjectDetail
              project={detailProject}
              notFound={!loading && !loadError && !detailProject}
              loading={loading}
            />
          ) : (
            <>
              <Reveal y={24}>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">My Projects</h1>
                <p className="text-gray-400 max-w-2xl mb-8 leading-relaxed">
                  Here are some of the projects I have built. Each project helped me improve my skills and
                  solve real-world problems.
                </p>
              </Reveal>

              {/* Search + sort + category filter */}
              <Reveal className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" delay={80} y={20}>
                <div className="relative w-full lg:max-w-sm">
                  <label htmlFor="project-search" className="sr-only">Search projects</label>
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                    fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                  </svg>
                  <input
                    id="project-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by title, description or technology…"
                    className="w-full rounded-lg border border-navy-600 bg-navy-800 py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-electric-400/70"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-gray-500" role="status">
                    {loading ? '…' : `${projects.length} of ${published.length} project${published.length === 1 ? '' : 's'}`}
                  </span>
                  <label htmlFor="project-sort" className="sr-only">Sort projects</label>
                  <select
                    id="project-sort"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-gray-300 outline-none transition-colors focus:border-electric-400/70"
                  >
                    {SORTS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </Reveal>

              <Reveal className="mb-10 flex flex-wrap gap-3" delay={140} y={18}>
                {filters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    aria-pressed={activeFilter === filter}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      activeFilter === filter
                        ? 'bg-electric-400 text-navy-900 shadow-lg shadow-electric-400/25'
                        : 'bg-navy-800 border border-navy-600 text-gray-300 hover:border-electric-400/50 hover:text-electric-400'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </Reveal>

              {loading ? (
                <p className="py-16 text-center text-gray-400">Loading published projects…</p>
              ) : loadError ? (
                <div role="alert" className="rounded-xl border border-amber-400/30 bg-amber-400/5 px-6 py-12 text-center text-amber-200">
                  <p>{loadError}</p>
                  <button type="button" onClick={load} className="mt-3 underline">Try again</button>
                </div>
              ) : projects.length === 0 ? (
                <div className="border border-dashed border-navy-600 rounded-xl py-16 px-6 text-center">
                  <span className="inline-flex items-center justify-center w-14 h-14 bg-electric-400/10 text-electric-400 rounded-2xl mb-4">
                    <FolderIcon />
                  </span>
                  <p className="text-gray-400 mb-4">
                    {hasActiveSearch
                      ? `No projects match “${query.trim() || activeFilter}”.`
                      : 'No projects in this category yet — stay tuned!'}
                  </p>
                  {hasActiveSearch && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="text-sm text-electric-400 underline transition-colors hover:text-white"
                    >
                      Clear search and filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {projects.map((project, index) => (
                    <Reveal key={project.id} delay={(index % 2) * 100} y={34}>
                      <article className="hover-lift group h-full overflow-hidden bg-navy-800 rounded-xl border border-navy-600 transition-all duration-300 hover:border-electric-400/50 hover:shadow-xl hover:shadow-electric-400/10">
                        <div className="p-3">
                          <div className="rounded-lg border border-navy-600 overflow-hidden bg-white">
                            <ProjectVisual project={project} />
                          </div>
                        </div>

                        <div className="px-6 pb-6">
                          <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-electric-400 transition-colors duration-200">
                            {project.title}
                          </h2>
                          <p className="text-gray-400 text-sm mb-4 leading-relaxed">{project.description}</p>

                          <div className="flex flex-wrap gap-2 mb-5">
                            {project.technologies.map((tech) => (
                              <span
                                key={tech}
                                className="px-2 py-1 bg-navy-700 border border-navy-600 text-gray-300 text-xs rounded-md"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => navigate(`/projects/${project.id}`)}
                              className="btn-primary text-sm"
                            >
                              View details
                            </button>
                            {project.liveDemo && <ProjectLink href={project.liveDemo} className="btn-secondary text-sm">
                              <ExternalLinkIcon />
                              Live Demo
                            </ProjectLink>}
                            {project.github && <ProjectLink href={project.github} className="btn-secondary text-sm">
                              <GithubIcon />
                              GitHub
                            </ProjectLink>}
                          </div>
                        </div>
                      </article>
                    </Reveal>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
