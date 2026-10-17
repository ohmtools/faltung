// Die `desktop`-Variante aus index.css als Media-Query, für die wenigen Stellen, die sie im
// Script brauchen: beide Spalten nebeneinander, keine Tab-Leiste.
export const DESKTOP_QUERY = '(width >= 64rem) and (height >= 600px)'

export function isDesktop(): boolean {
  return matchMedia(DESKTOP_QUERY).matches
}
