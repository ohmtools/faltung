import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tex } from '@/components/tex'
import { cn } from '@/lib/utils'

type Props = {
  id: string
  name: 'f' | 'g'
  value: string
  onChange: (v: string) => void
  error: string | null
  tex: string | null
}

export function FunctionInput({ id, name, value, onChange, error, tex }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id} className="font-mono text-sm text-muted-foreground">
        <i
          aria-hidden
          className={cn(
            'inline-block h-[3px] w-4.5 rounded-sm',
            name === 'f' ? 'bg-plot-f' : 'bg-plot-g',
          )}
        />
        {name}(t) =
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-msg`}
        className="h-10 font-mono"
      />
      <div id={`${id}-msg`} className="min-h-7 text-sm" aria-live="polite">
        {error ? (
          <span className="font-mono text-xs text-destructive">{error}</span>
        ) : tex ? (
          <span className="text-muted-foreground">
            <Tex math={`${name}(t) = ${tex}`} />
          </span>
        ) : null}
      </div>
    </div>
  )
}
