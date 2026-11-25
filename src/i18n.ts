import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { supportedLanguages } from './constants/supportedLanguages'

// Alle vorhandenen Übersetzungsdateien automatisch laden.
const translationFiles = import.meta.glob<Record<string, unknown>>('./locales/*/translation.json', {
  eager: true,
  import: 'default',
})

// Nur Sprachen mit vorhandener Übersetzung freigeben.
export const availableLanguages = supportedLanguages.filter((language) =>
  Object.prototype.hasOwnProperty.call(
    translationFiles,
    `./locales/${language.code}/translation.json`,
  ),
)

// Übersetzungen für i18next registrieren.
const resources = Object.fromEntries(
  availableLanguages.map((language) => [
    language.code,
    {
      translation: translationFiles[`./locales/${language.code}/translation.json`],
    },
  ]),
)

// Sprache und Schreibrichtung des Dokuments festlegen.
function updateDocumentLanguage(language: string) {
  const selectedLanguage = availableLanguages.find((item) => item.code === language)

  document.documentElement.lang = selectedLanguage?.code ?? 'en'
  document.documentElement.dir = selectedLanguage?.direction ?? 'ltr'
}

// Die zuletzt gewählte Sprache aus dem lokalen Speicher lesen.
const savedLanguage = localStorage.getItem('qibla-map-language')

// Nur eine verfügbare Sprache wiederherstellen.
const initialLanguage =
  availableLanguages.find((language) => language.code === savedLanguage)?.code ?? 'en'

updateDocumentLanguage(initialLanguage)

// Alle verfügbaren Sprachen bei i18next registrieren.
void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en',
  supportedLngs: availableLanguages.map((language) => language.code),
  interpolation: {
    escapeValue: false,
  },
})

// Sprachwechsel speichern und die Schreibrichtung aktualisieren.
i18n.on('languageChanged', (language) => {
  localStorage.setItem('qibla-map-language', language)
  updateDocumentLanguage(language)
})

export default i18n
