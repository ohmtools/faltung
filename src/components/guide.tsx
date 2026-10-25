import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'

import { ExamplesSheet } from '@/components/controls'
import { ConvolutionPlot } from '@/components/convolution-plot'
import { fill } from '@/components/fill'
import { Tex } from '@/components/tex'
import { Values } from '@/components/transport'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useMedia } from '@/hooks/use-media'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { formatValue, localized, m } from '@/i18n'
import { computeConvolution, type ConvolutionResult } from '@/lib/convolution'
import { bind, compileFormula } from '@/lib/formula'
import { bottomBar } from '@/lib/bottom-bar'
import { WIDE_QUERY } from '@/lib/media'
import { EASE, easeInOut } from '@/lib/motion'
import { Playhead } from '@/lib/playhead'
import { ANIMATOR_LAYERS, type PlotLayers } from '@/lib/plot'
import type { Localized, Preset } from '@/lib/presets'
import { cn } from '@/lib/utils'

const STEPS: { title: Localized; tex: string; short: string; text: Localized; hint: Localized }[] = [
  {
    title: { de: 'Spiegeln', en: 'Mirror' },
    tex: 'g(\\tau) \\;\\to\\; g(-\\tau)',
    short: 'g(\\tau) \\to g(-\\tau)',
    text: {
      de: 'Die zweite Funktion wird an der senkrechten Achse gespiegelt.',
      en: 'The second function is mirrored about the vertical axis.',
    },
    hint: {
      de: 'Die graue Linie zeigt g, wie es vor dem Spiegeln war.',
      en: 'The grey line is g as it was before mirroring.',
    },
  },
  {
    title: { de: 'Verschieben', en: 'Shift' },
    tex: 'g(-\\tau) \\;\\to\\; g(t-\\tau)',
    short: 'g(-\\tau) \\to g(t-\\tau)',
    text: {
      de: 'Die gespiegelte Funktion wird um t nach rechts geschoben. t ist der Zeitpunkt, für den das Ergebnis berechnet wird.',
      en: 'The mirrored function is shifted to the right by t. t is the time for which the result is computed.',
    },
    hint: {
      de: 'Zieh den Regler: g(t − τ) wandert mit t, die rote Linie zeigt, wo t liegt.',
      en: 'Drag the slider: g(t − τ) moves with t, the red line shows where t is.',
    },
  },
  {
    title: { de: 'Multiplizieren', en: 'Multiply' },
    tex: 'f(\\tau)\\cdot g(t-\\tau)',
    short: 'f(\\tau)\\cdot g(t-\\tau)',
    text: {
      de: 'Beide Funktionen werden Punkt für Punkt multipliziert. Nur wo sie sich überlappen, bleibt etwas übrig: die schraffierte Fläche.',
      en: 'Both functions are multiplied point by point. Only where they overlap is anything left: the hatched area.',
    },
    hint: {
      de: 'Zieh den Regler und beobachte, wie die Fläche wächst und schrumpft.',
      en: 'Drag the slider and watch the area grow and shrink.',
    },
  },
  {
    title: { de: 'Integrieren', en: 'Integrate' },
    tex: '(f*g)(t) = \\int_{-\\infty}^{\\infty} f(\\tau)\\,g(t-\\tau)\\,\\mathrm d\\tau',
    short: '(f*g)(t) = \\textstyle\\int \\dots\\, \\mathrm d\\tau',
    text: {
      de: 'Die Fläche (mit Vorzeichen) ist der Wert der Faltung bei t. Läuft t weiter, entsteht Punkt für Punkt die Kurve (f∗g)(t).',
      en: 'The area (with its sign) is the value of the convolution at t. As t moves on, it traces the curve (f∗g)(t) point by point.',
    },
    hint: {
      de: 'Im Animator geht es mit beliebigen Funktionen weiter.',
      en: 'The animator carries on with any functions you like.',
    },
  },
]

/**
 * Wie lange ein Schritt sein Bild aufbaut: Spiegeln, Verschieben, Fläche, Ergebnis. Erklärende
 * Animationen dauern 1 bis 2,5 s (DESIGN.md, „Motion“), sanft an beiden Enden (`easeInOut`), damit
 * man der Bewegung folgen kann.
 */
const STEP_MS = [1800, 1400, 1200, 2400]

/** Was der Plot im Schritt `step` zeigt; `k` von 0 bis 1 baut den Schritt auf. */
function stepLayers(step: number, k: number, t: number, ticks = true): PlotLayers {
  const base: PlotLayers = { ...ANIMATOR_LAYERS, area: 0, conv: false, rest: false, playhead: false, ticks }
  switch (step) {
    case 0:
      return { ...base, flip: k, shift: 0, ghost: true }
    case 1:
      return { ...base, shift: k * t, playhead: true }
    case 2:
      return { ...base, area: k, playhead: true }
    default:
      return { ...base, area: 1, conv: true, rest: true, playhead: true }
  }
}

function computeGuide(p: Preset): ConvolutionResult {
  return computeConvolution(bind(compileFormula(p.f), 1), bind(compileFormula(p.g), 1), 1, p.a, p.b)
}

function StepOf({ step, className }: { step: number; className?: string }) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      {m.stepWord} <span className="font-mono">{step + 1}</span> {m.stepOf}{' '}
      <span className="font-mono">{STEPS.length}</span>
    </p>
  )
}

/** Der Schieberegler für t mit den Werten t und Fläche. */
function TSlider({ result, playhead, wide }: { result: ConvolutionResult; playhead: Playhead; wide: boolean }) {
  const t = useSyncExternalStore(playhead.subscribe, playhead.getT)
  const span = result.xmax - result.xmin
  const slider = (
    <Slider
      className={cn('min-w-0', wide && 'flex-1')}
      min={0}
      max={1000}
      step={1}
      value={[Math.round(((t - result.xmin) / span) * 1000)]}
      aria-label={m.time}
      aria-valuetext={`t = ${formatValue(t / result.Tp)} T`}
      onValueChange={(v) => {
        const x = Array.isArray(v) ? v[0] : v
        playhead.setT(result.xmin + (span * x) / 1000)
      }}
    />
  )
  if (!wide) {
    return (
      <div className="flex shrink-0 flex-col gap-3">
        <Values result={result} playhead={playhead} second="area" className="flex justify-between gap-4" />
        {slider}
      </div>
    )
  }
  return (
    <div className="flex shrink-0 items-center gap-4 border-t pt-4">
      <span className="text-sm font-medium whitespace-nowrap">{fill(m.moveT, { t: <i className="font-math">t</i> })}</span>
      {slider}
      <Values result={result} playhead={playhead} second="area" className="flex min-w-36 flex-col text-xs" />
    </div>
  )
}

/**
 * Die Seite Anleitung: die vier Schritte einer Faltung an einem Beispiel, jeder mit seinem Bild,
 * das sich beim Wechsel aufbaut (g klappt um, gleitet nach t, die Fläche blendet ein, das Ergebnis
 * läuft bis t). Breit: links die Schritte, rechts Vorschaubilder, Plot, Ergebnis und Regler. Sonst
 * ein Schritt auf einmal (Text und Hinweis) mit Zurück und Weiter unten; auf dem Telefon steht oben
 * das Beispiel (`ExamplesSheet`), ab `compact:` steht es im Header.
 */
export function GuidePage({
  preset,
  onPreset,
  active,
  onOpenInAnimator,
}: {
  preset: Preset
  /** Ein anderes Beispiel; auf dem Telefon aus dem Blatt oben in der Anleitung */
  onPreset: (p: Preset) => void
  /** Die Seite ist zu sehen; der Regler misst sich dann neu (versteckt hat er keine Breite) */
  active: boolean
  onOpenInAnimator: (p: Preset) => void
}) {
  const wide = useMedia(WIDE_QUERY)
  const reduce = useReducedMotion()
  const result = useMemo(() => computeGuide(preset), [preset])
  const [playhead] = useState(() => new Playhead(0.4))
  const [step, setStep] = useState(0)
  /** Wann der Aufbau des Schritts begann (0: steht schon, −1: beginnt im nächsten Bild), für welches Beispiel */
  const [run, setRun] = useState({ step: 0, preset, start: 0 })
  const [now, setNow] = useState(0)
  const dir = useRef(1)
  const textRef = useRef<HTMLDivElement>(null)
  const t = useSyncExternalStore(playhead.subscribe, playhead.getT)

  // Ein anderes Beispiel und jedes Kommen auf die Seite baut den Schritt neu auf (Zustand aus dem
  // vorigen Rendern)
  const [wasActive, setWasActive] = useState(active)
  if (run.preset !== preset || active !== wasActive) {
    setWasActive(active)
    setRun({ step, preset, start: reduce || !active || step === 3 ? 0 : -1 })
  }

  // t im Bereich des Beispiels halten
  useEffect(() => {
    if (t < result.xmin || t > result.xmax) playhead.setT(Math.min(result.xmax, Math.max(result.xmin, 0.4)))
  }, [result, playhead, t])

  // Den Aufbau Bild für Bild weiterzählen
  useEffect(() => {
    if (!run.start) return
    let raf = 0
    const frame = (ts: number) => {
      if (run.start < 0) return setRun({ ...run, start: ts })
      setNow(ts)
      if (ts - run.start < STEP_MS[run.step]) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [run])
  const k = run.start < 0 ? 0 : run.start ? easeInOut(Math.min(1, Math.max(0, (now - run.start) / STEP_MS[run.step]))) : 1

  // Der Text des neuen Schritts kommt von der Seite, in die es geht
  useLayoutEffect(() => {
    if (reduce || !textRef.current) return
    textRef.current.animate(
      [
        { opacity: 0, transform: `translateX(${dir.current * 24}px)` },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 560, easing: EASE },
    )
  }, [step, reduce])

  // Jeder Schritt baut sein Bild auf (g klappt um, gleitet nach t, die Fläche blendet ein);
  // Integrieren lässt t vom Anfang bis zur Stelle laufen
  const goTo = (next: number) => {
    if (next === step || next < 0 || next >= STEPS.length) return
    dir.current = next > step ? 1 : -1
    setStep(next)
    setRun({ step: next, preset, start: reduce || next === 3 ? 0 : performance.now() })
    if (next === 3 && !reduce) {
      const target = playhead.t
      playhead.setT(result.xmin)
      playhead.glideTo(target, STEP_MS[3], easeInOut)
    }
  }
  const layers = useMemo(() => stepLayers(step, k, t), [step, k, t])
  const thumbs = useMemo(() => STEPS.map((_, i) => stepLayers(i, 1, t, false)), [t])
  const s = STEPS[step]
  const last = step === STEPS.length - 1

  const nav = (
    <div className="flex gap-2">
      <Button variant="outline" className="h-10 flex-1 compact:h-9" disabled={step === 0} onClick={() => goTo(step - 1)}>
        <ChevronLeft data-icon="inline-start" />
        {m.previous}
      </Button>
      <Button className="h-10 flex-1 compact:h-9" onClick={() => (last ? onOpenInAnimator(preset) : goTo(step + 1))}>
        {last ? m.toAnimator : m.next}
        <ChevronRight data-icon="inline-end" />
      </Button>
    </div>
  )
  const plot = (
    <ConvolutionPlot
      result={result}
      playhead={playhead}
      layers={layers}
      label={m.guidePlotLabel(localized(s.title))}
      className="min-h-44 flex-1"
    />
  )

  if (!wide) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Seitlich abgeschnitten: der Text eines neuen Schritts gleitet 24 px von der Seite herein */}
        <div className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto px-4 pt-4 pb-3 compact:px-6">
          {/* Ab `compact:` steht das Beispiel im Header */}
          <ExamplesSheet value={preset} onPreset={onPreset} className="shrink-0 compact:hidden" />
          <div className="flex shrink-0 flex-col gap-1.5">
            <div className="grid grid-cols-4 gap-1" aria-hidden>
              {STEPS.map((x, i) => (
                <span
                  key={x.tex}
                  className={cn(
                    'h-1 rounded-full bg-muted transition-colors duration-560 ease-[cubic-bezier(0.2,0,0,1)]',
                    i <= step && 'bg-foreground',
                  )}
                />
              ))}
            </div>
            <StepOf step={step} />
          </div>
          <div ref={textRef} className="flex shrink-0 flex-col gap-1">
            <h2 className="font-heading text-base font-semibold">{localized(s.title)}</h2>
            <Tex math={s.tex} className="relative overflow-x-auto overflow-y-hidden" />
            <div className="mt-1 flex flex-col gap-1.5 text-muted-foreground">
              <p>{localized(s.text)}</p>
              <p>{localized(s.hint)}</p>
            </div>
          </div>
          {plot}
          <TSlider key={String(active)} result={result} playhead={playhead} wide={false} />
        </div>
        <div ref={bottomBar} className="shrink-0 border-t px-4 py-3 short:py-2 compact:px-6">
          {nav}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-90 shrink-0 flex-col border-r">
        <div className="px-6 pt-6 pb-2">
          <StepOf step={step} />
          <h2 className="font-heading text-base font-semibold">
            {fill(m.guideTitle, { fg: <Tex math="f*g" /> })}
          </h2>
        </div>
        <ol className="relative min-h-0 flex-1 divide-y overflow-x-hidden overflow-y-auto px-6">
          {STEPS.map((x, i) => {
            const current = i === step
            return (
              <li key={x.tex} aria-current={current ? 'step' : undefined}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  className="flex w-full gap-3 py-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-sm font-mono text-xs font-semibold transition-colors duration-560 ease-[cubic-bezier(0.2,0,0,1)]',
                      current
                        ? 'bg-primary text-primary-foreground'
                        : i < step
                          ? 'border border-ring'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="flex min-w-0 flex-col gap-1.5">
                    <span className={cn('font-medium', i > step && 'text-muted-foreground')}>{localized(x.title)}</span>
                    {current ? (
                      <span ref={textRef} className="flex flex-col gap-1.5">
                        <Tex math={x.tex} className="relative overflow-x-auto overflow-y-hidden" />
                        <span className="text-muted-foreground">{localized(x.text)}</span>
                        <span className="text-muted-foreground">{localized(x.hint)}</span>
                      </span>
                    ) : (
                      <Tex math={x.short} className="text-muted-foreground" />
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <div className="flex flex-col gap-2 border-t px-6 py-4">
          {nav}
          <Button variant="ghost" className="self-center text-muted-foreground" onClick={() => onOpenInAnimator(preset)}>
            {m.openInAnimator}
          </Button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-4 p-6">
        <div className="grid shrink-0 grid-cols-4 gap-3">
          {STEPS.map((x, i) => (
            <button
              key={x.tex}
              type="button"
              aria-label={m.stepAria(i + 1, localized(x.title))}
              aria-current={i === step ? 'step' : undefined}
              onClick={() => goTo(i)}
              className={cn(
                'flex flex-col gap-1.5 rounded-lg border p-2 text-left text-xs transition-[border-color,translate] duration-400 ease-[cubic-bezier(0.2,0,0,1)] outline-none hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px',
                i === step && 'border-foreground font-medium hover:border-foreground',
              )}
            >
              <ConvolutionPlot result={result} playhead={playhead} layers={thumbs[i]} label="" className="h-16" />
              <span>
                <span className="font-mono">{i + 1}</span> {localized(x.title)}
              </span>
            </button>
          ))}
        </div>
        {plot}
        <div className="flex shrink-0 flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">
            {fill(m.resultSoFar, { conv: <Tex math="(f*g)(t)" /> })}
          </p>
          <ConvolutionPlot
            result={result}
            playhead={playhead}
            layers={{ ...ANIMATOR_LAYERS, convOnly: true, playhead: false }}
            label={m.resultPlotLabel}
            className="h-36"
          />
        </div>
        <TSlider key={String(active)} result={result} playhead={playhead} wide />
      </main>
    </div>
  )
}
