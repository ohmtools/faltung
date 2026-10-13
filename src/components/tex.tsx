import katex from 'katex'
import { useMemo } from 'react'

import { cn } from '@/lib/utils'

type TexProps = { math: string; display?: boolean; className?: string }

/** Rendert LaTeX mit KaTeX (rein clientseitig, ohne Netzwerkzugriff). */
export function Tex({ math, display = false, className }: TexProps) {
  const html = useMemo(
    () => katex.renderToString(math, { displayMode: display, throwOnError: false, strict: false }),
    [math, display],
  )
  return (
    <span
      className={cn(display && 'block overflow-x-auto overflow-y-hidden', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
