/*
 * Alle derzeit unterstützten Sprachen an einer Stelle.
 *
 * Bei Issue #42 können wir hier später weitere Sprachen
 * ergänzen, ohne die Sprachauswahl neu zu programmieren.
 */
export const supportedLanguages = [
  {
    code: 'de',
    name: 'Deutsch',
    flag: '🇩🇪',
    direction: 'ltr',
  },
  {
    code: 'en',
    name: 'English',
    flag: '🇬🇧',
    direction: 'ltr',
  },
  {
    code: 'ar',
    name: 'العربية',
    flag: '/images/flags/syria.svg',
    direction: 'rtl',
  },
] as const

// TypeScript erlaubt nur Sprachen aus unserer Liste.
export type LanguageCode = (typeof supportedLanguages)[number]['code']

// Dieser Schlüssel merkt sich die abgeschlossene Erstauswahl.
export const LANGUAGE_CHOICE_KEY = 'qibla-language-choice-completed'
