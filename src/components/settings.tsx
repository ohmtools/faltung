import { Download } from 'lucide-react'
import type { ReactNode } from 'react'

import { Brand } from '@/components/brand'
import { IosSteps } from '@/components/install'
import { GitHubLink } from '@/components/ohmtools/github-link'
import { LanguageTabs } from '@/components/ohmtools/settings'
import { Button } from '@/components/ui/button'
import type { InstallPrompt } from '@/hooks/use-install-prompt'
import { getLocale, locales, m, setLocale } from '@/i18n'

const REPO_URL = 'https://github.com/ohmtools/faltung'

/** Allgemein, der erste Abschnitt der Einstellungen: Sprache und Installation. */
export function GeneralSettings({ prompt }: { prompt: InstallPrompt }) {
  return (
    <>
      <Group title={m.language}>
        <LanguageTabs locales={locales} value={getLocale()} onChange={setLocale} label={m.language} />
        <Hint>{m.themeHint}</Hint>
      </Group>
      {(prompt.canInstall || prompt.iosHint) && (
        <Group title={m.installTitle}>
          {prompt.canInstall ? (
            <div className="-mx-2.5 flex flex-col">
              <Button variant="ghost" className="w-full justify-start px-2.5" onClick={prompt.install}>
                <Download data-icon="inline-start" />
                {m.installApp}
              </Button>
            </div>
          ) : (
            <IosSteps />
          )}
          <Hint>{m.installDescription}</Hint>
        </Group>
      )}
    </>
  )
}

/** Über, der letzte Abschnitt: Logo, Name, Version, Quellcode. */
export function AboutSettings() {
  return (
    <Group>
      <div className="flex items-center justify-between gap-2">
        <Brand name={m.appTitle} />
        <GitHubLink href={REPO_URL} label={m.sourceCode} />
      </div>
      <Hint>{m.footerNote}</Hint>
      <Hint>{m.credits}</Hint>
    </Group>
  )
}

// Eine Gruppe: ein Titel über ihren Bedienelementen, Linien zwischen den Gruppen, 24 px um jede
function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 py-6 first:pt-2 compact:first:pt-4">
      {title && <h4 className="text-sm font-semibold">{title}</h4>}
      {children}
    </section>
  )
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>
}
