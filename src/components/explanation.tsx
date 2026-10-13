import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tex } from '@/components/tex'

const STEPS = [
  {
    title: 'Spiegeln',
    tex: 'g(\\tau) \\;\\to\\; g(-\\tau)',
    text: 'Die zweite Funktion wird an der senkrechten Achse gespiegelt.',
  },
  {
    title: 'Verschieben',
    tex: 'g(-\\tau) \\;\\to\\; g(t-\\tau)',
    text: 'Die gespiegelte Funktion wird um t nach rechts geschoben. t ist der Zeitpunkt, für den das Ergebnis berechnet wird.',
  },
  {
    title: 'Multiplizieren',
    tex: 'f(\\tau)\\cdot g(t-\\tau)',
    text: 'Beide Funktionen werden punktweise multipliziert. Im Plot ist dieses Produkt gelb hinterlegt.',
  },
  {
    title: 'Integrieren',
    tex: '(f*g)(t) = \\int_{-\\infty}^{\\infty} f(\\tau)\\,g(t-\\tau)\\,\\mathrm d\\tau',
    text: 'Die gelbe Fläche (mit Vorzeichen) ist der Wert der Faltung bei t. Läuft t weiter, entsteht die schwarze Kurve.',
  },
]

const PROPS = [
  { name: 'Kommutativ', tex: 'f*g = g*f' },
  { name: 'Assoziativ', tex: '(f*g)*h = f*(g*h)' },
  { name: 'Distributiv', tex: 'f*(g+h) = f*g + f*h' },
  { name: 'Neutrales Element', tex: 'f*\\delta = f' },
  { name: 'Verschiebung', tex: 'f(t)*\\delta(t-t_0) = f(t-t_0)' },
  { name: 'Faltungssatz', tex: '\\mathcal F\\{f*g\\} = \\mathcal F\\{f\\}\\cdot\\mathcal F\\{g\\}' },
  {
    name: 'Rechteck ∗ Rechteck',
    tex: '\\operatorname{rect}\\!\\left(\\tfrac tT\\right) * \\operatorname{rect}\\!\\left(\\tfrac tT\\right) = T\\,\\operatorname{tri}\\!\\left(\\tfrac tT\\right)',
  },
  { name: 'Integral', tex: 'f*\\sigma = \\int_{-\\infty}^{t} f(\\tau)\\,\\mathrm d\\tau' },
]

export function Explanation() {
  return (
    <section id="erklaerung" className="flex scroll-mt-20 flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">So funktioniert die Faltung</h2>
        <p className="mt-1 max-w-[70ch] text-muted-foreground">
          Die Faltung beschreibt, wie ein lineares, zeitinvariantes System mit Impulsantwort g auf
          ein Eingangssignal f reagiert. Für jeden Zeitpunkt t laufen vier Schritte ab:
        </p>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <Card className="h-full">
              <CardHeader>
                <CardDescription>Schritt {i + 1}</CardDescription>
                <CardTitle>{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Tex math={s.tex} display className="text-sm" />
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
      <Card>
        <CardHeader>
          <CardTitle>Wichtige Eigenschaften</CardTitle>
          <CardDescription>
            Ohne Dirac-Impulse hat f∗g die Einheit Amplitude × Zeit; deshalb zeigt die rechte Achse
            des Plots das Ergebnis in Vielfachen von T.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {PROPS.map((p) => (
              <div key={p.name} className="flex flex-col gap-1">
                <dt className="text-sm text-muted-foreground">{p.name}</dt>
                <dd className="overflow-x-auto">
                  <Tex math={p.tex} />
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </section>
  )
}
