import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'
import { followLocaleOfOtherTabs, getLocale, m } from '@/i18n'

// Screenreader und Übersetzungsangebote lesen die Sprache der Seite hier ab.
document.documentElement.lang = getLocale()
document.title = m.appTitle
followLocaleOfOtherTabs()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
