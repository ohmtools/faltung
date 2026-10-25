import { ArrowLeftRight, ArrowUpDown, ChevronDown, CircleHelp, Pencil } from 'lucide-react'
import { useRef, useState } from 'react'

import { FunctionInput } from '@/components/function-input'
import { FunctionReference } from '@/components/function-reference'
import { Swatch } from '@/components/swatch'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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
 * Ab `lg:` eine Zeile über dem Plot: f, Tauschen, g, dann T und der Bereich. Der Strich vor f und g
 * ist die einzige Zuordnung von Farbe zu Kurve. Meldungen stehen in der Titelzeile darunter.
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
      <Popover>
        <Tooltip>
          <TooltipTrigger
            render={<PopoverTrigger render={<Button variant="ghost" size="icon" aria-label={m.referenceTitle} />} />}
          >
            <CircleHelp />
          </TooltipTrigger>
          <TooltipContent>{m.referenceTitle}</TooltipContent>
        </Tooltip>
        <PopoverContent align="end" className="max-h-[min(36rem,var(--available-height))] w-[28rem] overflow-y-auto">
          <FunctionReference />
        </PopoverContent>
      </Popover>
    </div>
  )
}

/** Fertige Paare von f und g im Header (ab `lg:`); eines startet die Animation von vorn. */
export function ExamplesMenu({ onPreset, label = m.examples }: { onPreset: (p: Preset) => void; label?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        {label}
        <ChevronDown data-icon="inline-end" className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-56">
        {PRESETS.map((p) => (
          <DropdownMenuItem key={p.name.de} onClick={() => onPreset(p)}>
            {localized(p.name)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Bausteine, die das Blatt an der Schreibmarke einfügt; bei Funktionen landet sie in der Klammer. */
const BLOCKS = ['rect()', 'tri()', 'u()', 'delta()', 'exp()', 'sin()', 'T']

/**
 * Unter `lg:` steht über dem Plot nur, was f und g sind, mit „Bearbeiten“: das öffnet ein Blatt von
 * unten mit den Eingaben, Bausteinen zum Einfügen (Telefontastaturen haben keine Klammern auf der
 * ersten Ebene), dem Bereich, den Beispielen und der Funktionsreferenz.
 */
export function FormulaSummary(props: ControlsProps & { onPreset: (p: Preset) => void; activePreset: Preset | null }) {
  const { settings, onChange, onSwap, fError, gError, fTex, gTex, rangeError, onPreset, activePreset } = props
  const [open, setOpen] = useState(false)
  const [reference, setReference] = useState(false)
  const fRef = useRef<HTMLInputElement>(null)
  const gRef = useRef<HTMLInputElement>(null)
  // Das Blatt fokussiert seinen Titel, nicht das erste Eingabefeld: sonst öffnet sich auf dem
  // Telefon sofort die Tastatur und verdeckt die Hälfte
  const titleRef = useRef<HTMLHeadingElement>(null)
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5 font-mono text-[13px]">
          {(['f', 'g'] as const).map((name) => (
            <span key={name} className="flex min-w-0 items-center gap-2">
              <Swatch series={name} />
              <span className="min-w-0 overflow-x-auto whitespace-nowrap [scrollbar-width:none]">
                <i className="font-math text-sm">{name}</i> = {settings[name]}
              </span>
            </span>
          ))}
        </div>
        <Button variant="outline" className="h-10 compact:h-9" onClick={() => setOpen(true)}>
          <Pencil data-icon="inline-start" />
          {m.edit}
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          closeLabel={m.close}
          initialFocus={titleRef}
          className="mx-auto max-h-[90dvh] max-w-2xl gap-0 overflow-y-auto pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader className="pb-2">
            <SheetTitle ref={titleRef} tabIndex={-1} className="text-base font-semibold outline-none">
              {m.functionsTitle}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 border-b px-4 pb-4">
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
            <div
              role="group"
              aria-label={m.insert}
              className="-mx-4 -mt-2 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]"
            >
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
              <Button variant="outline" size="icon" className="mt-6 size-10" onClick={onSwap} aria-label={m.swap}>
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

          <div className="flex flex-col gap-2 pt-4">
            <h3 className="mx-4 text-sm font-medium">{m.examples}</h3>
            <div className="flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">
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

          <div className="flex flex-col px-4 pt-4">
            <Button
              variant="ghost"
              className="-ml-2.5 self-start text-muted-foreground"
              aria-expanded={reference}
              onClick={() => setReference((r) => !r)}
            >
              <CircleHelp data-icon="inline-start" />
              {m.referenceTitle}
              <ChevronDown data-icon="inline-end" className={cn('transition-transform duration-200', reference && 'rotate-180')} />
            </Button>
            {reference && (
              <div className="animate-in pt-2 duration-280 fade-in-0 slide-in-from-top-2">
                <FunctionReference />
              </div>
            )}
          </div>

          <div className="p-4 pb-6">
            <Button className="h-11 w-full" onClick={() => setOpen(false)}>
              {m.done}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

