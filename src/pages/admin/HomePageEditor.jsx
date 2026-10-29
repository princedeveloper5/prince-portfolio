import { motion } from 'framer-motion'
import { Edit, Save, X, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { api, isOfflineError } from '../../api.js'

const DEFAULTS = {
  greeting: "Hello, I'm",
  name: 'Mugisha Prince',
  title: 'Software Developer',
  description: 'I build modern web applications and solve real problems with clean, efficient code. Passionate about learning, creating and growing in the tech industry.',
  profileImage: '/mugisha-prince.png',
}

export default function HomePageEditor() {
  const [editing, setEditing] = useState(false)
  const [heroData, setHeroData] = useState(DEFAULTS)
  const [imagePreview, setImagePreview] = useState(DEFAULTS.profileImage)
  const [selectedFile, setSelectedFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    let cancelled = false
    api('/api/home', { auth: true })
      .then((data) => {
        if (cancelled || !data) return
        const next = {
          greeting: data.greeting || DEFAULTS.greeting,
          name: data.name || DEFAULTS.name,
          title: data.title || DEFAULTS.title,
          description: data.description || DEFAULTS.description,
          profileImage: data.profileImage || DEFAULTS.profileImage,
        }
        setHeroData(next)
        setImagePreview(next.profileImage)
      })
      .catch((err) => setStatus(`⚠ ${err.message}`))
    return () => {
      cancelled = true
    }
  }, [])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setStatus('✗ Please select a valid image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus('✗ Image size must be less than 5MB')
      return
    }
    setSelectedFile(file)
    setImagePreview(URL.createObjectURL(file))
    setStatus('')
  }

  const handleSave = async () => {
    setSaving(true)
    setStatus('')
    try {
      const body = new FormData()
      body.append('greeting', heroData.greeting)
      body.append('name', heroData.name)
      body.append('title', heroData.title)
      body.append('description', heroData.description)
      if (selectedFile) {
        body.append('image', selectedFile)
      } else {
        body.append('profileImage', heroData.profileImage)
      }

      const updated = await api('/api/home', { method: 'PUT', auth: true, body })
      if (updated) {
        setHeroData(prev => ({ ...prev, ...updated, profileImage: updated.profileImage || prev.profileImage }))
        setImagePreview(updated.profileImage || imagePreview)
      }
      setSelectedFile(null)
      setEditing(false)
      setStatus('✓ Saved — reload the homepage to see it.')
    } catch (err) {
      setStatus(
        isOfflineError(err)
          ? `${err.message} Start it with: npm run server`
          : `✗ ${err.message}`,
      )
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setSelectedFile(null)
    setImagePreview(heroData.profileImage)
    setStatus('Changes discarded.')
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
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium text-sm disabled:opacity-60"
          >
            {editing ? <><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</> : <><Edit className="w-4 h-4" /> Edit Page</>}
          </motion.button>
        </div>

        {status && (
          <div
            className={`text-sm rounded-lg px-3 py-2 border ${
              status.startsWith('✓')
                ? 'text-green-400 bg-green-500/10 border-green-500/30'
                : status.startsWith('✗') || status.startsWith('⚠')
                  ? 'text-amber-300 bg-amber-400/10 border-amber-400/30'
                  : 'text-slate-300 bg-blue-500/10 border-blue-500/30'
            }`}
            role="status"
          >
            {status}
          </div>
        )}

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
                    onError={(e) => { e.currentTarget.src = DEFAULTS.profileImage }}
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
                  {selectedFile && (
                    <p className="text-xs text-cyan-400 mt-2">
                      New image selected: {selectedFile.name} — click Save to upload.
                    </p>
                  )}
                </div>
              </div>
            </div>
            {editing && (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-60"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm">
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
