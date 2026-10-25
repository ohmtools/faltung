import { describe, expect, it } from 'vitest'

import { computeConvolution, convAt } from './convolution'
import { bind, compileFormula } from './formula'

const fn = (src: string, T = 1) => bind(compileFormula(src), T)

describe('computeConvolution', () => {
  it('Rechteck ∗ Rechteck ergibt T·tri(t/T)', () => {
    for (const T of [1, 2]) {
      const r = computeConvolution(fn('rect(t/T)', T), fn('rect(t/T)', T), T, -2 * T, 2 * T)
      expect(r.convInT).toBe(true)
      expect(convAt(r, 0)).toBeCloseTo(T, 2)
      expect(convAt(r, 0.5 * T)).toBeCloseTo(0.5 * T, 2)
      expect(convAt(r, 1.5 * T)).toBeCloseTo(0, 6)
    }
  })

  it('Gauß ∗ Gauß ergibt breiteren Gauß', () => {
    // gauss(t) ∗ gauss(t) = gauss(t/√2)/√2
    const r = computeConvolution(fn('gauss(t)'), fn('gauss(t)'), 1, -3, 3)
    expect(convAt(r, 0)).toBeCloseTo(1 / Math.SQRT2, 3)
    expect(convAt(r, 1)).toBeCloseTo(Math.exp(-Math.PI / 2) / Math.SQRT2, 3)
  })

  it('Sprung ∗ Dirac-Paar ergibt Rechteck auf [0, T)', () => {
    const r = computeConvolution(fn('sigma(t)'), fn('delta(t) - delta(t-T)'), 1, -1.5, 2.5)
    expect(r.convInT).toBe(false)
    expect(r.gImp).toHaveLength(2)
    expect(r.gImp[0].p).toBeCloseTo(0, 6)
    expect(r.gImp[0].w).toBeCloseTo(1, 6)
    expect(r.gImp[1].p).toBeCloseTo(1, 6)
    expect(r.gImp[1].w).toBeCloseTo(-1, 6)
    expect(convAt(r, -0.5)).toBeCloseTo(0, 6)
    expect(convAt(r, 0.5)).toBeCloseTo(1, 6)
    expect(convAt(r, 1.5)).toBeCloseTo(0, 6)
  })

  it('Dirac ∗ Dirac ergibt einen Impuls an der Summe der Orte', () => {
    const r = computeConvolution(fn('2delta(t-0.5)'), fn('delta(t-1)'), 1, -1, 3)
    expect(r.convImp).toHaveLength(1)
    expect(r.convImp[0].p).toBeCloseTo(1.5, 6)
    expect(r.convImp[0].w).toBeCloseTo(2, 6)
  })

  it('setzt einen knappen y-Bereich: unten bei 0, oben wenig Luft', () => {
    const r = computeConvolution(fn('rect(t)'), fn('rect(t)'), 1, -2, 2)
    expect(r.ymin).toBe(0)
    expect(r.ymax).toBeGreaterThan(1)
    expect(r.ymax).toBeLessThan(1.1)
    expect(r.cmin).toBe(0)
    expect(r.cmax).toBeGreaterThan(1)
    expect(r.cmax).toBeLessThan(1.1)
  })

  it('geht unter 0, wenn etwas negativ wird', () => {
    const r = computeConvolution(fn('sin(2pi t)*(abs(t)<2)'), fn('rect(2t)'), 1, -3, 3)
    expect(r.ymin).toBeLessThan(-1)
    expect(r.cmin).toBeLessThan(0)
  })
})
