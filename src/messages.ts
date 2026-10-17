import type { FormulaProblem } from '@/lib/formula'

/** Alle Texte der Oberfläche auf Deutsch; `en` muss dieselben Schlüssel haben (Typ `Messages`). */
export const de = {
  appTitle: 'Faltungs-Animator',
  footerNote: 'Rechnet vollständig im Browser, auch offline.',
  credits: 'mathjs · KaTeX · React · shadcn/ui',

  tabLabel: 'Ansichten',
  tabAnimation: 'Animation',
  tabFunctions: 'Funktionen',
  tabExplanation: 'Erklärung',
  tabSettings: 'Einstellungen',

  animationTitle: 'Faltung zweier Funktionen',
  animationHint:
    'g wird gespiegelt über f geschoben; die Fläche unter dem Produkt ergibt Punkt für Punkt das Faltungsergebnis. Zum Spulen im Plot waagerecht ziehen.',
  plotLabel:
    'Animation der Faltung: f(τ), gespiegeltes und verschobenes g(t−τ), Produktfläche und Faltungsergebnis',
  legendArea: 'Fläche unter f(τ)·g(t−τ)',
  legendConvInT: '(f∗g)(t), rechte Achse in T',
  copyLink: 'Link kopieren',
  copyLinkTip: 'Link zu dieser Ansicht kopieren',
  linkCopied: 'Link kopiert',
  linkCopiedText: 'Der Link öffnet genau diese Ansicht.',
  linkPrompt: 'Link zum Kopieren:',
  savePng: 'Als Bild speichern',
  savePngTip: 'Als PNG speichern',

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
  functionsDescription: 'Variable t, Parameter T, siehe Funktionsreferenz unten.',
  swap: 'f und g tauschen',
  from: 'Von (× T)',
  to: 'Bis (× T)',
  examples: 'Beispiele',
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
    'Variable ist `t` (auch `τ` oder `x`), der Parameter `T` darf überall vorkommen, z. B. `rect(t/T)`. Dezimalzahlen mit Punkt: `0.5`. Die Formel wird live als Mathe-Ausdruck angezeigt.',
  referenceInput: 'Eingabe',
  referenceMeaning: 'Bedeutung',
  otherwise: 'sonst',

  explanationTitle: 'So funktioniert die Faltung',
  explanationIntro:
    'Die Faltung beschreibt, wie ein lineares, zeitinvariantes System mit Impulsantwort g auf ein Eingangssignal f reagiert. Für jeden Zeitpunkt t laufen vier Schritte ab:',
  step: (n: number) => `Schritt ${n}`,
  propertiesTitle: 'Wichtige Eigenschaften',
  propertiesDescription:
    'Ohne Dirac-Impulse hat f∗g die Einheit Amplitude × Zeit; deshalb zeigt die rechte Achse des Plots das Ergebnis in Vielfachen von T.',

  usageTitle: 'Bedienung',
  usageDescription:
    'Die Einstellungen stehen in der Adresszeile; ein kopierter Link öffnet genau diese Ansicht. Als App installiert (im Footer oder unter Einstellungen, auf iPhone und iPad über Teilen → „Zum Home-Bildschirm“) funktioniert sie auch ohne Internetverbindung.',
  keySpace: 'Leertaste',
  keyHome: 'Pos1',
  keyEnd: 'Ende',
  keyDrag: 'Ziehen',
  keyTap: 'Tippen',
  usagePlay: 'Abspielen / Pause',
  usageStep: 'Schritt zurück / vor (mit ⇧: größer)',
  usageEnds: 'Zum Anfang / Ende',
  usageScrub: 'Zeitpunkt t im Plot setzen',

  language: 'Sprache',
  install: 'Installieren',
  installApp: 'App installieren',
  installTitle: 'Als App installieren',
  installDescription: 'Installiert startet die App wie jede andere und funktioniert auch offline.',
  iosStep1: 'In Safari auf „Teilen“ tippen.',
  iosStep2: '„Zum Home-Bildschirm“ wählen.',
  iosAfter: 'Danach startet die App vom Home-Bildschirm und funktioniert auch offline.',
  about: 'Über',
  offlineReady: 'Die App ist jetzt auch offline nutzbar.',
  updateReady: 'Eine neue Version ist verfügbar.',
  reload: 'Neu laden',
}

export type Messages = typeof de

export const en: Messages = {
  appTitle: 'Convolution Animator',
  footerNote: 'Computes everything in the browser, offline too.',
  credits: 'mathjs · KaTeX · React · shadcn/ui',

  tabLabel: 'Views',
  tabAnimation: 'Animation',
  tabFunctions: 'Functions',
  tabExplanation: 'Explanation',
  tabSettings: 'Settings',

  animationTitle: 'Convolution of two functions',
  animationHint:
    'g is mirrored and slid across f; the area under the product gives the result point by point. Drag sideways in the plot to scrub.',
  plotLabel:
    'Animation of the convolution: f(τ), mirrored and shifted g(t−τ), product area and result',
  legendArea: 'Area under f(τ)·g(t−τ)',
  legendConvInT: '(f∗g)(t), right axis in T',
  copyLink: 'Copy link',
  copyLinkTip: 'Copy a link to this view',
  linkCopied: 'Link copied',
  linkCopiedText: 'The link opens exactly this view.',
  linkPrompt: 'Link to copy:',
  savePng: 'Save as image',
  savePngTip: 'Save as PNG',

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
  functionsDescription: 'Variable t, parameter T, see the function reference below.',
  swap: 'Swap f and g',
  from: 'From (× T)',
  to: 'To (× T)',
  examples: 'Examples',
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
    'The variable is `t` (also `τ` or `x`), the parameter `T` may appear anywhere, e.g. `rect(t/T)`. Decimals with a point: `0.5`. The formula is shown live as a math expression.',
  referenceInput: 'Input',
  referenceMeaning: 'Meaning',
  otherwise: 'otherwise',

  explanationTitle: 'How convolution works',
  explanationIntro:
    'Convolution describes how a linear time-invariant system with impulse response g responds to an input signal f. For every time t, four steps take place:',
  step: (n: number) => `Step ${n}`,
  propertiesTitle: 'Important properties',
  propertiesDescription:
    'Without Dirac impulses, f∗g has the unit amplitude × time; that is why the right axis of the plot shows the result in multiples of T.',

  usageTitle: 'Controls',
  usageDescription:
    'The settings are in the address bar; a copied link opens exactly this view. Installed as an app (in the footer or under Settings, on iPhone and iPad via Share → “Add to Home Screen”), it works without an internet connection, too.',
  keySpace: 'Space',
  keyHome: 'Home',
  keyEnd: 'End',
  keyDrag: 'Drag',
  keyTap: 'Tap',
  usagePlay: 'Play / pause',
  usageStep: 'Step back / forward (with ⇧: larger)',
  usageEnds: 'To the start / end',
  usageScrub: 'Set the time t in the plot',

  language: 'Language',
  install: 'Install',
  installApp: 'Install the app',
  installTitle: 'Install as an app',
  installDescription: 'Installed, the app starts like any other and works offline, too.',
  iosStep1: 'In Safari, tap “Share”.',
  iosStep2: 'Choose “Add to Home Screen”.',
  iosAfter: 'The app then starts from the home screen and works offline, too.',
  about: 'About',
  offlineReady: 'The app now works offline, too.',
  updateReady: 'A new version is available.',
  reload: 'Reload',
}
