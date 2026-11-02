import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20">
        <p className="text-electric-400 font-semibold tracking-widest">404</p>
        <h1 className="text-3xl md:text-5xl font-bold text-white mt-3">Page not found</h1>
        <p className="text-gray-400 mt-4">That address doesn’t match a page on this portfolio.</p>
        <Link to="/" className="btn-primary mt-8">Back to Home</Link>
      </main>
      <Footer />
    </div>
  )
}
