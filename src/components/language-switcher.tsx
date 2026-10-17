import { Button } from '@/components/ui/button'
import { getLocale, languageName, locales, m, setLocale } from '@/i18n'

/** Die Sprache folgt dem Browser; diese kleinen Knöpfe im Footer überschreiben sie nur. */
export function LanguageSwitcher() {
  const current = getLocale()
  return (
    <div role="group" aria-label={m.language} className="flex gap-1">
      {locales.map((locale) => (
        <Button
          key={locale}
          variant={locale === current ? 'secondary' : 'ghost'}
          size="xs"
          aria-pressed={locale === current}
          // „EN“ läse sich als Buchstaben: die Sprache in sich selbst nennen
          lang={locale}
          aria-label={languageName(locale)}
          onClick={() => setLocale(locale)}
        >
          {locale.toUpperCase()}
        </Button>
      ))}
    </div>
  )
}
