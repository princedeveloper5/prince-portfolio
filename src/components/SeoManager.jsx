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

export default function SeoManager() {
  const { pathname } = useLocation()
  useEffect(() => {
    let active = true
    const update = async () => {
      const [home, about] = await Promise.all([
        api('/api/home').catch(() => null),
        pathname === '/about' ? api('/api/about').catch(() => null) : Promise.resolve(null),
      ])
      if (!active) return
      const name = home?.name || 'Mugisha Prince'
      const titles = {
        '/': home?.metaTitle || `${name} | ${home?.title || 'Software Developer'}`,
        '/about': `About | ${name}`,
        '/projects': `Projects | ${name}`,
        '/skills': `Skills | ${name}`,
        '/contact': `Contact | ${name}`,
      }
      const description = pathname === '/'
        ? home?.metaDescription || home?.description || ''
        : pathname === '/about'
          ? about?.description || `Learn more about ${name}.`
          : descriptions[pathname] || `${name} portfolio.`
      const title = titles[pathname] || `${name} Portfolio`
      document.title = title
      setMeta('description', description)
      setMeta('og:title', title, true)
      setMeta('og:description', description, true)
      setMeta('og:type', 'website', true)
    }
    update()
    return () => { active = false }
  }, [pathname])
  return null
}
