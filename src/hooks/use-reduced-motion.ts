import { useEffect, useState } from 'react'

export function useReducedMotion() {
  const [reduce, setReduce] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduce(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return reduce
}
