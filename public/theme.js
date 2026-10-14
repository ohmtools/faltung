// Farbschema vor dem ersten Zeichnen setzen, damit nichts aufblitzt. Eigene
// Datei statt Inline-Script, damit die Content-Security-Policy ohne Hash auskommt.
try {
  var t = localStorage.getItem('faltung-theme')
  if (t === 'dark' || ((!t || t === 'system') && matchMedia('(prefers-color-scheme: dark)').matches))
    document.documentElement.classList.add('dark')
} catch {}
