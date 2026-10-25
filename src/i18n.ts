import type { FormulaProblem } from '@/lib/formula'
import type { Localized } from '@/lib/presets'
import { de, en, type Messages } from '@/messages'

/**
 * Deutsch und Englisch, nach der Sprache des Browsers. Die Knöpfe im Footer und auf der Seite
 * Einstellungen überschreiben sie (gespeichert auf dem Gerät). Eine Seite behält die Sprache, mit
 * der sie startet: jeder Wechsel lädt neu, so muss nichts darauf hören.
 */
export const locales = ['en', 'de'] as const
export type Locale = (typeof locales)[number]

const KEY = 'faltung-locale'

function isLocale(v: unknown): v is Locale {
  return locales.some((l) => l === v)
}

function resolveLocale(): Locale {
  try {
    const stored = localStorage.getItem(KEY)
    if (isLocale(stored)) return stored
  } catch {
    /* Speicher nicht verfügbar */
  }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.toLowerCase().split('-')[0]
    if (isLocale(base)) return base
  }
  return 'en'
}

const locale = resolveLocale()

export const m: Messages = locale === 'de' ? de : en

export function getLocale(): Locale {
  return locale
}

export function setLocale(next: Locale) {
  try {
    localStorage.setItem(KEY, next)
  } catch {
    return // ohne Speicher bliebe es nach dem Neuladen bei der alten Sprache
  }
  location.reload()
}

/** Ein anderer Tab hat die Sprache gewechselt (oder den Speicher geleert): mitziehen. */
export function followLocaleOfOtherTabs() {
  window.addEventListener('storage', (e) => {
    if (e.key !== null && e.key !== KEY) return
    if (resolveLocale() !== locale) location.reload()
  })
}

/** Die Sprache in sich selbst benannt („Deutsch“, „English“), so findet jeder seine. */
export function languageName(l: Locale): string {
  return new Intl.DisplayNames([l], { type: 'language' }).of(l) ?? l
}

export function localized(v: Localized): string {
  return v[locale]
}

export function formatNumber(v: number): string {
  return v.toLocaleString(locale)
}

const fixed3 = new Intl.NumberFormat(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 })

/** Ein Wert mit drei Nachkommastellen, „0,400“ bzw. "0.400", mit echtem Minus. */
export function formatValue(v: number): string {
  return fixed3.format(Math.abs(v) < 5e-4 ? 0 : v).replace('-', '−')
}

export function formulaError(p: FormulaProblem): string {
  return m.formulaError(p)
}
