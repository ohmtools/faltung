# Faltungs-Animator

> **Hinweis:** Dieses Projekt wurde mit KI geschrieben: Code, Konfiguration und Dokumentation
> sind mit [Claude Code](https://claude.com/claude-code) entstanden.

Web-App, die die Faltung zweier Funktionen animiert:

$$(f * g)(t) = \int_{-\infty}^{\infty} f(\tau)\, g(t-\tau)\, \mathrm d\tau$$

Freie Formeleingabe (`rect(t/T)`, `u(t)*exp(-2t/T)`, `delta(t-T)`, …), Dirac-Impulse werden
exakt verrechnet. Läuft komplett im Browser, als PWA installierbar und offline nutzbar.

Vite + React 19 + TypeScript, shadcn/ui, Tailwind v4, mathjs (Parser), KaTeX.
Kern: `src/lib/formula.ts` (Formel → JS-Funktion), `src/lib/convolution.ts`, `src/lib/plot.ts`.

## Entwicklung

```bash
npm install
npm run dev       # Entwicklungsserver
npm test          # Vitest
npm run lint      # oxlint
npm run build     # nach dist/ (Unterverzeichnis: BASE_PATH=/faltung/ npm run build)
npm run icons     # PWA-Icons aus public/favicon.svg
```

## Deployment

Ein GitHub-Release baut `faltung-<tag>.zip` und das Image `ghcr.io/ohmtools/faltung`
(`<tag>`, `1.2`, `latest`). Für ein Unterverzeichnis die Repository-Variable `BASE_PATH` setzen.

Das Image enthält nur `dist/` und [static-web-server](https://static-web-server.net) auf Port
8080, läuft als `nobody` und sendet alle Header selbst (CSP, COOP/COEP/CORP,
Permissions-Policy, Caching, Komprimierung; siehe `static-web-server.toml`). Der Proxy ergänzt
nur TLS und HSTS.

Das Image ist privat; einmalig mit einem Token mit `read:packages` anmelden:

```bash
podman login ghcr.io --username <github-name> --authfile ~/.config/containers/auth.json
```

Quadlet (`~/.config/containers/systemd/faltung.container`):

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
systemctl --user enable --now podman-auto-update.timer   # tägliche Updates
```

Caddy:

```caddyfile
faltung.example.org {
	header ?Strict-Transport-Security "max-age=63072000; includeSubDomains"
	reverse_proxy 127.0.0.1:8080
}
```

Den Port auf `127.0.0.1` lassen, der Proxy ist der einzige Zugang. Rollback: festen Tag
eintragen (`faltung:1.2.0`).
