export type Settings = {
  f: string
  g: string
  /** Parameter T */
  T: string
  /** Darstellungsbereich in Vielfachen von T */
  a: string
  b: string
}

/** Ein Text in beiden Sprachen der App. */
export type Localized = { de: string; en: string }

export type Preset = { name: Localized; f: string; g: string; a: number; b: number }

export const PRESETS: Preset[] = [
  { name: { de: 'Rechteck ∗ Rechteck', en: 'Rectangle ∗ rectangle' }, f: 'rect(t/T)', g: 'rect(t/T)', a: -2, b: 2 },
  { name: { de: 'Rechteck ∗ Dreieck', en: 'Rectangle ∗ triangle' }, f: 'rect(t/T)', g: 'tri(t/T)', a: -2.5, b: 2.5 },
  { name: { de: 'Rechteck ∗ Exp-Abfall', en: 'Rectangle ∗ exp. decay' }, f: 'rect(t/T)', g: 'u(t)*exp(-2t/T)', a: -1.5, b: 2.5 },
  { name: { de: 'Exp-Abfall ∗ Rechteck', en: 'Exp. decay ∗ rectangle' }, f: 'u(t)*exp(-2t/T)', g: 'rect(t/T-0.5)', a: -1.5, b: 3 },
  { name: { de: 'Gauß ∗ Gauß', en: 'Gaussian ∗ Gaussian' }, f: 'exp(-8(t/T)^2)', g: 'exp(-8(t/T)^2)', a: -2, b: 2 },
  { name: { de: 'Rampe ∗ Rechteck', en: 'Ramp ∗ rectangle' }, f: '(t>0)*(t<T)*t/T', g: 'rect(t/T)', a: -1.5, b: 2.5 },
  { name: { de: 'Sinus ∗ Rechteck', en: 'Sine ∗ rectangle' }, f: 'sin(2pi t/T)*(abs(t)<2T)', g: 'rect(2t/T)', a: -3, b: 3 },
  {
    name: { de: 'Rechteck ∗ Doppelrechteck', en: 'Rectangle ∗ double rectangle' },
    f: 'rect(t/T)',
    g: 'rect((t-T/2)/T) - 2*rect((t-3T/4)/(T/2))',
    a: -1.5,
    b: 2.5,
  },
  { name: { de: 'Sprung ∗ Dirac-Paar', en: 'Step ∗ Dirac pair' }, f: 'sigma(t)', g: 'delta(t) - delta(t-T)', a: -1.5, b: 2.5 },
  { name: { de: 'RC-Glied ∗ Sprung', en: 'RC circuit ∗ step' }, f: 'u(t)*exp(-t/T)/T', g: 'u(t)', a: -1, b: 5 },
  { name: { de: 'Rechteck ∗ Dirac-Kamm', en: 'Rectangle ∗ Dirac comb' }, f: 'rect(2t/T)', g: 'delta(t) + delta(t-T) + delta(t-2T)', a: -1, b: 3 },
]

/**
 * Das Beispiel, mit dem die Anleitung beginnt: g ist unsymmetrisch, damit das Spiegeln zu sehen
 * ist.
 */
export const GUIDE_PRESET = PRESETS[2]

/** Das Beispiel, dem die Einstellungen entsprechen (bei T beliebig), sonst null. */
export function matchPreset(s: Settings): Preset | null {
  return (
    PRESETS.find(
      (p) => p.f === s.f.trim() && p.g === s.g.trim() && p.a === parseNumber(s.a) && p.b === parseNumber(s.b),
    ) ?? null
  )
}

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
