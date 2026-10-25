import { Toaster } from '@/components/ui/sonner'
import { useMedia } from '@/hooks/use-media'
import { COMPACT_QUERY } from '@/lib/media'

// Auf dem Telefon liegt die Tab-Leiste unten, die Toasts darüber; sonst unten rechts
const ABOVE_TAB_BAR = 'calc(3.5rem + 16px + env(safe-area-inset-bottom))'

export function AppToaster() {
  const compact = useMedia(COMPACT_QUERY)
  const bottom = compact ? undefined : { bottom: ABOVE_TAB_BAR }
  return <Toaster position="bottom-right" offset={bottom} mobileOffset={bottom} />
}
