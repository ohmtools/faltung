import { cn } from '@/lib/utils'

/** App-Symbol: zwei Rechtecke ergeben ein Dreieck. Gleiche Grafik wie public/favicon.svg. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn('shrink-0 text-primary', className)}>
      <rect width="64" height="64" rx="14" fill="currentColor" />
      <g className="text-primary-foreground">
        <path d="M10 46 L32 18 L54 46" fill="currentColor" fillOpacity=".18" />
        <path d="M10 46 L32 18 L54 46" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M8 46 H56" stroke="currentColor" strokeOpacity=".5" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  )
}
