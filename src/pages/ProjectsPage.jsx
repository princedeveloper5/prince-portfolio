import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const FILTERS = ['All', 'Web Apps', 'Mobile Apps', 'Full Stack']

const PROJECTS = [
  {
    id: 'school-management',
    title: 'School Management System',
    description: 'A complete system to manage students, teachers, classes, and subjects.',
    category: 'Web Apps',
    technologies: ['React', 'Node.js', 'MySQL'],
    liveDemo: '#',
    github: '#',
    accent: '#38bdf8',
    thumb: 'rows',
  },
  {
    id: 'timetable-management',
    title: 'Timetable Management System',
    description: 'Manage class schedules, subjects and teachers with an interactive system.',
    category: 'Web Apps',
    technologies: ['React', 'Node.js', 'MySQL'],
    liveDemo: '#',
    github: '#',
    accent: '#0ea5e9',
    thumb: 'schedule',
  },
  {
    id: 'portfolio-website',
    title: 'Portfolio Website',
    description: 'Personal portfolio website with admin panel.',
    category: 'Full Stack',
    technologies: ['React', 'Express', 'MongoDB'],
    liveDemo: '#',
    github: '#',
    accent: '#0284c7',
    thumb: 'profile',
  },
  {
    id: 'task-management',
    title: 'Task Management App',
    description: 'A simple task manager with real-time updates.',
    category: 'Web Apps',
    technologies: ['React', 'Firebase'],
    liveDemo: '#',
    github: '#',
    accent: '#38bdf8',
    thumb: 'tasks',
  },
]

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
 * mockup without needing real image assets. Swap for an <img> when you
 * have real screenshots.
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

export default function ProjectsPage() {
  const [activeFilter, setActiveFilter] = useState('All')

  const projects = PROJECTS.filter(
    (project) => activeFilter === 'All' || project.category === activeFilter,
  )

  return (
    <div className="bg-navy-900 min-h-screen">
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">My Projects</h1>
          <p className="text-gray-400 max-w-2xl mb-8 leading-relaxed">
            Here are some of the projects I have built. Each project helped me improve my skills and
            solve real-world problems.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            {FILTERS.map((filter) => (
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
          </div>

          {projects.length === 0 ? (
            <div className="border border-dashed border-navy-600 rounded-xl py-16 px-6 text-center">
              <span className="inline-flex items-center justify-center w-14 h-14 bg-electric-400/10 text-electric-400 rounded-2xl mb-4">
                <FolderIcon />
              </span>
              <p className="text-gray-400">No projects in this category yet — stay tuned!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="bg-navy-800 rounded-xl border border-navy-600 overflow-hidden hover:border-electric-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-electric-400/10 group"
                >
                  <div className="p-3">
                    <div className="rounded-lg border border-navy-600 overflow-hidden bg-white">
                      <ProjectThumb
                        accent={project.accent}
                        variant={project.thumb}
                        label={`${project.title} preview`}
                      />
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
                      <a href={project.liveDemo} target="_blank" rel="noreferrer" className="btn-primary text-sm">
                        <ExternalLinkIcon />
                        Live Demo
                      </a>
                      <a href={project.github} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
                        <GithubIcon />
                        GitHub
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
