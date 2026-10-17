import { describe, expect, it } from 'vitest'

import { bind, compileFormula, FormulaError, SCOPE_REGULAR } from './formula'

const ev = (src: string, x: number, T = 1) => compileFormula(src).evaluate(x, T, SCOPE_REGULAR)

/** Was compileFormula an der Formel bemängelt, sonst null. */
function problem(src: string) {
  try {
    compileFormula(src)
  } catch (e) {
    if (e instanceof FormulaError) return e.problem
    throw e
  }
  return null
}

describe('compileFormula', () => {
  it('wertet Grundfunktionen aus', () => {
    expect(ev('rect(t/T)', 0)).toBe(1)
    expect(ev('rect(t/T)', 0.5)).toBe(0.5)
    expect(ev('rect(t/T)', 0.7)).toBe(0)
    expect(ev('tri(t)', 0.25)).toBeCloseTo(0.75)
    expect(ev('sigma(t)', -0.1)).toBe(0)
    expect(ev('u(t)', 0)).toBe(1)
    expect(ev('sinc(t)', 0)).toBe(1)
  })

  it('versteht implizite Multiplikation und Potenzen', () => {
    expect(ev('2t', 3)).toBe(6)
    expect(ev('exp(-2t/T)', 1, 2)).toBeCloseTo(Math.exp(-1))
    expect(ev('exp(-8(t/T)^2)', 0.5)).toBeCloseTo(Math.exp(-2))
    expect(ev('sin(2pi t/T)', 0.25)).toBeCloseTo(1)
    expect(ev('3T/4', 0, 2)).toBeCloseTo(1.5)
  })

  it('wandelt Vergleiche und Bedingungen in Zahlen', () => {
    expect(ev('(t>0)*(t<T)*t/T', 0.5)).toBeCloseTo(0.5)
    expect(ev('(t>0)*(t<T)*t/T', 1.5)).toBe(0)
    expect(ev('0 < t < T', 0.5)).toBe(1)
    expect(ev('0 < t < T', 2)).toBe(0)
    expect(ev('t > 0 ? t : -t', -3)).toBe(3)
    expect(ev('t > 0 and t < 1', 0.5)).toBe(1)
    expect(ev('t > 0 && t < 1', 2)).toBe(0)
  })

  it('akzeptiert Unicode-Schreibweisen', () => {
    expect(ev('σ(τ)·2', 1)).toBe(2)
    expect(ev('−π', 0)).toBeCloseTo(-Math.PI)
  })

  it('liefert 0 statt NaN/Infinity', () => {
    expect(ev('1/t', 0)).toBe(0)
    expect(ev('sqrt(t)', -1)).toBe(0)
  })

  it('lehnt Unbekanntes ab', () => {
    expect(() => compileFormula('foo(t)')).toThrow(FormulaError)
    expect(problem('y')).toEqual({ kind: 'unknown-symbol', name: 'y' })
    expect(() => compileFormula('t +')).toThrow(FormulaError)
    expect(() => compileFormula('')).toThrow(FormulaError)
    expect(() => compileFormula('"abc"')).toThrow(FormulaError)
    expect(() => compileFormula('a = 3')).toThrow(FormulaError)
    expect(() => compileFormula('constructor')).toThrow(FormulaError)
    expect(problem('rect')).toEqual({ kind: 'needs-argument', name: 'rect' })
    expect(problem('rect(t, 2)')).toEqual({ kind: 'arity', name: 'rect', min: 1, max: 1 })
    expect(problem('t +')).toMatchObject({ kind: 'syntax' })
    expect(problem('')).toEqual({ kind: 'empty' })
  })

  it('erkennt Dirac-Impulse', () => {
    expect(compileFormula('delta(t) - delta(t-T)').hasImpulses).toBe(true)
    expect(compileFormula('rect(t)').hasImpulses).toBe(false)
    const d = bind(compileFormula('delta(t)'), 1)
    expect(d.reg(0)).toBe(0)
  })

  it('erzeugt LaTeX', () => {
    expect(compileFormula('rect(t/T)').tex).toContain('\\operatorname{rect}')
    expect(compileFormula('delta(tau)').tex).toContain('\\delta')
    expect(compileFormula('delta(t-T)').tex).not.toContain('mathrm')
  })
})
