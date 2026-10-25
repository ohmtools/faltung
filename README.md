# Faltung

> **Hinweis:** Dieses Projekt wurde größtenteils mit KI generiert: Code, Konfiguration und
> Dokumentation sind mit [Claude Code](https://claude.com/claude-code) entstanden.

Web-App, die die Faltung zweier Funktionen animiert:

$$(f * g)(t) = \int_{-\infty}^{\infty} f(\tau)\, g(t-\tau)\, \mathrm d\tau$$

Freie Formeleingabe (`rect(t/T)`, `u(t)*exp(-2t/T)`, `delta(t-T)`, …), Dirac-Impulse werden
exakt verrechnet. Läuft komplett im Browser, als PWA installierbar und offline nutzbar, auf
Deutsch und Englisch (nach der Sprache des Browsers). Drei Seiten: der Animator, eine
Anleitung, die die vier Schritte einer Faltung an einem Beispiel zeigt, und die wichtigsten
Eigenschaften der Faltung.

Vite + React 19 + TypeScript, shadcn/ui (`base-vega`, Base UI), Tailwind v4, mathjs (Parser),
KaTeX. Das Erscheinungsbild folgt dem [ohmtools-Design](https://github.com/ohmtools/design)
(`components.json`, das Stylesheet `src/styles/ohmtools.css` und die Komponenten in
`src/components/ohmtools/`, `src/components/ui/` (bis auf `slider` und `table`) und
`src/lib/ohmtools/` kommen von dort, geholt mit `npx --yes github:ohmtools/design add …`; die CI
prüft, dass sie unverändert sind). Texte der Oberfläche: `src/messages.ts`.
Kern: `src/lib/formula.ts` (Formel → JS-Funktion), `src/lib/convolution.ts`, `src/lib/plot.ts`.

## Entwicklung

```bash
npm install
npm run dev       # Entwicklungsserver
npm test          # Vitest
npm run lint      # oxlint
npm run build     # nach dist/ (Unterverzeichnis: BASE_PATH=/faltung/ npm run build)
npm run icons     # App-Symbole (PNG) aus public/logo.svg
npm run release   # aktuelle Version taggen und den Tag pushen
```

`npm install` richtet einen Git-Hook ein, der bei jedem Commit die Patch-Version erhöht
(`scripts/bump-version.mjs`); sie steht in den Einstellungen unter „Über“. Überspringen: `SKIP_VERSION_BUMP=1` oder
`--no-verify`. Eine von Hand geänderte Version bleibt.

`scripts/og/social-preview.png` ist das Vorschaubild für GitHub (1280×640, nach dem
ohmtools-Design: Logo, Name und ein Plot von f, g und f ∗ g); es wird von Hand in den
Repository-Einstellungen unter „Social preview“ hochgeladen.

## Deployment

`npm run release` pusht den Tag `v<version>` aus `package.json`; der Workflow baut
`faltung-<tag>.zip` und das Image `ghcr.io/ohmtools/faltung` (`<tag>`, `1.2`, `latest`) und
veröffentlicht dann das Release (Releases sind unveränderlich, also nie von Hand auf GitHub
anlegen). Für ein Unterverzeichnis die Repository-Variable `BASE_PATH` setzen.

Das Image enthält nur `dist/` und [static-web-server](https://static-web-server.net) auf Port
8080, läuft als `nobody` und sendet alle Header selbst (CSP, COOP/COEP/CORP,
Permissions-Policy, Caching; siehe `static-web-server.toml`). Der Proxy ergänzt TLS, HSTS und
Komprimierung.

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
CPUQuota=10%
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
	encode zstd gzip
	header ?Strict-Transport-Security "max-age=63072000; includeSubDomains"
	reverse_proxy [::1]:8080
}
```

Den Port auf `[::1]` lassen, der Proxy ist der einzige Zugang. Rollback: festen Tag
eintragen (`faltung:1.2.0`).

## Lizenz

BSD-3-Clause, siehe [LICENSE](LICENSE).
