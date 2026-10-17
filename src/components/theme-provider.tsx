import { useEffect } from 'react'

/**
 * Folgt dem Farbschema des Geräts über shadcns `.dark`-Klasse auf <html>, auch wenn es sich
 * ändert, während die App offen ist. Kein Umschalter (ohmtools-Design). Vor dem ersten
 * Zeichnen setzt `public/dark.js` die Klasse, damit nichts weiß aufblitzt.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.classList.toggle('dark', query.matches)
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])
  return children
}
