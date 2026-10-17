import { Fragment } from 'react'

import { Section } from '@/components/section'
import { Tex } from '@/components/tex'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { localized, m } from '@/i18n'
import type { Localized } from '@/lib/presets'

const FUNCS: { code: string; tex: (otherwise: string) => string; text: Localized }[] = [
  {
    code: 'rect(t)',
    tex: (o) => `\\begin{cases}1 & |t|<\\tfrac12\\\\ \\tfrac12 & |t|=\\tfrac12\\\\ 0 & \\text{${o}}\\end{cases}`,
    text: { de: 'Rechteck der Breite 1', en: 'Rectangle of width 1' },
  },
  { code: 'tri(t)', tex: () => '\\max(0,\\,1-|t|)', text: { de: 'Dreieck der Breite 2', en: 'Triangle of width 2' } },
  {
    code: 'sigma(t), u(t), step(t)',
    tex: () => '\\sigma(t)=\\begin{cases}1 & t\\ge0\\\\0 & t<0\\end{cases}',
    text: { de: 'Sprungfunktion', en: 'Unit step' },
  },
  {
    code: 'delta(t), dirac(t)',
    tex: () => '\\delta(t)',
    text: {
      de: 'Dirac-Impuls, als Pfeil gezeichnet; Gewicht ≠ 1 steht daneben',
      en: 'Dirac impulse, drawn as an arrow; a weight ≠ 1 is written next to it',
    },
  },
  { code: 'sinc(t)', tex: () => '\\frac{\\sin(\\pi t)}{\\pi t}', text: { de: 'Normierte sinc-Funktion', en: 'Normalized sinc function' } },
  { code: 'gauss(t)', tex: () => 'e^{-\\pi t^2}', text: { de: 'Gauß-Impuls der Fläche 1', en: 'Gaussian pulse of area 1' } },
  {
    code: 'sin cos tan exp log sqrt abs sign',
    tex: () => '',
    text: {
      de: 'Übliche Funktionen, dazu asin, acos, atan, sinh, cosh, tanh, ln, floor, ceil, round, min, max, mod',
      en: 'The usual functions, plus asin, acos, atan, sinh, cosh, tanh, ln, floor, ceil, round, min, max, mod',
    },
  },
  { code: 'pi, e', tex: () => '\\pi,\\ e', text: { de: 'Konstanten', en: 'Constants' } },
  {
    code: 't^2, 2t, 2(t+1)',
    tex: () => 't^2,\\ 2t,\\ 2(t+1)',
    text: { de: 'Potenz mit ^, implizite Multiplikation', en: 'Powers with ^, implicit multiplication' },
  },
  {
    code: '(t>0)*(t<T)*t',
    tex: () => '',
    text: {
      de: 'Vergleiche liefern 1 oder 0 und schneiden Funktionen zu; auch 0<t<T und and/or/not',
      en: 'Comparisons give 1 or 0 and cut functions to a range; also 0<t<T and and/or/not',
    },
  },
  { code: 't > 0 ? t : 0', tex: () => '', text: { de: 'Bedingung', en: 'Condition' } },
]

/** Text mit `Code` in Backticks; der Code steht in derselben Schrift, nur kräftiger. */
function WithCode({ text }: { text: string }) {
  return text.split('`').map((part, i) =>
    i % 2 ? (
      <code key={i} className="font-sans font-semibold text-foreground">
        {part}
      </code>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}

export function FunctionReference() {
  return (
    <Section>
      <CardHeader>
        <CardTitle>{m.referenceTitle}</CardTitle>
        <CardDescription>
          <WithCode text={m.referenceDescription} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-0">{m.referenceInput}</TableHead>
              <TableHead className="pr-0">{m.referenceMeaning}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FUNCS.map((f) => {
              const tex = f.tex(m.otherwise)
              return (
                <TableRow key={f.code} className="hover:bg-transparent">
                  <TableCell className="w-2/5 pl-0 align-top font-semibold whitespace-normal">{f.code}</TableCell>
                  <TableCell className="pr-0 align-top whitespace-normal">
                    <p className="text-muted-foreground">{localized(f.text)}</p>
                    {tex && <Tex math={tex} className="mt-1 block overflow-x-auto overflow-y-hidden" />}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Section>
  )
}
