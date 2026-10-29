import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Lock, Save, X, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { api, isOfflineError } from '../../api.js'

const SETTINGS_KEY = 'admin_settings'
const DEFAULT_SETTINGS = { notifications: true, emailAlerts: true }

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(DEFAULT_SETTINGS.notifications)
  const [emailAlerts, setEmailAlerts] = useState(DEFAULT_SETTINGS.emailAlerts)
  const [status, setStatus] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwError, setPwError] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage?.getItem(SETTINGS_KEY) || 'null')
      if (stored) {
        setNotifications(Boolean(stored.notifications))
        setEmailAlerts(Boolean(stored.emailAlerts))
      }
    } catch {
      /* ignore corrupt stored settings */
    }
  }, [])

  const handleSave = () => {
    try {
      window.localStorage?.setItem(SETTINGS_KEY, JSON.stringify({ notifications, emailAlerts }))
      setStatus('✓ Settings saved on this device.')
    } catch {
      setStatus('✗ Could not save settings (storage unavailable).')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    if (!pw.currentPassword) return setPwError('Enter your current password')
    if (pw.newPassword.length < 6) return setPwError('New password must be at least 6 characters')
    if (pw.newPassword !== pw.confirmPassword) return setPwError('New passwords do not match')

    setSavingPw(true)
    try {
      await api('/api/change-password', { method: 'POST', auth: true, body: pw })
      setShowPasswordModal(false)
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setStatus('✓ Password changed successfully.')
    } catch (err) {
      setPwError(
        isOfflineError(err)
          ? `${err.message} Start it with: npm run server`
          : err.message,
      )
    } finally {
      setSavingPw(false)
    }
  }

  const toggle = (value, setter) => () => setter(!value)

  return (
    <AdminLayout currentPage="Settings">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">Manage your admin preferences</p>
        </div>

        {status && (
          <div
            className={`text-sm rounded-lg px-3 py-2 border ${
              status.startsWith('✓')
                ? 'text-green-400 bg-green-500/10 border-green-500/30'
                : 'text-amber-300 bg-amber-400/10 border-amber-400/30'
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
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-semibold text-white">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Push Notifications</p>
                  <p className="text-sm text-slate-400">Receive notifications in dashboard</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifications}
                  aria-label="Toggle push notifications"
                  onClick={toggle(notifications, setNotifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-blue-600' : 'bg-slate-600'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Email Alerts</p>
                  <p className="text-sm text-slate-400">Get email notifications for messages</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailAlerts}
                  aria-label="Toggle email alerts"
                  onClick={toggle(emailAlerts, setEmailAlerts)}
                  className={`w-12 h-6 rounded-full transition-colors ${emailAlerts ? 'bg-blue-600' : 'bg-slate-600'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${emailAlerts ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-semibold text-white">Security</h2>
            </div>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => { setPwError(''); setShowPasswordModal(true) }}
                className="w-full text-left p-3 bg-[#050B18] border border-blue-500/30 rounded-lg hover:border-cyan-400/50 transition-colors"
              >
                <p className="text-white">Change Password</p>
                <p className="text-sm text-slate-400">Update your admin password</p>
              </button>
              <div
                className="w-full text-left p-3 bg-[#050B18] border border-blue-500/30 rounded-lg opacity-60 cursor-not-allowed"
                title="Two-factor authentication is not available in this build yet"
              >
                <p className="text-white">Two-Factor Authentication</p>
                <p className="text-sm text-slate-400">Not available yet — coming in a future update</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.button
          onClick={handleSave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium"
        >
          <Save className="w-5 h-5" />
          Save Settings
        </motion.button>
      </div>

      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/40 rounded-xl w-full max-w-md"
            >
              <div className="p-4 border-b border-blue-500/30 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Change Password</h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleChangePassword} className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-white">Current Password</label>
                  <input
                    type="password"
                    value={pw.currentPassword}
                    onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                    autoComplete="current-password"
                    className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-white">New Password</label>
                  <input
                    type="password"
                    value={pw.newPassword}
                    onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                    autoComplete="new-password"
                    className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-white">Confirm New Password</label>
                  <input
                    type="password"
                    value={pw.confirmPassword}
                    onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })}
                    autoComplete="new-password"
                    className="w-full px-3 py-2 bg-[#050B18] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
                  />
                </div>

                {pwError && (
                  <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
                    {pwError}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 px-4 py-2 bg-[#050B18] border border-blue-500/30 text-white rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPw}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {savingPw ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Update Password
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
