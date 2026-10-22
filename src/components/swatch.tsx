import { AREA_ALPHA, G_COLOR } from '@/lib/plot'
import { cn } from '@/lib/utils'

export type Series = 'f' | 'g' | 'area' | 'conv'

const COLOR: Record<Series, string> = {
  f: 'text-chart-2',
  g: '', // G_COLOR, kein Token: als style gesetzt
  area: 'text-chart-1',
  conv: 'text-foreground',
}

/**
 * Wie der Plot eine Kurve zeichnet, im Kleinen: Farbe und Strich, für Legende und Eingabefelder.
 * Die Farbe ist nie das einzige Merkmal (ohmtools-Design): die Fläche ist gefüllt, das Ergebnis
 * dicker, und daneben steht immer der Name.
 */
export function Swatch({ series, className }: { series: Series; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 10"
      aria-hidden
      className={cn('h-2.5 w-4 shrink-0', COLOR[series], className)}
      style={series === 'g' ? { color: G_COLOR } : undefined}
    >
      {series === 'area' ? (
        <rect width="16" height="10" fill="currentColor" fillOpacity={AREA_ALPHA} />
      ) : (
        <line
          x1="0"
          y1="5"
          x2="16"
          y2="5"
          stroke="currentColor"
          strokeWidth={series === 'conv' ? 2.25 : 2}
        />
      )}
    </svg>
  )
}
