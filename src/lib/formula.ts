import { create, parseDependencies, type MathNode } from 'mathjs'

/**
 * Formeln werden mit dem Parser von mathjs gelesen (implizite Multiplikation, Vergleiche,
 * Bedingungen, saubere Fehlermeldungen) und anschließend in verschachtelte JS-Funktionen übersetzt.
 * Der Übersetzer kennt nur eine feste Liste von Knotentypen, Operatoren, Funktionen und Symbolen –
 * alles andere wird abgelehnt. Dadurch ist die Auswertung schnell genug für 60 fps und
 * trotzdem sicher (kein beliebiger Code, kein eval).
 */
const math = create({ parseDependencies })

export type Scope = Record<string, (...args: number[]) => number>

const rect = (x: number) => {
  const a = Math.abs(x)
  return a < 0.5 ? 1 : a === 0.5 ? 0.5 : 0
}
const step = (x: number) => (x >= 0 ? 1 : 0)

/** Gemeinsame Funktionen; delta/dirac kommen pro Auswertungsmodus dazu. */
const BASE: Scope = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
  atan2: Math.atan2, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  exp: Math.exp, log: Math.log, ln: Math.log, log10: Math.log10, log2: Math.log2,
  sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, sign: Math.sign,
  floor: Math.floor, ceil: Math.ceil, round: Math.round,
  min: Math.min, max: Math.max, pow: Math.pow,
  mod: (a, b) => ((a % b) + b) % b,
  rect,
  tri: (x) => Math.max(0, 1 - Math.abs(x)),
  u: step, sigma: step, step, heaviside: step,
  sinc: (x) => (x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x)),
  gauss: (x) => Math.exp(-Math.PI * x * x),
}

/** Erlaubte Funktionen mit [minArgs, maxArgs]. */
const ARITY: Record<string, [number, number]> = {
  atan2: [2, 2], pow: [2, 2], mod: [2, 2], min: [1, Infinity], max: [1, Infinity],
  delta: [1, 1], dirac: [1, 1],
}
const FUNCTIONS = new Set([...Object.keys(BASE), 'delta', 'dirac'])

const CONSTANTS: Record<string, number> = { pi: Math.PI, PI: Math.PI, e: Math.E, E: Math.E }
const VARIABLES = new Set(['t', 'x', 'tau'])

/** Halbbreite des Ersatz-Impulses im Pulsmodus (wird von findImpulses gesetzt). */
let pulseHalfWidth = 0.01
export function setPulseHalfWidth(h: number) {
  pulseHalfWidth = h
}

/** Regulärer Teil: Dirac-Impulse zählen als 0. */
export const SCOPE_REGULAR: Scope = { ...BASE, delta: () => 0, dirac: () => 0 }
/** Pulsmodus: Dirac als schmales Dreieck der Fläche 1. */
export const SCOPE_PULSE: Scope = {
  ...BASE,
  delta: (x) => Math.max(0, 1 - Math.abs(x) / pulseHalfWidth) / pulseHalfWidth,
  dirac: (x) => Math.max(0, 1 - Math.abs(x) / pulseHalfWidth) / pulseHalfWidth,
}

export class FormulaError extends Error {}

/** Übersetzte Formel an der Stelle x; T und die Funktionsumgebung sind fest eingebunden. */
type Ev = (x: number) => number
/** Übersetzter Teilausdruck; k ist sein Wert, wenn er nicht von x abhängt. */
type Out = { ev: Ev; k?: number }

const konst = (v: number): Out => ({ ev: () => v, k: v })
/** Hängt kein Teil von x ab (und ist der Knoten rein), wird er einmal vorab ausgerechnet. */
const fold = (ev: Ev, parts: Out[], pure = true): Out =>
  pure && parts.every((p) => p.k !== undefined) ? konst(ev(0)) : { ev }

/** Grundrechenarten: allgemein, mit konstantem rechten und mit konstantem linken Operanden. */
const ARITH: Record<string, [(a: Ev, b: Ev) => Ev, (a: Ev, k: number) => Ev, (k: number, b: Ev) => Ev]> = {
  add: [(a, b) => (x) => a(x) + b(x), (a, k) => (x) => a(x) + k, (k, b) => (x) => k + b(x)],
  subtract: [(a, b) => (x) => a(x) - b(x), (a, k) => (x) => a(x) - k, (k, b) => (x) => k - b(x)],
  multiply: [(a, b) => (x) => a(x) * b(x), (a, k) => (x) => a(x) * k, (k, b) => (x) => k * b(x)],
  divide: [(a, b) => (x) => a(x) / b(x), (a, k) => (x) => a(x) / k, (k, b) => (x) => k / b(x)],
}
ARITH.dotMultiply = ARITH.multiply
ARITH.dotDivide = ARITH.divide

function arith(fn: string, a: Out, b: Out): Ev {
  const [both, right, left] = ARITH[fn]
  if (b.k !== undefined) return right(a.ev, b.k)
  if (a.k !== undefined) return left(a.k, b.ev)
  return both(a.ev, b.ev)
}

const BINARY: Record<string, (a: Ev, b: Ev, M: Scope) => Ev> = {
  pow: (a, b, M) => {
    const pow = M.pow
    return (x) => pow(a(x), b(x))
  },
  mod: (a, b, M) => {
    const mod = M.mod
    return (x) => mod(a(x), b(x))
  },
  and: (a, b) => (x) => +(!!a(x) && !!b(x)),
  or: (a, b) => (x) => +(!!a(x) || !!b(x)),
  xor: (a, b) => (x) => +(!a(x) !== !b(x)),
  smaller: (a, b) => (x) => +(a(x) < b(x)),
  larger: (a, b) => (x) => +(a(x) > b(x)),
  smallerEq: (a, b) => (x) => +(a(x) <= b(x)),
  largerEq: (a, b) => (x) => +(a(x) >= b(x)),
  equal: (a, b) => (x) => +(a(x) === b(x)),
  unequal: (a, b) => (x) => +(a(x) !== b(x)),
}
BINARY.dotPow = BINARY.pow

const COMPARE: Record<string, (a: number, b: number) => boolean> = {
  smaller: (a, b) => a < b,
  larger: (a, b) => a > b,
  smallerEq: (a, b) => a <= b,
  largerEq: (a, b) => a >= b,
  equal: (a, b) => a === b,
  unequal: (a, b) => a !== b,
}

const UNARY: Record<string, (a: Ev) => Ev> = {
  unaryMinus: (a) => (x) => -a(x),
  unaryPlus: (a) => a,
  not: (a) => (x) => +!a(x),
}

function fnName(node: MathNode): string {
  const fn = (node as unknown as { fn: MathNode }).fn
  if (fn && fn.type === 'SymbolNode') return (fn as unknown as { name: string }).name
  throw new FormulaError('Ungültiger Funktionsaufruf.')
}

function call(f: (...args: number[]) => number, args: Ev[]): Ev {
  if (args.length === 1) {
    const [a] = args
    return (x) => f(a(x))
  }
  if (args.length === 2) {
    const [a, b] = args
    return (x) => f(a(x), b(x))
  }
  return (x) => f(...args.map((a) => a(x)))
}

/**
 * Übersetzt einen mathjs-Knoten in verschachtelte JS-Funktionen von x. Kein Quelltext, kein
 * new Function: die Content-Security-Policy kommt so ohne 'unsafe-eval' aus.
 */
function gen(node: MathNode, T: number, M: Scope): Out {
  const n = node as unknown as Record<string, unknown>
  switch (node.type) {
    case 'ConstantNode': {
      const v = n.value
      if (typeof v === 'number' && Number.isFinite(v)) return konst(v)
      if (typeof v === 'boolean') return konst(v ? 1 : 0)
      throw new FormulaError('Nur Zahlen sind als Konstanten erlaubt.')
    }
    case 'SymbolNode': {
      const name = n.name as string
      if (VARIABLES.has(name)) return { ev: (x) => x }
      if (name === 'T') return konst(T)
      if (Object.hasOwn(CONSTANTS, name)) return konst(CONSTANTS[name])
      if (FUNCTIONS.has(name)) throw new FormulaError(`${name} braucht ein Argument, z. B. ${name}(t).`)
      throw new FormulaError(`Unbekannt: ${name}`)
    }
    case 'ParenthesisNode':
      return gen(n.content as MathNode, T, M)
    case 'OperatorNode': {
      const fn = n.fn as string
      const args = (n.args as MathNode[]).map((a) => gen(a, T, M))
      if (Object.hasOwn(ARITH, fn) && args.length === 2) return fold(arith(fn, args[0], args[1]), args)
      if (Object.hasOwn(BINARY, fn) && args.length === 2) return fold(BINARY[fn](args[0].ev, args[1].ev, M), args)
      if (Object.hasOwn(UNARY, fn) && args.length === 1) return fold(UNARY[fn](args[0].ev), args)
      throw new FormulaError(`Operator „${n.op as string}“ wird nicht unterstützt.`)
    }
    case 'FunctionNode': {
      const name = fnName(node)
      if (!FUNCTIONS.has(name)) throw new FormulaError(`Unbekannte Funktion: ${name}`)
      const args = (n.args as MathNode[]).map((a) => gen(a, T, M))
      const [lo, hi] = ARITY[name] ?? [1, 1]
      if (args.length < lo || args.length > hi) {
        throw new FormulaError(
          lo === hi
            ? `${name} erwartet ${lo} Argument${lo === 1 ? '' : 'e'}.`
            : `${name} erwartet mindestens ${lo} Argument.`,
        )
      }
      // delta liest die Pulsbreite erst beim Aufruf, darf also nicht vorab ausgerechnet werden
      const ev = call(M[name], args.map((a) => a.ev))
      return fold(ev, args, name !== 'delta' && name !== 'dirac')
    }
    case 'ConditionalNode': {
      const c = gen(n.condition as MathNode, T, M)
      const a = gen(n.trueExpr as MathNode, T, M)
      const b = gen(n.falseExpr as MathNode, T, M)
      if (c.k !== undefined) return c.k ? a : b
      const [ce, ae, be] = [c.ev, a.ev, b.ev]
      return { ev: (x) => (ce(x) ? ae(x) : be(x)) }
    }
    case 'RelationalNode': {
      // 0 < t < T
      const params = (n.params as MathNode[]).map((p) => gen(p, T, M))
      const cmps = (n.conditionals as string[]).map((c) => {
        if (!Object.hasOwn(COMPARE, c)) throw new FormulaError('Vergleich wird nicht unterstützt.')
        return COMPARE[c]
      })
      const evs = params.map((p) => p.ev)
      const ev: Ev = (x) => {
        let left = evs[0](x)
        for (let i = 0; i < cmps.length; i++) {
          const right = evs[i + 1](x)
          if (!cmps[i](left, right)) return 0
          left = right
        }
        return 1
      }
      return fold(ev, params)
    }
  }
  throw new FormulaError('Dieser Ausdruck wird nicht unterstützt.')
}

/** Vereinheitlicht Unicode-Schreibweisen, damit mathjs sie versteht. */
function normalize(src: string): string {
  return src
    .replace(/τ/g, 'tau')
    .replace(/δ/g, 'delta')
    .replace(/σ/g, 'sigma')
    .replace(/π/g, 'pi')
    .replace(/[·×⋅]/g, '*')
    .replace(/[−–]/g, '-')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/≠/g, '!=')
    .replace(/&&/g, ' and ')
    .replace(/\|\|/g, ' or ')
}

const TEX_FN: Record<string, string> = {
  rect: '\\operatorname{rect}', tri: '\\operatorname{tri}', sinc: '\\operatorname{sinc}',
  gauss: '\\operatorname{gauss}', sigma: '\\sigma', u: 'u', step: '\\sigma', heaviside: '\\sigma',
  delta: '\\delta', dirac: '\\delta', ln: '\\ln', sign: '\\operatorname{sgn}',
}

function texHandler(node: MathNode, options: object): string | undefined {
  const n = node as unknown as Record<string, unknown>
  if (node.type === 'SymbolNode') {
    // mathjs hält t und T sonst für Einheiten (Tonne, Tesla) und setzt sie aufrecht
    if (n.name === 'tau') return '\\tau'
    if (n.name === 'x' || n.name === 't') return 't'
    if (n.name === 'T') return 'T'
  }
  if (node.type === 'FunctionNode') {
    const fn = n.fn as { name?: string }
    const name = fn?.name
    if (name && name in TEX_FN) {
      const args = (n.args as MathNode[]).map((a) => a.toTex(options)).join(',')
      return `${TEX_FN[name]}\\!\\left(${args}\\right)`
    }
  }
  return undefined
}

export type CompiledFormula = {
  /** Funktion von x für festes T und eine Funktionsumgebung (SCOPE_REGULAR / SCOPE_PULSE). */
  at: (T: number, M: Scope) => (x: number) => number
  /** Auswertung an einer Stelle (für Einzelwerte; für viele Stellen at verwenden). */
  evaluate: (x: number, T: number, M: Scope) => number
  /** Enthält Dirac-Impulse? */
  hasImpulses: boolean
  tex: string
}

export function compileFormula(src: string): CompiledFormula {
  const s = normalize(String(src)).trim()
  if (!s) throw new FormulaError('Bitte eine Funktion eingeben.')
  let node: MathNode
  try {
    node = math.parse(s)
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    const m = /\(char (\d+)\)/.exec(msg)
    throw new FormulaError(
      m ? `Formel fehlerhaft bei Zeichen ${m[1]}.` : 'Formel unvollständig oder fehlerhaft.',
    )
  }
  const parsed = node
  const at = (T: number, M: Scope) => {
    const raw = gen(parsed, T, M).ev
    return (x: number) => {
      const v = raw(x)
      return Number.isFinite(v) ? v : 0
    }
  }
  at(1, SCOPE_REGULAR) // Fehler schon hier melden, nicht erst beim Zeichnen
  const evaluate = (x: number, T: number, M: Scope) => at(T, M)(x)
  let tex = ''
  try {
    tex = node.toTex({ handler: texHandler, implicit: 'hide', parenthesis: 'keep' })
  } catch {
    tex = ''
  }
  let hasImpulses = false
  node.traverse((c) => {
    if (c.type === 'FunctionNode') {
      const name = (c as unknown as { fn: { name?: string } }).fn?.name
      if (name === 'delta' || name === 'dirac') hasImpulses = true
    }
  })
  return { at, evaluate, hasImpulses, tex }
}

/** Eine an den Parameter T gebundene Funktion, wie sie Rechnung und Zeichnung brauchen. */
export type BoundFn = {
  /** regulärer Teil (Impulse = 0) */
  reg: (x: number) => number
  /** mit Impulsen als schmale Dreiecke */
  full: (x: number) => number
  imp: boolean
}

export function bind(c: CompiledFormula, T: number): BoundFn {
  return {
    reg: c.at(T, SCOPE_REGULAR),
    full: c.at(T, SCOPE_PULSE),
    imp: c.hasImpulses,
  }
}
