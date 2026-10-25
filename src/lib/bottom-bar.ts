// Die Leisten unten (Tab-Leiste, Bedienleiste des Animators, Zurück/Weiter der Anleitung)
// veröffentlichen ihre gemeinsame Höhe als `--bottom-bar` auf <html>, damit Toasts auf dem Telefon
// darüber stehen (`AppToaster`), wie in zeiteisen (`BottomBar.tsx`). Versteckte Leisten
// (`display: none`, auch die Seite der Einstellungen ohne Leisten) zählen 0.

const bars = new Set<HTMLElement>()
let observer: ResizeObserver | undefined

function publish() {
  let height = 0
  for (const bar of bars) height += bar.offsetHeight
  document.documentElement.style.setProperty('--bottom-bar', `${height}px`)
}

/** Als `ref` an eine Leiste unten: misst sie, solange sie eingehängt ist. */
export function bottomBar(el: HTMLElement | null) {
  if (!el) return
  observer ??= new ResizeObserver(publish)
  bars.add(el)
  observer.observe(el, { box: 'border-box' })
  publish()
  return () => {
    bars.delete(el)
    observer?.unobserve(el)
    publish()
  }
}
