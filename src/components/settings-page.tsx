import { ChevronLeft, ChevronRight, Download, Info, Settings2, X, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Brand } from '@/components/brand'
import { GitHubLink } from '@/components/github-link'
import { IosSteps } from '@/components/install'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { InstallPrompt } from '@/hooks/use-install-prompt'
import { getLocale, languageName, locales, m, setLocale, type Locale } from '@/i18n'

// Die Einstellungen in Abschnitten, wie in zeiteisen (ohmtools-Design): ab `compact:` ein Dialog
// mit den Abschnitten links (`SettingsDialog`), auf dem Telefon eine Seite mit der Liste der
// Abschnitte, jeder eine Seite für sich (`SettingsPage`). Allgemein zuerst, Über zuletzt.
type Section = 'general' | 'about'

const SECTIONS: readonly { key: Section; icon: LucideIcon; label: () => string }[] = [
  { key: 'general', icon: Settings2, label: () => m.settingsGeneral },
  { key: 'about', icon: Info, label: () => m.about },
]

function labelOf(section: Section): string {
  return SECTIONS.find(({ key }) => key === section)?.label() ?? ''
}

type Props = { prompt: InstallPrompt }

/** Ab `compact:`: ein Dialog bis 1000 × 720, links die Abschnitte, rechts der offene. */
export function SettingsDialog({ open, onClose, prompt }: Props & { open: boolean; onClose: () => void }) {
  const [section, setSection] = useState<Section>('general')
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(45rem,calc(100dvh-3rem))] gap-0 overflow-hidden p-0 short:h-[calc(100dvh-1.5rem)] compact:max-w-[min(62.5rem,calc(100%-3rem-env(safe-area-inset-left)-env(safe-area-inset-right)))] compact:p-0"
      >
        <nav
          aria-label={m.settings}
          className="flex w-60 shrink-0 flex-col gap-0.5 overflow-y-auto border-r px-3 py-5 short:w-46 short:px-2 short:py-3"
        >
          <DialogTitle className="mb-3.5 px-2.5 pt-1.5 text-base leading-6 font-semibold short:mb-2">
            {m.settings}
          </DialogTitle>
          {SECTIONS.map(({ key, icon: Icon, label }) => (
            <Button
              key={key}
              variant="ghost"
              aria-current={key === section ? 'page' : undefined}
              className="w-full justify-start px-2.5 aria-[current=page]:bg-accent aria-[current=page]:font-semibold"
              onClick={() => setSection(key)}
            >
              <Icon data-icon="inline-start" className="text-muted-foreground" />
              <span className="truncate">{label()}</span>
            </Button>
          ))}
        </nav>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 pt-5 pr-4 pl-6 short:pt-3 short:pr-2 short:pl-5">
            <h3 className="truncate pt-1.5 text-base leading-6 font-semibold">{labelOf(section)}</h3>
            <DialogClose render={<Button variant="ghost" size="icon" aria-label={m.close} />}>
              <X />
            </DialogClose>
          </div>
          <div className="flex min-h-0 flex-1 flex-col divide-y overflow-y-auto px-6 short:px-5">
            <SectionBody section={section} prompt={prompt} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Kopfzeile einer Seite auf dem Telefon: Zurück und Titel, 56 px wie der Header. */
function PanelHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4 pt-[env(safe-area-inset-top)] box-content">
      <Button variant="ghost" size="icon" className="-ml-2 size-10" aria-label={m.back} onClick={onBack}>
        <ChevronLeft />
      </Button>
      <h2 className="truncate text-base leading-6 font-semibold">{title}</h2>
    </div>
  )
}

/**
 * Auf dem Telefon: eine Seite mit den Abschnitten und dem, was gerade eingestellt ist; jeder
 * Abschnitt eine Seite eine Ebene tiefer (Zurück führt zur Liste, deren Zurück zur App).
 */
export function SettingsPage({
  prompt,
  onClose,
  navigate,
}: Props & { onClose: () => void; navigate: (nav: 'forward' | 'close', update: () => void) => void }) {
  const [section, setSection] = useState<Section | null>(null)
  const value: Record<Section, ReactNode> = {
    general: languageName(getLocale()),
    about: <span className="font-mono text-xs">v{__APP_VERSION__}</span>,
  }

  if (section !== null) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PanelHeader title={labelOf(section)} onBack={() => navigate('close', () => setSection(null))} />
        <div className="flex min-h-0 flex-1 flex-col divide-y overflow-y-auto px-4 pb-[env(safe-area-inset-bottom)]">
          <SectionBody section={section} prompt={prompt} />
        </div>
      </div>
    )
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PanelHeader title={m.settings} onBack={onClose} />
      <nav aria-label={m.settings} className="min-h-0 flex-1 overflow-y-auto pt-2">
        <ul>
          {SECTIONS.map(({ key, icon: Icon, label }) => (
            <li key={key} className="group">
              <button
                type="button"
                className="flex h-14 w-full items-center gap-3.5 pl-4 text-left text-[0.9375rem] font-medium outline-none hover:bg-accent focus-visible:bg-accent active:bg-accent"
                onClick={() => navigate('forward', () => setSection(key))}
              >
                <Icon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                <span className="flex h-full min-w-0 flex-1 items-center gap-2 border-b pr-4 group-last:border-b-0">
                  <span className="flex-1 truncate">{label()}</span>
                  <span className="shrink-0 text-[0.8125rem] font-normal text-muted-foreground">{value[key]}</span>
                  <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

/** Der Inhalt eines Abschnitts, im Dialog und auf der Seite derselbe. */
function SectionBody({ section, prompt }: { section: Section; prompt: InstallPrompt }) {
  if (section === 'general') {
    return (
      <>
        <Group title={m.language}>
          {/* Die Sprachen in sich selbst benannt, so findet jeder seine */}
          <Tabs
            value={getLocale()}
            onValueChange={(value: Locale) => {
              if (value !== getLocale()) setLocale(value)
            }}
          >
            <TabsList aria-label={m.language} className="h-9 w-full">
              {locales.map((locale) => (
                <TabsTrigger key={locale} value={locale} lang={locale}>
                  {languageName(locale)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
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
  return (
    <Group>
      <div className="flex items-center justify-between gap-2">
        <Brand name={m.appTitle} />
        <GitHubLink className="-mr-2" />
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
