import { Download, Share, SquarePlus } from 'lucide-react'

import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import type { Theme } from '@/hooks/use-theme'

const NAV = [
  { href: '#animator', label: 'Animator' },
  { href: '#erklaerung', label: 'Erklärung' },
  { href: '#funktionen', label: 'Funktionen' },
]

function InstallLabel() {
  return (
    <>
      <Download />
      <span className="hidden sm:inline">Installieren</span>
    </>
  )
}

export function SiteHeader({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const { canInstall, install, iosHint } = useInstallPrompt()
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 short:static">
      <div className="px-safe mx-auto flex h-14 max-w-5xl items-center gap-3">
        <a href="#animator" className="flex min-w-0 items-center gap-2 font-semibold tracking-tight">
          <Logo className="size-7" />
          <span className="truncate">Faltungs-Animator</span>
        </a>
        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Hauptnavigation">
          {NAV.map((n) => (
            <Button key={n.href} variant="ghost" size="sm" asChild>
              <a href={n.href}>{n.label}</a>
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
          {canInstall && (
            <Button variant="outline" size="sm" onClick={install} aria-label="App installieren">
              <InstallLabel />
            </Button>
          )}
          {!canInstall && iosHint && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" aria-label="App installieren">
                  <InstallLabel />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[min(20rem,calc(100vw-2rem))] text-sm">
                <p className="font-medium">Als App installieren</p>
                <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5 text-muted-foreground">
                  <li>
                    In Safari auf <Share className="inline size-4 align-text-bottom" aria-label="Teilen" />{' '}
                    <span className="text-foreground">Teilen</span> tippen.
                  </li>
                  <li>
                    <SquarePlus className="inline size-4 align-text-bottom" aria-hidden />{' '}
                    <span className="text-foreground">„Zum Home-Bildschirm“</span> wählen.
                  </li>
                </ol>
                <p className="mt-2 text-muted-foreground">
                  Danach startet die App vom Home-Bildschirm und funktioniert auch offline.
                </p>
              </PopoverContent>
            </Popover>
          )}
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </div>
    </header>
  )
}
