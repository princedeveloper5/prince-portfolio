import { useState } from 'react'

/**
 * Site logo (circular MP emblem). Falls back to the gradient MP badge
 * if /logo.png is missing.
 */
export default function Logo({ className = 'w-10 h-10' }) {
  const [ok, setOk] = useState(true)

  if (!ok) {
    return (
      <div
        className={`${className} shrink-0 bg-gradient-to-br from-electric-400 to-electric-600 rounded-lg flex items-center justify-center`}
      >
        <span className="text-navy-900 font-bold text-lg">MP</span>
      </div>
    )
  }

  return (
    <img
      src="/logo.png"
      alt="Mugisha Prince logo"
      className={`${className} shrink-0 rounded-full object-cover`}
      onError={() => setOk(false)}
    />
  )
}
