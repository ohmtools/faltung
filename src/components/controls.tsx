import { ArrowLeftRight, ArrowUpDown, ChevronDown, CircleHelp } from 'lucide-react'
import { useRef } from 'react'

import { FunctionInput } from '@/components/function-input'
import { FunctionReference } from '@/components/function-reference'
import { Expand } from '@/components/ohmtools/expand'
import { Popup, PopupItem } from '@/components/ohmtools/popup'
import { Swatch } from '@/components/swatch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { localized, m } from '@/i18n'
import { parseNumber, PRESETS, type Preset, type Settings } from '@/lib/presets'
import { cn } from '@/lib/utils'

export type ControlsProps = {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onSwap: () => void
  fError: string | null
  gError: string | null
  fTex: string | null
  gTex: string | null
  rangeError: string | null
}

function NumberInput({
  id,
  value,
  onChange,
  invalid,
  signed,
  className,
  ...rest
}: {
  id: string
  value: string
  onChange: (v: string) => void
  invalid?: boolean
  /** negative Werte erlaubt → volle Tastatur, da der iPhone-Ziffernblock kein Minus hat */
  signed?: boolean
  className?: string
  'aria-label'?: string
}) {
  return (
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
      className={cn('font-mono', className)}
      {...rest}
    />
  )
}

/**
 * Ab `lg:` eine Zeile über dem Plot: f, Tauschen, g, dann T und der Bereich, rechts die
 * Funktionsreferenz im Popover. Der Strich vor f und g ist die einzige Zuordnung von Farbe zu Kurve.
 * Meldungen stehen in der Titelzeile darunter.
 */
export function FormulaBar(props: ControlsProps) {
  const { settings, onChange, onSwap, fError, gError, rangeError } = props
  const Tbad = !(parseNumber(settings.T) > 0)
  return (
    <div className="flex items-center gap-3">
      <FunctionInput
        id="f-row"
        name="f"
        variant="row"
        value={settings.f}
        onChange={(f) => onChange({ f })}
        error={fError}
        tex={null}
      />
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" size="icon" onClick={onSwap} aria-label={m.swap} />}>
          <ArrowLeftRight />
        </TooltipTrigger>
        <TooltipContent>{m.swap}</TooltipContent>
      </Tooltip>
      <FunctionInput
        id="g-row"
        name="g"
        variant="row"
        value={settings.g}
        onChange={(g) => onChange({ g })}
        error={gError}
        tex={null}
      />
      <Separator orientation="vertical" className="mx-2 h-6!" />
      <Label htmlFor="t-row">T</Label>
      <NumberInput id="t-row" value={settings.T} onChange={(T) => onChange({ T })} invalid={Tbad} className="w-16" />
      <Label htmlFor="a-row" className="ml-2">
        {m.range}
      </Label>
      <NumberInput
        id="a-row"
        aria-label={m.fromLabel}
        value={settings.a}
        onChange={(a) => onChange({ a })}
        invalid={!!rangeError}
        signed
        className="w-16"
      />
      <span className="text-muted-foreground">{m.rangeTo}</span>
      <NumberInput
        id="b-row"
        aria-label={m.toLabel}
        value={settings.b}
        onChange={(b) => onChange({ b })}
        invalid={!!rangeError}
        signed
        className="w-16"
      />
      <span className="whitespace-nowrap text-muted-foreground">× T</span>
      <Tooltip>
        <Popup
          kind="popover"
          title={m.referenceTitle}
          titleHidden
          align="end"
          trigger={
            <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={m.referenceTitle} />}>
              <CircleHelp />
            </TooltipTrigger>
          }
          className="relative max-h-[min(36rem,var(--available-height))] w-[28rem]"
        >
          <FunctionReference />
        </Popup>
        <TooltipContent>{m.referenceTitle}</TooltipContent>
      </Tooltip>
    </div>
  )
}

/**
 * Fertige Paare von f und g als Menü (auf dem Telefon ein Drawer von unten): im Header des Animators
 * (ab `lg:`, ein Beispiel startet die Animation von vorn) und der Anleitung (`value`: das gewählte
 * trägt einen Haken; auf dem Telefon als Knopf oben in der Anleitung).
 */
export function ExamplesMenu({
  onPreset,
  value,
  label = m.examples,
  className,
}: {
  onPreset: (p: Preset) => void
  value?: Preset
  label?: string
  className?: string
}) {
  return (
    <Popup
      kind="menu"
      title={m.examples}
      checks={value !== undefined}
      align="end"
      className="min-w-56"
      trigger={
        <Button variant="outline" className={cn('h-10 compact:h-9', className)}>
          {label}
          <ChevronDown data-icon="inline-end" className="text-muted-foreground" />
        </Button>
      }
    >
      {PRESETS.map((p) => (
        <PopupItem key={p.name.de} checked={value?.name.de === p.name.de} onSelect={() => onPreset(p)}>
          {localized(p.name)}
        </PopupItem>
      ))}
    </Popup>
  )
}

/** Unter `lg:` steht über dem Plot nur, was f und g sind; „Bearbeiten“ daneben bringt `PageEditor`. */
export function FormulaSummary({ settings }: { settings: Settings }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 font-mono text-xs">
      {(['f', 'g'] as const).map((name) => (
        <span key={name} className="flex min-w-0 items-center gap-2">
          <Swatch series={name} />
          <span className="relative min-w-0 overflow-x-auto whitespace-nowrap [scrollbar-width:none]">
            <i className="font-math text-sm">{name}</i> = {settings[name]}
          </span>
        </span>
      ))}
    </div>
  )
}

/** Bausteine, die der Editor an der Schreibmarke einfügt; bei Funktionen landet sie in der Klammer. */
const BLOCKS = ['rect()', 'tri()', 'u()', 'delta()', 'exp()', 'sin()', 'T']

/** Eine Reihe zum seitlichen Wischen, bis an die Ränder von Drawer und Blatt. */
const BLEED = 'relative -mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] compact:-mx-6 compact:px-6'

/**
 * Der Editor unter `lg:`, im Drawer (Telefon) oder Blatt von rechts (`PageEditor`): die Eingaben,
 * Bausteine zum Einfügen (Telefontastaturen haben keine Klammern auf der ersten Ebene), der Bereich,
 * die Beispiele und die Funktionsreferenz zum Aufklappen.
 */
export function FormulaEditor(props: ControlsProps & { onPreset: (p: Preset) => void; activePreset: Preset | null }) {
  const { settings, onChange, onSwap, fError, gError, fTex, gTex, rangeError, onPreset, activePreset } = props
  const fRef = useRef<HTMLInputElement>(null)
  const gRef = useRef<HTMLInputElement>(null)
  const last = useRef<'f' | 'g'>('f')
  const Tbad = !(parseNumber(settings.T) > 0)

  const insert = (block: string) => {
    const name = last.current
    const el = (name === 'f' ? fRef : gRef).current
    if (!el) return
    const v = settings[name]
    const a = el.selectionStart ?? v.length
    const b = el.selectionEnd ?? v.length
    const next = v.slice(0, a) + block + v.slice(b)
    const caret = a + (block.endsWith('()') ? block.length - 1 : block.length)
    onChange({ [name]: next })
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }

  return (
    <>
      <div className="flex flex-col gap-4 border-b pb-4 compact:pb-6">
        <FunctionInput
          ref={fRef}
          id="f-in"
          name="f"
          value={settings.f}
          onChange={(f) => onChange({ f })}
          onFocus={() => (last.current = 'f')}
          error={fError}
          tex={fTex}
        />
        <div role="group" aria-label={m.insert} className={cn(BLEED, '-mt-2')}>
          {BLOCKS.map((b) => (
            <Button
              key={b}
              variant="outline"
              size="sm"
              className="font-mono"
              // die Schreibmarke bleibt im Eingabefeld
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => insert(b)}
            >
              {b}
            </Button>
          ))}
        </div>
        <div className="flex items-start gap-2">
          <FunctionInput
            ref={gRef}
            id="g-in"
            name="g"
            value={settings.g}
            onChange={(g) => onChange({ g })}
            onFocus={() => (last.current = 'g')}
            error={gError}
            tex={gTex}
            className="flex-1"
          />
          <Button variant="outline" size="icon" className="mt-6 size-10 compact:size-9" onClick={onSwap} aria-label={m.swap}>
            <ArrowUpDown />
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="t-in">T</Label>
              <NumberInput id="t-in" value={settings.T} onChange={(T) => onChange({ T })} invalid={Tbad} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="a-in">{m.from}</Label>
              <NumberInput id="a-in" value={settings.a} onChange={(a) => onChange({ a })} invalid={!!rangeError} signed />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="b-in">{m.to}</Label>
              <NumberInput id="b-in" value={settings.b} onChange={(b) => onChange({ b })} invalid={!!rangeError} signed />
            </div>
          </div>
          {(rangeError || Tbad) && (
            <p className="text-xs text-destructive" aria-live="polite">
              {Tbad ? m.periodPositive : rangeError}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 compact:pt-2">
        <h3 className="text-sm font-medium">{m.examples}</h3>
        <div className={BLEED}>
          {PRESETS.map((p) => (
            <Button
              key={p.name.de}
              variant="outline"
              size="sm"
              aria-pressed={p === activePreset}
              className="aria-pressed:bg-accent"
              onClick={() => onPreset(p)}
            >
              {localized(p.name)}
            </Button>
          ))}
        </div>
      </div>

      <Expand title={m.referenceTitle} icon={<CircleHelp data-icon="inline-start" />}>
        <FunctionReference />
      </Expand>
    </>
  )
}
