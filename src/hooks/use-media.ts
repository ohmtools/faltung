import { useSyncExternalStore } from 'react'

/** Ob eine Media-Query gerade zutrifft, auch wenn sich das Fenster ändert. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (on) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', on)
      return () => m.removeEventListener('change', on)
    },
    () => window.matchMedia(query).matches,
  )
}
