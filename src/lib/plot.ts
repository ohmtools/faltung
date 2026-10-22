import { convAt, type ConvolutionResult } from './convolution'

export const PAD_L = 40
export const PAD_R = 46
const PAD_T = 10
const PAD_B = 30

export type PlotColors = {
  grid: string
  axis: string
  muted: string
  f: string
  g: string
  area: string
  areaSolid: string
  conv: string
  font: string
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

/** Deckkraft der Produktfläche über f und g */
export const AREA_ALPHA = 0.45
/**
 * Farbe von g(t−τ): ein Rot mit mehr Abstand zum Hintergrund als f, hell also dunkler, dunkel
 * heller. Die Helligkeit unterscheidet g von f, nicht der Farbton. Legende: `swatch.tsx`.
 */
export const G_COLOR = { light: '#7E1817', dark: '#FCA5A5' }

/**
 * Die Farben des Plots aus den Tokens des ohmtools-Designs: f in einer Diagrammfarbe (Rot ist die
 * einzige Akzentfarbe), g in `G_COLOR`, das Ergebnis in der Textfarbe, Raster und
 * Achsen grau.
 */
export function readPlotColors(el: Element = document.documentElement): PlotColors {
  const cs = getComputedStyle(el)
  const raw = (name: string) => cs.getPropertyValue(name).trim()
  const v = (name: string) => toCanvasColor(raw(name))
  return {
    grid: v('--border'),
    axis: v('--muted-foreground'),
    muted: v('--muted-foreground'),
    f: v('--chart-2'),
    g: el.classList.contains('dark') ? G_COLOR.dark : G_COLOR.light,
    area: toCanvasColor(raw('--chart-1'), AREA_ALPHA),
    areaSolid: v('--chart-1'),
    conv: v('--foreground'),
    font: getComputedStyle(document.body).fontFamily || 'sans-serif',
  }
}

export function niceStep(range: number, target: number): number {
  const raw = range / target
  const p = 10 ** Math.floor(Math.log10(raw))
  const n = raw / p
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p
}

export function fmt(v: number, step: number): string {
  const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9))
  return (Math.abs(v) < step / 1e6 ? 0 : v).toFixed(d).replace('-', '−')
}

/** v in Vielfachen von T → "−T", "T/2", "3T/2", "0.2T" */
export function fmtT(v: number): string {
  if (Math.abs(v) < 1e-9) return '0'
  const sign = v < 0 ? '−' : ''
  const a = Math.abs(v)
  for (const d of [1, 2, 4]) {
    const n = Math.round(a * d)
    if (Math.abs(n / d - a) < 1e-6) return sign + (n === 1 ? '' : n) + 'T' + (d === 1 ? '' : '/' + d)
  }
  return sign + +a.toFixed(3) + 'T'
}

/** Plot-x (Pixel, CSS) → t */
export function tFromX(r: ConvolutionResult, width: number, x: number): number {
  const pw = width - PAD_L - PAD_R
  return Math.min(r.xmax, Math.max(r.xmin, r.xmin + ((x - PAD_L) / pw) * (r.xmax - r.xmin)))
}

export function drawPlot(
  ctx: CanvasRenderingContext2D,
  r: ConvolutionResult,
  t: number,
  W: number,
  H: number,
  dpr: number,
  C: PlotColors,
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  const L = PAD_L
  const R = PAD_R
  const T = PAD_T
  const B = PAD_B
  const pw = W - L - R
  const ph = H - T - B
  if (pw <= 10 || ph <= 10) return
  const { xmin, xmax, ymin, ymax, f, g, Tp } = r
  const X = (x: number) => L + ((x - xmin) / (xmax - xmin)) * pw
  const Y = (y: number) => T + ((ymax - y) / (ymax - ymin)) * ph

  // Raster und Beschriftung
  ctx.font = '11px ' + C.font
  ctx.lineWidth = 1
  const xs = niceStep((xmax - xmin) / Tp, Math.max(4, Math.floor(pw / 70)))
  const ys = niceStep(ymax - ymin, Math.max(3, Math.floor(ph / 45)))
  ctx.strokeStyle = C.grid
  ctx.fillStyle = C.muted
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (let v = Math.ceil(xmin / Tp / xs - 1e-9) * xs; v <= xmax / Tp + 1e-9; v += xs) {
    const px = Math.round(X(v * Tp)) + 0.5
    ctx.beginPath()
    ctx.moveTo(px, T)
    ctx.lineTo(px, T + ph)
    ctx.stroke()
    ctx.fillText(fmtT(v), px, T + ph + 6)
  }
  ctx.textBaseline = 'middle'
  for (let v = Math.ceil(ymin / ys - 1e-9) * ys; v <= ymax + 1e-9; v += ys) {
    const py = Math.round(Y(v)) + 0.5
    ctx.beginPath()
    ctx.moveTo(L, py)
    ctx.lineTo(L + pw, py)
    ctx.stroke()
    ctx.fillStyle = C.muted
    ctx.textAlign = 'right'
    ctx.fillText(fmt(v, ys), L - 6, py)
    if (r.convInT) {
      // rechte Achse: Faltung in Vielfachen von T
      ctx.fillStyle = C.conv
      ctx.textAlign = 'left'
      ctx.fillText(fmtT(v), L + pw + 6, py)
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
  ctx.fillStyle = C.muted
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText('τ, t', L + pw - 2, T + ph - 3)

  ctx.save()
  ctx.beginPath()
  ctx.rect(L, T - 1, pw, ph + 2)
  ctx.clip()

  const steps = Math.max(200, Math.round(pw * 2))
  const tauAt = (j: number) => xmin + ((xmax - xmin) * j) / steps

  // Dirac-Impuls als Pfeil, Länge = Gewicht; Gewicht ≠ ±1 steht in Klammern daneben
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
    if (lw <= 2.5 && Math.abs(Math.abs(w) - 1) > 1e-3) {
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText('(' + String(+w.toFixed(2)).replace('-', '−') + ')', px + 7, p1 + dir * 5)
    }
  }

  // Fläche f(τ)·g(t−τ)
  ctx.fillStyle = C.area
  ctx.beginPath()
  ctx.moveTo(X(xmin), Y(0))
  for (let j = 0; j <= steps; j++) {
    const tau = tauAt(j)
    ctx.lineTo(X(tau), Y(f.reg(tau) * g.reg(t - tau)))
  }
  ctx.lineTo(X(xmax), Y(0))
  ctx.closePath()
  ctx.fill()

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
  // Impulsanteile des Produkts f(τ)·g(t−τ)
  for (const d of r.gImp) arrow(t - d.p, d.w * f.reg(t - d.p), C.areaSolid, 6)
  for (const d of r.fImp) arrow(d.p, d.w * g.reg(t - d.p), C.areaSolid, 6)
  curve(f.reg, C.f, 2)
  for (const d of r.fImp) arrow(d.p, d.w, C.f, 2)
  curve((tau) => g.reg(t - tau), C.g, 2)
  for (const d of r.gImp) arrow(t - d.p, d.w, C.g, 2)

  // Faltungsergebnis bis t
  ctx.strokeStyle = C.conv
  ctx.lineWidth = 2.25
  ctx.beginPath()
  const kEnd = Math.min(r.NT, Math.floor((t - xmin) / r.h))
  for (let k = 0; k <= kEnd; k++) {
    const px = X(xmin + k * r.h)
    const py = Y(r.conv[k] / r.cScale)
    if (k) ctx.lineTo(px, py)
    else ctx.moveTo(px, py)
  }
  const cNow = convAt(r, t) / r.cScale
  ctx.lineTo(X(t), Y(cNow))
  ctx.stroke()
  for (const d of r.convImp) if (d.p <= t) arrow(d.p, d.w / r.cScale, C.conv, 2)

  // Marker bei t
  ctx.setLineDash([4, 4])
  ctx.strokeStyle = C.axis
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(X(t), T)
  ctx.lineTo(X(t), T + ph)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = C.conv
  ctx.beginPath()
  ctx.arc(X(t), Y(cNow), 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
