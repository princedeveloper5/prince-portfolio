import { useEffect, useMemo, useState } from 'react'
import { FaReact, FaJsSquare, FaHtml5, FaCss3Alt, FaNodeJs, FaGitAlt, FaGithub } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'
import { api, isOfflineError } from '../api.js'

/**
 * Client-side icon/link lookup — the database stores name/category/level,
 * while icons and colours live here. Unknown skills still render nicely
 * (initials badge + category as the description).
 */
const LOOKUP = {
  react: { Icon: FaReact, color: '#61DAFB', url: 'https://react.dev/', description: 'Frontend Framework' },
  javascript: { Icon: FaJsSquare, color: '#F7DF1E', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', description: 'Programming Language' },
  html: { Icon: FaHtml5, color: '#E34F26', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML', description: 'Markup Language' },
  css: { Icon: FaCss3Alt, color: '#1572B6', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS', description: 'Styling Language' },
  'node.js': { Icon: FaNodeJs, color: '#339933', url: 'https://nodejs.org/', description: 'Backend Runtime' },
  'nodejs': { Icon: FaNodeJs, color: '#339933', url: 'https://nodejs.org/', description: 'Backend Runtime' },
  'express.js': { Icon: null, label: 'Ex', color: '#FFFFFF', url: 'https://expressjs.com/', description: 'Web Framework' },
  express: { Icon: null, label: 'Ex', color: '#FFFFFF', url: 'https://expressjs.com/', description: 'Web Framework' },
  mysql: { Icon: null, label: 'SQL', color: '#4479A1', url: 'https://www.mysql.com/', description: 'Database' },
  mongodb: { Icon: null, label: 'M', color: '#47A248', url: 'https://www.mongodb.com/', description: 'Database' },
  git: { Icon: FaGitAlt, color: '#F05032', url: 'https://git-scm.com/', description: 'Version Control' },
  github: { Icon: FaGithub, color: '#FFFFFF', url: 'https://github.com/', description: 'Code Hosting' },
  'vs code': { Icon: null, label: 'VS', color: '#007ACC', url: 'https://code.visualstudio.com/', description: 'Code Editor' },
  vscode: { Icon: null, label: 'VS', color: '#007ACC', url: 'https://code.visualstudio.com/', description: 'Code Editor' },
  figma: { Icon: null, label: 'Fg', color: '#F24E1E', url: 'https://www.figma.com/', description: 'UI/UX Design' },
}

const initials = (name) =>
  String(name)
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

function decorate(skill) {
  const meta = LOOKUP[String(skill.name || '').toLowerCase()] || {}
  const rawLevel = Number(skill.level)
  return {
    id: skill.id,
    name: skill.name,
    category: skill.category || 'Tools',
    level: Number.isFinite(rawLevel) ? Math.max(0, Math.min(100, rawLevel)) : null,
    Icon: meta.Icon ?? null,
    label: meta.label ?? initials(skill.name),
    color: meta.color ?? '#38bdf8',
    url: meta.url ?? '',
    description: skill.description || meta.description || skill.category || 'Skill',
  }
}

/** Proficiency bar — fills only once its card has been revealed. */
function LevelBar({ level, color }) {
  if (level === null) return null
  return (
    <div className="mt-1 w-full" title={`Proficiency ${level}%`}>
      <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-500">
        <span>Proficiency</span>
        <span className="text-electric-400">{level}%</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-navy-900"
        role="progressbar"
        aria-valuenow={level}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${level}% proficiency`}
      >
        <div
          className="skill-level__fill h-full rounded-full"
          style={{ '--level': `${level}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
    </div>
  )
}

export default function SkillsPage() {
  const [skills, setSkills] = useState([])
  const [loadError, setLoadError] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = () => {
      setLoadError('')
      api('/api/skills')
        .then((rows) => {
          if (cancelled || !Array.isArray(rows)) return
          setSkills(rows.map(decorate))
        })
        .catch((err) => {
          if (!cancelled) setLoadError(isOfflineError(err) ? 'Skills are temporarily unavailable. Please try again.' : err.message)
        })
    }
    load()
    window.addEventListener('focus', load)
    return () => {
      cancelled = true
      window.removeEventListener('focus', load)
    }
  }, [])

  // Categories come from the data, so adding one in the admin panel is
  // enough for it to appear here as a filter.
  const categories = useMemo(() => {
    const seen = []
    skills.forEach((skill) => {
      if (skill.category && !seen.includes(skill.category)) seen.push(skill.category)
    })
    return seen
  }, [skills])

  const visible = useMemo(
    () => (activeCategory === 'All' ? skills : skills.filter((skill) => skill.category === activeCategory)),
    [skills, activeCategory],
  )

  const retry = () => {
    setLoadError('')
    api('/api/skills')
      .then((rows) => { if (Array.isArray(rows)) setSkills(rows.map(decorate)) })
      .catch((err) => setLoadError(err.message))
  }

  return (
    <div className="bg-navy-900 min-h-screen">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-8" y={24}>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">My Skills</h1>
            <p className="text-gray-400 text-lg">Technologies and tools I work with</p>
          </Reveal>

          {/* Category filter — only shown once there is more than one. */}
          {!loadError && categories.length > 1 && (
            <Reveal className="mb-8 flex flex-wrap items-center gap-3" delay={80} y={18}>
              {['All', ...categories].map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                  className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors duration-200 ${
                    activeCategory === category
                      ? 'bg-electric-400 text-navy-900 shadow-lg shadow-electric-400/25'
                      : 'bg-navy-800 border border-navy-600 text-gray-300 hover:border-electric-400/50 hover:text-electric-400'
                  }`}
                >
                  {category}
                </button>
              ))}
              <span className="ml-auto text-sm text-gray-500" role="status">
                {visible.length} skill{visible.length === 1 ? '' : 's'}
              </span>
            </Reveal>
          )}

          <div className="bg-navy-900/60 border border-electric-400/30 rounded-2xl p-6 md:p-8 lg:p-10 shadow-[0_0_80px_rgba(56,189,248,0.08)]">
            {loadError && <div role="alert" className="mb-5 rounded-lg border border-amber-400/30 bg-amber-400/5 p-4 text-center text-amber-200"><p>{loadError}</p><button onClick={retry} className="mt-2 underline">Try again</button></div>}
            {!loadError && skills.length === 0 && <p className="py-10 text-center text-gray-400">No skills have been added yet.</p>}
            {!loadError && skills.length > 0 && visible.length === 0 && (
              <p className="py-10 text-center text-gray-400">No skills in this category yet.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {visible.map((skill, index) => {
                const Icon = skill.Icon
                const card = (
                  <>
                    <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-navy-900/60 group-hover:scale-110 transition-transform duration-300">
                      {Icon ? (
                        <Icon size={32} style={{ color: skill.color }} />
                      ) : (
                        <span className="text-sm font-bold" style={{ color: skill.color }}>{skill.label}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-base md:text-lg">{skill.name}</h3>
                      <p className="text-gray-400 text-xs md:text-sm mt-1">{skill.description}</p>
                      <p className="mt-1 inline-block rounded bg-navy-900/60 px-2 py-0.5 text-[11px] uppercase tracking-wider text-electric-400/80">
                        {skill.category}
                      </p>
                    </div>
                    <LevelBar level={skill.level} color={skill.color} />
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-electric-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </>
                )

                const baseClass =
                  'group relative hover-lift bg-navy-800/80 border border-navy-600 rounded-xl p-5 flex flex-col items-center text-center gap-3 transition-all duration-300 hover:border-electric-400/70 hover:shadow-[0_0_30px_rgba(56,189,248,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900'

                return (
                  <Reveal key={skill.id} delay={(index % 3) * 90} y={26}>
                    {skill.url ? (
                      <a
                        href={skill.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={baseClass}
                        aria-label={`${skill.name} - ${skill.description}, opens official website`}
                      >
                        {card}
                      </a>
                    ) : (
                      <div className={`${baseClass} cursor-default`} aria-label={`${skill.name} - ${skill.description}`}>
                        {card}
                      </div>
                    )}
                  </Reveal>
                )
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
