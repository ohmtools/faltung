import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { m } from '@/i18n'
import { PAGES, type Page } from '@/lib/pages'
import { cn } from '@/lib/utils'

const LABEL: Record<Page, () => string> = {
  animator: () => m.pageAnimator,
  guide: () => m.pageGuide,
  properties: () => m.pageProperties,
}

/**
 * Die drei Seiten als Tabs mit gleitendem Indikator: ab `compact:` im Header neben dem Namen, auf
 * dem Telefon in einer Leiste unten, wo der Daumen ist (`bar`).
 */
export function PageTabs({
  value,
  onChange,
  bar = false,
  className,
}: {
  value: Page | null
  onChange: (page: Page) => void
  bar?: boolean
  className?: string
}) {
  const tabs = (
    <Tabs value={value} onValueChange={(v: Page) => onChange(v)} className={cn(bar && 'w-full')}>
      <TabsList aria-label={m.pagesLabel} className={cn(bar && 'h-10! w-full')}>
        {PAGES.map((page) => (
          <TabsTrigger key={page} value={page} className={cn(!bar && 'px-3')}>
            {LABEL[page]()}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
  if (!bar) return <div className={className}>{tabs}</div>
  return (
    <nav
      aria-label={m.pagesLabel}
      className={cn(
        'shrink-0 border-t bg-background px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]',
        className,
      )}
    >
      {tabs}
    </nav>
  )
}
