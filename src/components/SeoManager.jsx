import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api.js'

const descriptions = {
  '/projects': 'Explore published software projects by Mugisha Prince.',
  '/skills': 'Explore the technologies and skills used by Mugisha Prince.',
  '/contact': 'Contact Mugisha Prince about projects, collaborations, and opportunities.',
}

function setMeta(name, content, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(property ? 'property' : 'name', name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = url
}

function setStructuredData(data) {
  let script = document.getElementById('portfolio-structured-data')
  if (!data) {
    script?.remove()
    return
  }
  if (!script) {
    script = document.createElement('script')
    script.id = 'portfolio-structured-data'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(data)
}

const absoluteUrl = (value) => {
  if (!value) return ''
  try { return new URL(value, window.location.origin).href } catch { return '' }
}

export default function SeoManager() {
  const { pathname } = useLocation()

  useEffect(() => {
    let active = true
    const update = async () => {
      const projectMatch = pathname.match(/^\/projects\/([^/]+)$/)
      const [home, about, projects] = await Promise.all([
        api('/api/home').catch(() => null),
        pathname === '/' || pathname === '/about' ? api('/api/about').catch(() => null) : Promise.resolve(null),
        projectMatch ? api('/api/projects').catch(() => null) : Promise.resolve(null),
      ])
      if (!active) return

      const name = home?.name || 'Mugisha Prince'
      let projectId = projectMatch?.[1] || ''
      try { projectId = decodeURIComponent(projectId) } catch { /* Keep the raw route id for the not-found fallback. */ }
      const project = projectId
        ? projects?.find((item) => String(item.id) === projectId)
        : null
      const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')
      const isKnownPublicPage = ['/', '/about', '/projects', '/skills', '/contact'].includes(pathname)
      const isIndexable = !isAdmin && (isKnownPublicPage || Boolean(project))
      const titles = {
        '/': home?.metaTitle || `${name} | ${home?.title || 'Software Developer'}`,
        '/about': `About | ${name}`,
        '/projects': `Projects | ${name}`,
        '/skills': `Skills | ${name}`,
        '/contact': `Contact | ${name}`,
      }
      const title = project
        ? `${project.title} | ${name}`
        : titles[pathname] || (pathname === '/admin/login' ? `Admin Login | ${name}` : `${name} Portfolio`)
      const rawDescription = project
        ? project.description || `Explore ${project.title}, a software project by ${name}.`
        : pathname === '/'
          ? home?.metaDescription || home?.description || ''
          : pathname === '/about'
            ? about?.description || `Learn more about ${name}.`
            : descriptions[pathname] || `${name} portfolio.`
      const description = String(rawDescription).replace(/\s+/g, ' ').trim().slice(0, 320)
      const shareImage = absoluteUrl(project?.image || home?.profileImage || '/logo.png')
      const canonicalUrl = `${window.location.origin}${pathname}`
      const socialUrls = [about?.githubUrl, about?.linkedinUrl, about?.twitterUrl, about?.instagramUrl, about?.facebookUrl].filter(Boolean)

      document.title = title
      setMeta('description', description)
      setMeta('robots', isIndexable ? 'index, follow' : 'noindex, nofollow')
      setMeta('og:title', title, true)
      setMeta('og:description', description, true)
      setMeta('og:type', project ? 'article' : 'website', true)
      setMeta('og:url', canonicalUrl, true)
      setMeta('og:site_name', name, true)
      setMeta('og:image', shareImage, true)
      setMeta('og:image:alt', project ? `${project.title} project preview` : `${name} profile photo`, true)
      setMeta('twitter:card', 'summary_large_image')
      setMeta('twitter:title', title)
      setMeta('twitter:description', description)
      setMeta('twitter:image', shareImage)
      setCanonical(canonicalUrl)

      if (project) {
        setStructuredData({
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: project.title,
          description,
          url: canonicalUrl,
          image: shareImage,
          creator: { '@type': 'Person', name },
          keywords: (project.technologies || []).join(', '),
        })
      } else if (pathname === '/' || pathname === '/about') {
        setStructuredData({
          '@context': 'https://schema.org',
          '@type': 'Person',
          name,
          jobTitle: home?.title || 'Software Developer',
          url: window.location.origin,
          image: shareImage,
          address: about?.location ? { '@type': 'PostalAddress', addressLocality: about.location } : undefined,
          sameAs: socialUrls,
        })
      } else {
        setStructuredData(null)
      }
    }

    update()
    return () => { active = false }
  }, [pathname])

  return null
}
