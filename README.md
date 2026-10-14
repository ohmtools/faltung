# Faltungs-Animator

> **Hinweis:** Dieses Projekt wurde größtenteils mit KI generiert: Code, Konfiguration und
> Dokumentation sind mit [Claude Code](https://claude.com/claude-code) entstanden.

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

Rootless-Quadlet in `~/.config/containers/systemd/`, `faltung.network`:

```ini
[Network]
```

`faltung.container`:

```ini
[Container]
ContainerName=faltung
Image=ghcr.io/ohmtools/faltung:latest
AutoUpdate=registry
PublishPort=[::1]:8080:8080
# Eigenes Netz; sonst wird die Gastadresse von pasta verwendet, was verwirren kann
Network=faltung.network

ReadOnly=true
NoNewPrivileges=true
DropCapability=ALL
User=65534
Group=65534

[Service]
Restart=always
MemoryMax=64M
# Komprimierung läuft bei jedem Abruf: ein Erstbesuch kostet ~30–70 ms CPU
CPUQuota=50%
TasksMax=32

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
	reverse_proxy [::1]:8080
}
```

Den Port auf `[::1]` lassen, der Proxy ist der einzige Zugang. Rollback: festen Tag
eintragen (`faltung:1.2.0`).

## Lizenz

BSD-3-Clause, siehe [LICENSE](LICENSE).
