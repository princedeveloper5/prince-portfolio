import { useEffect, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import EditableField from '../../components/admin/EditableField'
import { api, isOfflineError } from '../../api.js'

const DEFAULTS = {
  greeting: "Hello, I'm",
  name: 'Mugisha Prince',
  title: 'Software Developer',
  description: 'I build modern web applications and solve real problems with clean, efficient code. Passionate about learning, creating and growing in the tech industry.',
  profileImage: '/passport-2.png',
  aboutPreviewTitle: 'Driven by Curiosity. Built Through Code.',
  aboutPreviewText: 'I enjoy turning ideas into useful, user-friendly software and continue to grow by learning and building real projects.',
  contactCtaTitle: "Have an idea? Let's build something useful.",
  contactCtaText: "I'm open to discussing projects, creative ideas, and opportunities to collaborate.",
  metaTitle: 'Mugisha Prince | Software Developer',
  metaDescription: 'Mugisha Prince is a software developer building modern web applications and useful digital products.',
}

const SECTIONS = [
  {
    title: 'Hero section',
    description: 'The introduction at the top of your homepage.',
    fields: [
      ['greeting', 'Greeting'], ['name', 'Name'], ['title', 'Professional title'],
      ['description', 'Introduction', true],
    ],
  },
  {
    title: 'Homepage content',
    description: 'The about preview and contact callout shown further down the page.',
    fields: [
      ['aboutPreviewTitle', 'About heading'], ['aboutPreviewText', 'About text', true],
      ['contactCtaTitle', 'Contact heading'], ['contactCtaText', 'Contact text', true],
    ],
  },
  {
    title: 'Search preview',
    description: 'The page title and description used in browser tabs and search results.',
    fields: [
      ['metaTitle', 'Browser and search title'], ['metaDescription', 'Search description', true],
    ],
  },
]

export default function HomePageEditor() {
  const [homeData, setHomeData] = useState(DEFAULTS)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(DEFAULTS.profileImage)
  const [savingImage, setSavingImage] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    let cancelled = false
    api('/api/home', { auth: true })
      .then((data) => {
        if (cancelled || !data) return
        const next = Object.fromEntries(Object.keys(DEFAULTS).map((field) => [field, data[field] || DEFAULTS[field]]))
        setHomeData(next)
        setImagePreview(next.profileImage)
      })
      .catch((err) => setStatus(`⚠ ${err.message}`))
    return () => { cancelled = true }
  }, [])

  const saveField = async (field, value) => {
    setStatus('')
    try {
      const body = new FormData()
      body.append(field, value)
      const updated = await api('/api/home', { method: 'PUT', auth: true, body })
      if (updated) setHomeData((previous) => ({ ...previous, [field]: updated[field] ?? value }))
      setStatus(`✓ ${field === 'metaTitle' || field === 'metaDescription' ? 'Search preview' : 'Homepage'} updated.`)
    } catch (err) {
      throw new Error(isOfflineError(err) ? `${err.message} Start it with: npm run server` : err.message)
    }
  }

  const handleImageChange = (event) => {
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
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
    setStatus('')
  }

  const saveImage = async () => {
    if (!selectedImage) return
    setSavingImage(true)
    setStatus('')
    try {
      const body = new FormData()
      body.append('image', selectedImage)
      const updated = await api('/api/home', { method: 'PUT', auth: true, body })
      const nextImage = updated?.profileImage || imagePreview
      setHomeData((previous) => ({ ...previous, profileImage: nextImage }))
      setImagePreview(nextImage)
      setSelectedImage(null)
      setStatus('✓ Profile photo updated.')
    } catch (err) {
      setStatus(isOfflineError(err) ? `⚠ ${err.message} Start it with: npm run server` : `✗ ${err.message}`)
    } finally {
      setSavingImage(false)
    }
  }

  return (
    <AdminLayout currentPage="Home page">
      <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Home page</h1>
          <p className="mt-1 text-sm text-slate-400">Choose one item to edit and save. Other homepage content stays untouched.</p>
        </div>

        {status && <div className={`rounded-lg border px-3 py-2 text-sm ${status.startsWith('✓') ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`} role="status">{status}</div>}

        <section className="rounded-2xl border border-blue-500/25 bg-[#08152A] p-4 sm:p-5" aria-labelledby="profile-photo-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img src={imagePreview} alt="Homepage profile preview" onError={(event) => { event.currentTarget.src = DEFAULTS.profileImage }} className="h-24 w-24 rounded-xl border border-blue-500/30 object-cover" />
            <div className="min-w-0 flex-1">
              <h2 id="profile-photo-heading" className="font-semibold text-white">Profile photo</h2>
              <p className="mt-1 text-sm text-slate-400">Shown in the homepage introduction. Change this item on its own.</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-500/30 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-400/10">
                  <ImagePlus className="h-4 w-4" /> Choose image
                  <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleImageChange} className="sr-only" />
                </label>
                {selectedImage && <>
                  <button type="button" onClick={saveImage} disabled={savingImage} className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{savingImage ? 'Saving…' : 'Save photo'}</button>
                  <button type="button" onClick={() => { setSelectedImage(null); setImagePreview(homeData.profileImage) }} disabled={savingImage} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300">Cancel</button>
                </>}
              </div>
              {selectedImage && <p className="mt-2 text-xs text-slate-400">{selectedImage.name} · up to 5 MB</p>}
            </div>
          </div>
        </section>

        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-2xl border border-blue-500/25 bg-[#08152A] p-4 sm:p-5" aria-labelledby={`heading-${section.title}`}>
            <div className="mb-4">
              <h2 id={`heading-${section.title}`} className="font-semibold text-white">{section.title}</h2>
              <p className="mt-1 text-xs text-slate-400">{section.description}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {section.fields.map(([field, label, multiline]) => (
                <EditableField key={field} label={label} value={homeData[field]} multiline={multiline} onSave={(value) => saveField(field, value)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </AdminLayout>
  )
}
