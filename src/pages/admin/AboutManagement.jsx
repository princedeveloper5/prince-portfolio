import { useEffect, useState } from 'react'
import { FileUp, ImagePlus } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import EditableField from '../../components/admin/EditableField'
import { api, isOfflineError } from '../../api.js'
import { SITE_CONTACT } from '../../siteConfig.js'

const DEFAULTS = {
  ...SITE_CONTACT,
  name: 'Mugisha Prince',
  title: 'Software Developer',
  experience: '1+ year (learning & building)',
  description: 'Passionate software developer with expertise in building modern web applications and solving real-world problems through technology.',
  cvUrl: '', githubUrl: '', linkedinUrl: '', twitterUrl: '', instagramUrl: '', facebookUrl: '', portraitImage: '',
}

const PROFILE_FIELDS = [
  ['name', 'Full name'], ['title', 'Professional title'], ['experience', 'Experience'],
  ['description', 'About description', true],
]
const CONTACT_FIELDS = [
  ['email', 'Email address', false, 'email'], ['phone', 'Phone'], ['location', 'Location'],
]
const SOCIAL_FIELDS = [
  ['githubUrl', 'GitHub URL'], ['linkedinUrl', 'LinkedIn URL'], ['twitterUrl', 'Twitter / X URL'],
  ['instagramUrl', 'Instagram URL'], ['facebookUrl', 'Facebook URL'],
]

export default function AboutManagement() {
  const [aboutData, setAboutData] = useState(DEFAULTS)
  const [portraitPreview, setPortraitPreview] = useState('')
  const [selectedPortrait, setSelectedPortrait] = useState(null)
  const [savingPortrait, setSavingPortrait] = useState(false)
  const [selectedCv, setSelectedCv] = useState(null)
  const [savingCv, setSavingCv] = useState(false)
  const [status, setStatus] = useState('')

  const load = () => api('/api/about', { auth: true }).then((data) => {
    if (!data) return
    const next = Object.fromEntries(Object.keys(DEFAULTS).map((field) => [field, data[field] ?? DEFAULTS[field]]))
    setAboutData(next)
    setPortraitPreview(next.portraitImage)
  }).catch((err) => setStatus(`⚠ ${err.message}`))

  useEffect(() => {
    load()
    if (window.location.hash === '#social-links') {
      window.requestAnimationFrame(() => document.getElementById('social-links')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveField = async (field, value) => {
    setStatus('')
    try {
      const body = new FormData()
      body.append(field, value)
      const updated = await api('/api/about', { method: 'PUT', auth: true, body })
      setAboutData((previous) => ({ ...previous, ...(updated || {}), [field]: value }))
      setStatus(`✓ ${field === 'instagramUrl' || field === 'facebookUrl' || field === 'githubUrl' || field === 'linkedinUrl' || field === 'twitterUrl' ? 'Social link' : 'Profile detail'} saved.`)
    } catch (err) {
      throw new Error(isOfflineError(err) ? `${err.message} Start it with: npm run server` : err.message)
    }
  }

  const choosePortrait = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type)) {
      setStatus('✗ Choose a PNG, JPEG, GIF, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus('✗ Image size must be less than 5MB.')
      return
    }
    setSelectedPortrait(file)
    setPortraitPreview(URL.createObjectURL(file))
    setStatus('')
  }

  const savePortrait = async () => {
    if (!selectedPortrait) return
    setSavingPortrait(true)
    setStatus('')
    try {
      const body = new FormData()
      body.append('image', selectedPortrait)
      const updated = await api('/api/about', { method: 'PUT', auth: true, body })
      const nextPortrait = updated?.portraitImage || portraitPreview
      setAboutData((previous) => ({ ...previous, ...(updated || {}), portraitImage: nextPortrait }))
      setPortraitPreview(nextPortrait)
      setSelectedPortrait(null)
      setStatus('✓ About portrait updated.')
    } catch (err) {
      setStatus(isOfflineError(err) ? `⚠ ${err.message} Start it with: npm run server` : `✗ ${err.message}`)
    } finally {
      setSavingPortrait(false)
    }
  }

  const chooseCv = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setStatus('✗ Choose a PDF file for your CV.')
      event.target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus('✗ CV size must be less than 10 MB.')
      event.target.value = ''
      return
    }
    setSelectedCv(file)
    setStatus('')
  }

  const saveCv = async () => {
    if (!selectedCv) return
    setSavingCv(true)
    setStatus('')
    try {
      const body = new FormData()
      body.append('cv', selectedCv)
      const result = await api('/api/about/cv', { method: 'POST', auth: true, body })
      setAboutData((previous) => ({ ...previous, cvUrl: result.cvUrl }))
      setSelectedCv(null)
      setStatus('✓ CV uploaded and published.')
    } catch (err) {
      setStatus(isOfflineError(err) ? `⚠ ${err.message} Start it with: npm run server` : `✗ ${err.message}`)
    } finally {
      setSavingCv(false)
    }
  }

  const renderFields = (fields) => fields.map(([field, label, multiline = false, type = 'text']) => (
    <EditableField key={field} label={label} value={aboutData[field]} multiline={multiline} type={type} placeholder={type === 'url' ? 'https://…' : undefined} onSave={(value) => saveField(field, value)} />
  ))

  return (
    <AdminLayout currentPage="Profile & Links">
      <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Profile & links</h1>
          <p className="mt-1 text-sm text-slate-400">Edit one detail at a time. Saving a field leaves everything else as it is.</p>
        </div>

        {status && <div className={`rounded-lg border px-3 py-2 text-sm ${status.startsWith('✓') ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`} role="status">{status}</div>}

        <section className="rounded-2xl border border-blue-500/25 bg-[#08152A] p-4 sm:p-5" aria-labelledby="about-portrait-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img src={portraitPreview || '/passport-2.png'} alt="About portrait preview" onError={(event) => { event.currentTarget.src = '/passport-2.png' }} className="h-24 w-24 rounded-xl border border-blue-500/30 object-cover" />
            <div className="min-w-0 flex-1">
              <h2 id="about-portrait-heading" className="font-semibold text-white">About portrait</h2>
              <p className="mt-1 text-sm text-slate-400">This photo is independent from the homepage profile photo.</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-500/30 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-400/10">
                  <ImagePlus className="h-4 w-4" /> Choose image
                  <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={choosePortrait} className="sr-only" />
                </label>
                {selectedPortrait && <>
                  <button type="button" onClick={savePortrait} disabled={savingPortrait} className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{savingPortrait ? 'Saving…' : 'Save photo'}</button>
                  <button type="button" onClick={() => { setSelectedPortrait(null); setPortraitPreview(aboutData.portraitImage) }} disabled={savingPortrait} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300">Cancel</button>
                </>}
              </div>
              {selectedPortrait && <p className="mt-2 text-xs text-slate-400">{selectedPortrait.name} · up to 5 MB</p>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-blue-500/25 bg-[#08152A] p-4 sm:p-5" aria-labelledby="personal-info-heading">
          <div className="mb-4"><h2 id="personal-info-heading" className="font-semibold text-white">Personal information</h2><p className="mt-1 text-xs text-slate-400">Shown on the About page.</p></div>
          <div className="grid gap-3 md:grid-cols-2">{renderFields(PROFILE_FIELDS)}</div>
        </section>

        <section className="rounded-2xl border border-blue-500/25 bg-[#08152A] p-4 sm:p-5" aria-labelledby="contact-info-heading">
          <div className="mb-4"><h2 id="contact-info-heading" className="font-semibold text-white">Contact details</h2><p className="mt-1 text-xs text-slate-400">Each update saves only the detail you edited.</p></div>
          <div className="grid gap-3 md:grid-cols-2">{renderFields(CONTACT_FIELDS)}</div>
        </section>

        <section id="social-links" className="rounded-2xl border border-blue-500/25 bg-[#08152A] p-4 sm:p-5" aria-labelledby="social-links-heading">
          <div className="mb-4"><h2 id="social-links-heading" className="font-semibold text-white">Social links</h2><p className="mt-1 text-xs text-slate-400">Add the full profile URL. Blank links stay hidden on your portfolio.</p></div>
          <div className="grid gap-3 md:grid-cols-2">{renderFields(SOCIAL_FIELDS.map(([field, label]) => [field, label, false, 'url']))}</div>
        </section>

        <section className="rounded-2xl border border-blue-500/25 bg-[#08152A] p-4 sm:p-5" aria-labelledby="cv-heading">
          <div className="mb-4"><h2 id="cv-heading" className="font-semibold text-white">CV</h2><p className="mt-1 text-xs text-slate-400">Upload a PDF up to 10 MB, or add a public link below.</p></div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-500/30 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-400/10">
              <FileUp className="h-4 w-4" /> Choose PDF
              <input type="file" accept="application/pdf,.pdf" onChange={chooseCv} className="sr-only" />
            </label>
            {selectedCv && <>
              <span className="max-w-56 truncate text-xs text-slate-400">{selectedCv.name}</span>
              <button type="button" onClick={saveCv} disabled={savingCv} className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{savingCv ? 'Uploading…' : 'Upload CV'}</button>
              <button type="button" onClick={() => setSelectedCv(null)} disabled={savingCv} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300">Cancel</button>
            </>}
            {aboutData.cvUrl && <a href={aboutData.cvUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-cyan-300 underline underline-offset-2">View current CV</a>}
          </div>
          <div className="max-w-xl">{renderFields([['cvUrl', 'CV file URL', false, 'url']])}</div>
        </section>
      </div>
    </AdminLayout>
  )
}
