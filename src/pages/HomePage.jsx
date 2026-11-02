import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Stats from '../components/Stats'
import TechStrip from '../components/TechStrip'
import AboutPreview from '../components/AboutPreview'
import FeaturedProjects from '../components/FeaturedProjects'
import ContactCTA from '../components/ContactCTA'
import Footer from '../components/Footer'
import { trackVisit } from '../api.js'

export default function HomePage() {
  useEffect(() => {
    trackVisit()
  }, [])

  return (
    <div className="bg-navy-900 min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <TechStrip />
        <AboutPreview />
        <FeaturedProjects />
        <ContactCTA />
      </main>
      <Footer />
    </div>
  )
}
