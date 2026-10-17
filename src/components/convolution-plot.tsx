import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react'

import { m } from '@/i18n'
import type { ConvolutionResult } from '@/lib/convolution'
import type { Playhead } from '@/lib/playhead'
import { drawPlot, readPlotColors, tFromX, toCanvasColor, type PlotColors } from '@/lib/plot'
import { cn } from '@/lib/utils'

type Props = {
  result: ConvolutionResult
  playhead: Playhead
  className?: string
}

export type ConvolutionPlotHandle = { toBlob: () => Promise<Blob | null> }

export const ConvolutionPlot = forwardRef<ConvolutionPlotHandle, Props>(function ConvolutionPlot(
  { result, playhead, className },
  ref,
) {
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useRef({ W: 0, H: 0, dpr: 0 })
  const colors = useRef<PlotColors | null>(null)
  const resultRef = useRef(result)
  const drawRef = useRef<() => void>(() => {})

  useLayoutEffect(() => {
    drawRef.current = () => {
      const cv = canvasRef.current
      const ctx = cv?.getContext('2d')
      if (!cv || !ctx) return
      colors.current ??= readPlotColors()
      const { W, H, dpr } = size.current
      drawPlot(ctx, resultRef.current, playhead.t, W, H, dpr, colors.current)
    }
  }, [playhead])

  // Größe: der Plot füllt, was das Layout ihm lässt (Desktop und Animations-Tab sind genau
  // eine Ansicht hoch)
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

  // Neu zeichnen bei Änderungen von t, Ergebnis, Farbschema und sobald Inter geladen ist
  useEffect(() => playhead.subscribe(() => drawRef.current()), [playhead])
  useLayoutEffect(() => {
    resultRef.current = result
    drawRef.current()
  }, [result])
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
    return () => {
      alive = false
      mo.disconnect()
    }
  }, [])

  // Ziehen im Plot setzt t. Maus/Stift: sofort. Touch: senkrechtes Wischen scrollt die Seite
  // (touch-action: pan-y), waagerechtes Wischen spult, kurzes Tippen setzt t.
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    let active = false
    let scrubbing = false
    let x0 = 0
    let y0 = 0
    const setFromX = (clientX: number) => {
      const rect = cv.getBoundingClientRect()
      playhead.setT(tFromX(resultRef.current, size.current.W, clientX - rect.left))
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
  }, [playhead])

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
        className="absolute inset-0 block size-full cursor-ew-resize touch-pan-y select-none [-webkit-touch-callout:none]"
        role="img"
        aria-label={m.plotLabel}
      />
    </div>
  )
})
