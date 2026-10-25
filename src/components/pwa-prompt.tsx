import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

import { m } from '@/i18n'
import { toast } from '@/lib/ohmtools/toast'

/** Meldet Offline-Bereitschaft bzw. eine neue Version (Service Worker) als Toast. */
export function PwaPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!offlineReady) return
    toast.success(m.offlineReady)
    setOfflineReady(false)
  }, [offlineReady, setOfflineReady])

  useEffect(() => {
    if (!needRefresh) return
    toast(m.updateReady, {
      duration: Infinity,
      action: { label: m.reload, onClick: () => updateServiceWorker(true) },
      onDismiss: () => setNeedRefresh(false),
    })
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  return null
}
