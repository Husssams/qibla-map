import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import de from './locales/de/translation.json'
import en from './locales/en/translation.json'
import ar from './locales/ar/translation.json'

// Wir legen die Sprache und Schreibrichtung des HTML-Dokuments fest.
function updateDocumentLanguage(language: string) {
  document.documentElement.lang = language
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
}

// Wir lesen die zuletzt ausgewählte Sprache aus dem Browser-Speicher.
const savedLanguage = localStorage.getItem('qibla-map-language')

// Falls keine gültige Sprache gespeichert ist, verwenden wir Englisch.
const initialLanguage = savedLanguage === 'de' || savedLanguage === 'ar' ? savedLanguage : 'en'

// Wir übernehmen beim Start die gespeicherte Sprache.
updateDocumentLanguage(initialLanguage)

// Wir verbinden i18next mit React und registrieren unsere drei Sprachen.
void i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

// Bei jedem Sprachwechsel aktualisieren wir Speicher und Schreibrichtung.
i18n.on('languageChanged', (language) => {
  localStorage.setItem('qibla-map-language', language)
  updateDocumentLanguage(language)
})

export default i18n
