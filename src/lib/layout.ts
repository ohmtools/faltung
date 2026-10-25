// Layout der App, das die Elementgruppen des Designs nicht mitbringen. Die Stufen stehen in
// `@/lib/ohmtools/steps` (`useStep()`).

/** Breit genug für die Formelzeile über dem Plot (Tailwinds `lg:`, hängt nur an der Breite) */
export const LG_QUERY = '(width >= 64rem)'

/**
 * Seitenabstand des Inhalts: 16 px auf dem Telefon, 24 px ab `compact:`, mindestens die Safe Area
 * (die Kamera eines Telefons quer), wie im Header von `AppShell`.
 */
export const GUTTER =
  'pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] compact:pr-[max(1.5rem,env(safe-area-inset-right))] compact:pl-[max(1.5rem,env(safe-area-inset-left))]'
