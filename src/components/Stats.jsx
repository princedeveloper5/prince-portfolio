import { useEffect, useState } from 'react'

const STATS = [
  { value: 5, suffix: '+', label: 'Projects Completed' },
  { value: 3, suffix: '+', label: 'Technologies' },
  { value: 100, suffix: '%', label: 'Commitment' },
]

function useCountUp(target, duration = 1400) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let frame
    const start = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setCount(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return count
}

function Stat({ value, suffix, label }) {
  const count = useCountUp(value)

  return (
    <div>
      <p className="text-electric-400 text-3xl md:text-4xl font-bold">
        {count}
        {suffix}
      </p>
      <p className="text-gray-400 text-sm md:text-base mt-1">{label}</p>
    </div>
  )
}

export default function Stats() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
        {STATS.map((stat) => (
          <Stat key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  )
}
