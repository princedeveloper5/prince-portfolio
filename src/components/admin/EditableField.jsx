import { useEffect, useState } from 'react'
import { Check, Pencil, X } from 'lucide-react'

const inputClass = 'mt-2 w-full rounded-lg border border-blue-500/30 bg-[#050B18] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15'

export default function EditableField({ label, value = '', multiline = false, type = 'text', placeholder, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!editing) setDraft(value || '')
  }, [value, editing])

  const cancel = () => {
    setDraft(value || '')
    setEditing(false)
    setError('')
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await onSave(draft)
      setEditing(false)
    } catch (err) {
      setError(err.message || 'Could not save this field.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-blue-500/15 bg-[#050B18]/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          {editing ? (
            multiline
              ? <textarea rows={3} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={placeholder} className={`${inputClass} resize-y`} autoFocus />
              : <input type={type} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={placeholder} className={inputClass} autoFocus />
          ) : (
            <p className="mt-2 whitespace-pre-line break-words text-sm text-white">{value || <span className="text-slate-500">Not set</span>}</p>
          )}
        </div>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-500/25 px-2.5 py-1.5 text-xs font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-400/10" aria-label={`Edit ${label}`}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>
      {editing && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-60">
            <Check className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={cancel} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-60">
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
          {error && <p className="basis-full text-xs text-red-400" role="alert">{error}</p>}
        </div>
      )}
    </div>
  )
}
