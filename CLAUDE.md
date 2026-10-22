# Faltungs-Animator – Hinweise für Claude Code

Was die App ist, wie sie gebaut und ausgeliefert wird: `README.md`.

## Design

Folgt dem ohmtools-Design: https://github.com/ohmtools/design, Regeln in dessen
DESIGN.md (shadcn base-sera, Red auf Neutral, Inter; keine Großbuchstaben,
keine Boxen, kein Umschalter für das Farbschema). Farben nur über dessen
Tokens. Vor jeder sichtbaren Änderung DESIGN.md lesen; eine Regel, die sich
ändern soll, wird zuerst dort geändert, für alle Apps.

- `src/index.css` und `components.json` sind die Dateien aus `shadcn/` des
  Design-Repos, unverändert; die CI prüft sie mit `ohmtools-design check`.
- `src/components/ui/` erzeugt die shadcn-CLI (Base UI, nicht Radix:
  `render={<Button />}` statt `asChild`). `uppercase` und `tracking-wide*`
  nach jedem `shadcn add` entfernen. `sonner.tsx` ist von Hand auf
  `theme="system"` gesetzt, wie in zeiteisen.
- Plot: f in `--chart-2`, g in `#7E1817`, dunkel `#FCA5A5` (`G_COLOR`), die
  Fläche in `--chart-1`, das Ergebnis in `--foreground` (`src/lib/plot.ts`,
  Legende `src/components/swatch.tsx`). Die Farbe ist nie das einzige Merkmal.
- Shell wie zeiteisen: Desktop (`desktop:`-Variante) genau eine Ansicht hoch,
  die Spalten scrollen in sich; darunter die Tab-Leiste „Animation |
  Funktionen | Erklärung | Einstellungen“, die Bedienleiste der Animation
  direkt darüber.
- Jede sichtbare Änderung bei 360 und 400 px Breite, auf Deutsch und
  Englisch, und bei 1440 px prüfen, hell und dunkel.

## Sprache

Deutsch und Englisch nach dem Browser; die einzigen Umschalter sind EN/DE im
Footer und die Auswahl auf der Seite Einstellungen. Alle Texte stehen in
`src/messages.ts` (`en` hat denselben Typ wie `de`), Listen mit Formeln
direkt in ihrer Komponente als `{ de, en }`. Ein Sprachwechsel lädt neu
(`src/i18n.ts`). `src/lib/` bleibt ohne Texte: Formelfehler sind
`FormulaProblem`, die Oberfläche formuliert sie.
