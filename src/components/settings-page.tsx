import { Download } from 'lucide-react'

import { Brand } from '@/components/brand'
import { GitHubLink } from '@/components/github-link'
import { IosSteps } from '@/components/install'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { InstallPrompt } from '@/hooks/use-install-prompt'
import { getLocale, languageName, locales, m, setLocale, type Locale } from '@/i18n'
import { cn } from '@/lib/utils'

function Part({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('flex flex-col gap-3 px-4 py-4 compact:px-6', className)}>
      <h3 className="font-heading text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

/**
 * Die Einstellungen: auf dem Telefon eine eigene Seite, ab `compact:` ein Blatt von rechts, auf
 * breiten Bildschirmen eine Seitenleiste. Zuerst die Sprache, dann die Installation (nur wenn
 * möglich), zuletzt Name, Version und der Link zu GitHub.
 */
export function SettingsPanel({ prompt }: { prompt: InstallPrompt }) {
  return (
    <div className="flex flex-col divide-y">
      <Part title={m.language}>
        <Tabs
          value={getLocale()}
          onValueChange={(value: Locale) => {
            if (value !== getLocale()) setLocale(value)
          }}
        >
          <TabsList aria-label={m.language} className="w-full">
            {locales.map((locale) => (
              <TabsTrigger key={locale} value={locale} lang={locale}>
                {languageName(locale)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Part>

      {(prompt.canInstall || prompt.iosHint) && (
        <Part title={m.installTitle}>
          <p className="text-muted-foreground">{m.installDescription}</p>
          {prompt.canInstall ? (
            <Button variant="outline" className="justify-start" onClick={prompt.install}>
              <Download data-icon="inline-start" />
              {m.installApp}
            </Button>
          ) : (
            <IosSteps />
          )}
        </Part>
      )}

      <Part title={m.about}>
        <div className="flex items-center justify-between gap-2">
          <Brand name={m.appTitle} />
          <GitHubLink />
        </div>
        <p className="text-muted-foreground">{m.footerNote}</p>
        <p className="text-muted-foreground">{m.credits}</p>
      </Part>
    </div>
  )
}
