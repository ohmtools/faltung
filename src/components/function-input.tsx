import { Swatch } from '@/components/swatch'
import { Tex } from '@/components/tex'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
      <Label htmlFor={id}>
        <Swatch series={name} />
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
      />
      <div id={`${id}-msg`} className="min-h-7 text-sm" aria-live="polite">
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : tex ? (
          <span className="text-muted-foreground">
            <Tex math={`${name}(t) = ${tex}`} />
          </span>
        ) : null}
      </div>
    </div>
  )
}
