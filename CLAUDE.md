# Faltung – Hinweise für Claude Code

Was die App ist, wie sie gebaut und ausgeliefert wird: `README.md`.

## Design

Folgt dem ohmtools-Design: https://github.com/ohmtools/design, Regeln in dessen
DESIGN.md (shadcn base-vega, Schwarz und Weiß mit neutralem `primary`, Rot nur als
Akzent, Geist und Geist Mono; keine Großbuchstaben, keine Boxen, kein Umschalter für
das Farbschema). Farben nur über dessen Tokens. Vor jeder sichtbaren Änderung
DESIGN.md lesen; eine Regel, die sich ändern soll, wird zuerst dort geändert, für alle
Apps.

- `src/index.css` ist die Vorlage aus `shadcn/index.css` des Design-Repos: sie importiert
  `src/styles/ohmtools.css` (das ganze CSS des Designs) und fügt nur Eigenes an (`font-math`).
  `components.json`, `src/styles/`, `src/components/ohmtools/`, `src/lib/ohmtools/` und
  `src/components/ui/` (bis auf `slider` und `table`, die es im Design nicht gibt) sind Kopien
  aus dem Design-Repo (`npx --yes github:ohmtools/design add <name>…`, erste Zeile nennt die
  Quelle); nie hier bearbeiten, eine Änderung kommt zuerst ins Design, dann `add --force`. Die CI
  prüft sie mit `ohmtools-design check`, oxlint lässt sie aus. Eine neue shadcn-Komponente, die das
  Design nicht hat: `shadcn add`, `uppercase` und `tracking-wide*` entfernen, Handanpassungen aus
  DESIGN.md, „Components“.
- Die Oberfläche besteht aus den Elementgruppen des Designs (DESIGN.md, „Which group“), nie aus
  einzelnen Elementen: `AppShell` außen (Header mit Logo und Name, Aktionen rechts, Einstellungen
  zuletzt; die eine `<h1>` `sr-only`; Toaster und Farbschema). Die drei Seiten Animator, Anleitung,
  Eigenschaften (`src/lib/pages.ts`) sind `Views`: ab `compact:` Tabs im Header, auf dem Telefon in
  der Leiste unten. Was auf dem Telefon über den Tabs in dieser Leiste steht (Bedienleiste des
  Animators, Zurück/Weiter der Anleitung), kommt per `ViewControls narrow` hinein (`-order-1`, damit
  es über den Tabs steht); ab `compact:` steht es unten in der Seite. Die Leiste meldet ihre Höhe
  selbst, Toasts (`toast` aus `@/lib/ohmtools/toast`) stehen darüber. Einstellungen sind `Area`
  mit `useArea()` (`src/components/settings.tsx`: Allgemein, Über): breit (`wide:`) ein Dialog,
  sonst eine Seite mit der Liste der Abschnitte. Stufen im Script mit `useStep()`; `lg:` (nur die
  Breite, `LG_QUERY` in `src/lib/layout.ts`) bleibt, wo nur die Breite zählt. Seitenabstand des
  Inhalts `GUTTER` (16 px, ab `compact:` 24 px, mindestens die Safe Area).
- Jede Stufe ist eine Ansicht hoch, die Seite scrollt nie. Jeder Bereich, der scrollt (auch
  waagrecht), ist `relative` (DESIGN.md, „App shell“).
- Schrift: Grundgröße 14 px (`AppShell` setzt `text-sm`, DESIGN.md, „Typography“), Überschriften
  16 px, Hinweise und Werte in der Leiste 12 px.
- Animator: die Formeln sind `PageEditor` (Bearbeiten in der Seite). Ab `lg:` passt er in die
  Seite: die Formelzeile über dem Plot (f, Tauschen, g, T, Bereich, Funktionsreferenz als
  `Popup kind="popover"`), Beispiele als Menü im Header; darunter die Bedienleiste mit Zeitleiste
  (Ergebnis als kleine Kurve) und Geschwindigkeit (`Popup kind="select"`). Unter `lg:` steht über
  dem Plot, was f und g sind, mit „Bearbeiten“: der Editor (`FormulaEditor`, mit Bausteinen,
  Beispielen und der Funktionsreferenz zum Aufklappen, `Expand`) öffnet auf dem Telefon als Drawer,
  sonst als Blatt von rechts. Was er ändert, gilt sofort; Wegwischen, Tippen daneben und Esc
  schließen ihn.
- Anleitung (`src/components/guide.tsx`): breit (`wide:`) links die Schritte mit Text und Hinweis,
  rechts Vorschaubilder, Plot, Ergebnis und Regler; sonst ein Schritt auf einmal (Text und Hinweis
  darunter) mit Zurück/Weiter unten. Das Beispiel ist ein Menü (`ExamplesMenu`, `Popup
  kind="menu"`, das gewählte mit Haken): ab `compact:` im Header, auf dem Telefon als Knopf oben in
  der Anleitung, der einen Drawer mit der Liste öffnet.
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
- Bewegung mit halber Geschwindigkeit (DESIGN.md, „Motion“): 560 ms herein, 400 ms hinaus,
  shadcns Popups 200 ms, eine Kurve `cubic-bezier(0.2, 0, 0, 1)` (in Script `ease` aus
  `@/lib/ohmtools/motion`), der Durchlauf bei 1× 12 s. Seitenwechsel bringen die Gruppen mit
  (`Views`: die neue Seite von der Seite ihres Tabs; Seiten der Einstellungen von rechts); ein
  Wechsel aus dem Code (zum Animator öffnen) nimmt `transition('view-previous' | 'view-next', …)`.
  Gleitende Tab-Indikatoren, Sprünge von t gleiten (`Playhead.glideTo`), ein neues Ergebnis lässt
  den y-Bereich gleiten. Die Anleitung baut jeden Schritt auf (g klappt um, gleitet nach t, die
  Fläche blendet ein, das Ergebnis läuft bis t; erklärend, also 1,2 bis 2,4 s und sanft an beiden
  Enden, `easeInOut`), der Text des neuen Schritts kommt von der Seite (`slideIn`), sein Bereich
  schneidet seitlich ab (`overflow-x-hidden`). Bei `prefers-reduced-motion` nichts davon.
- Jede sichtbare Änderung bei 360 und 400 px Breite, quer (844 × 390), auf dem iPad hochkant
  (834 × 1194) und bei 1440 px prüfen, auf Deutsch und Englisch, hell und dunkel.

## Sprache

Deutsch und Englisch nach dem Browser; der einzige Umschalter sind die Tabs in
den Einstellungen. Alle Texte stehen in
`src/messages.ts` (`en` hat denselben Typ wie `de`), Listen mit Formeln
direkt in ihrer Komponente als `{ de, en }`. Ein Sprachwechsel lädt neu
(`src/i18n.ts`). `src/lib/` bleibt ohne Texte: Formelfehler sind
`FormulaProblem`, die Oberfläche formuliert sie.
