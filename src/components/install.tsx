import { Share, SquarePlus } from 'lucide-react'

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
