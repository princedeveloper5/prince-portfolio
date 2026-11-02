import { motion } from 'framer-motion'
import { Folder, Code, MessageSquare, Users, Plus, Search } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, formatDate, timeAgo } from '../../api.js'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
}

function Counter({ value, duration = 2 }) {
  const [count, setCount] = useState(0)
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.]/g, '')) : value
  const suffix = typeof value === 'string' && value.includes('K') ? 'K' : ''

  useEffect(() => {
    const end = Number.isFinite(numericValue) ? Math.round(numericValue) : 0
    if (end <= 0) {
      setCount(0)
      return
    }
    let start = 0
    const frames = Math.min(60, end)
    const increment = Math.max(1, Math.ceil(end / frames))
    const stepMs = (duration * 1000) / frames
    const timer = setInterval(() => {
      start = Math.min(end, start + increment)
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, stepMs)
    return () => clearInterval(timer)
  }, [numericValue, duration])

  return <span>{count}{suffix}</span>
}

const COLORS = ['#2563EB', '#38BDF8', '#8B5CF6', '#22C55E', '#F59E0B']

const DEFAULT_ACTIVITIES = [
  { action: 'Portfolio ready', item: 'Add your first project from the Projects page', time: null, color: '#22C55E' },
]

export default function DashboardContent() {
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [recentProjects, setRecentProjects] = useState([])
  const [activities, setActivities] = useState(DEFAULT_ACTIVITIES)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('All')

  useEffect(() => {
    let cancelled = false

    const refresh = () => {
      api('/api/stats', { auth: true })
        .then((data) => { if (!cancelled && data) { setStats(data); setLoadError('') } })
        .catch((err) => { if (!cancelled) setLoadError(err.message) })
      api('/api/projects', { auth: true })
        .then((rows) => {
          if (!cancelled && Array.isArray(rows)) setRecentProjects(rows
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 20).map((p) => ({
            title: p.title,
            status: p.status || 'Draft',
            date: formatDate(p.createdAt),
          })))
        }).catch(() => {})
      api('/api/activities', { auth: true })
        .then((rows) => { if (!cancelled && Array.isArray(rows)) setActivities(rows) })
        .catch(() => {})
    }
    refresh()
    window.addEventListener('focus', refresh)

    return () => {
      cancelled = true
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const cards = [
    { icon: Folder, label: 'Total Projects', value: stats ? stats.totalProjects : 0, color: '#2563EB' },
    { icon: Code, label: 'Total Skills', value: stats ? stats.totalSkills : 0, color: '#38BDF8' },
    { icon: MessageSquare, label: 'Total Messages', value: stats ? stats.totalMessages : 0, color: '#8B5CF6' },
    { icon: Users, label: 'Total Visitors', value: stats ? stats.totalVisits : 0, color: '#22C55E' },
  ]

  const pieData = stats?.categories?.length
    ? stats.categories.map((c, i) => ({
        ...c,
        color: ['#2563EB', '#38BDF8', '#8B5CF6', '#22C55E', '#F59E0B'][i % 5],
      }))
    : []
  const lineData = (stats?.visitorTrend || []).map((row) => ({
    name: new Date(`${row.day}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }),
    visitors: Number(row.visits) || 0,
  }))
  const filteredProjects = recentProjects.filter((project) =>
    project.title.toLowerCase().includes(search.trim().toLowerCase()) &&
    (projectFilter === 'All' || project.status === projectFilter),
  )

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loadError && (
          <div className="md:col-span-2 lg:col-span-4 text-amber-300 text-sm bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2">
            {loadError}
          </div>
        )}
        {cards.map((card, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(37, 99, 235, 0.3)' }}
            className="relative group bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl p-6 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center border border-blue-400/30"
                  style={{ boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)' }}
                >
                  <card.icon className="w-6 h-6 text-cyan-400" />
                </motion.div>
                <span className="text-xs text-slate-500">Live</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                <Counter value={card.value} />
              </div>
              <div className="text-slate-400 text-sm">{card.label}</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-blue-500/20">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
              <motion.button
                onClick={() => navigate('/admin/projects/add')}
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium"
              >
                <Plus className="w-4 h-4" />
                Add New Project
              </motion.button>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search recent projects"
                  className="w-full pl-10 pr-4 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} aria-label="Filter projects by status" className="rounded-lg border border-blue-500/30 bg-[#050B18] px-3 py-2 text-slate-200">
                <option>All</option><option>Published</option><option>Draft</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-blue-500/20">
                  <th className="text-left p-4 text-slate-400 font-medium">Title</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-slate-400 text-sm">
                      {recentProjects.length ? 'No projects match these filters.' : 'No projects yet — add your first one.'}
                    </td>
                  </tr>
                )}
                {filteredProjects.map((project, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ backgroundColor: 'rgba(37, 99, 235, 0.05)', x: 4 }}
                    className="border-b border-blue-500/10 hover:border-blue-500/30 transition-all"
                  >
                    <td className="p-4 text-white font-medium">{project.title}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === 'Published'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{project.date}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Activity Timeline</h2>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div
                  className="w-2 h-2 rounded-full mt-2"
                  style={{ backgroundColor: activity.color, boxShadow: `0 0 10px ${activity.color}` }}
                ></div>
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.action}</p>
                  <p className="text-cyan-400 text-xs">{activity.item}</p>
                  <p className="text-slate-500 text-xs mt-1">{timeAgo(activity.time)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Visitor Analytics</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#08152A',
                  border: '1px solid #2563EB',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line type="monotone" dataKey="visitors" stroke="#38BDF8" strokeWidth={2} dot={{ fill: '#38BDF8', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          {lineData.length === 0 && <p className="mt-2 text-center text-xs text-slate-500">Visitor data will appear as your portfolio receives visits.</p>}
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Projects by Category</h2>
          <ResponsiveContainer width="100%" height={250}>
            {pieData.length ? <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#08152A',
                  border: '1px solid #2563EB',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart> : <div className="flex h-[250px] items-center justify-center text-sm text-slate-500">Publish projects to see category totals.</div>}
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-slate-400 text-xs">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Add Project', icon: Plus, action: () => navigate('/admin/projects/add') },
            { label: 'Add Skill', icon: Code, action: () => navigate('/admin/skills') },
            { label: 'Upload CV', icon: Folder, action: () => navigate('/admin/about') },
            { label: 'Edit Profile', icon: Users, action: () => navigate('/admin/home') },
          ].map((action, index) => (
            <motion.button
              key={index}
              onClick={action.action}
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-600/10 to-cyan-500/10 border border-blue-500/30 rounded-xl text-white hover:border-cyan-400/50 transition-all"
            >
              <action.icon className="w-6 h-6 text-cyan-400" />
              <span className="text-sm font-medium">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
