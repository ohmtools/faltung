import { Pause, Play, SkipBack, StepBack, StepForward } from 'lucide-react'
import { useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatNumber, m } from '@/i18n'
import type { ConvolutionResult } from '@/lib/convolution'
import type { Playhead } from '@/lib/playhead'
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
      <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={label} onClick={onClick} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Abspielen, Schritte, Zeitpunkt und Geschwindigkeit. Auf dem Telefon die Bedienleiste über der
 * Tab-Leiste, wo der Daumen ist: Regler und Geschwindigkeit in einer Zeile, die Knöpfe darunter;
 * ab `md` alles in einer Zeile, die Knöpfe vorn.
 */
export function Transport({ result, playhead, className }: Props) {
  const t = useSyncExternalStore(playhead.subscribe, playhead.getT)
  const playing = useSyncExternalStore(playhead.subscribe, playhead.getPlaying)
  const speed = useSyncExternalStore(playhead.subscribe, playhead.getSpeed)
  const span = result.xmax - result.xmin
  const pos = Math.round(((t - result.xmin) / span) * RES)

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2', className)}>
      <div className="flex basis-full items-center gap-3 md:order-last md:min-w-40 md:flex-1 md:basis-0">
        <Slider
          className="min-w-0 flex-1"
          min={0}
          max={RES}
          step={1}
          value={[pos]}
          aria-label={m.time}
          onValueChange={(v) => {
            const x = Array.isArray(v) ? v[0] : v
            playhead.setPlaying(false)
            playhead.setT(result.xmin + (span * x) / RES)
          }}
        />
        <Select
          value={String(speed)}
          items={SPEEDS.map((s) => ({ value: String(s), label: `${formatNumber(s)}×` }))}
          onValueChange={(v) => {
            if (v !== null) playhead.setSpeed(parseFloat(v))
          }}
        >
          <SelectTrigger className="w-20" aria-label={m.speed}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPEEDS.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {formatNumber(s)}×
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <Button onClick={() => playhead.setPlaying(!playing)} className="min-w-30" aria-keyshortcuts="Space">
          {playing ? <Pause data-icon="inline-start" /> : <Play data-icon="inline-start" />}
          {playing ? m.pause : m.play}
        </Button>
        <IconButton label={m.toStart} tip={m.toStartTip} onClick={() => playhead.setT(result.xmin)}>
          <SkipBack />
        </IconButton>
        <IconButton
          label={m.stepBack}
          tip={m.stepBackTip}
          onClick={() => playhead.step(-0.01, result.xmin, result.xmax)}
        >
          <StepBack />
        </IconButton>
        <IconButton
          label={m.stepForward}
          tip={m.stepForwardTip}
          onClick={() => playhead.step(0.01, result.xmin, result.xmax)}
        >
          <StepForward />
        </IconButton>
      </div>
    </div>
  )
}
