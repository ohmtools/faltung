import { flushSync } from 'react-dom'

// Bewegung ohne Bibliothek, wie in zeiteisen (`src/lib/motion.ts`, DESIGN.md „Motion“): View
// Transitions für die Seitenwechsel, die Web Animations API für den Text eines Anleitungsschritts,
// Bilder für Bild (requestAnimationFrame) für alles im Plot. Bei `prefers-reduced-motion` oder ohne
// Unterstützung des Browsers passiert die Änderung sofort.

export function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Die eine Kurve des Designs als CSS: schnell los, sanft landen. */
export const EASE = 'cubic-bezier(0.2, 0, 0, 1)'

/**
 * Eine Kurve wie CSS `cubic-bezier(x1, y1, x2, y2)` für Animationen, die selbst rechnen: zu einem
 * Anteil der Zeit (0 … 1) der Anteil des Wegs.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  // Koordinate der Kurve beim Parameter s (Bernstein-Form mit P0 = 0 und P3 = 1)
  const at = (s: number, p1: number, p2: number) => 3 * (1 - s) ** 2 * s * p1 + 3 * (1 - s) * s ** 2 * p2 + s ** 3
  const slope = (s: number, p1: number, p2: number) =>
    3 * (1 - s) ** 2 * p1 + 6 * (1 - s) * s * (p2 - p1) + 3 * s ** 2 * (1 - p2)
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    // s zu x suchen: Newton, wo die Kurve steil genug ist, sonst Bisektion
    let s = x
    for (let i = 0; i < 8; i++) {
      const d = slope(s, x1, x2)
      if (Math.abs(d) < 1e-6) break
      const next = s - (at(s, x1, x2) - x) / d
      if (next < 0 || next > 1) break
      s = next
    }
    if (Math.abs(at(s, x1, x2) - x) > 1e-6) {
      let lo = 0
      let hi = 1
      for (let i = 0; i < 40; i++) {
        s = (lo + hi) / 2
        if (at(s, x1, x2) < x) lo = s
        else hi = s
      }
    }
    return at(s, y1, y2)
  }
}

/** Die eine Kurve des Designs zum Rechnen: Sprünge von t, der gleitende y-Bereich. */
export const ease = cubicBezier(0.2, 0, 0, 1)

/** Langsam an beiden Enden, für Animationen, die etwas erklären (DESIGN.md: „easing in and out“). */
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2)

/** Wie eine Seite hereinkommt (siehe `html[data-transition]` in index.css) */
export type Nav = 'forward' | 'back' | 'close'

let running = 0

/**
 * Führt `update` (ein State-Wechsel von React) in einer View Transition aus. `html[data-transition]`
 * nennt die Art, solange sie läuft; nur dann trägt die Seite ihren `view-transition-name`.
 */
export function transition(nav: Nav, update: () => void): void {
  if (
    typeof document.startViewTransition !== 'function' ||
    document.visibilityState !== 'visible' ||
    reducedMotion()
  ) {
    update()
    return
  }
  const root = document.documentElement
  const mine = ++running
  root.dataset.transition = nav
  const vt = document.startViewTransition(() => flushSync(update))
  // Eine neuere Transition überspringt diese: nur die letzte räumt auf
  void vt.finished.finally(() => {
    if (running === mine) delete root.dataset.transition
  })
}
