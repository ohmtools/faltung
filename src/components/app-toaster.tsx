import { Toaster } from '@/components/ui/sonner'
import { useMedia } from '@/hooks/use-media'
import { COMPACT_QUERY } from '@/lib/media'

// Auf dem Telefon stehen die Toasts über den Leisten unten (Tab-Leiste, Bedienleiste; ihre Höhe
// veröffentlicht `bottomBar` als `--bottom-bar`, ohne Leisten 0), sonst unten rechts
const ABOVE_BARS = 'calc(var(--bottom-bar, 0px) + 16px)'

export function AppToaster() {
  const compact = useMedia(COMPACT_QUERY)
  const bottom = compact ? undefined : { bottom: ABOVE_BARS }
  return <Toaster position="bottom-right" offset={bottom} mobileOffset={bottom} />
}
