/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Für Hosting in einem Unterverzeichnis (z. B. GitHub Pages) BASE_PATH=/faltung/ setzen.
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Faltungs-Animator',
        short_name: 'Faltung',
        description: 'Interaktive Animation der Faltung zweier Funktionen – (f ∗ g)(t) = ∫ f(τ) · g(t − τ) dτ',
        lang: 'de',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'any',
        background_color: '#11141a',
        theme_color: '#1f5fd6',
        categories: ['education', 'utilities'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
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
            { name: 'ui', test: /node_modules[\\/](radix-ui|@radix-ui|@floating-ui|lucide-react)[\\/]/ },
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
