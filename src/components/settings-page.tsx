import { Download } from 'lucide-react'

import { Brand } from '@/components/brand'
import { IosSteps } from '@/components/install'
import { Section } from '@/components/section'
import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { InstallPrompt } from '@/hooks/use-install-prompt'
import { getLocale, languageName, locales, m, setLocale } from '@/i18n'

/**
 * Der Tab Einstellungen auf dem Telefon: was der Desktop im Footer hat, als Seite. Zuerst die
 * Sprache, dann die Installation (nur wenn möglich), zuletzt Name und Version.
 */
export function SettingsPage({ prompt }: { prompt: InstallPrompt }) {
  return (
    <div className="flex flex-col divide-y">
      <Section>
        <CardHeader>
          <CardTitle>{m.language}</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            variant="outline"
            spacing={0}
            className="w-full"
            aria-label={m.language}
            value={[getLocale()]}
            onValueChange={([value]) => {
              const locale = locales.find((l) => l === value)
              if (locale && locale !== getLocale()) setLocale(locale)
            }}
          >
            {locales.map((locale) => (
              <ToggleGroupItem key={locale} value={locale} lang={locale} className="flex-1">
                {languageName(locale)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardContent>
      </Section>

      {(prompt.canInstall || prompt.iosHint) && (
        <Section>
          <CardHeader>
            <CardTitle>{m.installTitle}</CardTitle>
            <CardDescription>{m.installDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {prompt.canInstall ? (
              <Button variant="outline" className="w-full justify-start" onClick={prompt.install}>
                <Download data-icon="inline-start" />
                {m.installApp}
              </Button>
            ) : (
              <IosSteps />
            )}
          </CardContent>
        </Section>
      )}

      <Section>
        <CardHeader>
          <CardTitle>{m.about}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Brand />
          <p className="text-muted-foreground">{m.footerNote}</p>
          <p className="text-muted-foreground">{m.credits}</p>
        </CardContent>
      </Section>
    </div>
  )
}
