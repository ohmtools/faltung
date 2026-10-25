import { setPulseHalfWidth, type BoundFn } from './formula'

export type Impulse = { p: number; w: number }

export type ConvolutionResult = {
  f: BoundFn
  g: BoundFn
  Tp: number
  xmin: number
  xmax: number
  /** Anzahl Intervalle auf [xmin, xmax] */
  NT: number
  h: number
  conv: Float64Array
  fImp: Impulse[]
  gImp: Impulse[]
  convImp: Impulse[]
  /** Ohne Impulse hat f∗g die Einheit Amplitude·Zeit → Achse in Vielfachen von T. */
  convInT: boolean
  cScale: number
  /** Wertebereich des Plots: knapp über dem Größten, unten bei 0, außer es wird negativ */
  ymin: number
  ymax: number
  /** dasselbe nur für das Ergebnis (Ergebnisplot der Anleitung, Zeitleiste) */
  cmin: number
  cmax: number
}

/**
 * Dirac-Impulse finden: Differenz Pulsmodus − regulär; zusammenhängende Stücke liefern
 * Ort (Schwerpunkt) und Gewicht (Fläche).
 */
export function findImpulses(fn: BoundFn, start: number, h: number, count: number): Impulse[] {
  // breit genug, dass auch delta(2t) o. Ä. sauber abgetastet wird
  setPulseHalfWidth(4 * h)
  const out: Impulse[] = []
  let s = 0
  let sx = 0
  let on = false
  const flush = () => {
    if (on && Math.abs(s * h) > 1e-9) out.push({ p: sx / s, w: s * h })
    s = 0
    sx = 0
    on = false
  }
  for (let m = 0; m < count; m++) {
    const x = start + m * h
    const d = fn.full(x) - fn.reg(x)
    if (Math.abs(d) > 1e-9) {
      s += d
      sx += d * x
      on = true
    } else flush()
  }
  flush()
  return out
}

export function computeConvolution(
  f: BoundFn,
  g: BoundFn,
  Tp: number,
  xmin: number,
  xmax: number,
  NT = 1000,
): ConvolutionResult {
  const span = xmax - xmin
  const h = span / NT
  const a = xmin - 2 * span // Integrationsbereich: zwei Breiten links und rechts zusätzlich
  const N = Math.round((5 * span) / h) + 1
  const F = new Float64Array(N)
  for (let i = 0; i < N; i++) F[i] = f.reg(a + i * h)
  const c = xmin - a - (N - 1) * h // g auf Gitter: Index m = k + N−1−i entspricht t_k − τ_i
  const G = new Float64Array(NT + N)
  for (let m = 0; m < NT + N; m++) G[m] = g.reg(c + m * h)
  const fImp = f.imp ? findImpulses(f, a, h, N) : []
  const gImp = g.imp ? findImpulses(g, c, h, NT + N) : []

  const conv = new Float64Array(NT + 1)
  for (let i = 0; i < N; i++) {
    const fi = F[i]
    if (fi === 0) continue
    const base = N - 1 - i
    for (let k = 0; k <= NT; k++) conv[k] += fi * G[k + base]
  }
  for (let k = 0; k <= NT; k++) conv[k] *= h
  // Impulsanteile exakt: f ∗ w·δ(t−p) = w·f(t−p)
  for (const d of gImp) for (let k = 0; k <= NT; k++) conv[k] += d.w * f.reg(xmin + k * h - d.p)
  for (const d of fImp) for (let k = 0; k <= NT; k++) conv[k] += d.w * g.reg(xmin + k * h - d.p)
  const convImp: Impulse[] = []
  for (const p of fImp) for (const q of gImp) convImp.push({ p: p.p + q.p, w: p.w * q.w })

  const convInT = !fImp.length && !gImp.length
  const cScale = convInT ? Tp : 1

  // y-Bereich aus allem, was sichtbar wird
  let lo = 0
  let hi = 0
  const ext = (v: number) => {
    lo = Math.min(lo, v)
    hi = Math.max(hi, v)
  }
  let fLo = 0
  let fHi = 0
  let gLo = 0
  let gHi = 0
  const i0 = Math.round((xmin - a) / h)
  const i1 = Math.round((xmax - a) / h)
  for (let i = i0; i <= i1; i++) {
    fLo = Math.min(fLo, F[i])
    fHi = Math.max(fHi, F[i])
  }
  for (let m = 0; m < NT + N; m++) {
    const u = c + m * h
    if (u >= -span && u <= span) {
      gLo = Math.min(gLo, G[m])
      gHi = Math.max(gHi, G[m])
    }
  }
  ext(fLo)
  ext(fHi)
  ext(gLo)
  ext(gHi)
  let cLo = 0
  let cHi = 0
  for (let k = 0; k <= NT; k++) {
    const v = conv[k] / cScale
    cLo = Math.min(cLo, v)
    cHi = Math.max(cHi, v)
  }
  for (const d of convImp) {
    if (d.p < xmin || d.p > xmax) continue
    cLo = Math.min(cLo, d.w / cScale)
    cHi = Math.max(cHi, d.w / cScale)
  }
  ext(cLo)
  ext(cHi)
  for (const d of fImp) {
    if (d.p >= xmin && d.p <= xmax) ext(d.w)
    ext(d.w * gLo)
    ext(d.w * gHi)
  }
  for (const d of gImp) {
    ext(d.w)
    ext(d.w * fLo)
    ext(d.w * fHi)
  }
  if (hi - lo < 1e-9) hi = lo + 1
  if (cHi - cLo < 1e-9) cHi = cLo + 1
  // Knapp: oben etwas Luft für den Punkt des Abspielkopfs, unten keine, solange nichts negativ ist
  const pad = (hi - lo) * 0.05
  const cPad = (cHi - cLo) * 0.05

  return {
    f, g, Tp, xmin, xmax, NT, h, conv, fImp, gImp, convImp, convInT, cScale,
    ymax: hi + pad,
    ymin: lo < 0 ? lo - pad : 0,
    cmax: cHi + cPad,
    cmin: cLo < 0 ? cLo - cPad : 0,
  }
}

/** Faltungswert bei t (linear interpoliert, ohne Skalierung). */
export function convAt(r: ConvolutionResult, t: number): number {
  const p = (t - r.xmin) / r.h
  const k = Math.max(0, Math.min(r.NT - 1, Math.floor(p)))
  const fr = Math.max(0, Math.min(1, p - k))
  return r.conv[k] * (1 - fr) + r.conv[k + 1] * fr
}
