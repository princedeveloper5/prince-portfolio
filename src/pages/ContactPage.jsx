import { useEffect, useState } from 'react'
import { Mail, MapPin, Phone, Send, User } from 'lucide-react'
import { FaGithub, FaLinkedinIn, FaTwitter } from 'react-icons/fa'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { api, isOfflineError } from '../api.js'

const DEFAULTS = {
  email: 'mugishaprince@gmail.com',
  phone: '+250 788 123 456',
  location: 'Kigali, Rwanda',
}

const SOCIALS = [
  { name: 'GitHub', href: 'https://github.com/', Icon: FaGithub },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/', Icon: FaLinkedinIn },
  { name: 'Twitter', href: 'https://twitter.com/', Icon: FaTwitter },
]

const emptyForm = { name: '', email: '', message: '' }

export default function ContactPage() {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const [statusText, setStatusText] = useState('')
  const [contact, setContact] = useState(DEFAULTS)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    let cancelled = false
    api('/api/about')
      .then((data) => {
        if (cancelled || !data) return
        setContact({
          email: data.email?.trim() || DEFAULTS.email,
          phone: data.phone?.trim() || DEFAULTS.phone,
          location: data.location?.trim() || DEFAULTS.location,
        })
      })
      .catch((err) => {
        if (!isOfflineError(err)) console.warn('Contact info:', err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    if (status !== 'idle') setStatus('idle')
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Please enter your name.'
    if (!form.email.trim()) next.email = 'Please enter your email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Please enter a valid email address.'
    }
    if (!form.message.trim()) next.message = 'Please write a message.'
    return next
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const next = validate()
    if (Object.keys(next).length) {
      setErrors(next)
      setStatus('error')
      setStatusText('')
      return
    }

    setStatus('sending')
    setStatusText('')

    try {
      await api('/api/messages', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
        },
      })
      setStatus('sent')
      setStatusText('Thanks! Your message has been sent — I will get back to you soon.')
      setForm(emptyForm)
    } catch (err) {
      if (isOfflineError(err) || err.status >= 500) {
        // Backend unreachable → fall back to opening the mail app.
        const subject = encodeURIComponent(`Portfolio message from ${form.name.trim()}`)
        const body = encodeURIComponent(
          `${form.message.trim()}\n\n— ${form.name.trim()}\n${form.email.trim()}`,
        )
        window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`
        setStatus('sent')
        setStatusText('Opening your email app so you can send the message.')
        setForm(emptyForm)
      } else {
        setStatus('error')
        setStatusText(err.message || 'Could not send your message. Please try again.')
      }
    }
  }

  return (
    <div className="bg-navy-900 min-h-screen">
      <Navbar />

      <main className="pt-28 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)] gap-10 lg:gap-14 items-start">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Get In Touch</h1>
              <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-md mb-10">
                Have a project in mind or want to work together? Feel free to reach out.
              </p>

              <div className="space-y-4 mb-10">
                <ContactRow icon={Mail} label="Email" value={contact.email} href={`mailto:${contact.email}`} />
                <ContactRow icon={Phone} label="Phone" value={contact.phone} href={`tel:${contact.phone.replace(/\s/g, '')}`} />
                <ContactRow icon={MapPin} label="Location" value={contact.location} />
              </div>

              <div>
                <p className="text-white font-semibold mb-4">Follow Me</p>
                <div className="flex items-center gap-3">
                  {SOCIALS.map(({ name, href, Icon }) => (
                    <a
                      key={name}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={name}
                      className="contact-social w-11 h-11 rounded-lg bg-navy-800 border border-navy-600 text-electric-400 flex items-center justify-center transition-all duration-200 hover:border-electric-400 hover:bg-electric-400/10 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="bg-navy-800 border border-navy-600 rounded-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(56,189,248,0.06)]"
            >
              <div className="space-y-5">
                <Field
                  id="contact-name"
                  label="Name"
                  icon={User}
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={update('name')}
                  error={errors.name}
                  autoComplete="name"
                />
                <Field
                  id="contact-email"
                  label="Email"
                  icon={Mail}
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={update('email')}
                  error={errors.email}
                  autoComplete="email"
                />
                <div>
                  <label htmlFor="contact-message" className="block text-white text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={6}
                    placeholder="Your message..."
                    value={form.message}
                    onChange={update('message')}
                    aria-invalid={Boolean(errors.message)}
                    className={`contact-field w-full resize-y min-h-[140px] rounded-xl bg-navy-900 border px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all duration-200 ${
                      errors.message
                        ? 'border-red-400/70 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
                        : 'border-navy-600 focus:border-electric-400 focus:ring-2 focus:ring-electric-400/20'
                    }`}
                  />
                  {errors.message && <p className="mt-1.5 text-xs text-red-400">{errors.message}</p>}
                </div>
              </div>

              {status === 'sent' && statusText && (
                <p className="mt-4 text-sm text-electric-400" role="status">
                  {statusText}
                </p>
              )}
              {status === 'error' && statusText && (
                <p className="mt-4 text-sm text-red-400" role="alert">
                  {statusText}
                </p>
              )}

              <button type="submit" disabled={status === 'sending'} className="btn-primary w-full justify-center mt-6 disabled:opacity-60">
                {status === 'sending' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin inline-block" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function ContactRow({ icon: Icon, label, value, href }) {
  const content = (
    <>
      <div className="w-12 h-12 shrink-0 rounded-xl bg-navy-800 border border-navy-600 flex items-center justify-center text-electric-400">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-white text-sm font-semibold">{label}</p>
        <p className="text-gray-400 text-sm">{value}</p>
      </div>
    </>
  )

  if (href) {
    return (
      <a href={href} className="flex items-center gap-4 group">
        <span className="contents group-hover:[&>div:first-child]:border-electric-400/70">{content}</span>
      </a>
    )
  }

  return <div className="flex items-center gap-4">{content}</div>
}

function Field({ id, label, icon: Icon, error, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="block text-white text-sm font-medium mb-2">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          id={id}
          name={id.replace('contact-', '')}
          {...inputProps}
          aria-invalid={Boolean(error)}
          className={`contact-field w-full rounded-xl bg-navy-900 border pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all duration-200 ${
            error
              ? 'border-red-400/70 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
              : 'border-navy-600 focus:border-electric-400 focus:ring-2 focus:ring-electric-400/20'
          }`}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}
