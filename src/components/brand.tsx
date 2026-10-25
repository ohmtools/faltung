import { cn } from '@/lib/utils'

/** Das Logo der App (dasselbe wie das App-Symbol). */
export function Logo({ className }: { className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className={cn('size-7 shrink-0', className)} />
}

/**
 * Logo, Name und Version, unter „Über“ in den Einstellungen. Die Version zeigt, welchen Stand ein
 * Browser ausliefert.
 */
export function Brand({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-heading font-semibold', className)}>
      <Logo className="size-6" />
      {name}
      <span className="font-mono text-xs font-normal text-muted-foreground">v{__APP_VERSION__}</span>
    </span>
  )
}
