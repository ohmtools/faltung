import { Pause, Play, SkipBack, StepBack, StepForward } from 'lucide-react'
import { useId, useMemo, useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMedia } from '@/hooks/use-media'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { formatNumber, formatValue, m } from '@/i18n'
import { convAt, type ConvolutionResult } from '@/lib/convolution'
import { COMPACT_QUERY } from '@/lib/media'
import { GLIDE_MS, type Playhead } from '@/lib/playhead'
import { cn } from '@/lib/utils'

const RES = 1000
const SPEEDS = [0.25, 0.5, 1, 2, 4]

type Props = { result: ConvolutionResult; playhead: Playhead; className?: string }


function IconButton({ label, tip, onClick, children }: {
  label: string
  tip: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" size="icon" className="size-10 compact:size-9" aria-label={label} onClick={onClick} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  )
}

/** t und der Wert der Faltung bei t; ohne Impulse in Vielfachen von T. */
export function Values({ result, playhead, className, second }: Props & { second?: 'conv' | 'area' }) {
  const t = useSyncExternalStore(playhead.subscribe, playhead.getT)
  const c = convAt(result, t) / result.cScale
  const unit = result.convInT ? ' T' : ''
  return (
    <div className={cn('tabular-nums', className)} aria-live="off">
      <span>
        <i className="font-math">t</i> = <span className="font-mono font-medium">{formatValue(t / result.Tp)}</span> T
      </span>
      <span>
        {second === 'area' ? (
          m.area
        ) : (
          <>
            (<i className="font-math">f</i>∗<i className="font-math">g</i>)(<i className="font-math">t</i>)
          </>
        )}{' '}
        = <span className="font-mono font-medium">{formatValue(c)}</span>
        {unit}
      </span>
    </div>
  )
}

/**
 * Die Zeitleiste: das Ergebnis als kleine Kurve, bis t in der Textfarbe, danach grau, und eine rote
 * Linie bei t. Darüber liegt ein unsichtbarer Schieberegler, der Tastatur, Ziehen und Tippen
 * übernimmt.
 */
export function Timeline({ result, playhead, className }: Props) {
  const reduce = useReducedMotion()
  const clip = useId()
  const t = useSyncExternalStore(playhead.subscribe, playhead.getT)
  const span = result.xmax - result.xmin
  const pos = Math.min(1, Math.max(0, (t - result.xmin) / span))

  // Die Kurve in Koordinaten 0 … 1000 × 0 … 44, einmal je Ergebnis
  const { line, fill } = useMemo(() => {
    const n = 200
    const lo = result.cmin
    const hi = result.cmax
    const y = (v: number) => 40 - ((v - lo) / (hi - lo)) * 34
    const y0 = y(0)
    let d = ''
    for (let i = 0; i <= n; i++) {
      const k = Math.round((i / n) * result.NT)
      d += `${i ? 'L' : 'M'}${((i / n) * RES).toFixed(1)} ${y(result.conv[k] / result.cScale).toFixed(2)}`
    }
    return { line: d, fill: `${d}L${RES} ${y0}L0 ${y0}Z` }
  }, [result])

  return (
    <div
      className={cn(
        'relative h-11 overflow-hidden rounded-md border transition-[border-color,box-shadow] has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
        className,
      )}
    >
      <svg viewBox={`0 0 ${RES} 44`} preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full">
        <defs>
          <clipPath id={clip}>
            <rect x="0" y="0" width={pos * RES} height="44" />
          </clipPath>
        </defs>
        <path d={fill} className="fill-muted" />
        <path d={line} className="fill-none stroke-ring" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <path
          d={line}
          clipPath={`url(#${clip})`}
          className="fill-none stroke-foreground"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span aria-hidden className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-red" style={{ left: `${pos * 100}%` }} />
      <input
        type="range"
        min={0}
        max={RES}
        step={1}
        value={Math.round(pos * RES)}
        aria-label={m.time}
        aria-valuetext={`t = ${formatValue(t / result.Tp)} T`}
        className="absolute inset-0 m-0 size-full cursor-ew-resize touch-none opacity-0"
        onPointerDown={(e) => {
          // Tippen gleitet zur Stelle, Ziehen folgt danach direkt
          const rect = e.currentTarget.getBoundingClientRect()
          const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
          playhead.glideTo(result.xmin + span * x, reduce ? 0 : GLIDE_MS)
          e.preventDefault()
          const move = (ev: PointerEvent) => {
            const xx = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width))
            playhead.setT(result.xmin + span * xx)
          }
          const up = () => {
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', up)
            window.removeEventListener('pointercancel', up)
          }
          window.addEventListener('pointermove', move)
          window.addEventListener('pointerup', up)
          window.addEventListener('pointercancel', up)
        }}
        onChange={(e) => {
          playhead.setPlaying(false)
          playhead.setT(result.xmin + (span * Number(e.target.value)) / RES)
        }}
      />
    </div>
  )
}

function Speed({ playhead }: { playhead: Playhead }) {
  const speed = useSyncExternalStore(playhead.subscribe, playhead.getSpeed)
  return (
    <Select
      value={String(speed)}
      items={SPEEDS.map((s) => ({ value: String(s), label: `${formatNumber(s)}×` }))}
      onValueChange={(v) => {
        if (v !== null) playhead.setSpeed(parseFloat(v))
      }}
    >
      <SelectTrigger className="w-20 font-mono" aria-label={m.speed}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SPEEDS.map((s) => (
          <SelectItem key={s} value={String(s)} className="font-mono">
            {formatNumber(s)}×
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Abspielen, Schritte, Zeitleiste, Werte und Geschwindigkeit. Auf dem Telefon über der Tab-Leiste,
 * wo der Daumen ist: die Werte, die Zeitleiste und darunter die Knöpfe mit einem breiten
 * Abspielknopf; ab `compact:` alles in einer Zeile.
 */
export function Transport({ result, playhead, className }: Props) {
  const reduce = useReducedMotion()
  const compact = useMedia(COMPACT_QUERY)
  const playing = useSyncExternalStore(playhead.subscribe, playhead.getPlaying)
  const play = (
    <Button
      onClick={() => playhead.setPlaying(!playing)}
      className={cn('h-10 compact:h-9', compact ? 'min-w-30' : 'mx-1 flex-1')}
      aria-keyshortcuts="Space"
    >
      {playing ? <Pause data-icon="inline-start" /> : <Play data-icon="inline-start" />}
      {playing ? m.pause : m.play}
    </Button>
  )
  const toStart = (
    <IconButton label={m.toStart} tip={m.toStartTip} onClick={() => playhead.glideTo(result.xmin, reduce ? 0 : GLIDE_MS)}>
      <SkipBack />
    </IconButton>
  )
  const back = (
    <IconButton label={m.stepBack} tip={m.stepBackTip} onClick={() => playhead.step(-0.01, result.xmin, result.xmax)}>
      <StepBack />
    </IconButton>
  )
  const forward = (
    <IconButton
      label={m.stepForward}
      tip={m.stepForwardTip}
      onClick={() => playhead.step(0.01, result.xmin, result.xmax)}
    >
      <StepForward />
    </IconButton>
  )

  if (!compact) {
    return (
      <div className={cn('flex flex-col gap-2.5', className)}>
        <Values result={result} playhead={playhead} className="flex justify-between gap-4" />
        <Timeline result={result} playhead={playhead} />
        <div className="flex items-center">
          {toStart}
          {back}
          {play}
          {forward}
          <Speed playhead={playhead} />
        </div>
      </div>
    )
  }
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex items-center gap-1">
        {play}
        <div className="flex">
          {toStart}
          {back}
          {forward}
        </div>
      </div>
      <Timeline result={result} playhead={playhead} className="min-w-0 flex-1" />
      <Values result={result} playhead={playhead} className="flex min-w-36 flex-col text-xs" />
      <Speed playhead={playhead} />
    </div>
  )
}
