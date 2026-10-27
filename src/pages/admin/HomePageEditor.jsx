import { motion, AnimatePresence } from 'framer-motion'
import { Edit, Save, X, Upload, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'

export default function HomePageEditor() {
  const [editing, setEditing] = useState(false)
  const [heroData, setHeroData] = useState({
    greeting: "Hi, I'm",
    name: "Mugisha Prince",
    title: "Software Developer",
    description: "I build modern web applications and solve real-world problems through technology.",
    profileImage: "/logo.png"
  })
  const [imagePreview, setImagePreview] = useState(heroData.profileImage)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSave = () => {
    setEditing(false)
    alert('Home page updated successfully!')
  }

  return (
    <AdminLayout currentPage="Home">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Home Page Editor</h1>
            <p className="text-sm text-slate-400">Edit homepage content and images</p>
          </div>
          <motion.button
            onClick={editing ? handleSave : () => setEditing(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium text-sm"
          >
            {editing ? <><Save className="w-4 h-4" /> Save Changes</> : <><Edit className="w-4 h-4" /> Edit Page</>}
          </motion.button>
        </div>

        <div className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-blue-500/20">
            <h2 className="text-lg font-semibold text-white">Hero Section</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-white">Greeting</label>
                  {editing ? (
                    <input
                      value={heroData.greeting}
                      onChange={(e) => setHeroData({...heroData, greeting: e.target.value})}
                      className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                    />
                  ) : (
                    <p className="text-slate-300 text-sm">{heroData.greeting}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-white">Name</label>
                  {editing ? (
                    <input
                      value={heroData.name}
                      onChange={(e) => setHeroData({...heroData, name: e.target.value})}
                      className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                    />
                  ) : (
                    <p className="text-white font-semibold text-sm">{heroData.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-white">Title</label>
                  {editing ? (
                    <input
                      value={heroData.title}
                      onChange={(e) => setHeroData({...heroData, title: e.target.value})}
                      className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                    />
                  ) : (
                    <p className="text-cyan-400 text-sm">{heroData.title}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-white">Description</label>
                  {editing ? (
                    <textarea
                      value={heroData.description}
                      onChange={(e) => setHeroData({...heroData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm resize-none"
                    />
                  ) : (
                    <p className="text-slate-400 text-sm leading-relaxed">{heroData.description}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2 text-white">Profile Image</label>
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-48 object-cover rounded-lg border border-blue-500/30"
                  />
                  {editing && (
                    <label className="absolute bottom-2 right-2 cursor-pointer">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs">
                        <Upload className="w-3 h-3" />
                        Change Image
                      </div>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>
            {editing && (
              <div className="flex gap-2">
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                  <Save className="w-4 h-4" /> Save
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm">
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
