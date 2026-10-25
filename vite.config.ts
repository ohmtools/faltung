/// <reference types="vitest/config" />
import fs from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Für Hosting in einem Unterverzeichnis BASE_PATH=/faltung/ setzen.
const base = process.env.BASE_PATH ?? '/'

// Steht im Footer, damit sich jeder Stand unterscheiden lässt; der Git-Hook
// (scripts/bump-version.mjs) erhöht sie bei jedem Commit.
const APP_VERSION: string = JSON.parse(
  fs.readFileSync(path.resolve(import.meta.dirname, 'package.json'), 'utf8'),
).version

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      // Die Symbole des Manifests liest nur die Installation (online), nie die App selbst
      includeManifestIcons: false,
      manifest: {
        name: 'Faltung',
        short_name: 'Faltung',
        description: 'Interaktive Animation der Faltung zweier Funktionen – (f ∗ g)(t) = ∫ f(τ) · g(t − τ) dτ',
        lang: 'de',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'any',
        // Startbildschirm: der dunkle Grund des ohmtools-Designs
        background_color: '#000000',
        theme_color: '#000000',
        categories: ['education', 'utilities'],
        // Das SVG für Browser, die eines nehmen; PNGs für Android-Browser ohne SVG; ein randloses
        // maskable, sonst setzt Android das Symbol auf eine weiße Platte. iOS liest nichts davon
        // (`apple-touch-icon` in index.html). Alle aus `npm run icons`.
        icons: [
          { src: 'logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // KaTeX bringt ~20 Schriftschnitte mit, die meisten erscheinen nie: nicht alle
        // vorab laden (~250 KB), sondern jeden beim ersten Gebrauch cachen
        // Geist bringt weitere Schriftsysteme mit; Deutsch und Englisch treffen ihren
        // `unicode-range` nie, der Browser fragt sie also auch nie an. Die App-Symbole liest nur
        // die Installation.
        globIgnores: [
          '**/KaTeX_*',
          '**/geist-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2',
          '**/geist-mono-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2',
          'apple-touch-icon.png',
          'icon-*.png',
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/assets/KaTeX_'),
            handler: 'CacheFirst',
            options: { cacheName: 'katex-fonts', expiration: { maxEntries: 40 } },
          },
        ],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Große Bibliotheken in eigene Dateien, damit sie bei App-Updates im Cache bleiben
        codeSplitting: {
          groups: [
            { name: 'mathjs', test: /node_modules[\\/](mathjs|typed-function|complex\.js|fraction\.js|decimal\.js|javascript-natural-sort|seedrandom|escape-latex|tiny-emitter)[\\/]/ },
            { name: 'katex', test: /node_modules[\\/]katex[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'ui', test: /node_modules[\\/](@base-ui|@floating-ui|lucide-react)[\\/]/ },
          ],
        },
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    environment: 'node',
  },
})
