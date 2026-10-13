export type Settings = {
  f: string
  g: string
  /** Parameter T */
  T: string
  /** Darstellungsbereich in Vielfachen von T */
  a: string
  b: string
}

export type Preset = { name: string; f: string; g: string; a: number; b: number }

export const PRESETS: Preset[] = [
  { name: 'Rechteck ∗ Rechteck', f: 'rect(t/T)', g: 'rect(t/T)', a: -2, b: 2 },
  { name: 'Rechteck ∗ Dreieck', f: 'rect(t/T)', g: 'tri(t/T)', a: -2.5, b: 2.5 },
  { name: 'Exp-Abfall ∗ Rechteck', f: 'u(t)*exp(-2t/T)', g: 'rect(t/T-0.5)', a: -1.5, b: 3 },
  { name: 'Gauß ∗ Gauß', f: 'exp(-8(t/T)^2)', g: 'exp(-8(t/T)^2)', a: -2, b: 2 },
  { name: 'Rampe ∗ Rechteck', f: '(t>0)*(t<T)*t/T', g: 'rect(t/T)', a: -1.5, b: 2.5 },
  { name: 'Sinus ∗ Rechteck', f: 'sin(2pi t/T)*(abs(t)<2T)', g: 'rect(2t/T)', a: -3, b: 3 },
  {
    name: 'Rechteck ∗ Doppelrechteck',
    f: 'rect(t/T)',
    g: 'rect((t-T/2)/T) - 2*rect((t-3T/4)/(T/2))',
    a: -1.5,
    b: 2.5,
  },
  { name: 'Sprung ∗ Dirac-Paar', f: 'sigma(t)', g: 'delta(t) - delta(t-T)', a: -1.5, b: 2.5 },
  { name: 'RC-Glied ∗ Sprung', f: 'u(t)*exp(-t/T)/T', g: 'u(t)', a: -1, b: 5 },
  { name: 'Rechteck ∗ Dirac-Kamm', f: 'rect(2t/T)', g: 'delta(t) + delta(t-T) + delta(t-2T)', a: -1, b: 3 },
]

/** Zahl aus einer Eingabe; akzeptiert Dezimalkomma und typografisches Minus. */
export function parseNumber(s: string): number {
  const v = s.trim().replace(',', '.').replace(/[−–]/g, '-')
  return v === '' ? NaN : Number(v)
}

export const DEFAULT_SETTINGS: Settings = { f: 'rect(t/T)', g: 'rect(t/T)', T: '1', a: '-2', b: '2' }

/** Zustand ↔ URL-Hash, damit sich Konfigurationen als Link teilen lassen. */
export function settingsToHash(s: Settings): string {
  const p = new URLSearchParams({ f: s.f, g: s.g, T: s.T, a: s.a, b: s.b })
  return '#' + p.toString()
}

export function settingsFromHash(hash: string): Settings | null {
  if (!hash || hash.length < 2) return null
  const p = new URLSearchParams(hash.slice(1))
  if (!p.has('f') || !p.has('g')) return null
  return {
    f: p.get('f') ?? DEFAULT_SETTINGS.f,
    g: p.get('g') ?? DEFAULT_SETTINGS.g,
    T: p.get('T') ?? DEFAULT_SETTINGS.T,
    a: p.get('a') ?? DEFAULT_SETTINGS.a,
    b: p.get('b') ?? DEFAULT_SETTINGS.b,
  }
}
