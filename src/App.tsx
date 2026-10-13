import { ImageDown, Link2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Controls } from '@/components/controls'
import { ConvolutionPlot, type ConvolutionPlotHandle } from '@/components/convolution-plot'
import { Explanation } from '@/components/explanation'
import { FunctionReference } from '@/components/function-reference'
import { PwaPrompt } from '@/components/pwa-prompt'
import { Readout } from '@/components/readout'
import { SiteHeader } from '@/components/site-header'
import { Tex } from '@/components/tex'
import { Transport } from '@/components/transport'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Toaster } from '@/components/ui/sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useTheme } from '@/hooks/use-theme'
import { computeConvolution, type ConvolutionResult } from '@/lib/convolution'
import { bind, compileFormula, FormulaError, type CompiledFormula } from '@/lib/formula'
import { Playhead } from '@/lib/playhead'
import {
  DEFAULT_SETTINGS,
  parseNumber,
  settingsFromHash,
  settingsToHash,
  type Preset,
  type Settings,
} from '@/lib/presets'
import { cn } from '@/lib/utils'

/** Dauer eines Durchlaufs über den ganzen Bereich bei 1× */
const SWEEP_MS = 6000

type Compiled = { ok: true; c: CompiledFormula } | { ok: false; error: string }

function tryCompile(src: string): Compiled {
  try {
    return { ok: true, c: compileFormula(src) }
  } catch (e) {
    return { ok: false, error: e instanceof FormulaError ? e.message : 'Formel nicht auswertbar.' }
  }
}

type Parts = { f: CompiledFormula; g: CompiledFormula; Tp: number; a: number; b: number }

function parseRange(s: Settings) {
  const Tp = parseNumber(s.T)
  const a = parseNumber(s.a)
  const b = parseNumber(s.b)
  const TpOk = Number.isFinite(Tp) && Tp > 0
  let rangeError: string | null = null
  if (!Number.isFinite(a) || !Number.isFinite(b)) rangeError = 'Bitte Zahlen für den Bereich eingeben.'
  else if (b <= a) rangeError = '„Bis“ muss größer als „Von“ sein.'
  else if (b - a > 200) rangeError = 'Der Bereich darf höchstens 200 T breit sein.'
  return { Tp, a, b, TpOk, rangeError }
}

/** Nimmt die gültigen Teile aus den Einstellungen, für ungültige bleibt der letzte gute Stand. */
function mergeParts(s: Settings, last: Parts): Parts {
  const f = tryCompile(s.f)
  const g = tryCompile(s.g)
  const r = parseRange(s)
  return {
    f: f.ok ? f.c : last.f,
    g: g.ok ? g.c : last.g,
    Tp: r.TpOk ? r.Tp : last.Tp,
    a: r.rangeError ? last.a : r.a,
    b: r.rangeError ? last.b : r.b,
  }
}

function compute(p: Parts): ConvolutionResult {
  return computeConvolution(bind(p.f, p.Tp), bind(p.g, p.Tp), p.Tp, p.a * p.Tp, p.b * p.Tp)
}

const DEFAULT_PARTS: Parts = {
  f: compileFormula(DEFAULT_SETTINGS.f),
  g: compileFormula(DEFAULT_SETTINGS.g),
  Tp: 1,
  a: -2,
  b: 2,
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return (
    el.isContentEditable ||
    el.closest('input, textarea, select, button, a, [role="slider"], [role="combobox"], [role="menu"]') !==
      null
  )
}

export default function App() {
  const { theme, resolved, setTheme } = useTheme()
  const reduce = useReducedMotion()
  const plotRef = useRef<ConvolutionPlotHandle>(null)

  // Startzustand: aus dem Link oder Standard; Animation läuft, außer bei reduzierter Bewegung
  const [boot] = useState(() => {
    const initial = settingsFromHash(window.location.hash) ?? DEFAULT_SETTINGS
    const parts = mergeParts(initial, DEFAULT_PARTS)
    const result = compute(parts)
    const t = reduce ? Math.max(result.xmin, -0.3 * result.Tp) : result.xmin
    return { initial, parts, result, playhead: new Playhead(t, !reduce) }
  })
  const { initial, playhead } = boot
  const [settings, setSettings] = useState<Settings>(initial)
  /** Entprellte Einstellungen, aus denen gerechnet wird */
  const [applied, setApplied] = useState<Settings>(initial)

  const lastParts = useRef<Parts>(boot.parts)
  const [result, setResult] = useState<ConvolutionResult>(boot.result)
  const resultRef = useRef(result)
  /** Nach einem Beispiel: t auf den Anfang setzen und abspielen */
  const restart = useRef(false)

  // Eingaben entprellen
  useEffect(() => {
    const id = window.setTimeout(() => setApplied(settings), 200)
    return () => window.clearTimeout(id)
  }, [settings])

  const fState = useMemo(() => tryCompile(applied.f), [applied.f])
  const gState = useMemo(() => tryCompile(applied.g), [applied.g])
  const rangeState = useMemo(() => parseRange(applied), [applied])

  // Neu rechnen
  const computedFor = useRef<Settings>(initial)
  useEffect(() => {
    if (computedFor.current === applied) return
    computedFor.current = applied
    const p = mergeParts(applied, lastParts.current)
    lastParts.current = p
    setResult(compute(p))
  }, [applied])

  // t beim Bereichswechsel relativ beibehalten
  useEffect(() => {
    const prev = resultRef.current
    resultRef.current = result
    if (restart.current) {
      restart.current = false
      playhead.setT(result.xmin)
      if (!reduce) playhead.setPlaying(true)
      return
    }
    if (prev === result) return
    const rel = (playhead.t - prev.xmin) / (prev.xmax - prev.xmin)
    playhead.setT(result.xmin + Math.min(1, Math.max(0, rel)) * (result.xmax - result.xmin))
  }, [result, playhead, reduce])

  // Animationsschleife
  useEffect(() => {
    let raf = 0
    let last = 0
    const frame = (ts: number) => {
      if (!playhead.playing) {
        raf = 0
        last = 0
        return
      }
      const r = resultRef.current
      if (last) {
        const dt = Math.min(64, ts - last)
        let t = playhead.t + ((r.xmax - r.xmin) * dt * playhead.speed) / SWEEP_MS
        if (t > r.xmax) t = r.xmin
        playhead.setT(t)
      }
      last = ts
      raf = requestAnimationFrame(frame)
    }
    const kick = () => {
      if (playhead.playing && !raf) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }
    const unsub = playhead.subscribe(kick)
    kick()
    return () => {
      unsub()
      cancelAnimationFrame(raf)
    }
  }, [playhead])

  // Zustand in der URL ablegen (teilbarer Link)
  useEffect(() => {
    const hash = settingsToHash(applied)
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash)
  }, [applied])

  useEffect(() => {
    const onHash = () => {
      const s = settingsFromHash(window.location.hash)
      if (s) {
        setSettings(s)
        setApplied(s)
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Tastenkürzel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return
      const r = resultRef.current
      switch (e.key) {
        case ' ':
        case 'k':
          playhead.setPlaying(!playhead.playing)
          break
        case 'ArrowLeft':
          playhead.step(e.shiftKey ? -0.05 : -0.01, r.xmin, r.xmax)
          break
        case 'ArrowRight':
          playhead.step(e.shiftKey ? 0.05 : 0.01, r.xmin, r.xmax)
          break
        case 'Home':
          playhead.setT(r.xmin)
          break
        case 'End':
          playhead.setPlaying(false)
          playhead.setT(r.xmax)
          break
        default:
          return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playhead])

  const change = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  const applyNow = useCallback((s: Settings) => {
    setSettings(s)
    setApplied(s)
  }, [])

  const swap = useCallback(() => {
    applyNow({ ...settings, f: settings.g, g: settings.f })
  }, [settings, applyNow])

  const preset = useCallback(
    (p: Preset) => {
      restart.current = true
      applyNow({ ...settings, f: p.f, g: p.g, a: String(p.a), b: String(p.b) })
    },
    [settings, applyNow],
  )

  const share = useCallback(async () => {
    const url = window.location.origin + window.location.pathname + settingsToHash(settings)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link kopiert', { description: 'Der Link öffnet genau diese Ansicht.' })
    } catch {
      window.prompt('Link zum Kopieren:', url)
    }
  }, [settings])

  const savePng = useCallback(async () => {
    const blob = await plotRef.current?.toBlob()
    if (!blob) return
    const file = new File([blob], 'faltung.png', { type: 'image/png' })
    const touch = window.matchMedia('(pointer: coarse)').matches
    if (touch && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Faltung' })
        return
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
      }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'faltung.png'
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, [])

  return (
    <TooltipProvider>
      <SiteHeader theme={theme} setTheme={setTheme} />
      <main className="px-safe mx-auto flex max-w-5xl flex-col gap-12 pt-5 pb-16 sm:pt-6">
        <section id="animator" className="flex scroll-mt-20 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-3xl">
              Faltung zweier Funktionen
            </h1>
            <Tex
              display
              className="tex-left -mx-1 px-1 text-[0.85rem] sm:text-base"
              math="(f*g)(t) = \int_{-\infty}^{\infty} f(\tau)\,g(t-\tau)\,\mathrm d\tau"
            />
            <p className="hidden max-w-[70ch] text-muted-foreground sm:block">
              g wird gespiegelt über f geschoben; die gelbe Fläche unter dem Produkt ergibt Punkt für
              Punkt das Faltungsergebnis. Zum Spulen im Plot waagerecht ziehen.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Animation</CardTitle>
              <CardDescription>
                <Legend convInT={result.convInT} />
              </CardDescription>
              <CardAction className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={share} aria-label="Link kopieren">
                      <Link2 />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Link zu dieser Ansicht kopieren</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={savePng} aria-label="Als Bild speichern">
                      <ImageDown />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Als PNG speichern</TooltipContent>
                </Tooltip>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ConvolutionPlot ref={plotRef} result={result} playhead={playhead} theme={resolved} />
              <Readout result={result} playhead={playhead} />
              <Transport result={result} playhead={playhead} />
              <p className="text-sm text-muted-foreground sm:hidden">
                g wird gespiegelt über f geschoben; die gelbe Fläche ergibt das Faltungsergebnis. Zum
                Spulen im Plot waagerecht ziehen.
              </p>
            </CardContent>
          </Card>

          <Controls
            settings={settings}
            onChange={change}
            onSwap={swap}
            onPreset={preset}
            fError={fState.ok ? null : fState.error}
            gError={gState.ok ? null : gState.error}
            fTex={fState.ok ? fState.c.tex : null}
            gTex={gState.ok ? gState.c.tex : null}
            rangeError={rangeState.rangeError}
          />
        </section>

        <Explanation />
        <FunctionReference />
        <Shortcuts />
      </main>
      <footer className="border-t">
        <div className="px-safe mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 py-6 text-sm text-muted-foreground">
          <span>Faltungs-Animator – rechnet vollständig im Browser, auch offline.</span>
          <span>mathjs · KaTeX · React · shadcn/ui</span>
        </div>
      </footer>
      <PwaPrompt />
      <Toaster theme={resolved} position="bottom-right" />
    </TooltipProvider>
  )
}

function Swatch({ className, box }: { className: string; box?: boolean }) {
  return (
    <i
      aria-hidden
      className={cn('inline-block w-4 rounded-sm', box ? 'h-3' : 'h-0.5', className)}
    />
  )
}

function Legend({ convInT }: { convInT: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      <span className="inline-flex items-center gap-1.5">
        <Swatch box className="bg-plot-area" />
        Fläche unter f(τ)·g(t−τ)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Swatch className="bg-plot-f" />
        f(τ)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Swatch className="bg-plot-g" />
        g(t−τ)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Swatch className="bg-plot-conv" />
        {convInT ? '(f∗g)(t), rechte Achse in T' : '(f∗g)(t)'}
      </span>
    </div>
  )
}

const KEYS: [string[], string][] = [
  [['Leertaste'], 'Abspielen / Pause'],
  [['←', '→'], 'Schritt zurück / vor (mit ⇧: größer)'],
  [['Pos1', 'Ende'], 'Zum Anfang / Ende'],
  [['Ziehen', 'Tippen'], 'Zeitpunkt t im Plot setzen'],
]

function Shortcuts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bedienung</CardTitle>
        <CardDescription>
          Die Einstellungen stehen in der Adresszeile; ein kopierter Link öffnet genau diese Ansicht.
          Über „Installieren“ oben (auf iPhone und iPad: Teilen → „Zum Home-Bildschirm“) lässt sich die
          Seite als App installieren und funktioniert danach auch ohne Internetverbindung.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {KEYS.map(([keys, v]) => (
            <div key={v} className="flex items-center gap-3">
              <dt>
                <KbdGroup>
                  {keys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </KbdGroup>
              </dt>
              <dd className="text-sm text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
