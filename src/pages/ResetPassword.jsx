import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (password.length < 8) return setError('Use at least 8 characters for your password.')
    if (password !== confirm) return setError('The passwords do not match.')
    setSaving(true)
    try {
      await api('/api/password-reset/complete', { method: 'POST', body: { token, password } })
      setMessage('Your password has been changed. You can now sign in.')
      setPassword('')
      setConfirm('')
    } catch (err) {
      setError(err.message || 'This reset link is invalid or expired.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0e27] flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md bg-[#0f172a] border border-navy-600/50 rounded-xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Choose a new password</h1>
        <p className="text-gray-400 mb-6">Use at least 8 characters. Reset links expire after 30 minutes.</p>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm text-gray-300">New password<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full px-4 py-3 bg-[#0a0e27] border border-navy-600 rounded-lg text-white" /></label>
          <label className="block text-sm text-gray-300">Confirm password<input type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-2 w-full px-4 py-3 bg-[#0a0e27] border border-navy-600 rounded-lg text-white" /></label>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          {message && <p role="status" className="text-sm text-green-400">{message}</p>}
          <button type="submit" disabled={!token || saving || Boolean(message)} className="w-full py-3 bg-electric-400 text-navy-900 font-semibold rounded-lg disabled:opacity-50">{saving ? 'Updating...' : 'Update password'}</button>
        </form>
        <Link to="/admin/login" className="block mt-6 text-center text-sm text-electric-400">Back to Login</Link>
      </section>
    </main>
  )
}
