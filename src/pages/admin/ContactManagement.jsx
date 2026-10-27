import { motion } from 'framer-motion'
import { Mail, Eye, Trash2, Clock } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'

const messages = [
  { id: 1, name: 'John Doe', email: 'john@example.com', subject: 'Project Inquiry', message: 'I would like to discuss a project with you...', date: 'Apr 15, 2025', read: false },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', subject: 'Collaboration', message: 'Interested in collaborating on a project...', date: 'Apr 14, 2025', read: true },
]

export default function ContactManagement() {
  return (
    <AdminLayout currentPage="Contact">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-slate-400">Manage contact form messages</p>
        </div>

        <div className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl overflow-hidden">
          <div className="divide-y divide-blue-500/10">
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 hover:bg-blue-500/5 transition-colors ${!msg.read ? 'bg-blue-500/5' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                      <span className="text-white font-semibold">{msg.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{msg.name}</span>
                        {!msg.read && <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>}
                      </div>
                      <p className="text-sm text-cyan-400 mb-1">{msg.subject}</p>
                      <p className="text-sm text-slate-400 mb-2">{msg.message}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {msg.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {msg.date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-blue-500/10 rounded-lg text-slate-400 hover:text-white">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
