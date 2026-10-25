import { forwardRef } from 'react'

import { Swatch } from '@/components/swatch'
import { Tex } from '@/components/tex'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Props = {
  id: string
  name: 'f' | 'g'
  value: string
  onChange: (v: string) => void
  error: string | null
  tex: string | null
  /** `row`: Beschriftung daneben, ohne Zeile darunter (Formelzeile, die Meldung steht dort) */
  variant?: 'stacked' | 'row'
  className?: string
  onFocus?: () => void
}

export function FunctionLabel({ name, htmlFor, eq = true }: { name: 'f' | 'g'; htmlFor?: string; eq?: boolean }) {
  return (
    <Label htmlFor={htmlFor} className="shrink-0 gap-2 whitespace-nowrap">
      <Swatch series={name} />
      <span>
        <i className="font-math">{name}</i>(<i className="font-math">t</i>){eq && ' ='}
      </span>
    </Label>
  )
}

export const FunctionInput = forwardRef<HTMLInputElement, Props>(function FunctionInput(
  { id, name, value, onChange, error, tex, variant = 'stacked', className, onFocus },
  ref,
) {
  const input = (
    <Input
      ref={ref}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      enterKeyHint="done"
      aria-invalid={error ? true : undefined}
      aria-describedby={variant === 'stacked' ? `${id}-msg` : undefined}
      className={cn('font-mono', variant === 'row' && 'w-auto min-w-36 flex-1 basis-0 lg:max-w-65')}
    />
  )
  if (variant === 'row') {
    return (
      <>
        <FunctionLabel name={name} htmlFor={id} />
        {input}
      </>
    )
  }
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <FunctionLabel name={name} htmlFor={id} eq={false} />
      {input}
      <div id={`${id}-msg`} className="min-h-6 text-xs" aria-live="polite">
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : tex ? (
          <span className="text-muted-foreground">
            <Tex math={`= ${tex}`} />
          </span>
        ) : null}
      </div>
    </div>
  )
})
