import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { supportedLanguages } from './constants/supportedLanguages'

import de from './locales/de/translation.json'
import en from './locales/en/translation.json'
import ar from './locales/ar/translation.json'

function updateDocumentLanguage(language: string) {
  const selectedLanguage = supportedLanguages.find((item) => item.code === language)

  document.documentElement.lang = selectedLanguage?.code ?? 'en'
  document.documentElement.dir = selectedLanguage?.direction ?? 'ltr'
}

// Wir lesen die zuletzt ausgewählte Sprache aus dem Browser-Speicher.
const savedLanguage = localStorage.getItem('qibla-map-language')

const initialLanguage =
  supportedLanguages.find((language) => language.code === savedLanguage)?.code ?? 'en'

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
