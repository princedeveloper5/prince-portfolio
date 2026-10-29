import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Eye, Trash2, Clock, Inbox } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { api, formatDate, isOfflineError, timeAgo } from '../../api.js'

export default function ContactManagement() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const rows = await api('/api/messages', { auth: true })
      setMessages(Array.isArray(rows) ? rows : [])
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

  const toggleRead = async (msg) => {
    const next = !msg.read
    setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, read: next } : m)))
    try {
      await api(`/api/messages/${msg.id}`, { method: 'PUT', auth: true, body: { read: next } })
    } catch (err) {
      setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, read: !next } : m)))
      alert(err.message)
    }
  }

  const handleDelete = async (msg) => {
    if (!confirm(`Delete the message from ${msg.name}?`)) return
    try {
      await api(`/api/messages/${msg.id}`, { method: 'DELETE', auth: true })
      setMessages(prev => prev.filter(m => m.id !== msg.id))
    } catch (err) {
      alert(err.message)
    }
  }

  const unreadCount = messages.filter(m => !m.read).length

  return (
    <AdminLayout currentPage="Contact">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-slate-400">
            Manage contact form messages
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>

        {error && (
          <div className="text-amber-300 text-sm bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-cyan-400 text-sm">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="p-10 text-center">
              <Inbox className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No messages yet.</p>
              <p className="text-slate-500 text-sm mt-1">
                Messages sent from the public Contact page will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-blue-500/10">
              <AnimatePresence initial={false}>
                {messages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 hover:bg-blue-500/5 transition-colors ${!msg.read ? 'bg-blue-500/5' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                          <span className="text-white font-semibold">{(msg.name || '?').charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{msg.name}</span>
                            {!msg.read && <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>}
                          </div>
                          <p className="text-sm text-cyan-400 mb-1">{msg.subject}</p>
                          <p className="text-sm text-slate-400 mb-2 whitespace-pre-line">
                            {openId === msg.id ? msg.message : `${String(msg.message || '').slice(0, 120)}${String(msg.message || '').length > 120 ? '…' : ''}`}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {msg.email}
                            </span>
                            <span className="flex items-center gap-1" title={formatDate(msg.createdAt)}>
                              <Clock className="w-3 h-3" />
                              {timeAgo(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setOpenId(openId === msg.id ? null : msg.id)
                            if (!msg.read) toggleRead(msg)
                          }}
                          title={msg.read ? 'Collapse message' : 'Read message (marks as read)'}
                          className="p-2 hover:bg-blue-500/10 rounded-lg text-slate-400 hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(msg)}
                          title="Delete message"
                          className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {msg.email && openId === msg.id && (
                      <a
                        href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || 'your message')}`}
                        className="inline-block mt-3 ml-4 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                      >
                        Reply to {msg.name}
                      </a>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
