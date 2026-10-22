import { ImageDown, Link2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { AppToaster } from '@/components/app-toaster'
import { Brand } from '@/components/brand'
import { Controls, Examples } from '@/components/controls'
import { ConvolutionPlot, type ConvolutionPlotHandle } from '@/components/convolution-plot'
import { Explanation, Properties } from '@/components/explanation'
import { FunctionReference } from '@/components/function-reference'
import { GitHubLink } from '@/components/github-link'
import { InstallButton } from '@/components/install'
import { LanguageSwitcher } from '@/components/language-switcher'
import { PwaPrompt } from '@/components/pwa-prompt'
import { Readout } from '@/components/readout'
import { Section } from '@/components/section'
import { SettingsPage } from '@/components/settings-page'
import { Swatch } from '@/components/swatch'
import { TabBar, type Tab } from '@/components/tab-bar'
import { Tex } from '@/components/tex'
import { Transport } from '@/components/transport'
import { Button } from '@/components/ui/button'
import { CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useInstallPrompt, type InstallPrompt } from '@/hooks/use-install-prompt'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { formulaError, m } from '@/i18n'
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
import { isDesktop } from '@/lib/media'
import { cn } from '@/lib/utils'

/** Dauer eines Durchlaufs über den ganzen Bereich bei 1× */
const SWEEP_MS = 6000

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
    el.closest('input, textarea, select, button, a, [role="slider"], [role="combobox"], [role="menu"]') !==
      null
  )
}

export default function App() {
  const installPrompt = useInstallPrompt()
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

  // Telefone zeigen eine Seite auf einmal (`TabBar`); los geht es mit der Animation
  const [tab, setTab] = useState<Tab>('animation')
  const switchTab = useCallback((next: Tab) => {
    setTab(next)
    window.scrollTo({ top: 0 })
  }, [])

  const preset = useCallback(
    (p: Preset) => {
      restart.current = true
      applyNow({ ...settings, f: p.f, g: p.g, a: String(p.a), b: String(p.b) })
      // Ein Beispiel startet die Animation von vorn: auf dem Telefon dorthin wechseln
      if (!isDesktop()) switchTab('animation')
    },
    [settings, applyNow, switchTab],
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

  const phonePage = tab === 'animation' ? 'h-dvh overflow-hidden' : 'min-h-dvh'

  return (
    <TooltipProvider>
      {/* Desktop: genau eine Ansicht hoch, die Seite scrollt nie, die Spalten in sich. Telefone
          (und zu niedrige Fenster, siehe `desktop` in index.css): eine Seite je Tab; die Animation
          ist ebenfalls eine Ansicht hoch, die anderen scrollen normal. Platz für die Tab-Leiste
          und im Querformat für die Notch. */}
      <div
        className={cn(
          'flex flex-col pr-[env(safe-area-inset-right)] pb-[calc(3.5rem+env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)] desktop:h-dvh desktop:min-h-0 desktop:overflow-hidden desktop:pb-0',
          phonePage,
        )}
      >
        {/* Kein sichtbarer Header (ohmtools-Design); der Name steht im Footer */}
        <h1 className="sr-only">{m.appTitle}</h1>

        <main className="grid min-h-0 w-full flex-1 grid-cols-1 desktop:grid-cols-[24rem_minmax(0,1fr)]">
          {/* Links die Eingaben und zum Nachschlagen; auf dem Desktop scrollt die Spalte in sich,
              auf dem Telefon sind es zwei Tabs. Linien statt Kästen trennen die Abschnitte. */}
          <div
            className={cn(
              'min-h-0 flex-col desktop:flex desktop:overflow-y-auto desktop:border-r',
              tab === 'functions' || tab === 'explanation' ? 'flex' : 'hidden',
            )}
          >
            <div className={cn('flex-col divide-y desktop:flex', tab === 'functions' ? 'flex' : 'hidden')}>
              <Controls
                settings={settings}
                onChange={change}
                onSwap={swap}
                fError={fState.ok ? null : fState.error}
                gError={gState.ok ? null : gState.error}
                fTex={fState.ok ? fState.c.tex : null}
                gTex={gState.ok ? gState.c.tex : null}
                rangeError={rangeState.rangeError}
              />
              <Examples onPreset={preset} />
              <FunctionReference />
            </div>
            <div
              className={cn(
                'flex-col divide-y desktop:flex desktop:border-t',
                tab === 'explanation' ? 'flex' : 'hidden',
              )}
            >
              <Explanation />
              <Properties />
              <Usage />
            </div>
          </div>

          {/* Rechts die Animation; der Footer gehört auf dem Desktop zu dieser Spalte */}
          <div
            className={cn(
              'min-h-0 flex-col overflow-y-auto desktop:flex desktop:overflow-hidden',
              tab === 'animation' ? 'flex' : 'hidden',
            )}
          >
            {/* Füllt die Höhe; auf zu niedrigen Telefonen (quer) nie kleiner als der Inhalt mit
                dem Mindestmaß des Plots, dann scrollt die Spalte */}
            <Section className="flex-[1_0_auto] gap-4 desktop:min-h-0 desktop:flex-1">
              <CardHeader>
                <CardTitle>{m.animationTitle}</CardTitle>
                <CardDescription className="flex flex-col gap-1">
                  <Tex
                    math="(f*g)(t) = \int_{-\infty}^{\infty} f(\tau)\,g(t-\tau)\,\mathrm d\tau"
                    className="whitespace-nowrap"
                  />
                  <span className="hidden max-w-[70ch] desktop:block">{m.animationHint}</span>
                </CardDescription>
                <CardAction className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger
                      render={<Button variant="ghost" size="icon" onClick={share} aria-label={m.copyLink} />}
                    >
                      <Link2 />
                    </TooltipTrigger>
                    <TooltipContent>{m.copyLinkTip}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={<Button variant="ghost" size="icon" onClick={savePng} aria-label={m.savePng} />}
                    >
                      <ImageDown />
                    </TooltipTrigger>
                    <TooltipContent>{m.savePngTip}</TooltipContent>
                  </Tooltip>
                </CardAction>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
                <Legend convInT={result.convInT} />
                <ConvolutionPlot ref={plotRef} result={result} playhead={playhead} className="min-h-48 flex-1" />
                <Readout result={result} playhead={playhead} />
              </CardContent>
            </Section>
            {/* Telefon: die Bedienleiste über der Tab-Leiste, wo der Daumen ist */}
            <Transport result={result} playhead={playhead} className="border-t px-6 py-3" />
            <Footer prompt={installPrompt} />
          </div>

          {/* Nur Telefone: der Inhalt des Footers als Seite */}
          <div className={cn('flex-col desktop:hidden', tab === 'settings' ? 'flex' : 'hidden')}>
            <SettingsPage prompt={installPrompt} />
          </div>
        </main>

        <TabBar value={tab} onChange={switchTab} />
      </div>
      <PwaPrompt />
      <AppToaster />
    </TooltipProvider>
  )
}

/** Logo, Name und Version · Hinweis · Installieren · Sprache · GitHub. Nur auf dem Desktop. */
function Footer({ prompt }: { prompt: InstallPrompt }) {
  return (
    <footer className="hidden border-t desktop:block">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Brand className="text-foreground" />
          {m.footerNote}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <InstallButton prompt={prompt} />
          <LanguageSwitcher />
          <GitHubLink />
        </div>
      </div>
    </footer>
  )
}

function Legend({ convInT }: { convInT: boolean }) {
  const items: [React.ComponentProps<typeof Swatch>['series'], string][] = [
    ['area', m.legendArea],
    ['f', 'f(τ)'],
    ['g', 'g(t−τ)'],
    ['conv', convInT ? m.legendConvInT : '(f∗g)(t)'],
  ]
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
      {items.map(([series, label]) => (
        <span key={series} className="inline-flex items-center gap-1.5">
          <Swatch series={series} />
          {label}
        </span>
      ))}
    </div>
  )
}

function Usage() {
  const keys: [string[], string][] = [
    [[m.keySpace], m.usagePlay],
    [['←', '→'], m.usageStep],
    [[m.keyHome, m.keyEnd], m.usageEnds],
    [[m.keyDrag, m.keyTap], m.usageScrub],
  ]
  return (
    <Section>
      <CardHeader>
        <CardTitle>{m.usageTitle}</CardTitle>
        <CardDescription>{m.usageDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-3">
          {keys.map(([k, v]) => (
            <div key={v} className="flex items-center gap-3">
              <dt>
                <KbdGroup>
                  {k.map((one) => (
                    <Kbd key={one}>{one}</Kbd>
                  ))}
                </KbdGroup>
              </dt>
              <dd className="text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Section>
  )
}
