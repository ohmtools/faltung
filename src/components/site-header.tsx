import { Download } from 'lucide-react'

import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import type { Theme } from '@/hooks/use-theme'

const NAV = [
  { href: '#animator', label: 'Animator' },
  { href: '#erklaerung', label: 'Erklärung' },
  { href: '#funktionen', label: 'Funktionen' },
]

export function SiteHeader({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const { canInstall, install } = useInstallPrompt()
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <a href="#animator" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo className="size-7" />
          <span>Faltungs-Animator</span>
        </a>
        <nav className="ml-auto hidden items-center gap-1 sm:flex" aria-label="Hauptnavigation">
          {NAV.map((n) => (
            <Button key={n.href} variant="ghost" size="sm" asChild>
              <a href={n.href}>{n.label}</a>
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          {canInstall && (
            <Button variant="outline" size="sm" onClick={install}>
              <Download />
              Installieren
            </Button>
          )}
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </div>
    </header>
  )
}
