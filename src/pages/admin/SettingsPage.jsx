import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Lock, X, Check, Mail, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { api, isOfflineError, setToken } from '../../api.js'
import { PREFS_EVENT, readPrefs, savePrefs } from '../../adminPrefs.js'

export default function SettingsPage() {
  // Real preferences — see src/adminPrefs.js for what each one controls.
  const [prefs, setPrefs] = useState(() => readPrefs())
  const [status, setStatus] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwError, setPwError] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null)
  const [emailError, setEmailError] = useState('')
  const [testingEmail, setTestingEmail] = useState(false)
  const [testResult, setTestResult] = useState('')
  const [twoFactor, setTwoFactor] = useState(null)
  const [twoFactorChallenge, setTwoFactorChallenge] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorPassword, setTwoFactorPassword] = useState('')
  const [twoFactorBusy, setTwoFactorBusy] = useState(false)
  const [twoFactorFeedback, setTwoFactorFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    api('/api/email/status', { auth: true })
      .then((data) => { if (!cancelled) setEmailStatus(data) })
      .catch((err) => { if (!cancelled) setEmailError(isOfflineError(err) ? `${err.message} Start it with: npm run server` : err.message) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    api('/api/security/2fa', { auth: true })
      .then((data) => { if (!cancelled) setTwoFactor(data) })
      .catch((err) => { if (!cancelled) setTwoFactorFeedback(err.message) })
    return () => { cancelled = true }
  }, [])

  const startTwoFactorSetup = async () => {
    setTwoFactorBusy(true)
    setTwoFactorFeedback('')
    try {
      const result = await api('/api/security/2fa/setup', { method: 'POST', auth: true })
      setTwoFactorChallenge(result.challengeId)
      setTwoFactorFeedback(result.message)
    } catch (err) {
      setTwoFactorFeedback(err.message)
    } finally {
      setTwoFactorBusy(false)
    }
  }

  const enableTwoFactor = async (event) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(twoFactorCode)) return setTwoFactorFeedback('Enter the six-digit code from your email.')
    setTwoFactorBusy(true)
    setTwoFactorFeedback('')
    try {
      const result = await api('/api/security/2fa/enable', { method: 'POST', auth: true, body: { challengeId: twoFactorChallenge, code: twoFactorCode } })
      setToken(result.token)
      setTwoFactor((previous) => ({ ...previous, enabled: true }))
      setTwoFactorChallenge('')
      setTwoFactorCode('')
      setTwoFactorFeedback('✓ Two-factor sign-in is enabled for this account.')
    } catch (err) {
      setTwoFactorFeedback(err.message)
    } finally {
      setTwoFactorBusy(false)
    }
  }

  const disableTwoFactor = async (event) => {
    event.preventDefault()
    setTwoFactorBusy(true)
    setTwoFactorFeedback('')
    try {
      const result = await api('/api/security/2fa/disable', { method: 'POST', auth: true, body: { password: twoFactorPassword } })
      setToken(result.token)
      setTwoFactor((previous) => ({ ...previous, enabled: false }))
      setTwoFactorPassword('')
      setTwoFactorFeedback('✓ Two-factor sign-in has been disabled.')
    } catch (err) {
      setTwoFactorFeedback(err.message)
    } finally {
      setTwoFactorBusy(false)
    }
  }

  const handleTestEmail = async () => {
    setTestingEmail(true)
    setTestResult('')
    setEmailError('')
    try {
      const result = await api('/api/email/test', { method: 'POST', auth: true })
      setTestResult(`✓ Test email sent to ${result.to}. Check that inbox (and its Spam folder).`)
    } catch (err) {
      setEmailError(isOfflineError(err) ? `${err.message} Start it with: npm run server` : err.message)
    } finally {
      setTestingEmail(false)
    }
  }

  useEffect(() => {
    const sync = (event) => setPrefs(event.detail || readPrefs())
    window.addEventListener(PREFS_EVENT, sync)
    return () => window.removeEventListener(PREFS_EVENT, sync)
  }, [])

  // Each toggle saves immediately — no fake "Save" button that only
  // writes to this browser without affecting anything else.
  const toggle = (key, label) => () => {
    const next = savePrefs({ [key]: !prefs[key] })
    setPrefs(next)
    setStatus(`✓ ${label} ${next[key] ? 'enabled' : 'disabled'} on this device.`)
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    if (!pw.currentPassword) return setPwError('Enter your current password')
    if (pw.newPassword.length < 12) return setPwError('New password must be at least 12 characters')
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

  return (    <AdminLayout currentPage="Settings">
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
              <h2 className="text-xl font-semibold text-white">Preferences</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Unread message badge</p>
                  <p className="text-sm text-slate-400">Shows the red count on “Messages” and the bell dot in the admin header.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs.unreadBadge}
                  aria-label="Toggle unread message badge"
                  onClick={toggle('unreadBadge', 'Unread message badge')}
                  className={`w-12 h-6 shrink-0 rounded-full transition-colors ${prefs.unreadBadge ? 'bg-blue-600' : 'bg-slate-600'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${prefs.unreadBadge ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Reduce motion</p>
                  <p className="text-sm text-slate-400">Turns off interface animations site-wide on this device.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs.reduceMotion}
                  aria-label="Toggle reduced motion"
                  onClick={toggle('reduceMotion', 'Reduce motion')}
                  className={`w-12 h-6 shrink-0 rounded-full transition-colors ${prefs.reduceMotion ? 'bg-blue-600' : 'bg-slate-600'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${prefs.reduceMotion ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>
              <p className="text-xs text-slate-500">Changes apply immediately and are saved on this device.</p>
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
              <div className="rounded-lg border border-blue-500/30 bg-[#050B18] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">Email two-factor sign-in</p>
                    <p className="mt-1 text-sm text-slate-400">Require a one-time code after your password.</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${twoFactor?.enabled ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-slate-600 bg-slate-700/50 text-slate-300'}`}>
                    {twoFactor ? (twoFactor.enabled ? 'Enabled' : 'Disabled') : 'Checking…'}
                  </span>
                </div>
                {twoFactorFeedback && <p className={`mt-3 text-sm ${twoFactorFeedback.startsWith('✓') ? 'text-emerald-300' : 'text-amber-200'}`} role="status" aria-live="polite">{twoFactorFeedback}</p>}
                {twoFactor && !twoFactor.enabled && !twoFactorChallenge && <div className="mt-3">
                  <button type="button" onClick={startTwoFactorSetup} disabled={twoFactorBusy || !twoFactor.emailConfigured} className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50">{twoFactorBusy ? 'Sending code…' : 'Enable two-factor sign-in'}</button>
                  <p className="mt-2 text-xs text-slate-500">A code will be sent to {twoFactor.email}. {!twoFactor.emailConfigured && 'Email delivery is not configured on the server yet.'}</p>
                </div>}
                {twoFactorChallenge && <form onSubmit={enableTwoFactor} className="mt-3 space-y-3">
                  <label htmlFor="two-factor-code" className="block text-sm font-medium text-slate-200">Enter the six-digit code</label>
                  <input id="two-factor-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full max-w-xs rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-lg tracking-[0.3em] text-white focus:border-cyan-400 focus:outline-none" />
                  <div className="flex gap-2"><button type="submit" disabled={twoFactorBusy} className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{twoFactorBusy ? 'Verifying…' : 'Verify and enable'}</button><button type="button" onClick={() => { setTwoFactorChallenge(''); setTwoFactorCode(''); setTwoFactorFeedback('') }} className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200">Cancel</button></div>
                </form>}
                {twoFactor?.enabled && <form onSubmit={disableTwoFactor} className="mt-3 space-y-3">
                  <label htmlFor="disable-two-factor-password" className="block text-sm font-medium text-slate-200">Confirm your password to disable</label>
                  <div className="flex flex-col gap-2 sm:flex-row"><input id="disable-two-factor-password" type="password" autoComplete="current-password" required value={twoFactorPassword} onChange={(event) => setTwoFactorPassword(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none" /><button type="submit" disabled={twoFactorBusy} className="rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/10 disabled:opacity-50">{twoFactorBusy ? 'Updating…' : 'Disable'}</button></div>
                </form>}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-[#08152A] to-[#050B18] border border-blue-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">Email notifications</h2>
            {emailStatus && (
              <span
                className={`ml-auto text-xs px-2 py-1 rounded-full border ${
                  emailStatus.configured
                    ? 'text-green-400 bg-green-500/10 border-green-500/30'
                    : 'text-amber-300 bg-amber-400/10 border-amber-400/30'
                }`}
              >
                {emailStatus.configured ? 'Configured' : 'Not configured'}
              </span>
            )}
          </div>

          {emailError && (
            <div className="text-sm text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2 mb-4" role="alert">
              {emailError}
            </div>
          )}
          {testResult && (
            <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 mb-4" role="status">
              {testResult}
            </div>
          )}

          {emailStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-[#050B18] border border-blue-500/30 rounded-lg">
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Notify inbox</p>
                  <p className="text-white mt-1 break-all">{emailStatus.contactTo || 'Not set (CONTACT_TO missing)'}</p>
                </div>
                <div className="p-3 bg-[#050B18] border border-blue-500/30 rounded-lg">
                  <p className="text-slate-400 text-xs uppercase tracking-wide">SMTP server</p>
                  <p className="text-white mt-1">
                    {emailStatus.host
                      ? `${emailStatus.host}:${emailStatus.port}${emailStatus.secure ? ' (SSL)' : ''}`
                      : 'Not set (SMTP_HOST missing)'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                When configured, every contact-form submission and password reset sends an
                email to the inbox above. Credentials live in the git-ignored <code className="text-cyan-400">.env</code> file.
              </p>
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingEmail || !emailStatus.configured}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingEmail ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {testingEmail ? 'Sending…' : 'Send test email'}
              </button>
              {!emailStatus.configured && (
                <p className="text-xs text-slate-500">
                  Copy <code className="text-cyan-400">.env.example</code> to <code className="text-cyan-400">.env</code>,
                  fill in your Gmail address and app password, then restart the server.
                </p>
              )}
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-slate-400"
        >
          Preferences are stored locally in this browser. Content, projects and
          accounts are saved on the server.
        </motion.div>
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
                    minLength={12}
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
                    minLength={12}
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
