import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Filter, Edit, Trash2, Eye, X, Check } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { api, formatDate, isOfflineError } from '../../api.js'

const availableTechnologies = [
  'React', 'Node.js', 'MySQL', 'PHP', 'Laravel', 'Dart', 'Flutter',
  'JavaScript', 'Python', 'Tailwind CSS', 'Express', 'MongoDB', 'Firebase',
  'TypeScript', 'Next.js', 'Vue.js', 'Angular'
]

const emptyForm = {
  title: '',
  description: '',
  technologies: [],
  liveDemoUrl: '',
  githubUrl: '',
  category: 'Web Apps',
  status: 'Draft'
}

export default function ProjectsManagement() {
  const navigate = useNavigate()
  const location = useLocation()
  const [projects, setProjects] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  // Load real projects from the API
  useEffect(() => {
    let cancelled = false
    api('/api/projects', { auth: true })
      .then((rows) => {
        if (!cancelled && Array.isArray(rows)) setProjects(rows)
      })
      .catch((err) => {
        if (!cancelled) setListError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // /admin/projects/add opens the create modal directly
  useEffect(() => {
    if (location.pathname.endsWith('/add')) openAddModal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openAddModal = () => {
    setEditingProject(null)
    setFormData(emptyForm)
    setSelectedImage(null)
    setImagePreview(null)
    setErrors({})
    setShowAddModal(true)
  }

  const openEditModal = (project) => {
    setEditingProject(project)
    setFormData({
      title: project.title || '',
      description: project.description || '',
      technologies: project.technologies || [],
      liveDemoUrl: project.liveDemoUrl || '',
      githubUrl: project.githubUrl || '',
      category: project.category || 'Web Apps',
      status: project.status || 'Draft',
    })
    setSelectedImage(null)
    setImagePreview(project.image || null)
    setErrors({})
    setShowAddModal(true)
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingProject(null)
    setFormData(emptyForm)
    setSelectedImage(null)
    setImagePreview(null)
    setErrors({})
    if (location.pathname.endsWith('/add')) navigate('/admin/projects', { replace: true })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) processFile(file)
  }

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'Please select a valid image file' }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }))
      return
    }
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
    setErrors(prev => ({ ...prev, image: null }))
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const addTechnology = (tech) => {
    if (tech && !formData.technologies.includes(tech)) {
      setFormData(prev => ({ ...prev, technologies: [...prev.technologies, tech] }))
    }
  }

  const removeTechnology = (techToRemove) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== techToRemove)
    }))
  }

  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Project title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (formData.technologies.length === 0) newErrors.technologies = 'Select at least one technology'

    if (formData.liveDemoUrl && !isValidUrl(formData.liveDemoUrl)) {
      newErrors.liveDemoUrl = 'Please enter a valid URL'
    }
    if (formData.githubUrl && !isValidUrl(formData.githubUrl)) {
      newErrors.githubUrl = 'Please enter a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setErrors(prev => ({ ...prev, submit: null }))

    try {
      const body = new FormData()
      body.append('title', formData.title.trim())
      body.append('description', formData.description.trim())
      body.append('technologies', JSON.stringify(formData.technologies))
      body.append('liveDemoUrl', formData.liveDemoUrl.trim())
      body.append('githubUrl', formData.githubUrl.trim())
      body.append('category', formData.category)
      body.append('status', formData.status)
      if (selectedImage) body.append('image', selectedImage)

      if (editingProject) {
        const updated = await api(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          auth: true,
          body,
        })
        console.log('[E2E] PUT resolved', JSON.stringify(updated).slice(0, 80))
        setProjects(prev => prev.map(p => (p.id === editingProject.id ? updated : p)))
      } else {
        const created = await api('/api/projects', { method: 'POST', auth: true, body })
        console.log('[E2E] POST resolved')
        setProjects(prev => [created, ...prev])
      }
      setListError('')
      console.log('[E2E] before closeModal')
      closeModal()
      console.log('[E2E] after closeModal')
    } catch (error) {
      console.log('[E2E] catch', error.message)
      setErrors(prev => ({
        ...prev,
        submit: isOfflineError(error)
          ? `${error.message} Start it with: npm run server`
          : error.message,
      }))
    } finally {
      console.log('[E2E] finally, loading=false')
      setLoading(false)
    }
  }

  const handleDelete = async (project) => {
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return
    try {
      await api(`/api/projects/${project.id}`, { method: 'DELETE', auth: true })
      setProjects(prev => prev.filter(p => p.id !== project.id))
    } catch (error) {
      alert(error.message)
    }
  }

  const handleView = (project) => {
    if (project.liveDemoUrl) {
      window.open(project.liveDemoUrl, '_blank', 'noopener')
    } else {
      window.open('/#/projects', '_blank', 'noopener')
    }
  }

  return (
    <AdminLayout currentPage="Projects">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Projects</h1>
            <p className="text-sm text-slate-400">Manage your portfolio projects</p>
          </div>
          <motion.button
            onClick={openAddModal}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Project
          </motion.button>
        </div>

        {listError && (
          <div className="text-amber-300 text-sm bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2">
            {listError}
          </div>
        )}

        <div className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full pl-10 pr-4 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                title="Clear the search filter"
                className="flex items-center gap-2 px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-slate-300 hover:text-white text-sm"
              >
                <Filter className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-blue-500/20">
                  <th className="text-left p-3 text-slate-400 font-medium text-sm">Project</th>
                  <th className="text-left p-3 text-slate-400 font-medium text-sm">Category</th>
                  <th className="text-left p-3 text-slate-400 font-medium text-sm">Status</th>
                  <th className="text-left p-3 text-slate-400 font-medium text-sm">Date</th>
                  <th className="text-right p-3 text-slate-400 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 text-sm">
                      {projects.length === 0 ? 'No projects yet — add your first one.' : 'No project matches your search.'}
                    </td>
                  </tr>
                )}
                {filteredProjects.map((project, index) => (
                  <motion.tr
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ backgroundColor: 'rgba(37, 99, 235, 0.05)' }}
                    className="border-b border-blue-500/10"
                  >
                    <td className="p-3 text-white font-medium text-sm">{project.title}</td>
                    <td className="p-3 text-slate-300 text-sm">{project.category}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === 'Published'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-sm">{formatDate(project.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleView(project)}
                          title="View on the public site"
                          className="p-1.5 hover:bg-blue-500/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(project)}
                          title="Edit project"
                          className="p-1.5 hover:bg-blue-500/10 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project)}
                          title="Delete project"
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-4 border-b border-blue-500/30 flex items-center justify-between sticky top-0 bg-[#08152A]/95 backdrop-blur-xl">
                <h2 className="text-lg font-bold text-white">
                  {editingProject ? 'Edit Project' : 'Add New Project'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1 text-white">Project Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g. School Management System"
                      className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                    />
                    {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-white">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                    >
                      <option value="Web Apps">Web Apps</option>
                      <option value="Mobile Apps">Mobile Apps</option>
                      <option value="Full Stack">Full Stack</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-white">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Drafts are hidden from the public Projects page.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-white">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe your project..."
                    rows={3}
                    className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm resize-none"
                  />
                  {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-white">Technologies *</label>
                  <div className="flex flex-wrap gap-1 mb-2 min-h-[32px] p-1.5 bg-[#050B18] border border-blue-500/30 rounded-lg">
                    {formData.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 border border-blue-400/40 text-cyan-400 rounded text-xs"
                      >
                        {tech}
                        <button type="button" onClick={() => removeTechnology(tech)}>
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <select
                    onChange={(e) => { if (e.target.value) { addTechnology(e.target.value); e.target.value = ''; } }}
                    className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                  >
                    <option value="">+ Add Technology</option>
                    {availableTechnologies
                      .filter(t => !formData.technologies.includes(t))
                      .map(tech => (
                        <option key={tech} value={tech}>{tech}</option>
                      ))}
                  </select>
                  {errors.technologies && <p className="text-red-400 text-xs mt-1">{errors.technologies}</p>}
                </div>

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    dragActive ? 'border-cyan-400 bg-cyan-400/10' : 'border-blue-500/30'
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Project preview"
                        className="max-h-40 rounded-lg mx-auto border border-blue-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => { setSelectedImage(null); setImagePreview(editingProject?.image || null) }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white"
                        title="Remove selected image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">Drag & drop a screenshot here, or</p>
                  )}
                  <label className="inline-block mt-2 cursor-pointer text-cyan-400 text-sm hover:underline">
                    {imagePreview ? 'Change image' : 'browse files'}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1">PNG/JPG up to 5MB</p>
                  {errors.image && <p className="text-red-400 text-xs mt-1">{errors.image}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-white">Live Demo URL</label>
                    <input
                      type="url"
                      value={formData.liveDemoUrl}
                      onChange={(e) => setFormData({...formData, liveDemoUrl: e.target.value})}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                    />
                    {errors.liveDemoUrl && <p className="text-red-400 text-xs mt-1">{errors.liveDemoUrl}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-white">GitHub URL</label>
                    <input
                      type="url"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
                      placeholder="https://github.com/..."
                      className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                    />
                    {errors.githubUrl && <p className="text-red-400 text-xs mt-1">{errors.githubUrl}</p>}
                  </div>
                </div>

                {errors.submit && (
                  <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
                    {errors.submit}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-[#050B18] border border-blue-500/30 text-white rounded-lg hover:bg-blue-500/10 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.02 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {editingProject ? 'Update Project' : 'Save Project'}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}
