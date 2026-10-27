import { Link } from 'react-router-dom'

export default function AboutPreview() {
  return (
    <section className="py-20 bg-navy-900/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Driven by Curiosity. <span className="text-electric-400">Built Through Code.</span>
        </h2>
        <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-3xl mx-auto">
          I'm developing my software engineering skills by learning modern technologies and building practical
          software projects. I enjoy turning ideas into functional, user-friendly applications that solve
          real-world problems.
        </p>
        <Link to="/about" className="btn-secondary">
          More About Me
          <span>→</span>
        </Link>
      </div>
    </section>
  )
}
