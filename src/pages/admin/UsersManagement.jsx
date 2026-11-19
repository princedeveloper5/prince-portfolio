import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, Shield, Mail, Trash2, Pencil, X, Check } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { api, isOfflineError, timeAgo } from '../../api.js'
import { useAuth } from '../../AuthContext.jsx'

const emptyForm = { name: '', email: '', password: '', role: 'admin' }

/**
 * Real activity label backed by users.last_login (recorded at sign-in).
 * Falls back to "Never signed in" instead of a fake "Active" badge.
 */
function LastActive({ value }) {
  if (!value) {
    return <span className="text-slate-500 text-xs">Never signed in</span>
  }
  return (
    <span
      title={`Last sign-in: ${value}`}
      className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30"
    >
      {timeAgo(value)}
    </span>
  )
}

export default function UsersManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  // null = creating a new user; an object = editing that user.
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  // Delete failures surface here instead of a blocking alert().
  const [actionError, setActionError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const rows = await api('/api/users', { auth: true })
      setUsers(Array.isArray(rows) ? rows : [])
      setError('')
    } catch (err) {
      setError(
        isOfflineError(err)
          ? `${err.message} Start it with: npm run server`
          : err.message,
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setFormData(emptyForm)
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (user) => {
    setEditing(user)
    // Password stays blank on edit: it is only sent when you want to change it.
    setFormData({ name: user.name || '', email: user.email || '', password: '', role: user.role || 'admin' })
    setFormError('')
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const isEdit = Boolean(editing)
    if (!formData.name.trim()) return setFormError('Name is required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) return setFormError('A valid email is required')
    // New accounts always need a password; edits only when changing it.
    if ((!isEdit || formData.password) && formData.password.length < 12) {
      return setFormError('Password must be at least 12 characters')
    }

    setSaving(true)
    try {
      if (isEdit) {
        const body = { name: formData.name, email: formData.email, role: formData.role }
        if (formData.password) body.password = formData.password
        const updated = await api(`/api/users/${editing.id}`, { method: 'PUT', auth: true, body })
        setUsers(prev => prev.map(u => (u.id === editing.id ? updated : u)))
      } else {
        const created = await api('/api/users', { method: 'POST', auth: true, body: formData })
        setUsers(prev => [...prev, created])
      }
      setShowModal(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (target) => {
    setActionError('')
    if (!confirm(`Delete the account for ${target.email}?`)) return
    try {
      await api(`/api/users/${target.id}`, { method: 'DELETE', auth: true })
      setUsers(prev => prev.filter(u => u.id !== target.id))
    } catch (err) {
      setActionError(err.message)
    }
  }

  const isSelf = (user) => Boolean(currentUser && user.email === currentUser.email)

  return (
    <AdminLayout currentPage="Users">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Users</h1>
            <p className="text-slate-400">Manage admin users</p>
          </div>
          <motion.button
            onClick={openCreate}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </motion.button>
        </div>

        {error && (
          <div className="flex items-center justify-between gap-3 text-amber-300 text-sm bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2" role="alert">
            <span>{error}</span>
            <button type="button" onClick={load} disabled={loading} className="shrink-0 rounded-md border border-amber-300/30 px-2.5 py-1 text-xs font-semibold hover:bg-amber-300/10 disabled:opacity-50">
              {loading ? 'Loading…' : 'Try again'}
            </button>
          </div>
        )}
        {actionError && (
          <div className="flex items-center justify-between text-red-300 text-sm bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
            <span>{actionError}</span>
            <button type="button" onClick={() => setActionError('')} className="ml-3 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-blue-500/20">
                  <th className="text-left p-4 text-slate-400 font-medium">User</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Email</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Role</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Last active</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-cyan-400 text-sm">Loading users...</td>
                  </tr>
                )}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 text-sm">{error ? 'Users could not be loaded. Use “Try again” above.' : 'No users found.'}</td>
                  </tr>
                )}
                {users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-blue-500/10"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                          <span className="text-white font-semibold">{(user.name || '?').charAt(0)}</span>
                        </div>
                        <span className="text-white font-medium">{user.name}</span>
                        {isSelf(user) && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <span className="text-cyan-400 capitalize">{user.role}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <LastActive value={user.lastLogin} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(user)}
                          title="Edit user"
                          className="p-1.5 hover:bg-cyan-500/10 rounded-lg text-slate-400 hover:text-cyan-400"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={isSelf(user)}
                          title={
                            isSelf(user)
                              ? 'You cannot delete your own account'
                              : 'Delete user'
                          }
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
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
                <h2 className="text-lg font-bold text-white">{editing ? 'Edit User' : 'Add User'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-white">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-white">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-white">
                    {editing ? 'New Password' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editing ? 'Leave blank to keep current password' : 'At least 12 characters'}
                    autoComplete="new-password"
                    className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-white">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                  </select>
                  {editing && isSelf(editing) && (
                    <p className="text-[11px] text-slate-500 mt-1">You cannot remove your own admin role.</p>
                  )}
                </div>

                {formError && (
                  <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
                    {formError}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-[#050B18] border border-blue-500/30 text-white rounded-lg text-sm">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Check className="w-4 h-4" />}
                    {editing ? 'Save Changes' : 'Add User'}
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
