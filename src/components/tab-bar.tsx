import { BookOpen, ChartSpline, Settings, SquareFunction } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { m } from '@/i18n'
import { cn } from '@/lib/utils'

export type Tab = 'animation' | 'functions' | 'explanation' | 'settings'

// Ein Platz der Leiste: Symbol über der Beschriftung
const TAB_ITEM =
  'relative h-14 min-w-0 flex-1 flex-col gap-1 text-xs text-muted-foreground aria-[current=page]:text-foreground'

/**
 * Unterhalb der `desktop`-Variante zeigt die App eine Seite auf einmal: die Animation mit ihrer
 * Bedienleiste, die Funktionen, die Erklärung oder die Einstellungen (was der Desktop im Footer
 * hat). Diese Leiste unten am Bildschirm wechselt zwischen ihnen; der Desktop zeigt alles.
 */
export function TabBar({ value, onChange }: { value: Tab; onChange: (tab: Tab) => void }) {
  const tabs: { tab: Tab; label: string; Icon: typeof Settings }[] = [
    { tab: 'animation', label: m.tabAnimation, Icon: ChartSpline },
    { tab: 'functions', label: m.tabFunctions, Icon: SquareFunction },
    { tab: 'explanation', label: m.tabExplanation, Icon: BookOpen },
    { tab: 'settings', label: m.tabSettings, Icon: Settings },
  ]
  return (
    <nav
      aria-label={m.tabLabel}
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] desktop:hidden"
    >
      {tabs.map(({ tab, label, Icon }) => (
        <Button
          key={tab}
          variant="ghost"
          aria-current={tab === value ? 'page' : undefined}
          className={TAB_ITEM}
          onClick={() => onChange(tab)}
        >
          {/* Die Linie des aktiven Tabs liegt auf der Trennlinie der Leiste */}
          <span
            aria-hidden
            className={cn('absolute inset-x-0 -top-px h-0.5 bg-primary', tab !== value && 'hidden')}
          />
          <Icon className="size-5" />
          {label}
        </Button>
      ))}
    </nav>
  )
}
