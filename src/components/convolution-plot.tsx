import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react'

import { useReducedMotion } from '@/hooks/use-reduced-motion'
import type { ConvolutionResult } from '@/lib/convolution'
import { ease } from '@/lib/ohmtools/motion'
import type { Playhead } from '@/lib/playhead'
import {
  ANIMATOR_LAYERS,
  drawPlot,
  plotBox,
  readPlotColors,
  tFromX,
  toCanvasColor,
  yRange,
  type PlotColors,
  type PlotLayers,
} from '@/lib/plot'
import { cn } from '@/lib/utils'

type Props = {
  result: ConvolutionResult
  playhead: Playhead
  /** Was gezeigt wird; sonst alles wie im Animator */
  layers?: PlotLayers
  /** Ziehen und Tippen im Plot setzen t */
  scrub?: boolean
  label: string
  className?: string
}

export type ConvolutionPlotHandle = { toBlob: () => Promise<Blob | null> }

/** Wie lange der y-Bereich zu einem neuen Ergebnis gleitet (halbe Geschwindigkeit des Designs) */
const Y_MS = 560

export const ConvolutionPlot = forwardRef<ConvolutionPlotHandle, Props>(function ConvolutionPlot(
  { result, playhead, layers = ANIMATOR_LAYERS, scrub = false, label, className },
  ref,
) {
  const reduce = useReducedMotion()
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useRef({ W: 0, H: 0, dpr: 0 })
  const colors = useRef<PlotColors | null>(null)
  const resultRef = useRef(result)
  const layersRef = useRef(layers)
  /** Der gezeigte y-Bereich; gleitet nach einem neuen Ergebnis zum neuen */
  const shownY = useRef<[number, number]>(yRange(result, layers))
  const drawRef = useRef<() => void>(() => {})

  useLayoutEffect(() => {
    drawRef.current = () => {
      const cv = canvasRef.current
      const ctx = cv?.getContext('2d')
      if (!cv || !ctx) return
      colors.current ??= readPlotColors()
      const { W, H, dpr } = size.current
      const l = { ...layersRef.current, y: shownY.current }
      drawPlot(ctx, resultRef.current, playhead.t, W, H, dpr, colors.current, l)
    }
  }, [playhead])

  // Größe: der Plot füllt, was das Layout ihm lässt (jede Seite ist genau eine Ansicht hoch)
  useEffect(() => {
    const box = boxRef.current
    const cv = canvasRef.current
    if (!box || !cv) return
    const resize = () => {
      const W = box.clientWidth
      const H = box.clientHeight
      const dpr = window.devicePixelRatio || 1
      if (W === size.current.W && H === size.current.H && dpr === size.current.dpr) return
      size.current = { W, H, dpr }
      cv.width = Math.round(W * dpr)
      cv.height = Math.round(H * dpr)
      drawRef.current()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(box)
    resize()
    return () => ro.disconnect()
  }, [])

  // Neu zeichnen bei Änderungen von t, Ebenen, Farbschema und sobald die Schriften geladen sind
  useEffect(() => playhead.subscribe(() => drawRef.current()), [playhead])
  useLayoutEffect(() => {
    layersRef.current = layers
    if (resultRef.current === result) shownY.current = yRange(result, layers)
    drawRef.current()
  }, [layers, result])

  // Ein neues Ergebnis: der y-Bereich gleitet hin, statt zu springen
  useLayoutEffect(() => {
    if (resultRef.current === result) return
    resultRef.current = result
    const from = shownY.current
    const to = yRange(result, layersRef.current)
    if (reduce) {
      shownY.current = to
      drawRef.current()
      return
    }
    let raf = 0
    const start = performance.now()
    const frame = (now: number) => {
      const k = ease(Math.min(1, (now - start) / Y_MS))
      shownY.current = [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k]
      drawRef.current()
      if (k < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      shownY.current = to
    }
  }, [result, reduce])

  useEffect(() => {
    // ThemeProvider setzt die dark-Klasse, wenn das Gerät das Farbschema wechselt
    let alive = true
    const reset = () => {
      if (!alive) return
      colors.current = null
      drawRef.current()
    }
    const mo = new MutationObserver(reset)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    void document.fonts.ready.then(reset)
    document.fonts.addEventListener('loadingdone', reset)
    return () => {
      alive = false
      mo.disconnect()
      document.fonts.removeEventListener('loadingdone', reset)
    }
  }, [])

  // Ziehen im Plot setzt t. Maus/Stift: sofort. Touch: senkrechtes Wischen scrollt
  // (touch-action: pan-y), waagerechtes Wischen spult, kurzes Tippen setzt t.
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv || !scrub) return
    let active = false
    let scrubbing = false
    let x0 = 0
    let y0 = 0
    const setFromX = (clientX: number) => {
      const rect = cv.getBoundingClientRect()
      const box = plotBox(resultRef.current, layersRef.current)
      playhead.setT(tFromX(resultRef.current, box, size.current.W, clientX - rect.left))
    }
    const startScrub = (ev: PointerEvent) => {
      scrubbing = true
      playhead.setPlaying(false)
      setFromX(ev.clientX)
    }
    const down = (ev: PointerEvent) => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return
      active = true
      scrubbing = false
      x0 = ev.clientX
      y0 = ev.clientY
      if (ev.pointerType !== 'touch') {
        cv.setPointerCapture(ev.pointerId)
        startScrub(ev)
      }
    }
    const move = (ev: PointerEvent) => {
      if (!active) return
      if (scrubbing) {
        setFromX(ev.clientX)
        return
      }
      const dx = Math.abs(ev.clientX - x0)
      const dy = Math.abs(ev.clientY - y0)
      if (dx > 6 && dx > dy) {
        try {
          cv.setPointerCapture(ev.pointerId)
        } catch {
          /* Zeiger schon weg */
        }
        startScrub(ev)
      } else if (dy > 10) active = false // senkrecht: die Seite scrollt
    }
    const up = (ev: PointerEvent) => {
      if (active && !scrubbing && ev.type === 'pointerup') startScrub(ev) // Tippen
      active = false
      scrubbing = false
    }
    cv.addEventListener('pointerdown', down)
    cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerup', up)
    cv.addEventListener('pointercancel', up)
    return () => {
      cv.removeEventListener('pointerdown', down)
      cv.removeEventListener('pointermove', move)
      cv.removeEventListener('pointerup', up)
      cv.removeEventListener('pointercancel', up)
    }
  }, [playhead, scrub])

  useImperativeHandle(ref, () => ({
    toBlob: () =>
      new Promise((resolve) => {
        const cv = canvasRef.current
        if (!cv) return resolve(null)
        // Kopie mit Hintergrund, damit das PNG nicht transparent ist
        const out = document.createElement('canvas')
        out.width = cv.width
        out.height = cv.height
        const ctx = out.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.fillStyle = toCanvasColor(
          getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
        )
        ctx.fillRect(0, 0, out.width, out.height)
        ctx.drawImage(cv, 0, 0)
        out.toBlob(resolve, 'image/png')
      }),
  }))

  return (
    <div ref={boxRef} className={cn('relative w-full', className)}>
      <canvas
        ref={canvasRef}
        className={cn(
          'absolute inset-0 block size-full select-none [-webkit-touch-callout:none]',
          scrub && 'cursor-ew-resize touch-pan-y',
        )}
        // Ohne Beschriftung (Vorschaubilder in einem beschrifteten Knopf) nur Bild
        role={label ? 'img' : undefined}
        aria-label={label || undefined}
        aria-hidden={label ? undefined : true}
      />
    </div>
  )
})
