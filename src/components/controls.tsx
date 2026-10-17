import { ArrowLeftRight } from 'lucide-react'

import { FunctionInput } from '@/components/function-input'
import { Section } from '@/components/section'
import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { localized, m } from '@/i18n'
import { parseNumber, PRESETS, type Preset, type Settings } from '@/lib/presets'

type Props = {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onSwap: () => void
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

/** f, g, T und der Bereich. */
export function Controls({ settings, onChange, onSwap, fError, gError, fTex, gTex, rangeError }: Props) {
  const Tbad = !(parseNumber(settings.T) > 0)
  return (
    <Section>
      <CardHeader>
        <CardTitle>{m.functionsTitle}</CardTitle>
        <CardDescription>{m.functionsDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <FunctionInput
            id="f-in"
            name="f"
            value={settings.f}
            onChange={(f) => onChange({ f })}
            error={fError}
            tex={fTex}
          />
          <Button variant="outline" size="sm" onClick={onSwap} className="self-start">
            <ArrowLeftRight data-icon="inline-start" />
            {m.swap}
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
          <div className="flex gap-4">
            <NumberField id="t-per" label="T" value={settings.T} onChange={(T) => onChange({ T })} invalid={Tbad} />
            <NumberField
              id="x-min"
              label={m.from}
              value={settings.a}
              onChange={(a) => onChange({ a })}
              invalid={!!rangeError}
              signed
            />
            <NumberField
              id="x-max"
              label={m.to}
              value={settings.b}
              onChange={(b) => onChange({ b })}
              invalid={!!rangeError}
              signed
            />
          </div>
          {(rangeError || Tbad) && (
            <p className="text-sm text-destructive" aria-live="polite">
              {Tbad ? m.periodPositive : rangeError}
            </p>
          )}
        </div>
      </CardContent>
    </Section>
  )
}

/** Fertige Paare von f und g; eines startet die Animation von vorn. */
export function Examples({ onPreset }: { onPreset: (p: Preset) => void }) {
  return (
    <Section>
      <CardHeader>
        <CardTitle>{m.examples}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button key={p.name.de} variant="outline" size="sm" onClick={() => onPreset(p)}>
            {localized(p.name)}
          </Button>
        ))}
      </CardContent>
    </Section>
  )
}
