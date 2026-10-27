import { Link } from 'react-router-dom'

const projects = [
  {
    id: 1,
    title: 'School Management System',
    description: 'A comprehensive system for managing students, teachers, classes, and academic records efficiently.',
    tags: ['React', 'Node.js', 'MySQL', 'Express'],
    image: null,
  },
  {
    id: 2,
    title: 'Timetable Management System',
    description: 'An intelligent timetable scheduling system that optimizes class schedules and prevents conflicts.',
    tags: ['React', 'Express', 'MySQL'],
    image: null,
  },
  {
    id: 3,
    title: 'Workforce Management System',
    description: 'A complete solution for managing employees, attendance, payroll, and HR operations.',
    tags: ['React', 'Node.js', 'MySQL'],
    image: null,
  },
]

export default function FeaturedProjects() {
  return (
    <section className="py-20 bg-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Featured Projects</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            A selection of projects I've built to solve real-world problems
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-navy-800 rounded-xl border border-navy-600 overflow-hidden hover:border-electric-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-electric-400/10 group"
            >
              <div className="h-48 bg-gradient-to-br from-navy-700 to-navy-900 relative overflow-hidden">
                {project.image ? (
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-electric-400/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-electric-400 text-2xl font-bold">&lt;/&gt;</span>
                      </div>
                      <p className="text-gray-500 text-sm">Screenshot placeholder</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-electric-400 transition-colors duration-200">
                  {project.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-electric-400/10 text-electric-400 text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center text-electric-400 text-sm font-medium group-hover:gap-2 transition-all duration-200">
                  <span>View Details</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/projects" className="btn-secondary">
            View All Projects
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
