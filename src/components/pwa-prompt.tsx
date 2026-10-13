import { RefreshCw, WifiOff, X } from 'lucide-react'
import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

import { Button } from '@/components/ui/button'

/** Hinweis auf Offline-Bereitschaft bzw. neue Version (Service Worker). */
export function PwaPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  // Der Offline-Hinweis verschwindet von selbst; der Update-Hinweis bleibt bis zur Entscheidung
  useEffect(() => {
    if (!offlineReady || needRefresh) return
    const id = window.setTimeout(() => setOfflineReady(false), 6000)
    return () => window.clearTimeout(id)
  }, [offlineReady, needRefresh, setOfflineReady])

  if (!offlineReady && !needRefresh) return null
  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }
  return (
    <div
      role="status"
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-[max(1rem,env(safe-area-inset-left))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-lg sm:left-auto"
    >
      {needRefresh ? <RefreshCw className="size-4 shrink-0" /> : <WifiOff className="size-4 shrink-0" />}
      <span className="flex-1">
        {needRefresh
          ? 'Eine neue Version ist verfügbar.'
          : 'Die App ist jetzt auch offline nutzbar.'}
      </span>
      {needRefresh && (
        <Button size="sm" onClick={() => updateServiceWorker(true)}>
          Neu laden
        </Button>
      )}
      <Button variant="ghost" size="icon-sm" aria-label="Schließen" onClick={close}>
        <X />
      </Button>
    </div>
  )
}
