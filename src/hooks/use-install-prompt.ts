import { useCallback, useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** iPhone/iPad (iPadOS meldet sich als Mac, hat aber Touch). */
function detectIOS() {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/**
 * Installationsmöglichkeit der Web-App.
 * - Chromium-Browser: echter Installationsdialog über beforeinstallprompt
 * - iOS/iPadOS: kein solches Ereignis; dort braucht es eine Anleitung (Teilen → Zum Home-Bildschirm)
 */
export type InstallPrompt = { canInstall: boolean; install: () => void; iosHint: boolean }

export function useInstallPrompt(): InstallPrompt {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [iosHint] = useState(() => detectIOS() && !isStandalone())

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setEvt(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!evt) return
    await evt.prompt()
    await evt.userChoice
    setEvt(null)
  }, [evt])

  return { canInstall: evt !== null, install, iosHint }
}
