import { useAuth } from '../AuthContext.jsx'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function AdminDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="bg-navy-900 min-h-screen">
      <Navbar />
      
      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-navy-800 border border-navy-600 rounded-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-300">
                Welcome, <span className="text-electric-400 font-semibold">{user?.name}</span>
              </p>
              <p className="text-gray-400">
                You are logged in as an administrator.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
