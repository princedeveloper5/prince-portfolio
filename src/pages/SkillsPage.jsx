import { useEffect, useState } from 'react'
import { FaReact, FaJsSquare, FaHtml5, FaCss3Alt, FaNodeJs, FaGitAlt, FaGithub } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
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

const DEFAULT_SKILLS = Object.entries(LOOKUP).map(([key, meta], index) => ({
  id: index + 1,
  name: key,
  ...meta,
}))

const initials = (name) =>
  String(name)
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

function decorate(skill) {
  const meta = LOOKUP[String(skill.name || '').toLowerCase()] || {}
  return {
    id: skill.id,
    name: skill.name,
    Icon: meta.Icon ?? null,
    label: meta.label ?? initials(skill.name),
    color: meta.color ?? '#38bdf8',
    url: meta.url ?? '',
    description: skill.description || meta.description || skill.category || 'Skill',
  }
}

export default function SkillsPage() {
  const [skills, setSkills] = useState(() => DEFAULT_SKILLS.map(decorate))

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    let cancelled = false
    api('/api/skills')
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) return
        if (rows.length) setSkills(rows.map(decorate))
      })
      .catch((err) => {
        if (!isOfflineError(err)) console.warn('Skills:', err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="bg-navy-900 min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">My Skills</h1>
            <p className="text-gray-400 text-lg">Technologies and tools I work with</p>
          </div>

          <div className="bg-navy-900/60 border border-electric-400/30 rounded-2xl p-6 md:p-8 lg:p-10 shadow-[0_0_80px_rgba(56,189,248,0.08)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {skills.map((skill) => {
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
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-electric-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </>
                )

                const baseClass =
                  'group relative bg-navy-800/80 border border-navy-600 rounded-xl p-5 flex flex-col items-center text-center gap-3 transition-all duration-300 hover:border-electric-400/70 hover:shadow-[0_0_30px_rgba(56,189,248,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900'

                if (skill.url) {
                  return (
                    <a
                      key={skill.id}
                      href={skill.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={baseClass}
                      aria-label={`${skill.name} - ${skill.description}, opens official website`}
                    >
                      {card}
                    </a>
                  )
                }
                return (
                  <div key={skill.id} className={`${baseClass} cursor-default`} aria-label={`${skill.name} - ${skill.description}`}>
                    {card}
                  </div>
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
