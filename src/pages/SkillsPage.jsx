import { useEffect } from 'react'
import { FaReact, FaJsSquare, FaHtml5, FaCss3Alt, FaNodeJs, FaGitAlt, FaGithub } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const skills = [
  { id: 1, name: 'React', description: 'Frontend Framework', Icon: FaReact, color: '#61DAFB', url: 'https://react.dev/' },
  { id: 2, name: 'JavaScript', description: 'Programming Language', Icon: FaJsSquare, color: '#F7DF1E', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
  { id: 3, name: 'HTML', description: 'Markup Language', Icon: FaHtml5, color: '#E34F26', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
  { id: 4, name: 'CSS', description: 'Styling Language', Icon: FaCss3Alt, color: '#1572B6', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
  { id: 5, name: 'Node.js', description: 'Backend Runtime', Icon: FaNodeJs, color: '#339933', url: 'https://nodejs.org/' },
  { id: 6, name: 'Express.js', description: 'Web Framework', Icon: null, label: 'Ex', color: '#FFFFFF', url: 'https://expressjs.com/' },
  { id: 7, name: 'MySQL', description: 'Database', Icon: null, label: 'SQL', color: '#4479A1', url: 'https://www.mysql.com/' },
  { id: 8, name: 'MongoDB', description: 'Database', Icon: null, label: 'M', color: '#47A248', url: 'https://www.mongodb.com/' },
  { id: 9, name: 'Git', description: 'Version Control', Icon: FaGitAlt, color: '#F05032', url: 'https://git-scm.com/' },
  { id: 10, name: 'GitHub', description: 'Code Hosting', Icon: FaGithub, color: '#FFFFFF', url: 'https://github.com/' },
  { id: 11, name: 'VS Code', description: 'Code Editor', Icon: null, label: 'VS', color: '#007ACC', url: 'https://code.visualstudio.com/' },
  { id: 12, name: 'Figma', description: 'UI/UX Design', Icon: null, label: 'Fg', color: '#F24E1E', url: 'https://www.figma.com/' },
]

export default function SkillsPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
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
                return (
                  <a
                    key={skill.id}
                    href={skill.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative bg-navy-800/80 border border-navy-600 rounded-xl p-5 flex flex-col items-center text-center gap-3 transition-all duration-300 hover:border-electric-400/70 hover:shadow-[0_0_30px_rgba(56,189,248,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900"
                    aria-label={`${skill.name} - ${skill.description}, opens official website`}
                  >
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
                  </a>
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
