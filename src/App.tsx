import { ImageDown, Link2, SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { AppToaster } from '@/components/app-toaster'
import { Logo } from '@/components/brand'
import { ExamplesMenu, FormulaBar, FormulaSummary, type ControlsProps } from '@/components/controls'
import { ConvolutionPlot, type ConvolutionPlotHandle } from '@/components/convolution-plot'
import { GuidePage } from '@/components/guide'
import { PropertiesPage } from '@/components/properties'
import { PwaPrompt } from '@/components/pwa-prompt'
import { SettingsDialog, SettingsPage } from '@/components/settings-page'
import { PageTabs } from '@/components/tab-bar'
import { Tex } from '@/components/tex'
import { Transport } from '@/components/transport'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { useMedia } from '@/hooks/use-media'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { formulaError, localized, m } from '@/i18n'
import { computeConvolution, type ConvolutionResult } from '@/lib/convolution'
import { bind, compileFormula, FormulaError, type CompiledFormula } from '@/lib/formula'
import { COMPACT_QUERY, LG_QUERY } from '@/lib/media'
import { transition, type Nav } from '@/lib/motion'
import { PAGES, type Page } from '@/lib/pages'
import { GLIDE_MS, Playhead } from '@/lib/playhead'
import {
  DEFAULT_SETTINGS,
  GUIDE_PRESET,
  matchPreset,
  parseNumber,
  settingsFromHash,
  settingsToHash,
  type Preset,
  type Settings,
} from '@/lib/presets'
import { cn } from '@/lib/utils'

/** Dauer eines Durchlaufs über den ganzen Bereich bei 1× */
const SWEEP_MS = 12000

type Compiled = { ok: true; c: CompiledFormula } | { ok: false; error: string }

function tryCompile(src: string): Compiled {
  try {
    return { ok: true, c: compileFormula(src) }
  } catch (e) {
    return { ok: false, error: e instanceof FormulaError ? formulaError(e.problem) : m.formulaFailed }
  }
}

type Parts = { f: CompiledFormula; g: CompiledFormula; Tp: number; a: number; b: number }

function parseRange(s: Settings) {
  const Tp = parseNumber(s.T)
  const a = parseNumber(s.a)
  const b = parseNumber(s.b)
  const TpOk = Number.isFinite(Tp) && Tp > 0
  let rangeError: string | null = null
  if (!Number.isFinite(a) || !Number.isFinite(b)) rangeError = m.rangeNotNumbers
  else if (b <= a) rangeError = m.rangeOrder
  else if (b - a > 200) rangeError = m.rangeTooWide
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
    el.closest(
      'input, textarea, select, button, a, [role="slider"], [role="combobox"], [role="menu"], [role="dialog"]',
    ) !== null
  )
}

/** Die Meldung zu Formeln und Bereich für die Zeile über dem Plot; null ohne Fehler. */
function controlsProblem({ settings, fError, gError, rangeError }: ControlsProps): string | null {
  if (fError) return `f: ${fError}`
  if (gError) return `g: ${gError}`
  if (!(parseNumber(settings.T) > 0)) return m.periodPositive
  return rangeError
}

function HeaderButton({ label, onClick, children, pressed }: {
  label: string
  onClick: () => void
  children: React.ReactNode
  pressed?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-10 compact:size-9 aria-pressed:bg-accent"
            onClick={onClick}
            aria-label={label}
            aria-pressed={pressed}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export default function App() {
  const installPrompt = useInstallPrompt()
  const reduce = useReducedMotion()
  const compact = useMedia(COMPACT_QUERY)
  const lg = useMedia(LG_QUERY)
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
  const activePreset = useMemo(() => matchPreset(applied), [applied])

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

  // Seiten: Animator, Anleitung, Eigenschaften; die Einstellungen sind auf dem Telefon eine eigene
  // Seite, ab `compact:` ein Dialog
  const [page, setPage] = useState<Page>('animator')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsPage = settingsOpen && !compact
  const [guidePreset, setGuidePreset] = useState<Preset>(GUIDE_PRESET)

  /** Wechselt die Seite mit einer View Transition: nur die neue Seite bewegt sich. */
  const navigate = useCallback((nav: Nav, update: () => void) => transition(nav, update), [])

  const goPage = useCallback(
    (next: Page) => {
      if (next === page && !settingsPage) return
      const nav: Nav = settingsPage ? 'close' : PAGES.indexOf(next) > PAGES.indexOf(page) ? 'forward' : 'back'
      navigate(nav, () => {
        setPage(next)
        if (settingsPage) setSettingsOpen(false)
      })
    },
    [page, settingsPage, navigate],
  )

  const toggleSettings = useCallback(() => {
    if (compact) setSettingsOpen((o) => !o)
    else navigate(settingsOpen ? 'close' : 'forward', () => setSettingsOpen((o) => !o))
  }, [compact, settingsOpen, navigate])

  // Die Animation läuft nur, solange sie zu sehen ist
  const resumeOnReturn = useRef(false)
  useEffect(() => {
    const visible = page === 'animator' && !settingsPage
    if (!visible && playhead.playing) {
      resumeOnReturn.current = true
      playhead.setPlaying(false)
    } else if (visible && resumeOnReturn.current) {
      resumeOnReturn.current = false
      playhead.setPlaying(true)
    }
  }, [page, settingsPage, playhead])

  // Tastenkürzel des Animators
  const keysActive = useRef(true)
  useEffect(() => {
    keysActive.current = page === 'animator' && !settingsPage
  }, [page, settingsPage])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!keysActive.current || e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return
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
          playhead.glideTo(r.xmin, reduce ? 0 : GLIDE_MS)
          break
        case 'End':
          playhead.glideTo(r.xmax, reduce ? 0 : GLIDE_MS)
          break
        default:
          return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playhead, reduce])

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
      resumeOnReturn.current = false
      applyNow({ ...settings, f: p.f, g: p.g, a: String(p.a), b: String(p.b) })
    },
    [settings, applyNow],
  )

  /** Aus Anleitung und Eigenschaften: das Beispiel im Animator von vorn abspielen */
  const openInAnimator = useCallback(
    (p: Preset) => {
      preset({ ...p })
      goPage('animator')
    },
    [preset, goPage],
  )

  const share = useCallback(async () => {
    const url = window.location.origin + window.location.pathname + settingsToHash(settings)
    try {
      await navigator.clipboard.writeText(url)
      toast.success(m.linkCopied, { description: m.linkCopiedText })
    } catch {
      window.prompt(m.linkPrompt, url)
    }
  }, [settings])

  const savePng = useCallback(async () => {
    const blob = await plotRef.current?.toBlob()
    if (!blob) return
    const file = new File([blob], 'faltung.png', { type: 'image/png' })
    const touch = window.matchMedia('(pointer: coarse)').matches
    if (touch && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: m.appTitle })
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

  const controls: ControlsProps = {
    settings,
    onChange: change,
    onSwap: swap,
    fError: fState.ok ? null : fState.error,
    gError: gState.ok ? null : gState.error,
    fTex: fState.ok ? fState.c.tex : null,
    gTex: gState.ok ? gState.c.tex : null,
    rangeError: rangeState.rangeError,
  }
  const problem = controlsProblem({ ...controls, settings: applied })

  const settingsIcon = (
    <HeaderButton label={m.settings} onClick={toggleSettings}>
      <SlidersHorizontal />
    </HeaderButton>
  )

  return (
    <TooltipProvider>
      {/* Jede Stufe ist genau eine Ansicht hoch, die Seite scrollt nie; was nicht passt, scrollt in
          sich. Platz für die Notch im Querformat. */}
      <div className="flex h-dvh flex-col overflow-hidden text-sm pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
        {/* Die eine Überschrift der Seite, auch wenn der Header fehlt (Einstellungen auf dem Telefon) */}
        <h1 className="sr-only">{m.appTitle}</h1>
        <header className={cn('shrink-0 border-b pt-[env(safe-area-inset-top)]', settingsPage && 'hidden')}>
          <div className="flex h-14 items-center justify-between gap-4 pr-2 pl-4 short:h-12 compact:px-6">
            {
              <div className="flex min-w-0 items-center gap-6">
                <div className="flex items-center gap-2.5">
                  <Logo />
                  <span className="font-heading text-base font-semibold">{m.appTitle}</span>
                </div>
                <PageTabs value={page} onChange={goPage} className="hidden compact:block" />
              </div>
            }
            {(
              <div className="flex items-center gap-2">
                {page === 'animator' && (
                  <>
                    {lg && <ExamplesMenu onPreset={preset} />}
                    <div className="flex items-center gap-2">
                      <HeaderButton label={m.copyLink} onClick={share}>
                        <Link2 />
                      </HeaderButton>
                      <HeaderButton label={m.savePngTip} onClick={savePng}>
                        <ImageDown />
                      </HeaderButton>
                    </div>
                  </>
                )}
                {page === 'guide' && compact && (
                  <ExamplesMenu onPreset={setGuidePreset} label={m.example(localized(guidePreset.name))} />
                )}
                {settingsIcon}
              </div>
            )}
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="page-view flex min-h-0 min-w-0 flex-1 flex-col">
            {settingsPage && <SettingsPage prompt={installPrompt} onClose={toggleSettings} navigate={navigate} />}

            <div className={cn('flex min-h-0 flex-1 flex-col', (page !== 'animator' || settingsPage) && 'hidden')}>
              <div className="shrink-0 border-b py-2.5 pr-2 pl-4 compact:px-6 lg:py-4">
                {lg ? (
                  <FormulaBar {...controls} />
                ) : (
                  <FormulaSummary {...controls} onPreset={preset} activePreset={activePreset} />
                )}
              </div>
              <main className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-4 pb-3 compact:px-6 compact:pt-5">
                <TitleRow
                  problem={problem}
                  preset={activePreset}
                  fTex={controls.fTex}
                  gTex={controls.gTex}
                  showTitle={compact}
                />
                <ConvolutionPlot
                  ref={plotRef}
                  result={result}
                  playhead={playhead}
                  scrub
                  label={m.plotLabel}
                  className="min-h-40 flex-1"
                />
              </main>
              <Transport result={result} playhead={playhead} className="shrink-0 border-t px-4 py-3 compact:px-6" />
            </div>

            <div className={cn('flex min-h-0 flex-1 flex-col', (page !== 'guide' || settingsPage) && 'hidden')}>
              <GuidePage preset={guidePreset} active={page === 'guide' && !settingsPage} onOpenInAnimator={openInAnimator} />
            </div>

            <div className={cn('flex min-h-0 flex-1 flex-col', (page !== 'properties' || settingsPage) && 'hidden')}>
              <PropertiesPage onShow={openInAnimator} />
            </div>
          </div>

        </div>

        <PageTabs value={page} onChange={goPage} bar className={cn('compact:hidden', settingsPage && 'hidden')} />
      </div>

      <SettingsDialog open={compact && settingsOpen} onClose={() => setSettingsOpen(false)} prompt={installPrompt} />
      <PwaPrompt />
      <AppToaster />
    </TooltipProvider>
  )
}

/**
 * Über dem Plot: der Name des Beispiels (oder die eigenen Funktionen als Formel) und rechts die
 * Faltungsformel; gibt es ein Problem mit der Eingabe, steht es an dieser Stelle.
 */
function TitleRow({ problem, preset, fTex, gTex, showTitle }: {
  problem: string | null
  preset: Preset | null
  fTex: string | null
  gTex: string | null
  showTitle: boolean
}) {
  if (problem) {
    return (
      <p className="shrink-0 text-sm text-destructive" aria-live="polite">
        {problem}
      </p>
    )
  }
  if (!showTitle) return null
  return (
    <div className="flex shrink-0 items-baseline justify-between gap-4 short:hidden">
      <h2 className="relative min-w-0 overflow-x-auto overflow-y-hidden font-heading text-base font-semibold whitespace-nowrap">
        {preset ? (
          localized(preset.name)
        ) : fTex && gTex ? (
          <Tex math={`f(t) = ${fTex},\\quad g(t) = ${gTex}`} />
        ) : (
          m.ownFunctions
        )}
      </h2>
      <Tex
        math="(f*g)(t) = \int_{-\infty}^{\infty} f(\tau)\,g(t-\tau)\,\mathrm d\tau"
        className="hidden shrink-0 whitespace-nowrap lg:inline"
      />
    </div>
  )
}
