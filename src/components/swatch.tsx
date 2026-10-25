import { cn } from '@/lib/utils'

export type Series = 'f' | 'g'

// Wie in src/lib/plot.ts: die Datenfarben des Designs, alle Linien durchgezogen
const COLOR: Record<Series, string> = {
  f: 'text-kind-ue-border',
  g: 'text-kind-pr-border',
}

/**
 * Wie der Plot eine Kurve zeichnet, im Kleinen: Farbe und Strich, vor dem Namen der Funktion. Die
 * einzige Zuordnung von Farbe zu Funktion (keine Legende), deshalb steht der Name immer daneben.
 */
export function Swatch({ series, className }: { series: Series; className?: string }) {
  return (
    <svg viewBox="0 0 16 10" aria-hidden className={cn('h-2.5 w-4 shrink-0', COLOR[series], className)}>
      <line
        x1="0"
        y1="5"
        x2="16"
        y2="5"
        stroke="currentColor"
        strokeWidth={2}
      />
    </svg>
  )
}
