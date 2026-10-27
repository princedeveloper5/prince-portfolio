import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, Upload, Link, Github, ArrowLeft, FileImage, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

const availableTechnologies = [
  'React', 'Node.js', 'MySQL', 'PHP', 'Laravel', 'Dart', 'Flutter', 
  'JavaScript', 'Python', 'Tailwind CSS', 'Express', 'MongoDB', 'Firebase',
  'TypeScript', 'Next.js', 'Vue.js', 'Angular'
]

export default function AddProject() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    technologies: [],
    liveDemoUrl: '',
    githubUrl: '',
    category: 'Web Apps',
    status: 'Draft'
  })
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [techInput, setTechInput] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setErrors({...errors, image: 'Please select a valid image file'})
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors({...errors, image: 'Image size must be less than 5MB'})
      return
    }
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
    setErrors({...errors, image: null})
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

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const addTechnology = (tech) => {
    if (tech && !formData.technologies.includes(tech)) {
      setFormData({...formData, technologies: [...formData.technologies, tech]})
    }
    setTechInput('')
  }

  const removeTechnology = (techToRemove) => {
    setFormData({
      ...formData, 
      technologies: formData.technologies.filter(t => t !== techToRemove)
    })
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

  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      alert('Project saved successfully!')
      navigate('/admin/projects')
    } catch (error) {
      setErrors({ submit: 'Failed to save project. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050B18] to-[#08152A] text-white">
      <div className="border-b border-blue-500/30 bg-gradient-to-r from-[#08152A]/90 to-[#050B18]/90 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin/projects')}
                className="p-2 hover:bg-blue-500/10 rounded-xl transition-colors border border-blue-500/30"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">Add New Project</h1>
                <p className="text-sm text-slate-400">Create a new project for your portfolio</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-400/30 rounded-lg">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-cyan-400">Admin Mode</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-blue-500/20 bg-gradient-to-r from-blue-600/5 to-cyan-500/5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileImage className="w-5 h-5 text-cyan-400" />
                Project Information
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-white">Project Title <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. School Management System"
                    className="w-full px-4 py-3 bg-[#050B18] border border-blue-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  />
                  {errors.title && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><X className="w-3 h-3" />{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 bg-[#050B18] border border-blue-500/30 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Web Apps">Web Apps</option>
                    <option value="Mobile Apps">Mobile Apps</option>
                    <option value="Full Stack">Full Stack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-3 bg-[#050B18] border border-blue-500/30 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white">Description <span className="text-red-400">*</span></label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your project in detail..."
                  rows={5}
                  className="w-full px-4 py-3 bg-[#050B18] border border-blue-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all resize-none"
                />
                {errors.description && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><X className="w-3 h-3" />{errors.description}</p>}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-blue-500/20 bg-gradient-to-r from-purple-600/5 to-blue-500/5">
              <h2 className="text-lg font-semibold text-white">Technologies & Media</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Technologies Used <span className="text-red-400">*</span></label>
                <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 bg-[#050B18] border border-blue-500/30 rounded-xl">
                  {formData.technologies.length === 0 ? (
                    <span className="text-slate-500 text-sm py-1">No technologies selected</span>
                  ) : (
                    formData.technologies.map((tech) => (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        key={tech}
                        className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-400/40 text-cyan-400 rounded-lg text-sm"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => removeTechnology(tech)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))
                  )}
                </div>
                <select
                  value={techInput}
                  onChange={(e) => {
                    if (e.target.value) addTechnology(e.target.value)
                  }}
                  className="w-full px-4 py-3 bg-[#050B18] border border-blue-500/30 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">+ Add Technology</option>
                  {availableTechnologies
                    .filter(t => !formData.technologies.includes(t))
                    .map(tech => (
                      <option key={tech} value={tech}>{tech}</option>
                    ))}
                </select>
                {errors.technologies && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><X className="w-3 h-3" />{errors.technologies}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white">Project Image</label>
                {imagePreview ? (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-xl border border-blue-500/30"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <button
                        type="button"
                        onClick={removeImage}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      dragActive 
                        ? 'border-cyan-400 bg-cyan-400/5' 
                        : 'border-blue-500/30 hover:border-cyan-400/50 bg-[#050B18]'
                    }`}
                  >
                    <Upload className={`w-10 h-10 mb-3 ${dragActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="text-white font-medium mb-1">Drop image here or click to browse</span>
                    <span className="text-sm text-slate-400">PNG, JPG, JPEG, WebP (max 5MB)</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                {errors.image && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><X className="w-3 h-3" />{errors.image}</p>}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-blue-500/20 bg-gradient-to-r from-green-600/5 to-blue-500/5">
              <h2 className="text-lg font-semibold text-white">Links</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Live Demo URL</label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="url"
                    value={formData.liveDemoUrl}
                    onChange={(e) => setFormData({...formData, liveDemoUrl: e.target.value})}
                    placeholder="https://your-demo-link.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#050B18] border border-blue-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  />
                </div>
                {errors.liveDemoUrl && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><X className="w-3 h-3" />{errors.liveDemoUrl}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white">GitHub Repository URL</label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
                    placeholder="https://github.com/username/repo-name"
                    className="w-full pl-10 pr-4 py-3 bg-[#050B18] border border-blue-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  />
                </div>
                {errors.githubUrl && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><X className="w-3 h-3" />{errors.githubUrl}</p>}
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <X className="w-5 h-5" />
              {errors.submit}
            </div>
          )}

          <div className="flex items-center gap-4">
            <motion.button
              type="button"
              onClick={() => navigate('/admin/projects')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-[#08152A] border border-blue-500/30 text-white rounded-xl hover:bg-blue-500/10 transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 30px rgba(37, 99, 235, 0.6)' } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving Project...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save Project
                </>
              )}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
