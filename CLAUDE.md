# Faltung – Hinweise für Claude Code

Was die App ist, wie sie gebaut und ausgeliefert wird: `README.md`.

## Design

Folgt dem ohmtools-Design: https://github.com/ohmtools/design, Regeln in dessen
DESIGN.md (shadcn base-vega, Schwarz und Weiß mit neutralem `primary`, Rot nur als
Akzent, Geist und Geist Mono; keine Großbuchstaben, keine Boxen, kein Umschalter für
das Farbschema). Farben nur über dessen Tokens. Vor jeder sichtbaren Änderung
DESIGN.md lesen; eine Regel, die sich ändern soll, wird zuerst dort geändert, für alle
Apps.

- `src/index.css` und `components.json` sind die Dateien aus `shadcn/` des
  Design-Repos, unverändert bis auf die App-eigenen Regeln am Ende von `index.css`
  (`font-math`, Seitenwechsel); die CI prüft sie mit `ohmtools-design check`.
- `src/components/ui/` erzeugt die shadcn-CLI (Base UI, nicht Radix:
  `render={<Button />}` statt `asChild`). Nach jedem `shadcn add` `uppercase` und
  `tracking-wide*` entfernen und die Handanpassungen aus DESIGN.md, „Components“,
  wieder einbauen: `destructive` rot gefüllt, Abdunklung hinter `Sheet`
  `bg-black/40 dark:bg-black/70` ohne Unschärfe, gleitender Indikator in `TabsList`,
  `sonner.tsx` mit `theme="system"`. Dazu hier: `Sheet` mit der Bewegungskurve des
  Designs, freien Ecken `rounded-lg` und `closeLabel`; `Tooltip` mit `duration-200`
  (shadcns Popups mit halber Geschwindigkeit).
- Drei Seiten: Animator, Anleitung, Eigenschaften (`src/lib/pages.ts`). Ab `compact:`
  als Tabs im Header neben Logo und Name, auf dem Telefon als Tab-Leiste unten.
  Einstellungen wie in zeiteisen (`src/components/settings-page.tsx`): ab `compact:` ein
  Dialog mit den Abschnitten links, auf dem Telefon eine Seite mit der Liste der
  Abschnitte, jeder eine eigene Seite. `ui/dialog.tsx` ist zeiteisens (mit dessen
  Handanpassungen; hier dazu: Abdunklung und Dialog gleich lang, `fill-mode-forwards`
  beim Schließen, sonst springt die Abdunklung zurück).
- Jede Stufe ist eine Ansicht hoch, die Seite scrollt nie. Jeder Bereich, der scrollt
  (auch waagrecht), ist `relative` (DESIGN.md, „App shell“). Toasts stehen auf dem
  Telefon über den Leisten unten: Tab-Leiste, Bedienleiste des Animators und Zurück/Weiter
  der Anleitung melden ihre Höhe als `--bottom-bar` (`src/lib/bottom-bar.ts`), ohne
  Leisten (Einstellungen) 16 px über dem Rand.
- Schrift: Grundgröße 14 px (`text-sm` an der Wurzel der App, DESIGN.md,
  „Typography“), Überschriften 16 px, Hinweise und Werte in der Leiste 12 px. Die eine
  `<h1>` steht `sr-only` an der Wurzel, damit es sie auch ohne Header gibt.
- Animator: ab `lg:` die Formelzeile über dem Plot (f, Tauschen, g, T, Bereich,
  Funktionsreferenz im Popover), darunter die Bedienleiste mit Zeitleiste (Ergebnis als
  kleine Kurve); unter `lg:` ein Blatt von unten zum Bearbeiten mit Bausteinen und
  Beispielen.
- Plot (`src/lib/plot.ts`): f in `--kind-ue-border` (blau), g in
  `--kind-pr-border` (orange), die Produktfläche in `--kind-s` mit
  Schraffur in `--kind-s-border` (violett wie im Logo), das Ergebnis in
  `--foreground`, der noch nicht berechnete Rest dünn in `--ring`, der
  Abspielkopf in `--accent-red` mit Punkt oben. Keine gestrichelten Linien, vor allem
  keine bewegten (Entscheidung des Nutzers: das verwirrt). Im Plot keine Beschriftung der
  Kurven und keine Legende (Entscheidung des Nutzers); die Zuordnung steht als Strich
  vor f und g (`src/components/swatch.tsx`). Beides steht inzwischen so in DESIGN.md
  („Plots in apps“). Zahlen an der x-Achse in T, an der y-Achse links für f und g,
  rechts für das Ergebnis in T, mit dem Dezimalzeichen der Sprache. Der Wertebereich
  endet knapp über dem Größten und bei 0, solange nichts negativ ist.
- Bewegung mit halber Geschwindigkeit (Entscheidung des Nutzers, inzwischen so in
  DESIGN.md, „Motion“): 560 ms herein, 400 ms hinaus, shadcns Popups 200 ms, eine
  Kurve `cubic-bezier(0.2, 0, 0, 1)` (in Script `ease` aus `src/lib/motion.ts`), der
  Durchlauf bei 1× 12 s. Seitenwechsel als View Transition (nur die neue Seite, von der
  Seite ihres Tabs; `transition` in `src/lib/motion.ts`: `html[data-transition]` steht
  nur, solange eine läuft, nur dann trägt die Seite ihren `view-transition-name`, und
  nur die letzte räumt auf), gleitende Tab-Indikatoren, Sprünge von t gleiten
  (`Playhead.glideTo`), ein neues Ergebnis lässt den y-Bereich gleiten. Die Anleitung
  baut jeden Schritt auf (g klappt um, gleitet nach t, die Fläche blendet ein, das
  Ergebnis läuft bis t; erklärend, also 1,2 bis 2,4 s und sanft an beiden Enden,
  `easeInOut`), der Text des neuen Schritts kommt von der Seite, sein Bereich schneidet
  seitlich ab (`overflow-x-hidden`). Bei `prefers-reduced-motion` nichts davon.
- Jede sichtbare Änderung bei 360 und 400 px Breite, quer (844 × 390) und bei
  1440 px prüfen, auf Deutsch und Englisch, hell und dunkel.

## Sprache

Deutsch und Englisch nach dem Browser; der einzige Umschalter sind die Tabs in
den Einstellungen. Alle Texte stehen in
`src/messages.ts` (`en` hat denselben Typ wie `de`), Listen mit Formeln
direkt in ihrer Komponente als `{ de, en }`. Ein Sprachwechsel lädt neu
(`src/i18n.ts`). `src/lib/` bleibt ohne Texte: Formelfehler sind
`FormulaProblem`, die Oberfläche formuliert sie.
