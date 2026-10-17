import { Download, Share, SquarePlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { InstallPrompt } from '@/hooks/use-install-prompt'
import { m } from '@/i18n'

/** iPhone und iPad kennen keinen Installationsdialog: die zwei Schritte in Safari. */
export function IosSteps() {
  return (
    <ol className="flex list-decimal flex-col gap-2 pl-5 text-muted-foreground">
      <li>
        <Share className="mr-1 inline size-4 align-text-bottom" aria-hidden />
        {m.iosStep1}
      </li>
      <li>
        <SquarePlus className="mr-1 inline size-4 align-text-bottom" aria-hidden />
        {m.iosStep2}
      </li>
    </ol>
  )
}

/** Im Footer des Desktops: der Installationsdialog, auf dem iPad die Anleitung als Popover. */
export function InstallButton({ prompt }: { prompt: InstallPrompt }) {
  if (prompt.canInstall) {
    return (
      <Button variant="ghost" size="xs" onClick={prompt.install}>
        <Download data-icon="inline-start" />
        {m.install}
      </Button>
    )
  }
  if (!prompt.iosHint) return null
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="xs" />}>
        <Download data-icon="inline-start" />
        {m.install}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(20rem,calc(100vw-2rem))]">
        <p className="font-semibold">{m.installTitle}</p>
        <IosSteps />
        <p className="text-muted-foreground">{m.iosAfter}</p>
      </PopoverContent>
    </Popover>
  )
}
