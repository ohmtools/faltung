import { useEffect, useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

type Katex = typeof import('katex').default
type TexProps = { math: string; display?: boolean; className?: string }

let katex: Katex | undefined
let loading: Promise<Katex> | undefined

/**
 * KaTeX (mit Stylesheet) kommt erst nach dem ersten Zeichnen: ~75 KB weniger auf dem
 * Startpfad, die Formeln erscheinen einen Moment später.
 */
function loadKatex(): Promise<Katex> {
  loading ??= import('@/lib/katex').then(
    (m) => (katex = m.default),
    (e: unknown) => {
      loading = undefined // beim nächsten Mal neu versuchen
      throw e
    },
  )
  return loading
}

/** Rendert LaTeX mit KaTeX (rein clientseitig, ohne Netzwerkzugriff). */
export function Tex({ math, display = false, className }: TexProps) {
  const [lib, setLib] = useState(katex)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (lib) return
    let alive = true
    loadKatex().then(
      (k) => alive && setLib(k),
      () => alive && setFailed(true),
    )
    return () => {
      alive = false
    }
  }, [lib])
  const html = useMemo(
    () => lib?.renderToString(math, { displayMode: display, throwOnError: false, strict: false }),
    [lib, math, display],
  )
  // Abgesetzte Formeln linksbündig und ohne den großen Rand aus KaTeX' Stylesheet. Das liegt
  // außerhalb der Tailwind-Layer und gewinnt sonst, deshalb `!`.
  const cls = cn(
    display &&
      'relative block overflow-x-auto overflow-y-hidden [&_.katex-display]:my-2! [&_.katex-display>.katex]:text-left!',
    className,
  )
  // Bis KaTeX da ist leer; schlägt das Laden fehl, die Formel als Quelltext
  if (html === undefined) {
    return <span className={cn(cls, failed && 'font-mono')}>{failed && math}</span>
  }
  return <span className={cls} dangerouslySetInnerHTML={{ __html: html }} />
}
