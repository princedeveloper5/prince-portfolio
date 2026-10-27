export default function TechStrip() {
  const technologies = [
    { name: 'JavaScript', color: '#f7df1e', label: 'JS' },
    { name: 'React', color: '#61dafb', label: '⚛' },
    { name: 'Node.js', color: '#339933', label: 'N' },
    { name: 'Express.js', color: '#ffffff', label: 'Ex' },
    { name: 'MySQL', color: '#4479a1', label: 'SQL' },
    { name: 'Git', color: '#f05032', label: 'G' },
  ]

  return (
    <section className="py-12 bg-navy-900/50 border-y border-navy-600/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
          {technologies.map((tech) => (
            <div
              key={tech.name}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200 group"
            >
              <div className="w-6 h-6 flex items-center justify-center text-xs font-bold" style={{ color: tech.color }}>
                {tech.label}
              </div>
              <span className="text-sm font-medium">{tech.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
