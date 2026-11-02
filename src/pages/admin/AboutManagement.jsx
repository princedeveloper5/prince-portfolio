import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Edit, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { api, isOfflineError } from '../../api.js'
import { SITE_CONTACT } from '../../siteConfig.js'

const DEFAULTS = {
  ...SITE_CONTACT,
  name: 'Mugisha Prince',
  title: 'Software Developer',
  description: 'Passionate software developer with expertise in building modern web applications and solving real-world problems through technology.',
  cvUrl: '', githubUrl: '', linkedinUrl: '', twitterUrl: '',
}

export default function AboutManagement() {
  const [editing, setEditing] = useState(false)
  const [aboutData, setAboutData] = useState(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  const load = () =>
    api('/api/about', { auth: true })
      .then((data) => {
        if (!data) return
        setAboutData({
          name: data.name || DEFAULTS.name,
          title: data.title || DEFAULTS.title,
          description: data.description || DEFAULTS.description,
          email: data.email || DEFAULTS.email,
          phone: data.phone || DEFAULTS.phone,
          location: data.location || DEFAULTS.location,
          cvUrl: data.cvUrl || '', githubUrl: data.githubUrl || '',
          linkedinUrl: data.linkedinUrl || '', twitterUrl: data.twitterUrl || '',
        })
      })
      .catch((err) => setStatus(`⚠ ${err.message}`))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCancel = async () => {
    setEditing(false)
    setStatus('Changes discarded.')
    await load()
  }

  const handleSave = async () => {
    setSaving(true)
    setStatus('')
    try {
      const updated = await api('/api/about', { method: 'PUT', auth: true, body: aboutData })
      if (updated) setAboutData(prev => ({ ...prev, ...updated }))
      setEditing(false)
      setStatus('✓ Saved — the public About page now shows this.')
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

  return (
    <AdminLayout currentPage="About">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">About</h1>
            <p className="text-slate-400">Manage your about information</p>
          </div>
          <motion.button
            onClick={() => (editing ? handleCancel() : setEditing(true))}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg"
          >
            {editing ? <><X className="w-4 h-4" /> Cancel</> : <><Edit className="w-4 h-4" /> Edit</>}
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
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
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
              <div className="grid grid-cols-1 gap-3 border-t border-blue-500/20 pt-4">
                <p className="text-sm font-semibold text-white">Public links</p>
                {[
                  ['cvUrl', 'CV file URL'], ['githubUrl', 'GitHub URL'],
                  ['linkedinUrl', 'LinkedIn URL'], ['twitterUrl', 'Twitter / X URL'],
                ].map(([field, label]) => (
                  <label key={field} className="block text-xs text-slate-400">
                    {label}
                    {editing ? <input type="url" value={aboutData[field] || ''} onChange={(event) => setAboutData({ ...aboutData, [field]: event.target.value })} placeholder="https://..." className="mt-1 w-full rounded border border-blue-500/30 bg-[#050B18] px-2 py-2 text-sm text-white" /> : <span className="mt-1 block break-all text-slate-300">{aboutData[field] || 'Not set'}</span>}
                  </label>
                ))}
                {editing && <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 justify-self-start rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Changes'}</button>}
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
