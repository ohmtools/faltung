import { describe, expect, it } from 'vitest'

import { cubicBezier, ease } from './motion'

describe('cubicBezier', () => {
  it('beginnt bei 0 und endet bei 1', () => {
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
    expect(ease(-1)).toBe(0)
    expect(ease(2)).toBe(1)
  })

  it('ist monoton und schnell los, sanft am Ziel', () => {
    let last = 0
    for (let i = 1; i <= 100; i++) {
      const y = ease(i / 100)
      expect(y).toBeGreaterThanOrEqual(last)
      last = y
    }
    // cubic-bezier(0.2, 0, 0, 1): nach einem Viertel der Zeit gut die Hälfte des Wegs
    expect(ease(0.25)).toBeGreaterThan(0.5)
    expect(ease(0.9)).toBeGreaterThan(0.99)
  })

  it('ist für linear die Gerade', () => {
    const linear = cubicBezier(1 / 3, 1 / 3, 2 / 3, 2 / 3)
    for (const x of [0.1, 0.37, 0.5, 0.92]) expect(linear(x)).toBeCloseTo(x, 6)
  })
})
