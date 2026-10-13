import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

/** Meldet Offline-Bereitschaft bzw. eine neue Version (Service Worker) als Toast. */
export function PwaPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!offlineReady) return
    toast.success('Die App ist jetzt auch offline nutzbar.')
    setOfflineReady(false)
  }, [offlineReady, setOfflineReady])

  useEffect(() => {
    if (!needRefresh) return
    toast('Eine neue Version ist verfügbar.', {
      duration: Infinity,
      action: { label: 'Neu laden', onClick: () => updateServiceWorker(true) },
      onDismiss: () => setNeedRefresh(false),
    })
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  return null
}
