import i18n, { type BackendModule } from 'i18next'
import { initReactI18next } from 'react-i18next'

import { supportedLanguages } from './constants/supportedLanguages'
import englishTranslations from './locales/en/translation.json'

// Englisch bleibt fest eingebunden, alle anderen Sprachen werden bei Bedarf geladen.
const translationFiles: Record<string, () => Promise<Record<string, unknown>>> = {
  './locales/en/translation.json': () => Promise.resolve(englishTranslations),

  ...import.meta.glob<Record<string, unknown>>(
    ['./locales/*/translation.json', '!./locales/en/translation.json'],
    {
      import: 'default',
    },
  ),
}

// Nur Sprachen mit vorhandener Übersetzung freigeben.
export const availableLanguages = supportedLanguages.filter((language) =>
  Object.prototype.hasOwnProperty.call(
    translationFiles,
    `./locales/${language.code}/translation.json`,
  ),
)

// Übersetzungsdateien bei Bedarf an i18next übergeben.
const translationBackend: BackendModule = {
  type: 'backend',

  init() {
    // Keine zusätzliche Initialisierung erforderlich.
  },

  read(language, namespace, callback) {
    const loadTranslation = translationFiles[`./locales/${language}/${namespace}.json`]

    if (!loadTranslation) {
      callback(new Error(`Translation not found: ${language}/${namespace}`), null)
      return
    }

    void loadTranslation().then(
      (translations) => {
        callback(null, translations)
      },
      (error: unknown) => {
        callback(error instanceof Error ? error : new Error(String(error)), null)
      },
    )
  },
}

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

// Englisch sofort bereitstellen, weitere Sprachen dynamisch laden.
void i18n
  .use(translationBackend)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: englishTranslations,
      },
    },
    partialBundledLanguages: true,
    lng: initialLanguage,
    fallbackLng: 'en',
    load: 'currentOnly',
    supportedLngs: availableLanguages.map((language) => language.code),
    react: {
      bindI18n: 'languageChanged loaded',
    },
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
