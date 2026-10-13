import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#1f5fd6' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#1f5fd6' } },
  },
  images: ['public/favicon.svg'],
})
