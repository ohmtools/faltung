import { create, parseDependencies, type MathNode } from 'mathjs'

/**
 * Formeln werden mit dem Parser von mathjs gelesen (implizite Multiplikation, Vergleiche,
 * Bedingungen, saubere Fehlermeldungen) und anschließend in eine native JS-Funktion übersetzt.
 * Der Übersetzer kennt nur eine feste Liste von Knotentypen, Operatoren, Funktionen und Symbolen –
 * alles andere wird abgelehnt. Dadurch ist die Auswertung schnell genug für 60 fps und
 * trotzdem sicher (kein beliebiger Code).
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

const BINARY: Record<string, string> = {
  add: '+', subtract: '-', multiply: '*', dotMultiply: '*', divide: '/', dotDivide: '/',
}
const COMPARE: Record<string, string> = {
  smaller: '<', larger: '>', smallerEq: '<=', largerEq: '>=', equal: '===', unequal: '!==',
}

function fnName(node: MathNode): string {
  const fn = (node as unknown as { fn: MathNode }).fn
  if (fn && fn.type === 'SymbolNode') return (fn as unknown as { name: string }).name
  throw new FormulaError('Ungültiger Funktionsaufruf.')
}

/** Übersetzt einen mathjs-Knoten in einen JS-Ausdruck über (x, T, M). */
function gen(node: MathNode): string {
  const n = node as unknown as Record<string, unknown>
  switch (node.type) {
    case 'ConstantNode': {
      const v = n.value
      if (typeof v === 'number' && Number.isFinite(v)) return `(${v})`
      if (typeof v === 'boolean') return v ? '1' : '0'
      throw new FormulaError('Nur Zahlen sind als Konstanten erlaubt.')
    }
    case 'SymbolNode': {
      const name = n.name as string
      if (VARIABLES.has(name)) return 'x'
      if (name === 'T') return 'T'
      if (name in CONSTANTS) return `(${CONSTANTS[name]})`
      if (FUNCTIONS.has(name)) throw new FormulaError(`${name} braucht ein Argument, z. B. ${name}(t).`)
      throw new FormulaError(`Unbekannt: ${name}`)
    }
    case 'ParenthesisNode':
      return `(${gen(n.content as MathNode)})`
    case 'OperatorNode': {
      const fn = n.fn as string
      const args = (n.args as MathNode[]).map(gen)
      if (fn in BINARY && args.length === 2) return `(${args[0]} ${BINARY[fn]} ${args[1]})`
      if (fn in COMPARE && args.length === 2) return `+(${args[0]} ${COMPARE[fn]} ${args[1]})`
      switch (fn) {
        case 'unaryMinus': return `(-${args[0]})`
        case 'unaryPlus': return `(+${args[0]})`
        case 'pow':
        case 'dotPow': return `M.pow(${args[0]}, ${args[1]})`
        case 'mod': return `M.mod(${args[0]}, ${args[1]})`
        case 'and': return `+(!!${args[0]} && !!${args[1]})`
        case 'or': return `+(!!${args[0]} || !!${args[1]})`
        case 'xor': return `+(!${args[0]} !== !${args[1]})`
        case 'not': return `+(!${args[0]})`
      }
      throw new FormulaError(`Operator „${n.op as string}“ wird nicht unterstützt.`)
    }
    case 'FunctionNode': {
      const name = fnName(node)
      if (!FUNCTIONS.has(name)) throw new FormulaError(`Unbekannte Funktion: ${name}`)
      const args = (n.args as MathNode[]).map(gen)
      const [lo, hi] = ARITY[name] ?? [1, 1]
      if (args.length < lo || args.length > hi) {
        throw new FormulaError(
          lo === hi
            ? `${name} erwartet ${lo} Argument${lo === 1 ? '' : 'e'}.`
            : `${name} erwartet mindestens ${lo} Argument.`,
        )
      }
      return `M.${name}(${args.join(', ')})`
    }
    case 'ConditionalNode':
      return `(${gen(n.condition as MathNode)} ? ${gen(n.trueExpr as MathNode)} : ${gen(n.falseExpr as MathNode)})`
    case 'RelationalNode': {
      // 0 < t < T
      const params = (n.params as MathNode[]).map(gen)
      const conds = (n.conditionals as string[]).map((c, i) => {
        if (!(c in COMPARE)) throw new FormulaError('Vergleich wird nicht unterstützt.')
        return `(${params[i]} ${COMPARE[c]} ${params[i + 1]})`
      })
      return `+(${conds.join(' && ')})`
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
  /** Auswertung (x, T, Funktionsumgebung). */
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
  const code = gen(node)
  let raw: (x: number, T: number, M: Scope) => unknown
  try {
    raw = new Function('x', 'T', 'M', `"use strict"; return (${code});`) as typeof raw
  } catch {
    throw new FormulaError('Formel unvollständig oder fehlerhaft.')
  }
  const evaluate = (x: number, T: number, M: Scope) => {
    const v = +(raw(x, T, M) as number)
    return Number.isFinite(v) ? v : 0
  }
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
  return { evaluate, hasImpulses, tex }
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
    reg: (x) => c.evaluate(x, T, SCOPE_REGULAR),
    full: (x) => c.evaluate(x, T, SCOPE_PULSE),
    imp: c.hasImpulses,
  }
}
