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

### Release und Container-Image

Wird auf GitHub ein Release **veröffentlicht**, führt `.github/workflows/release.yml` Lint und Tests
aus und

1. hängt den Build als `faltung-<tag>.zip` (mit `.sha256`) an das Release,
2. veröffentlicht ein Container-Image unter `ghcr.io/ohmtools/faltung` mit den Tags
   `<tag>`, `1.2.3`, `1.2` und – außer bei Pre-releases – `latest`.

Das Image (`Containerfile`) wird in zwei Stufen gebaut: Node baut die App, ins fertige Image kommen
nur `dist/` und [static-web-server](https://static-web-server.net) – kein Node, kein Quellcode
(~11 MB Image, ~15 MB RAM). Es läuft als `nobody` und liefert auf Port 8080 aus. Die Header
stehen in `static-web-server.toml`: gehashte Dateien unter `assets/` werden ein Jahr gecacht
(`immutable`), alles andere (`index.html`, `sw.js`, Manifest, Icons) prüft der Browser bei jedem
Aufruf per `Last-Modified` nach. Komprimierung und TLS übernimmt der Reverse Proxy.

```bash
podman build -t faltung . && podman run --rm -p 8080:8080 faltung   # lokal ausprobieren
```

Liegt die App hinter dem Reverse Proxy in einem Unterverzeichnis, die Repository-Variable
`BASE_PATH` (z. B. `/faltung/`) setzen; sie gilt für ZIP und Image.

### Betrieb mit Podman und Caddy

Das Repository ist privat, also auch das Image. Einmalig auf dem Server mit einem
[Personal Access Token (classic)](https://github.com/settings/tokens) mit dem Recht
`read:packages` anmelden – die Datei in `~/.config` bleibt anders als die Standardablage über
Neustarts erhalten:

```bash
podman login ghcr.io --username <github-name> --authfile ~/.config/containers/auth.json
```

Als Quadlet-Dienst (`~/.config/containers/systemd/faltung.container`):

```ini
[Container]
ContainerName=faltung
Image=ghcr.io/ohmtools/faltung:latest
PublishPort=127.0.0.1:8080:8080
AutoUpdate=registry
ReadOnly=true
DropCapability=all
NoNewPrivileges=true

[Service]
Restart=always

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload && systemctl --user start faltung
systemctl --user enable --now podman-auto-update.timer   # holt neue Releases automatisch (täglich)
```

`podman auto-update` lädt das Image neu, sobald `latest` auf ein neues Release zeigt, und startet
den Dienst neu; sofort geht es mit `podman auto-update` von Hand. Ein Rollback ist ein Wechsel auf
einen festen Tag, z. B. `Image=ghcr.io/ohmtools/faltung:1.2.0`.

Caddyfile:

```caddyfile
faltung.example.org {
	encode zstd gzip
	reverse_proxy 127.0.0.1:8080
}
```

Läuft Caddy selbst in einem Container, beide in ein gemeinsames Podman-Netzwerk hängen
(`Network=` in beiden Quadlets) und `reverse_proxy faltung:8080` verwenden; `PublishPort` entfällt
dann.

Der Workflow `.github/workflows/pages.yml` veröffentlicht die App auf GitHub Pages, sobald in den
Repository-Einstellungen unter *Settings → Pages* als Quelle „GitHub Actions“ gewählt ist.
