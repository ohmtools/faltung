import type { FormulaProblem } from '@/lib/formula'

/** Alle Texte der Oberfläche auf Deutsch; `en` muss dieselben Schlüssel haben (Typ `Messages`). */
export const de = {
  appTitle: 'Faltung',
  footerNote: 'Rechnet vollständig im Browser, auch offline.',
  credits: 'mathjs · KaTeX · React · shadcn/ui',
  sourceCode: 'Quellcode auf GitHub',

  pagesLabel: 'Seiten',
  pageAnimator: 'Animator',
  pageGuide: 'Anleitung',
  pageProperties: 'Eigenschaften',
  settings: 'Einstellungen',
  settingsGeneral: 'Allgemein',
  themeHint: 'Hell oder dunkel folgt dem Gerät.',
  back: 'Zurück',
  close: 'Schließen',

  plotLabel:
    'Animation der Faltung: f(τ), gespiegeltes und verschobenes g(t−τ), Produktfläche und Faltungsergebnis',
  copyLink: 'Link kopieren',
  copyLinkTip: 'Link zu dieser Ansicht kopieren',
  linkCopied: 'Link kopiert',
  linkCopiedText: 'Der Link öffnet genau diese Ansicht.',
  linkPrompt: 'Link zum Kopieren:',
  savePng: 'Als Bild speichern',
  savePngTip: 'Plot als PNG speichern',
  ownFunctions: 'Eigene Funktionen',

  play: 'Abspielen',
  pause: 'Pause',
  toStart: 'Zum Anfang',
  toStartTip: 'Zum Anfang (Pos1)',
  stepBack: 'Schritt zurück',
  stepBackTip: 'Schritt zurück (←)',
  stepForward: 'Schritt vor',
  stepForwardTip: 'Schritt vor (→)',
  time: 'Zeitpunkt t',
  speed: 'Geschwindigkeit',

  functionsTitle: 'Funktionen',
  edit: 'Bearbeiten',
  done: 'Fertig',
  insert: 'Bausteine einfügen',
  swap: 'f und g tauschen',
  range: 'Bereich',
  rangeTo: 'bis',
  fromLabel: 'Von, in T',
  toLabel: 'Bis, in T',
  from: 'Von (× T)',
  to: 'Bis (× T)',
  examples: 'Beispiele',
  example: (name: string) => `Beispiel: ${name}`,
  rangeNotNumbers: 'Bitte Zahlen für den Bereich eingeben.',
  rangeOrder: '„Bis“ muss größer als „Von“ sein.',
  rangeTooWide: 'Der Bereich darf höchstens 200 T breit sein.',
  periodPositive: 'T muss größer als 0 sein.',
  formulaFailed: 'Formel nicht auswertbar.',
  formulaError: (p: FormulaProblem): string => {
    switch (p.kind) {
      case 'empty':
        return 'Bitte eine Funktion eingeben.'
      case 'syntax':
        return p.at === undefined
          ? 'Formel unvollständig oder fehlerhaft.'
          : `Formel fehlerhaft bei Zeichen ${p.at}.`
      case 'invalid-call':
        return 'Ungültiger Funktionsaufruf.'
      case 'constant':
        return 'Nur Zahlen sind als Konstanten erlaubt.'
      case 'needs-argument':
        return `${p.name} braucht ein Argument, z. B. ${p.name}(t).`
      case 'unknown-symbol':
        return `Unbekannt: ${p.name}`
      case 'unknown-function':
        return `Unbekannte Funktion: ${p.name}`
      case 'arity':
        return p.min === p.max
          ? `${p.name} erwartet ${p.min} Argument${p.min === 1 ? '' : 'e'}.`
          : `${p.name} erwartet mindestens ${p.min} Argument${p.min === 1 ? '' : 'e'}.`
      case 'operator':
        return `Operator „${p.op}“ wird nicht unterstützt.`
      case 'comparison':
        return 'Vergleich wird nicht unterstützt.'
      case 'unsupported':
        return 'Dieser Ausdruck wird nicht unterstützt.'
    }
  },

  referenceTitle: 'Funktionsreferenz',
  referenceDescription:
    'Variable ist `t` (auch `τ` oder `x`), der Parameter `T` darf überall vorkommen, z. B. `rect(t/T)`. Dezimalzahlen mit Punkt: `0.5`.',
  referenceInput: 'Eingabe',
  referenceMeaning: 'Bedeutung',
  otherwise: 'sonst',

  guideTitle: 'So entsteht {fg}',
  stepWord: 'Schritt',
  stepOf: 'von',
  stepAria: (n: number, name: string) => `Schritt ${n}, ${name}`,
  next: 'Weiter',
  previous: 'Zurück',
  toAnimator: 'Zum Animator',
  openInAnimator: 'Mit diesen Funktionen im Animator öffnen',
  moveT: '{t} verschieben',
  area: 'Fläche',
  resultSoFar: 'Ergebnis {conv}, bisher berechnet',
  guidePlotLabel: (step: string) => `Plot zum Schritt ${step}`,
  resultPlotLabel: 'Bisher berechnetes Faltungsergebnis',

  propertiesTitle: 'Eigenschaften der Faltung',
  propertiesLead:
    'Ohne Dirac-Impulse hat f∗g die Einheit Amplitude × Zeit; der Plot zeigt das Ergebnis deshalb in Vielfachen von T.',
  showInAnimator: 'Im Animator zeigen',

  language: 'Sprache',
  install: 'Installieren',
  installApp: 'App installieren',
  installTitle: 'Als App installieren',
  installDescription: 'Installiert startet die App wie jede andere und funktioniert auch offline.',
  iosStep1: 'In Safari auf „Teilen“ tippen.',
  iosStep2: '„Zum Home-Bildschirm“ wählen.',
  about: 'Über',
  offlineReady: 'Die App ist jetzt auch offline nutzbar.',
  updateReady: 'Eine neue Version ist verfügbar.',
  reload: 'Neu laden',
}

export type Messages = typeof de

export const en: Messages = {
  appTitle: 'Faltung',
  footerNote: 'Computes everything in the browser, offline too.',
  credits: 'mathjs · KaTeX · React · shadcn/ui',
  sourceCode: 'Source code on GitHub',

  pagesLabel: 'Pages',
  pageAnimator: 'Animator',
  pageGuide: 'Guide',
  pageProperties: 'Properties',
  settings: 'Settings',
  settingsGeneral: 'General',
  themeHint: 'Light or dark follows the device.',
  back: 'Back',
  close: 'Close',

  plotLabel:
    'Animation of the convolution: f(τ), mirrored and shifted g(t−τ), product area and result',
  copyLink: 'Copy link',
  copyLinkTip: 'Copy a link to this view',
  linkCopied: 'Link copied',
  linkCopiedText: 'The link opens exactly this view.',
  linkPrompt: 'Link to copy:',
  savePng: 'Save as image',
  savePngTip: 'Save the plot as PNG',
  ownFunctions: 'Own functions',

  play: 'Play',
  pause: 'Pause',
  toStart: 'To the start',
  toStartTip: 'To the start (Home)',
  stepBack: 'Step back',
  stepBackTip: 'Step back (←)',
  stepForward: 'Step forward',
  stepForwardTip: 'Step forward (→)',
  time: 'Time t',
  speed: 'Speed',

  functionsTitle: 'Functions',
  edit: 'Edit',
  done: 'Done',
  insert: 'Insert building blocks',
  swap: 'Swap f and g',
  range: 'Range',
  rangeTo: 'to',
  fromLabel: 'From, in T',
  toLabel: 'To, in T',
  from: 'From (× T)',
  to: 'To (× T)',
  examples: 'Examples',
  example: (name: string) => `Example: ${name}`,
  rangeNotNumbers: 'Please enter numbers for the range.',
  rangeOrder: '“To” must be greater than “From”.',
  rangeTooWide: 'The range can be at most 200 T wide.',
  periodPositive: 'T must be greater than 0.',
  formulaFailed: 'The formula cannot be evaluated.',
  formulaError: (p: FormulaProblem): string => {
    switch (p.kind) {
      case 'empty':
        return 'Please enter a function.'
      case 'syntax':
        return p.at === undefined
          ? 'The formula is incomplete or wrong.'
          : `Error in the formula at character ${p.at}.`
      case 'invalid-call':
        return 'Invalid function call.'
      case 'constant':
        return 'Only numbers are allowed as constants.'
      case 'needs-argument':
        return `${p.name} needs an argument, e.g. ${p.name}(t).`
      case 'unknown-symbol':
        return `Unknown: ${p.name}`
      case 'unknown-function':
        return `Unknown function: ${p.name}`
      case 'arity':
        return p.min === p.max
          ? `${p.name} takes ${p.min} argument${p.min === 1 ? '' : 's'}.`
          : `${p.name} takes at least ${p.min} argument${p.min === 1 ? '' : 's'}.`
      case 'operator':
        return `Operator “${p.op}” is not supported.`
      case 'comparison':
        return 'This comparison is not supported.'
      case 'unsupported':
        return 'This expression is not supported.'
    }
  },

  referenceTitle: 'Function reference',
  referenceDescription:
    'The variable is `t` (also `τ` or `x`), the parameter `T` may appear anywhere, e.g. `rect(t/T)`. Decimals with a point: `0.5`.',
  referenceInput: 'Input',
  referenceMeaning: 'Meaning',
  otherwise: 'otherwise',

  guideTitle: 'How {fg} comes about',
  stepWord: 'Step',
  stepOf: 'of',
  stepAria: (n: number, name: string) => `Step ${n}, ${name}`,
  next: 'Next',
  previous: 'Back',
  toAnimator: 'To the animator',
  openInAnimator: 'Open these functions in the animator',
  moveT: 'Move {t}',
  area: 'Area',
  resultSoFar: 'Result {conv}, computed so far',
  guidePlotLabel: (step: string) => `Plot for the step ${step}`,
  resultPlotLabel: 'Convolution result computed so far',

  propertiesTitle: 'Properties of convolution',
  propertiesLead:
    'Without Dirac impulses, f∗g has the unit amplitude × time; that is why the plot shows the result in multiples of T.',
  showInAnimator: 'Show in the animator',

  language: 'Language',
  install: 'Install',
  installApp: 'Install the app',
  installTitle: 'Install as an app',
  installDescription: 'Installed, the app starts like any other and works offline, too.',
  iosStep1: 'In Safari, tap “Share”.',
  iosStep2: 'Choose “Add to Home Screen”.',
  about: 'About',
  offlineReady: 'The app now works offline, too.',
  updateReady: 'A new version is available.',
  reload: 'Reload',
}
