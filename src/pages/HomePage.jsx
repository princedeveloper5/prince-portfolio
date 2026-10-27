import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Stats from '../components/Stats'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <div className="bg-navy-900 min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Stats />
      </main>
      <Footer />
    </div>
  )
}
