/*
 * Zentraler Katalog aller geplanten App-Sprachen.
 *
 * Die Reihenfolge bestimmt die Anzeige in der Sprachauswahl.
 * Eine Sprache wird erst verfügbar, wenn ihre Übersetzungsdatei existiert.
 *
 * Für Syrien verwenden wir die lokale SVG-Flagge.
 * Alle anderen Flaggen bleiben Unicode-Emojis.
 */
export const supportedLanguages = [
  // Bevorzugte Sprachen.
  {
    code: 'ar',
    name: 'العربية',
    flag: '/images/flags/syria.svg',
    direction: 'rtl',
  },
  {
    code: 'en',
    name: 'English',
    flag: '🇬🇧',
    direction: 'ltr',
  },
  {
    code: 'de',
    name: 'Deutsch',
    flag: '🇩🇪',
    direction: 'ltr',
  },
  {
    code: 'tr',
    name: 'Türkçe',
    flag: '🇹🇷',
    direction: 'ltr',
  },
  {
    code: 'fr',
    name: 'Français',
    flag: '🇫🇷',
    direction: 'ltr',
  },

  // Süd- und Südostasien.
  {
    code: 'id',
    name: 'Bahasa Indonesia',
    flag: '🇮🇩',
    direction: 'ltr',
  },
  {
    code: 'ur',
    name: 'اردو',
    flag: '🇵🇰',
    direction: 'rtl',
  },
  {
    code: 'hi',
    name: 'हिन्दी',
    flag: '🇮🇳',
    direction: 'ltr',
  },
  {
    code: 'bn',
    name: 'বাংলা',
    flag: '🇧🇩',
    direction: 'ltr',
  },
  {
    code: 'ha',
    name: 'Hausa',
    flag: '🇳🇬',
    direction: 'ltr',
  },
  {
    code: 'fa',
    name: 'فارسی',
    flag: '🇮🇷',
    direction: 'rtl',
  },
  {
    code: 'jv',
    name: 'Basa Jawa',
    flag: '🇮🇩',
    direction: 'ltr',
  },
  {
    code: 'pnb',
    name: 'پنجابی',
    flag: '🇵🇰',
    direction: 'rtl',
  },
  {
    code: 'ps',
    name: 'پښتو',
    flag: '🇦🇫',
    direction: 'rtl',
  },
  {
    code: 'om',
    name: 'Afaan Oromoo',
    flag: '🇪🇹',
    direction: 'ltr',
  },
  {
    code: 'uz',
    name: 'Oʻzbekcha',
    flag: '🇺🇿',
    direction: 'ltr',
  },
  {
    code: 'ms',
    name: 'Bahasa Melayu',
    flag: '🇲🇾',
    direction: 'ltr',
  },
  {
    code: 'zh-Hans',
    name: '简体中文',
    flag: '🇨🇳',
    direction: 'ltr',
  },

  // Afrika und weitere große Sprachgemeinschaften.
  {
    code: 'sw',
    name: 'Kiswahili',
    flag: '🇹🇿',
    direction: 'ltr',
  },
  {
    code: 'so',
    name: 'Soomaali',
    flag: '🇸🇴',
    direction: 'ltr',
  },
  {
    code: 'ru',
    name: 'Русский',
    flag: '🇷🇺',
    direction: 'ltr',
  },
  {
    code: 'am',
    name: 'አማርኛ',
    flag: '🇪🇹',
    direction: 'ltr',
  },
  {
    code: 'ff',
    name: 'Fulfulde',
    flag: '🇬🇳',
    direction: 'ltr',
  },
  {
    code: 'wo',
    name: 'Wolof',
    flag: '🇸🇳',
    direction: 'ltr',
  },
  {
    code: 'bm',
    name: 'Bamanankan',
    flag: '🇲🇱',
    direction: 'ltr',
  },

  // Kurdische und zentralasiatische Sprachen.
  {
    code: 'ckb',
    name: 'سۆرانی',
    flag: '🇮🇶',
    direction: 'rtl',
  },
  {
    code: 'ku',
    name: 'Kurmancî',
    flag: '🇮🇶',
    direction: 'ltr',
  },
  {
    code: 'kk',
    name: 'Қазақша',
    flag: '🇰🇿',
    direction: 'ltr',
  },
  {
    code: 'az',
    name: 'Azərbaycanca',
    flag: '🇦🇿',
    direction: 'ltr',
  },
  {
    code: 'tg',
    name: 'Тоҷикӣ',
    flag: '🇹🇯',
    direction: 'ltr',
  },
  {
    code: 'ky',
    name: 'Кыргызча',
    flag: '🇰🇬',
    direction: 'ltr',
  },
  {
    code: 'tk',
    name: 'Türkmençe',
    flag: '🇹🇲',
    direction: 'ltr',
  },

  // Balkan und weitere asiatische Sprachen.
  {
    code: 'sq',
    name: 'Shqip',
    flag: '🇦🇱',
    direction: 'ltr',
  },
  {
    code: 'bs',
    name: 'Bosanski',
    flag: '🇧🇦',
    direction: 'ltr',
  },
  {
    code: 'ta',
    name: 'தமிழ்',
    flag: '🇮🇳',
    direction: 'ltr',
  },
  {
    code: 'ml',
    name: 'മലയാളം',
    flag: '🇮🇳',
    direction: 'ltr',
  },
  {
    code: 'yo',
    name: 'Yorùbá',
    flag: '🇳🇬',
    direction: 'ltr',
  },
  {
    code: 'ug',
    name: 'ئۇيغۇرچە',
    flag: '🇨🇳',
    direction: 'rtl',
  },
  {
    code: 'th',
    name: 'ไทย',
    flag: '🇹🇭',
    direction: 'ltr',
  },
  {
    code: 'my',
    name: 'မြန်မာ',
    flag: '🇲🇲',
    direction: 'ltr',
  },
  {
    code: 'fil',
    name: 'Filipino',
    flag: '🇵🇭',
    direction: 'ltr',
  },

  // Weitere internationale Sprachen.
  {
    code: 'es',
    name: 'Español',
    flag: '🇪🇸',
    direction: 'ltr',
  },
  {
    code: 'pt',
    name: 'Português',
    flag: '🇵🇹',
    direction: 'ltr',
  },
  {
    code: 'nl',
    name: 'Nederlands',
    flag: '🇳🇱',
    direction: 'ltr',
  },
  {
    code: 'it',
    name: 'Italiano',
    flag: '🇮🇹',
    direction: 'ltr',
  },
  {
    code: 'sv',
    name: 'Svenska',
    flag: '🇸🇪',
    direction: 'ltr',
  },
] as const

// TypeScript erlaubt nur Sprachen aus unserer Liste.
export type LanguageCode = (typeof supportedLanguages)[number]['code']

// Dieser Schlüssel merkt sich die abgeschlossene Erstauswahl.
export const LANGUAGE_CHOICE_KEY = 'qibla-language-choice-completed'
