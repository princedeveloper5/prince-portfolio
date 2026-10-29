import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Code, X, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { api, isOfflineError } from '../../api.js'

const CATEGORIES = ['Frontend', 'Backend', 'Database', 'Tools']

export default function SkillsManagement() {
  const [skills, setSkills] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSkill, setEditingSkill] = useState(null)
  const [formData, setFormData] = useState({ name: '', category: 'Frontend', level: 50 })
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    api('/api/skills', { auth: true })
      .then((rows) => {
        if (!cancelled && Array.isArray(rows)) setSkills(rows)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filteredSkills = skills.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openAddModal = () => {
    setEditingSkill(null)
    setFormData({ name: '', category: 'Frontend', level: 50 })
    setShowModal(true)
  }

  const openEditModal = (skill) => {
    setEditingSkill(skill)
    setFormData({ name: skill.name, category: skill.category, level: skill.level })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this skill?')) return
    try {
      await api(`/api/skills/${id}`, { method: 'DELETE', auth: true })
      setSkills((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setLoading(true)
    setLoadError('')
    try {
      if (editingSkill) {
        const updated = await api(`/api/skills/${editingSkill.id}`, {
          method: 'PUT',
          auth: true,
          body: formData,
        })
        setSkills((prev) => prev.map((s) => (s.id === editingSkill.id ? updated : s)))
      } else {
        const created = await api('/api/skills', {
          method: 'POST',
          auth: true,
          body: formData,
        })
        setSkills((prev) => [...prev, created])
      }
      setShowModal(false)
    } catch (err) {
      setLoadError(isOfflineError(err) ? `${err.message} Start it with: npm run server` : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout currentPage="Skills">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Skills</h1>
            <p className="text-sm text-slate-400">Manage your technical skills</p>
          </div>
          <motion.button
            onClick={openAddModal}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </motion.button>
        </div>

        {loadError && (
          <div className="text-amber-300 text-sm bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2">
            {loadError}
          </div>
        )}

        <div className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-blue-500/20">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search skills..."
                className="w-full pl-10 pr-4 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {filteredSkills.length === 0 && (
              <p className="text-slate-400 text-sm col-span-full text-center py-8">
                {skills.length === 0 ? 'No skills yet — add your first one.' : 'No skill matches your search.'}
              </p>
            )}
            {filteredSkills.map((skill, index) => (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="bg-[#050B18] border border-blue-500/30 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-cyan-400" />
                    <span className="text-white font-medium text-sm">{skill.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditModal(skill)} className="p-1 hover:bg-blue-500/10 rounded text-slate-400 hover:text-cyan-400">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(skill.id)} className="p-1 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mb-2">{skill.category}</div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full" 
                    style={{ width: `${skill.level}%` }}
                  ></div>
                </div>
                <div className="text-xs text-cyan-400 mt-1">{skill.level}%</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/40 rounded-xl w-full max-w-md"
            >
              <div className="p-4 border-b border-blue-500/30 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">{editingSkill ? 'Edit Skill' : 'Add Skill'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-white">Skill Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-white">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                  >
                    {CATEGORIES.includes(formData.category) || !formData.category ? null : (
                      <option value={formData.category}>{formData.category}</option>
                    )}
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-white">Proficiency Level: {formData.level}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-[#050B18] border border-blue-500/30 text-white rounded-lg text-sm">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Check className="w-4 h-4" />}
                    {editingSkill ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}
