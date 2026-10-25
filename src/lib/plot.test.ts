import { describe, expect, it } from 'vitest'

import { fmt, fmtT, toCanvasColor } from './plot'

const rgba = (s: string) => s.match(/[\d.]+/g)!.map(Number)

describe('toCanvasColor', () => {
  it('rechnet oklch in sRGB um', () => {
    expect(toCanvasColor('oklch(1 0 0)')).toBe('rgba(255, 255, 255, 1)')
    expect(rgba(toCanvasColor('oklch(0.145 0 0)'))).toEqual([10, 10, 10, 1])
    // Tailwind red-600 = #e7000b, blue-600 = #155dfc
    const [r, g, b] = rgba(toCanvasColor('oklch(0.577 0.245 27.325)'))
    expect(Math.abs(r - 231) + Math.abs(g - 0) + Math.abs(b - 11)).toBeLessThanOrEqual(3)
    const [r2, g2, b2] = rgba(toCanvasColor('oklch(0.546 0.245 262.881)'))
    expect(Math.abs(r2 - 21) + Math.abs(g2 - 93) + Math.abs(b2 - 252)).toBeLessThanOrEqual(3)
  })

  it('übernimmt Transparenz', () => {
    expect(rgba(toCanvasColor('oklch(1 0 0 / 10%)'))[3]).toBeCloseTo(0.1)
    expect(rgba(toCanvasColor('oklch(0.828 0.189 84.429 / 0.5)'))[3]).toBeCloseTo(0.5)
  })

  it('ersetzt die Deckkraft auf Wunsch', () => {
    expect(rgba(toCanvasColor('oklch(0.808 0.114 19.571)', 0.45))[3]).toBeCloseTo(0.45)
    expect(rgba(toCanvasColor('oklch(1 0 0 / 10%)', 1))[3]).toBe(1)
  })

  it('lässt andere Farben unverändert', () => {
    expect(toCanvasColor('#ff0000')).toBe('#ff0000')
    expect(toCanvasColor('rgb(1, 2, 3)')).toBe('rgb(1, 2, 3)')
  })
})

describe('Zahlen an den Achsen', () => {
  it('schreiben das Dezimalzeichen der Sprache und ein echtes Minus', () => {
    expect(fmt(0.8, 0.2)).toBe('0.8')
    expect(fmt(0.8, 0.2, ',')).toBe('0,8')
    expect(fmt(-0.25, 0.05, ',')).toBe('−0,25')
    expect(fmt(2, 1, ',')).toBe('2')
  })

  it('schreiben Vielfache von T als Bruch, sonst mit dem Dezimalzeichen', () => {
    expect(fmtT(0)).toBe('0')
    expect(fmtT(1, ',')).toBe('T')
    expect(fmtT(-1.5, ',')).toBe('−3T/2')
    expect(fmtT(0.2, ',')).toBe('0,2T')
    expect(fmtT(0.2)).toBe('0.2T')
  })
})
