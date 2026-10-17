import { m } from '@/i18n'
import { cn } from '@/lib/utils'

/**
 * Logo, Name und Version. Kein Header (ohmtools-Design): steht im Footer des Desktops und auf
 * der Seite Einstellungen. Die Version zeigt, welchen Stand ein Browser ausliefert.
 */
export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 font-heading font-semibold', className)}>
      <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-5" />
      {m.appTitle}
      <span className="ml-1 text-xs font-normal text-muted-foreground">v{__APP_VERSION__}</span>
    </span>
  )
}
