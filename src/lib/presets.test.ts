import { describe, expect, it } from 'vitest'

import { DEFAULT_SETTINGS, matchPreset, PRESETS } from './presets'

describe('matchPreset', () => {
  it('erkennt ein Beispiel unabhängig von T und Schreibweise der Zahlen', () => {
    const p = PRESETS[1]
    expect(matchPreset({ f: p.f, g: p.g, T: '2', a: String(p.a).replace('.', ','), b: String(p.b) })).toBe(p)
    expect(matchPreset(DEFAULT_SETTINGS)).toBe(PRESETS[0])
  })

  it('liefert null für eigene Funktionen', () => {
    expect(matchPreset({ ...DEFAULT_SETTINGS, g: 'tri(t/T)' })).toBeNull()
  })
})
