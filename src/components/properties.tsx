import { ArrowRight } from 'lucide-react'

import { Tex } from '@/components/tex'
import { Button } from '@/components/ui/button'
import { localized, m } from '@/i18n'
import { PRESETS, type Localized, type Preset } from '@/lib/presets'

const PROPS: { name: Localized; tex: string; text: Localized; preset?: Preset }[] = [
  {
    name: { de: 'Kommutativ', en: 'Commutative' },
    tex: 'f*g = g*f',
    text: {
      de: 'Welche der beiden Funktionen gespiegelt und verschoben wird, ist egal.',
      en: 'It does not matter which of the two functions is mirrored and shifted.',
    },
  },
  {
    name: { de: 'Assoziativ', en: 'Associative' },
    tex: '(f*g)*h = f*(g*h)',
    text: {
      de: 'Hintereinander geschaltete Systeme lassen sich zu einem zusammenfassen.',
      en: 'Systems connected in series can be combined into one.',
    },
  },
  {
    name: { de: 'Distributiv', en: 'Distributive' },
    tex: 'f*(g+h) = f*g + f*h',
    text: { de: 'Parallel geschaltete Systeme addieren sich.', en: 'Systems connected in parallel add up.' },
  },
  {
    name: { de: 'Neutrales Element', en: 'Identity' },
    tex: 'f*\\delta = f',
    text: { de: 'Der Dirac-Impuls lässt jede Funktion unverändert.', en: 'The Dirac impulse leaves every function unchanged.' },
  },
  {
    name: { de: 'Verschiebung', en: 'Shift' },
    tex: 'f(t)*\\delta(t-t_0) = f(t-t_0)',
    text: {
      de: 'Ein verschobener Dirac-Impuls verschiebt f um t₀.',
      en: 'A shifted Dirac impulse shifts f by t₀.',
    },
  },
  {
    name: { de: 'Faltungssatz', en: 'Convolution theorem' },
    tex: '\\mathcal F\\{f*g\\} = \\mathcal F\\{f\\}\\cdot\\mathcal F\\{g\\}',
    text: {
      de: 'Im Frequenzbereich wird aus der Faltung ein Produkt.',
      en: 'In the frequency domain, convolution becomes a product.',
    },
  },
  {
    name: { de: 'Rechteck ∗ Rechteck', en: 'Rectangle ∗ rectangle' },
    tex: '\\operatorname{rect}\\!\\left(\\tfrac tT\\right) * \\operatorname{rect}\\!\\left(\\tfrac tT\\right) = T\\,\\operatorname{tri}\\!\\left(\\tfrac tT\\right)',
    text: { de: 'Zwei gleich breite Rechtecke ergeben ein Dreieck.', en: 'Two rectangles of equal width give a triangle.' },
    preset: PRESETS[0],
  },
  {
    name: { de: 'Integral', en: 'Integral' },
    tex: 'f*\\sigma = \\int_{-\\infty}^{t} f(\\tau)\\,\\mathrm d\\tau',
    text: { de: 'Die Faltung mit dem Sprung integriert f.', en: 'Convolution with the step integrates f.' },
  },
]

/** Die Seite Eigenschaften: eine Leseseite mit den wichtigsten Regeln, breit in zwei Spalten. */
export function PropertiesPage({ onShow }: { onShow: (p: Preset) => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="max-w-280 px-4 pt-6 pb-10 compact:px-14 compact:pt-10">
        <h2 className="text-[26px] leading-8 font-semibold tracking-tight compact:text-3xl">{m.propertiesTitle}</h2>
        <p className="mt-3 mb-6 max-w-180 text-base text-muted-foreground compact:mb-8 compact:text-lg">
          {m.propertiesLead}
        </p>
        <div className="grid grid-cols-1 gap-x-12 wide:grid-cols-2">
          {PROPS.map((p) => (
            <section key={p.tex} className="flex min-w-0 flex-col gap-1 border-t py-4 compact:gap-1.5 compact:py-5">
              <h3 className="font-medium">{localized(p.name)}</h3>
              <Tex math={p.tex} className="overflow-x-auto overflow-y-hidden py-1 text-lg compact:text-xl" />
              <p className="text-muted-foreground">{localized(p.text)}</p>
              {p.preset && (
                <Button variant="link" className="h-auto self-start p-0" onClick={() => onShow(p.preset!)}>
                  {m.showInAnimator}
                  <ArrowRight data-icon="inline-end" />
                </Button>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
