import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tex } from '@/components/tex'

const FUNCS: { code: string; tex: string; text: string }[] = [
  {
    code: 'rect(t)',
    tex: '\\begin{cases}1 & |t|<\\tfrac12\\\\ \\tfrac12 & |t|=\\tfrac12\\\\ 0 & \\text{sonst}\\end{cases}',
    text: 'Rechteck der Breite 1',
  },
  { code: 'tri(t)', tex: '\\max(0,\\,1-|t|)', text: 'Dreieck der Breite 2' },
  { code: 'sigma(t), u(t), step(t)', tex: '\\sigma(t)=\\begin{cases}1 & t\\ge0\\\\0 & t<0\\end{cases}', text: 'Sprungfunktion' },
  { code: 'delta(t), dirac(t)', tex: '\\delta(t)', text: 'Dirac-Impuls, als Pfeil gezeichnet; Gewicht ≠ 1 steht daneben' },
  { code: 'sinc(t)', tex: '\\frac{\\sin(\\pi t)}{\\pi t}', text: 'Normierte sinc-Funktion' },
  { code: 'gauss(t)', tex: 'e^{-\\pi t^2}', text: 'Gauß-Impuls der Fläche 1' },
  { code: 'sin cos tan exp log sqrt abs sign', tex: '', text: 'Übliche Funktionen, dazu asin, acos, atan, sinh, cosh, tanh, ln, floor, ceil, round, min, max, mod' },
  { code: 'pi, e', tex: '\\pi,\\ e', text: 'Konstanten' },
  { code: 't^2, 2t, 2(t+1)', tex: 't^2,\\ 2t,\\ 2(t+1)', text: 'Potenz mit ^, implizite Multiplikation' },
  { code: '(t>0)*(t<T)*t', tex: '', text: 'Vergleiche liefern 1 oder 0 und schneiden Funktionen zu; auch 0<t<T und and/or/not' },
  { code: 't > 0 ? t : 0', tex: '', text: 'Bedingung' },
]

export function FunctionReference() {
  return (
    <section id="funktionen" className="scroll-mt-20">
      <Card>
        <CardHeader>
          <CardTitle>Funktionsreferenz</CardTitle>
          <CardDescription className="max-w-[70ch]">
            Variable ist <code>t</code> (auch <code>τ</code> oder <code>x</code>), der Parameter{' '}
            <code>T</code> darf überall vorkommen, z. B. <code>rect(t/T)</code>. Dezimalzahlen mit
            Punkt: <code>0.5</code>. Die Formel wird live als Mathe-Ausdruck angezeigt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Eingabe</TableHead>
                <TableHead>Bedeutung</TableHead>
                <TableHead className="hidden sm:table-cell">Formel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FUNCS.map((f) => (
                <TableRow key={f.code}>
                  <TableCell className="align-top font-mono whitespace-normal">
                    {f.code}
                  </TableCell>
                  <TableCell className="align-top whitespace-normal text-muted-foreground">
                    {f.text}
                  </TableCell>
                  <TableCell className="hidden align-top sm:table-cell">
                    {f.tex && <Tex math={f.tex} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
