import { convAt, type ConvolutionResult } from './convolution'

export type PlotColors = {
  grid: string
  axis: string
  tick: string
  f: string
  g: string
  area: string
  areaLine: string
  conv: string
  rest: string
  red: string
  mono: string
  /** Dezimalzeichen der Zahlen an den Achsen, wie bei den Werten der Seite („0,8“ auf Deutsch) */
  decimal: string
}

/**
 * oklch(L C H [/ A]) → rgba(), da nicht jede Canvas-Implementierung oklch versteht. `alpha`
 * ersetzt die Deckkraft der Farbe.
 */
export function toCanvasColor(css: string, alpha?: number): string {
  const m = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/i.exec(css)
  if (!m) return css
  const L = parseFloat(m[1]) / (m[2] ? 100 : 1)
  const C = parseFloat(m[3])
  const h = (parseFloat(m[4]) * Math.PI) / 180
  const own = m[5] === undefined ? 1 : parseFloat(m[5]) / (m[6] ? 100 : 1)
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
  const [r, g, bl] = lin.map((x) => {
    const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
    return Math.round(Math.min(1, Math.max(0, v)) * 255)
  })
  return `rgba(${r}, ${g}, ${bl}, ${alpha ?? own})`
}

/**
 * Die Farben des Plots aus den Tokens des ohmtools-Designs: die Kurven sind Datenreihen in den
 * Datenfarben (f blau, g orange, die Produktfläche violett wie im Logo), das Ergebnis in der
 * Textfarbe, der Abspielkopf im roten Akzent. Raster und Achsen grau, die Zahlen in mono, mit dem
 * Dezimalzeichen der Sprache der Seite (`lang` auf <html>).
 */
export function readPlotColors(el: Element = document.documentElement): PlotColors {
  const cs = getComputedStyle(el)
  const v = (name: string) => toCanvasColor(cs.getPropertyValue(name).trim())
  const probe = document.createElement('span')
  probe.className = 'font-mono'
  document.body.append(probe)
  const mono = getComputedStyle(probe).fontFamily || 'monospace'
  probe.remove()
  const lang = document.documentElement.lang || undefined
  const decimal = new Intl.NumberFormat(lang).formatToParts(0.5).find((p) => p.type === 'decimal')?.value ?? '.'
  return {
    grid: v('--grid'),
    axis: v('--ring'),
    tick: v('--hour'),
    f: v('--kind-ue-border'),
    g: v('--kind-pr-border'),
    area: v('--kind-s'),
    areaLine: v('--kind-s-border'),
    conv: v('--foreground'),
    rest: v('--ring'),
    red: v('--accent-red'),
    mono,
    decimal,
  }
}

export function niceStep(range: number, target: number): number {
  const raw = range / target
  const p = 10 ** Math.floor(Math.log10(raw))
  const n = raw / p
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p
}

export function fmt(v: number, step: number, decimal = '.'): string {
  const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9))
  return (Math.abs(v) < step / 1e6 ? 0 : v).toFixed(d).replace('-', '−').replace('.', decimal)
}

/** v in Vielfachen von T → "−T", "T/2", "3T/2", "0.2T" (mit `decimal` als Dezimalzeichen) */
export function fmtT(v: number, decimal = '.'): string {
  if (Math.abs(v) < 1e-9) return '0'
  const sign = v < 0 ? '−' : ''
  const a = Math.abs(v)
  for (const d of [1, 2, 4]) {
    const n = Math.round(a * d)
    if (Math.abs(n / d - a) < 1e-6) return sign + (n === 1 ? '' : n) + 'T' + (d === 1 ? '' : '/' + d)
  }
  return sign + String(+a.toFixed(3)).replace('.', decimal) + 'T'
}

/**
 * Was der Plot zeigt. Der Animator zeigt alles; die Anleitung zeigt je Schritt einen Teil und
 * blendet ihn mit den Zahlen von 0 bis 1 ein.
 */
export type PlotLayers = {
  /** f(τ) */
  f: boolean
  /** g(t−τ); `flip` 0 → g(τ), 1 → g(−τ) (gespiegelt), `shift` ist die Verschiebung (sonst t) */
  g: boolean
  flip: number
  shift?: number
  /** g(τ) vor dem Spiegeln, dünn in Grau */
  ghost: boolean
  /** Produktfläche f(τ)·g(t−τ), 0 … 1 eingeblendet */
  area: number
  /** Ergebnis bis t; `rest` dazu den Rest dünn in Grau; `convOnly` skaliert nur auf das Ergebnis */
  conv: boolean
  rest: boolean
  convOnly: boolean
  /** Abspielkopf bei t */
  playhead: boolean
  /** Zahlen an den Achsen (aus für Vorschaubilder) */
  ticks: boolean
  /** y-Bereich, wenn er gerade gleitet */
  y?: [number, number]
}

export const ANIMATOR_LAYERS: PlotLayers = {
  f: true,
  g: true,
  flip: 1,
  ghost: false,
  area: 1,
  conv: true,
  rest: true,
  convOnly: false,
  playhead: true,
  ticks: true,
}

const TICK_FONT = 12
/** Platz für den Punkt des Abspielkopfs über der höchsten Stelle */
const PAD_T = 8

export type PlotBox = { L: number; R: number; T: number; B: number }

/** Die Ränder um die Zeichenfläche: links die Zahlen von f und g, rechts die des Ergebnisses in T. */
export function plotBox(r: ConvolutionResult, layers: PlotLayers): PlotBox {
  if (!layers.ticks) return { L: 1, R: 1, T: 4, B: 2 }
  const right = r.convInT && (layers.conv || layers.convOnly)
  return { L: 40, R: right ? 40 : 12, T: PAD_T, B: 24 }
}

export function yRange(r: ConvolutionResult, layers: PlotLayers): [number, number] {
  return layers.convOnly ? [r.cmin, r.cmax] : [r.ymin, r.ymax]
}

/** Plot-x (Pixel, CSS) → t */
export function tFromX(r: ConvolutionResult, box: PlotBox, width: number, x: number): number {
  const pw = width - box.L - box.R
  return Math.min(r.xmax, Math.max(r.xmin, r.xmin + ((x - box.L) / pw) * (r.xmax - r.xmin)))
}

export function drawPlot(
  ctx: CanvasRenderingContext2D,
  r: ConvolutionResult,
  t: number,
  W: number,
  H: number,
  dpr: number,
  C: PlotColors,
  layers: PlotLayers = ANIMATOR_LAYERS,
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  const { L, R, T, B } = plotBox(r, layers)
  const pw = W - L - R
  const ph = H - T - B
  if (pw <= 10 || ph <= 10) return
  const { xmin, xmax, f, g, Tp } = r
  const [ymin, ymax] = layers.y ?? yRange(r, layers)
  const X = (x: number) => L + ((x - xmin) / (xmax - xmin)) * pw
  const Y = (y: number) => T + ((ymax - y) / (ymax - ymin)) * ph
  const shift = layers.shift ?? t
  const s = 1 - 2 * layers.flip
  // g(shift + s·τ): s = 1 → g(τ) (vor dem Spiegeln, shift 0), s = −1 → g(shift − τ)
  const gAt = (tau: number) => g.reg(shift + s * tau)

  // Raster und Zahlen: x in Vielfachen von T, y links für f und g, rechts für das Ergebnis in T
  ctx.lineWidth = 1
  ctx.font = `${TICK_FONT}px ${C.mono}`
  const xs = niceStep((xmax - xmin) / Tp, Math.max(4, Math.floor(pw / 110)))
  const ys = niceStep(ymax - ymin, Math.min(6, Math.max(2, Math.floor(ph / 64))))
  ctx.strokeStyle = C.grid
  ctx.fillStyle = C.tick
  ctx.textBaseline = 'top'
  const x0v = Math.ceil(xmin / Tp / xs - 1e-9) * xs
  for (let v = x0v; v <= xmax / Tp + 1e-9; v += xs) {
    const px = Math.round(X(v * Tp)) + 0.5
    ctx.beginPath()
    ctx.moveTo(px, T)
    ctx.lineTo(px, T + ph)
    ctx.stroke()
    if (!layers.ticks) continue
    // Die äußeren Zahlen bündig zum Rand, damit sie nicht abgeschnitten werden
    const label = fmtT(v, C.decimal)
    const w = ctx.measureText(label).width
    ctx.textAlign = 'left'
    ctx.fillText(label, Math.min(W - w, Math.max(0, px - w / 2)), T + ph + 6)
  }
  ctx.textBaseline = 'middle'
  for (let v = Math.ceil(ymin / ys - 1e-9) * ys; v <= ymax + 1e-9; v += ys) {
    const py = Math.round(Y(v)) + 0.5
    ctx.beginPath()
    ctx.moveTo(L, py)
    ctx.lineTo(L + pw, py)
    ctx.stroke()
    if (!layers.ticks) continue
    const yl = Math.min(T + ph - TICK_FONT / 2, Math.max(TICK_FONT / 2, py))
    if (!layers.convOnly || !r.convInT) {
      ctx.textAlign = 'right'
      ctx.fillText(fmt(v, ys, C.decimal), L - 8, yl)
    }
    if (r.convInT && (layers.conv || layers.convOnly)) {
      ctx.textAlign = 'left'
      ctx.fillText(fmtT(v, C.decimal), L + pw + 8, yl)
    }
  }
  ctx.strokeStyle = C.axis
  ctx.beginPath()
  const y0 = Math.round(Y(0)) + 0.5
  ctx.moveTo(L, y0)
  ctx.lineTo(L + pw, y0)
  if (xmin <= 0 && xmax >= 0) {
    const x0 = Math.round(X(0)) + 0.5
    ctx.moveTo(x0, T)
    ctx.lineTo(x0, T + ph)
  }
  ctx.stroke()

  ctx.save()
  ctx.beginPath()
  ctx.rect(L, 0, pw, T + ph + 1)
  ctx.clip()

  const steps = Math.max(200, Math.round(pw * 2))
  const tauAt = (j: number) => xmin + ((xmax - xmin) * j) / steps

  // Dirac-Impuls als Pfeil, Länge = Gewicht (an den Zahlen der y-Achse abzulesen)
  const arrow = (x: number, w: number, color: string, lw: number) => {
    if (Math.abs(w) < 1e-9 || x < xmin - 1e-9 || x > xmax + 1e-9) return
    const px = X(x)
    const p0 = Y(0)
    const p1 = Y(w)
    const dir = w > 0 ? 1 : -1
    const hs = 8
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = lw
    ctx.beginPath()
    ctx.moveTo(px, p0)
    ctx.lineTo(px, p1 + dir * hs * 0.8)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(px, p1)
    ctx.lineTo(px - hs * 0.6, p1 + dir * hs)
    ctx.lineTo(px + hs * 0.6, p1 + dir * hs)
    ctx.closePath()
    ctx.fill()
  }

  // Alle Linien durchgezogen (Entscheidung des Nutzers): gestrichelte Linien, die sich bewegen,
  // verwirren
  const curve = (fn: (x: number) => number, color: string, w: number) => {
    ctx.strokeStyle = color
    ctx.lineWidth = w
    ctx.lineJoin = 'round'
    ctx.beginPath()
    for (let j = 0; j <= steps; j++) {
      const tau = tauAt(j)
      const px = X(tau)
      const py = Y(fn(tau))
      if (j) ctx.lineTo(px, py)
      else ctx.moveTo(px, py)
    }
    ctx.stroke()
  }

  const fg = !layers.convOnly

  // Produktfläche f(τ)·g(t−τ): violett gefüllt und schraffiert, die Farbe ist nie das einzige Merkmal
  if (fg && layers.area > 0) {
    ctx.globalAlpha = layers.area
    const path = new Path2D()
    path.moveTo(X(xmin), Y(0))
    for (let j = 0; j <= steps; j++) {
      const tau = tauAt(j)
      path.lineTo(X(tau), Y(f.reg(tau) * gAt(tau)))
    }
    path.lineTo(X(xmax), Y(0))
    path.closePath()
    ctx.fillStyle = C.area
    ctx.fill(path)
    ctx.save()
    ctx.clip(path)
    ctx.strokeStyle = C.areaLine
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let d = -ph; d < pw + ph; d += 6) {
      ctx.moveTo(L + d, T + ph)
      ctx.lineTo(L + d + ph, T)
    }
    ctx.stroke()
    ctx.restore()
    ctx.strokeStyle = C.areaLine
    ctx.lineWidth = 1
    ctx.stroke(path)
    for (const d of r.gImp) arrow(shift - d.p, d.w * f.reg(shift - d.p), C.areaLine, 4)
    for (const d of r.fImp) arrow(d.p, d.w * gAt(d.p), C.areaLine, 4)
    ctx.globalAlpha = 1
  }

  if (fg && layers.ghost) {
    curve(g.reg, C.rest, 1.5)
    for (const d of r.gImp) arrow(d.p, d.w, C.rest, 1.5)
  }
  if (fg && layers.f) {
    curve(f.reg, C.f, 2)
    for (const d of r.fImp) arrow(d.p, d.w, C.f, 2)
  }
  if (fg && layers.g) {
    curve(gAt, C.g, 2)
    // Impuls von g bei p: g(shift + s·τ) hat ihn bei τ = (p − shift)/s
    if (Math.abs(s) > 1e-3) for (const d of r.gImp) arrow((d.p - shift) / s, d.w / Math.abs(s), C.g, 2)
  }

  // Ergebnis: bis t in der Textfarbe, der Rest dünn in Grau
  const cy = (k: number) => Y(r.conv[k] / r.cScale)
  const cNow = convAt(r, t) / r.cScale
  const kEnd = Math.min(r.NT, Math.floor((t - xmin) / r.h))
  if (layers.rest && kEnd < r.NT) {
    ctx.strokeStyle = C.rest
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(X(t), Y(cNow))
    for (let k = Math.max(0, kEnd + 1); k <= r.NT; k++) ctx.lineTo(X(xmin + k * r.h), cy(k))
    ctx.stroke()
    for (const d of r.convImp) if (d.p > t) arrow(d.p, d.w / r.cScale, C.rest, 1.5)
  }
  if (layers.conv) {
    ctx.strokeStyle = C.conv
    ctx.lineWidth = 2.25
    ctx.lineJoin = 'round'
    ctx.beginPath()
    for (let k = 0; k <= kEnd; k++) {
      if (k) ctx.lineTo(X(xmin + k * r.h), cy(k))
      else ctx.moveTo(X(xmin), cy(0))
    }
    ctx.lineTo(X(t), Y(cNow))
    ctx.stroke()
    for (const d of r.convImp) if (d.p <= t) arrow(d.p, d.w / r.cScale, C.conv, 2)
  }
  ctx.restore()

  // Abspielkopf: rote Linie mit Punkt oben, dazu der Punkt auf dem Ergebnis
  if (layers.playhead) {
    const px = Math.round(X(t)) + 0.5
    ctx.strokeStyle = C.red
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(px, T)
    ctx.lineTo(px, T + ph)
    ctx.stroke()
    ctx.fillStyle = C.red
    ctx.beginPath()
    ctx.arc(px, T, 4, 0, Math.PI * 2)
    ctx.fill()
  }
  if (layers.conv) {
    ctx.fillStyle = C.conv
    ctx.beginPath()
    ctx.arc(X(t), Y(cNow), 4, 0, Math.PI * 2)
    ctx.fill()
  }
}
