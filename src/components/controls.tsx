import { ArrowLeftRight } from 'lucide-react'

import { FunctionInput } from '@/components/function-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { PRESETS, type Preset, type Settings } from '@/lib/presets'

type Props = {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onSwap: () => void
  onPreset: (p: Preset) => void
  fError: string | null
  gError: string | null
  fTex: string | null
  gTex: string | null
  rangeError: string | null
}

function NumberField({
  id,
  label,
  value,
  onChange,
  invalid,
  min,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  invalid?: boolean
  min?: number
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <Label htmlFor={id} className="text-xs tracking-wider text-muted-foreground uppercase">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step={0.5}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        className="h-10 font-mono"
      />
    </div>
  )
}

export function Controls({
  settings,
  onChange,
  onSwap,
  onPreset,
  fError,
  gError,
  fTex,
  gTex,
  rangeError,
}: Props) {
  const Tbad = !(parseFloat(settings.T) > 0)
  return (
    <Card className="gap-5">
      <CardHeader>
        <CardTitle>Funktionen</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
          <FunctionInput
            id="f-in"
            name="f"
            value={settings.f}
            onChange={(f) => onChange({ f })}
            error={fError}
            tex={fTex}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onSwap}
            className="justify-self-start md:mt-6"
            aria-label="f und g tauschen"
          >
            <ArrowLeftRight />
            <span className="md:sr-only">f ⇄ g tauschen</span>
          </Button>
          <FunctionInput
            id="g-in"
            name="g"
            value={settings.g}
            onChange={(g) => onChange({ g })}
            error={gError}
            tex={gTex}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-3">
            <NumberField
              id="t-per"
              label="T ="
              value={settings.T}
              onChange={(T) => onChange({ T })}
              invalid={Tbad}
              min={0.001}
            />
            <NumberField
              id="x-min"
              label="Von (× T)"
              value={settings.a}
              onChange={(a) => onChange({ a })}
              invalid={!!rangeError}
            />
            <NumberField
              id="x-max"
              label="Bis (× T)"
              value={settings.b}
              onChange={(b) => onChange({ b })}
              invalid={!!rangeError}
            />
          </div>
          {(rangeError || Tbad) && (
            <p className="font-mono text-xs text-destructive" aria-live="polite">
              {Tbad ? 'T muss größer als 0 sein.' : rangeError}
            </p>
          )}
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Beispiele
          </h3>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.name}
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => onPreset(p)}
              >
                {p.name}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
