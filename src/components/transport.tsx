import { Pause, Play, SkipBack, StepBack, StepForward } from 'lucide-react'
import { useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ConvolutionResult } from '@/lib/convolution'
import type { Playhead } from '@/lib/playhead'

const RES = 1000

type Props = { result: ConvolutionResult; playhead: Playhead }

export function Transport({ result, playhead }: Props) {
  const t = useSyncExternalStore(playhead.subscribe, playhead.getT)
  const playing = useSyncExternalStore(playhead.subscribe, playhead.getPlaying)
  const speed = useSyncExternalStore(playhead.subscribe, playhead.getSpeed)
  const span = result.xmax - result.xmin
  const pos = Math.round(((t - result.xmin) / span) * RES)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <Button
          onClick={() => playhead.setPlaying(!playing)}
          className="min-w-30"
          aria-keyshortcuts="Space"
        >
          {playing ? <Pause /> : <Play />}
          {playing ? 'Pause' : 'Abspielen'}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Zum Anfang"
              onClick={() => {
                playhead.setT(result.xmin)
              }}
            >
              <SkipBack />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zum Anfang (Pos1)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Schritt zurück"
              onClick={() => playhead.step(-0.01, result.xmin, result.xmax)}
            >
              <StepBack />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Schritt zurück (←)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Schritt vor"
              onClick={() => playhead.step(0.01, result.xmin, result.xmax)}
            >
              <StepForward />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Schritt vor (→)</TooltipContent>
        </Tooltip>
      </div>
      <Slider
        className="min-w-0 flex-[1_1_200px]"
        min={0}
        max={RES}
        step={1}
        value={[pos]}
        aria-label="Zeitpunkt t"
        onValueChange={([v]) => {
          playhead.setPlaying(false)
          playhead.setT(result.xmin + (span * v) / RES)
        }}
      />
      <Select value={String(speed)} onValueChange={(v) => playhead.setSpeed(parseFloat(v))}>
        <SelectTrigger className="w-24" aria-label="Geschwindigkeit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0.25">0,25×</SelectItem>
          <SelectItem value="0.5">0,5×</SelectItem>
          <SelectItem value="1">1×</SelectItem>
          <SelectItem value="2">2×</SelectItem>
          <SelectItem value="4">4×</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
