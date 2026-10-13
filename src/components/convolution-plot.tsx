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
    let lastVH = 0
    const resize = (ev?: Event) => {
      const W = box.clientWidth
      const vh = window.innerHeight
      // iOS ändert innerHeight beim Ein-/Ausblenden der Leisten während des Scrollens;
      // darauf nicht reagieren, nur auf echte Größenwechsel (Drehen, Fenstergröße)
      if (ev?.type === 'resize' && W === size.current.W && Math.abs(vh - lastVH) < 150) return
      lastVH = vh
      // schmal: höher als breit-halbe, damit der Plot auf dem Telefon lesbar bleibt;
      // niedrig (Telefon quer): Plot + Bedienleiste sollen gemeinsam auf den Bildschirm passen
      const ideal = Math.round(W * (W < 600 ? 0.72 : 0.5))
      const H = Math.max(190, Math.min(480, ideal, vh - 150, Math.round(vh * 0.5)))
      const dpr = window.devicePixelRatio || 1
      size.current = { W, H, dpr }
      cv.width = Math.round(W * dpr)
      cv.height = Math.round(H * dpr)
      cv.style.height = H + 'px'
      drawRef.current()
    }
    const ro = new ResizeObserver(() => resize())
    ro.observe(box)
    window.addEventListener('resize', resize)
    resize()
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', resize)
    }
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
        className="block w-full cursor-ew-resize touch-pan-y select-none [-webkit-touch-callout:none]"
        role="img"
        aria-label="Animation der Faltung: f(τ), gespiegeltes und verschobenes g(t−τ), Produktfläche und Faltungsergebnis"
      />
    </div>
  )
})
