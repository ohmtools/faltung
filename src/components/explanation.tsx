import { Section } from '@/components/section'
import { Tex } from '@/components/tex'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { localized, m } from '@/i18n'
import type { Localized } from '@/lib/presets'

const STEPS: { title: Localized; tex: string; text: Localized }[] = [
  {
    title: { de: 'Spiegeln', en: 'Mirror' },
    tex: 'g(\\tau) \\;\\to\\; g(-\\tau)',
    text: {
      de: 'Die zweite Funktion wird an der senkrechten Achse gespiegelt.',
      en: 'The second function is mirrored about the vertical axis.',
    },
  },
  {
    title: { de: 'Verschieben', en: 'Shift' },
    tex: 'g(-\\tau) \\;\\to\\; g(t-\\tau)',
    text: {
      de: 'Die gespiegelte Funktion wird um t nach rechts geschoben. t ist der Zeitpunkt, für den das Ergebnis berechnet wird.',
      en: 'The mirrored function is shifted to the right by t. t is the time for which the result is computed.',
    },
  },
  {
    title: { de: 'Multiplizieren', en: 'Multiply' },
    tex: 'f(\\tau)\\cdot g(t-\\tau)',
    text: {
      de: 'Beide Funktionen werden punktweise multipliziert. Im Plot ist dieses Produkt als Fläche hinterlegt.',
      en: 'Both functions are multiplied point by point. The plot shows this product as a shaded area.',
    },
  },
  {
    title: { de: 'Integrieren', en: 'Integrate' },
    tex: '(f*g)(t) = \\int_{-\\infty}^{\\infty} f(\\tau)\\,g(t-\\tau)\\,\\mathrm d\\tau',
    text: {
      de: 'Die Fläche (mit Vorzeichen) ist der Wert der Faltung bei t. Läuft t weiter, entsteht die Kurve (f∗g)(t).',
      en: 'The area (with its sign) is the value of the convolution at t. As t moves on, it traces the curve (f∗g)(t).',
    },
  },
]

const PROPS: { name: Localized; tex: string }[] = [
  { name: { de: 'Kommutativ', en: 'Commutative' }, tex: 'f*g = g*f' },
  { name: { de: 'Assoziativ', en: 'Associative' }, tex: '(f*g)*h = f*(g*h)' },
  { name: { de: 'Distributiv', en: 'Distributive' }, tex: 'f*(g+h) = f*g + f*h' },
  { name: { de: 'Neutrales Element', en: 'Identity' }, tex: 'f*\\delta = f' },
  { name: { de: 'Verschiebung', en: 'Shift' }, tex: 'f(t)*\\delta(t-t_0) = f(t-t_0)' },
  {
    name: { de: 'Faltungssatz', en: 'Convolution theorem' },
    tex: '\\mathcal F\\{f*g\\} = \\mathcal F\\{f\\}\\cdot\\mathcal F\\{g\\}',
  },
  {
    name: { de: 'Rechteck ∗ Rechteck', en: 'Rectangle ∗ rectangle' },
    tex: '\\operatorname{rect}\\!\\left(\\tfrac tT\\right) * \\operatorname{rect}\\!\\left(\\tfrac tT\\right) = T\\,\\operatorname{tri}\\!\\left(\\tfrac tT\\right)',
  },
  { name: { de: 'Integral', en: 'Integral' }, tex: 'f*\\sigma = \\int_{-\\infty}^{t} f(\\tau)\\,\\mathrm d\\tau' },
]

/** Die vier Schritte für jeden Zeitpunkt t. */
export function Explanation() {
  return (
    <Section>
      <CardHeader>
        <CardTitle>{m.explanationTitle}</CardTitle>
        <CardDescription>{m.explanationIntro}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-6">
          {STEPS.map((s, i) => (
            <li key={s.tex} className="flex flex-col gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{m.step(i + 1)}</p>
                <p className="font-semibold">{localized(s.title)}</p>
              </div>
              <Tex math={s.tex} display />
              <p className="text-muted-foreground">{localized(s.text)}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Section>
  )
}

export function Properties() {
  return (
    <Section>
      <CardHeader>
        <CardTitle>{m.propertiesTitle}</CardTitle>
        <CardDescription>{m.propertiesDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-3">
          {PROPS.map((p) => (
            <div key={p.tex} className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{localized(p.name)}</dt>
              <dd className="overflow-x-auto">
                <Tex math={p.tex} />
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Section>
  )
}
