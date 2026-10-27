import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Edit, Save, X } from 'lucide-react'
import { useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'

export default function AboutManagement() {
  const [editing, setEditing] = useState(false)
  const [aboutData, setAboutData] = useState({
    name: 'Mugisha Prince',
    title: 'Software Developer',
    description: 'Passionate software developer with expertise in building modern web applications and solving real-world problems through technology.',
    email: 'mugisha@example.com',
    phone: '+250 xxx xxx xxx',
    location: 'Rwanda'
  })

  return (
    <AdminLayout currentPage="About">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">About</h1>
            <p className="text-slate-400">Manage your about information</p>
          </div>
          <motion.button
            onClick={() => setEditing(!editing)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg"
          >
            {editing ? <><X className="w-4 h-4" /> Cancel</> : <><Edit className="w-4 h-4" /> Edit</>}
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                {editing ? (
                  <input
                    value={aboutData.name}
                    onChange={(e) => setAboutData({...aboutData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white"
                  />
                ) : (
                  <p className="text-white">{aboutData.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Title</label>
                {editing ? (
                  <input
                    value={aboutData.title}
                    onChange={(e) => setAboutData({...aboutData, title: e.target.value})}
                    className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white"
                  />
                ) : (
                  <p className="text-cyan-400">{aboutData.title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                {editing ? (
                  <textarea
                    value={aboutData.description}
                    onChange={(e) => setAboutData({...aboutData, description: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white resize-none"
                  />
                ) : (
                  <p className="text-slate-300 leading-relaxed">{aboutData.description}</p>
                )}
              </div>
              {editing && (
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Contact Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-cyan-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-400">Email</p>
                  {editing ? (
                    <input
                      value={aboutData.email}
                      onChange={(e) => setAboutData({...aboutData, email: e.target.value})}
                      className="w-full px-2 py-1 bg-[#050B18] border border-blue-500/30 rounded text-white text-sm"
                    />
                  ) : (
                    <p className="text-white">{aboutData.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-cyan-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-400">Phone</p>
                  {editing ? (
                    <input
                      value={aboutData.phone}
                      onChange={(e) => setAboutData({...aboutData, phone: e.target.value})}
                      className="w-full px-2 py-1 bg-[#050B18] border border-blue-500/30 rounded text-white text-sm"
                    />
                  ) : (
                    <p className="text-white">{aboutData.phone}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-400">Location</p>
                  {editing ? (
                    <input
                      value={aboutData.location}
                      onChange={(e) => setAboutData({...aboutData, location: e.target.value})}
                      className="w-full px-2 py-1 bg-[#050B18] border border-blue-500/30 rounded text-white text-sm"
                    />
                  ) : (
                    <p className="text-white">{aboutData.location}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  )
}
