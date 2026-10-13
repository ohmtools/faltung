import { useSyncExternalStore } from 'react'

import { convAt, type ConvolutionResult } from '@/lib/convolution'
import type { Playhead } from '@/lib/playhead'

const signed = (v: number, digits: number) => (v < 0 ? '−' : ' ') + Math.abs(v).toFixed(digits)

export function Readout({ result, playhead }: { result: ConvolutionResult; playhead: Playhead }) {
  const t = useSyncExternalStore(playhead.subscribe, playhead.getT)
  const c = convAt(result, t) / result.cScale
  return (
    <div
      className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm tabular-nums"
      aria-live="off"
    >
      <span>
        t = <b className="font-medium">{signed(t / result.Tp, 3)}</b> T
      </span>
      <span>
        (f∗g)(t) = <b className="font-medium">{signed(c, 4)}</b>
        {result.convInT ? ' T' : ''}
      </span>
    </div>
  )
}
