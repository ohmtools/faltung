import { useEffect, useState } from 'react'

import { Toaster } from '@/components/ui/sonner'
import { DESKTOP_QUERY, isDesktop } from '@/lib/media'

// Unterhalb der `desktop`-Variante liegt die Tab-Leiste unten, die Toasts darüber
const ABOVE_TAB_BAR = 'calc(3.5rem + 16px + env(safe-area-inset-bottom))'

export function AppToaster() {
  const [desktop, setDesktop] = useState(isDesktop)
  useEffect(() => {
    const query = matchMedia(DESKTOP_QUERY)
    const change = () => setDesktop(query.matches)
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])
  const bottom = desktop ? undefined : { bottom: ABOVE_TAB_BAR }
  return <Toaster offset={bottom} mobileOffset={bottom} />
}
