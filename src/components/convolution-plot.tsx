import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react'

import type { ConvolutionResult } from '@/lib/convolution'
import type { Playhead } from '@/lib/playhead'
import { drawPlot, readPlotColors, tFromX, type PlotColors } from '@/lib/plot'

type Props = {
  result: ConvolutionResult
  playhead: Playhead
  /** ändert sich beim Themenwechsel → Farben neu lesen */
  theme: string
}

export type ConvolutionPlotHandle = { toBlob: () => Promise<Blob | null> }

export const ConvolutionPlot = forwardRef<ConvolutionPlotHandle, Props>(function ConvolutionPlot(
  { result, playhead, theme },
  ref,
) {
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useRef({ W: 600, H: 320, dpr: 1 })
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

  // Größe
  useEffect(() => {
    const box = boxRef.current
    const cv = canvasRef.current
    if (!box || !cv) return
    const resize = () => {
      const W = box.clientWidth
      const H = Math.max(260, Math.min(480, Math.round(W * 0.5)))
      const dpr = window.devicePixelRatio || 1
      size.current = { W, H, dpr }
      cv.width = Math.round(W * dpr)
      cv.height = Math.round(H * dpr)
      cv.style.height = H + 'px'
      drawRef.current()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(box)
    resize()
    return () => ro.disconnect()
  }, [])

  // Neu zeichnen bei Änderungen von t, Ergebnis oder Thema
  useEffect(() => playhead.subscribe(() => drawRef.current()), [playhead])
  useLayoutEffect(() => {
    resultRef.current = result
    drawRef.current()
  }, [result])
  useEffect(() => {
    // Die dark-Klasse setzt der Eltern-Effekt erst nach diesem; deshalb auf die Klasse selbst hören
    const reset = () => {
      colors.current = null
      drawRef.current()
    }
    reset()
    const mo = new MutationObserver(reset)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [theme])

  // Ziehen im Plot setzt t
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    let dragging = false
    const setFromEvent = (ev: PointerEvent) => {
      const rect = cv.getBoundingClientRect()
      playhead.setT(tFromX(resultRef.current, size.current.W, ev.clientX - rect.left))
    }
    const down = (ev: PointerEvent) => {
      dragging = true
      cv.setPointerCapture(ev.pointerId)
      playhead.setPlaying(false)
      setFromEvent(ev)
    }
    const move = (ev: PointerEvent) => {
      if (dragging) setFromEvent(ev)
    }
    const up = () => {
      dragging = false
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
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--card').trim()
        ctx.fillRect(0, 0, out.width, out.height)
        ctx.drawImage(cv, 0, 0)
        out.toBlob(resolve, 'image/png')
      }),
  }))

  return (
    <div ref={boxRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        className="block w-full cursor-ew-resize touch-none"
        role="img"
        aria-label="Animation der Faltung: f(τ), gespiegeltes und verschobenes g(t−τ), Produktfläche und Faltungsergebnis"
      />
    </div>
  )
})
