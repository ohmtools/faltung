import { ArrowLeftRight } from 'lucide-react'

import { FunctionInput } from '@/components/function-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { parseNumber, PRESETS, type Preset, type Settings } from '@/lib/presets'

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
  signed,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  invalid?: boolean
  /** negative Werte erlaubt → volle Tastatur, da der iPhone-Ziffernblock kein Minus hat */
  signed?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode={signed ? 'text' : 'decimal'}
        enterKeyHint="done"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
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
  const Tbad = !(parseNumber(settings.T) > 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Funktionen</CardTitle>
        <CardDescription>Variable t, Parameter T – siehe Funktionsreferenz unten.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
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
            className="justify-self-start md:mt-5.5"
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
              label="T"
              value={settings.T}
              onChange={(T) => onChange({ T })}
              invalid={Tbad}
            />
            <NumberField
              id="x-min"
              label="Von (× T)"
              value={settings.a}
              onChange={(a) => onChange({ a })}
              invalid={!!rangeError}
              signed
            />
            <NumberField
              id="x-max"
              label="Bis (× T)"
              value={settings.b}
              onChange={(b) => onChange({ b })}
              invalid={!!rangeError}
              signed
            />
          </div>
          {(rangeError || Tbad) && (
            <p className="text-sm text-destructive" aria-live="polite">
              {Tbad ? 'T muss größer als 0 sein.' : rangeError}
            </p>
          )}
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Beispiele</h3>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.name}
                variant="outline"
                size="sm"
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
