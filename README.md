# Faltungs-Animator

Interaktive Web-App, die die Faltung zweier Funktionen animiert:

$$(f * g)(t) = \int_{-\infty}^{\infty} f(\tau)\, g(t-\tau)\, \mathrm d\tau$$

g wird gespiegelt über f geschoben, die Fläche unter dem Produkt f(τ)·g(t−τ) wird gelb
hinterlegt und das Faltungsergebnis entsteht Punkt für Punkt. Dirac-Impulse werden erkannt,
als Pfeile gezeichnet und exakt verrechnet.

Die App läuft **vollständig im Browser** (kein Servercode) und ist als **Progressive Web App
installierbar**; nach dem ersten Aufruf funktioniert sie auch offline.

## Funktionen

- Freie Formeleingabe für f(t) und g(t) mit Parameter `T`, z. B. `rect(t/T)`, `u(t)*exp(-2t/T)`,
  `delta(t) - delta(t-T)`, `0 < t < T`, `t > 0 ? t : 0`
- Live-Vorschau der Formel als Mathe-Satz (KaTeX), verständliche Fehlermeldungen
- Abspielen/Pause, Geschwindigkeit, Schrittweise, Ziehen im Plot, Tastenkürzel
- Beispiele, f ⇄ g tauschen, frei wählbarer Darstellungsbereich
- Teilbarer Link (Zustand steht im URL-Hash), Export als PNG
- Hell/Dunkel/System, mobil nutzbar, Erklärteil und Funktionsreferenz

## Technik

| Bereich | Bibliothek |
| --- | --- |
| Build | [Vite](https://vite.dev) + TypeScript |
| UI | React 19, [shadcn/ui](https://ui.shadcn.com) im Standardstil (Theme „neutral“, Radix), Tailwind CSS v4, lucide-react, Sonner |
| Formeln | [mathjs](https://mathjs.org) als Parser; der Syntaxbaum wird über eine Whitelist in eine native JS-Funktion übersetzt (schnell genug für 60 fps, kein beliebiger Code) |
| Mathe-Satz | [KaTeX](https://katex.org) |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app) (Workbox) |

Wichtige Dateien:

- `src/lib/formula.ts` – Parser/Compiler, Sonderfunktionen (`rect`, `tri`, `sigma`, `delta`, …)
- `src/lib/convolution.ts` – numerische Faltung, Erkennung und Verrechnung von Dirac-Impulsen
- `src/lib/plot.ts` – Canvas-Zeichnung
- `src/App.tsx` – Zustand, Animation, Tastenkürzel, URL-Synchronisierung

## Entwicklung

```bash
npm install
npm run dev       # Entwicklungsserver
npm test          # Unit-Tests (Vitest)
npm run lint      # oxlint
npm run build     # Produktionsbuild nach dist/
npm run preview   # Build lokal ansehen (inkl. Service Worker)
npm run icons     # PWA-Icons aus public/favicon.svg neu erzeugen
```

Weitere shadcn-Komponenten lassen sich mit `npx shadcn@latest add <name>` ergänzen
(`components.json` ist eingerichtet).

## Deployment

`dist/` ist eine rein statische Seite und lässt sich auf jedem Static-Host ablegen. Für ein
Unterverzeichnis den Basispfad setzen, z. B. `BASE_PATH=/faltung/ npm run build`.

Der Workflow `.github/workflows/pages.yml` veröffentlicht die App auf GitHub Pages, sobald in den
Repository-Einstellungen unter *Settings → Pages* als Quelle „GitHub Actions“ gewählt ist.
