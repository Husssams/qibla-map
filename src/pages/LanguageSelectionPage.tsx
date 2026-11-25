import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { LANGUAGE_CHOICE_KEY, supportedLanguages } from '../constants/supportedLanguages'
import { availableLanguages } from '../i18n'

import './LanguageSelectionPage.css'

// Der Sprachcode muss in unserem unterstützten Sprachkatalog vorkommen.
type LanguageCode = (typeof supportedLanguages)[number]['code']

// Unterstützt die bereits verwendeten Eigenschaftsnamen
// name und nativeName aus den bisherigen Projektversionen.
function getLanguageName(language: { code: string; name?: string; nativeName?: string }) {
  return language.name ?? language.nativeName ?? language.code
}

export default function LanguageSelectionPage() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()

  // Beim ersten Öffnen wurde noch keine Sprache ausgewählt.
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(null)

  // Die Suche berücksichtigt verfügbare Sprachen nach Name und Sprachcode.
  const [searchQuery, setSearchQuery] = useState('')
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase()

  const filteredLanguages = availableLanguages.filter(
    (language) =>
      getLanguageName(language).toLocaleLowerCase().includes(normalizedSearch) ||
      language.code.toLocaleLowerCase().includes(normalizedSearch),
  )

  // Standardmäßig zeigen wir Englisch an.
  // Bei der Auswahl einer Sprache ändern sich nur die Vorschautexte.
  const previewLanguage = selectedLanguage ?? 'en'

  // Wir holen die Übersetzungen der ausgewählten Sprache,
  // ohne die globale App-Sprache zu verändern.
  const previewT = i18n.getFixedT(previewLanguage)

  // Die Vorschau verwendet die Schreibrichtung der gewählten Sprache.
  const previewDirection =
    supportedLanguages.find((language) => language.code === previewLanguage)?.direction ?? 'ltr'

  // Diese Funktion wird NUR durch den Weiter-Button ausgeführt.
  async function handleContinue() {
    // Ohne Sprachauswahl darf nichts passieren.
    if (!selectedLanguage) return

    // Die bestätigte Sprache in der gesamten App aktivieren.
    await i18n.changeLanguage(selectedLanguage)

    // Die gewählte Sprache für den nächsten App-Start speichern.
    localStorage.setItem('qibla-map-language', selectedLanguage)

    // Zusätzlich merken, dass die Erstauswahl abgeschlossen ist.
    localStorage.setItem(LANGUAGE_CHOICE_KEY, 'true')

    // Erst jetzt zur Kamera wechseln.
    navigate('/camera', { replace: true })
  }

  return (
    <section
      className="qm-language-selection qm-card"
      aria-labelledby="qm-language-selection-title"
    >
      {/* Titel der aktuell ausgewählten Sprache */}
      <h2 id="qm-language-selection-title" lang={previewLanguage} dir={previewDirection}>
        {previewT('languageSelection.title')}
      </h2>

      {/* Beschreibung wird sofort in der ausgewählten Sprache angezeigt. */}
      <p
        className="qm-language-selection__description"
        lang={previewLanguage}
        dir={previewDirection}
      >
        {previewT('languageSelection.description')}
      </p>

      {/* Sprachsuche oberhalb der vollständigen Sprachliste. */}
      <label className="qm-language-selection__search-label" htmlFor="qm-language-search">
        {previewT('languageSelection.searchLabel')}
      </label>

      <input
        id="qm-language-search"
        className="qm-language-selection__search"
        type="search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder={previewT('languageSelection.searchPlaceholder')}
        autoComplete="off"
        lang={previewLanguage}
        dir="auto"
      />

      {/* Radiogroup erlaubt nur eine ausgewählte Sprache. */}
      <div
        className="qm-language-selection__options"
        role="radiogroup"
        aria-labelledby="qm-language-selection-title"
      >
        {filteredLanguages.map((language) => (
          <label
            key={language.code}
            className={`qm-language-selection__option${
              selectedLanguage === language.code ? ' qm-language-selection__option--selected' : ''
            }`}
          >
            <input
              type="radio"
              name="qibla-language"
              value={language.code}
              checked={selectedLanguage === language.code}
              onChange={() => {
                // Nur die Auswahl ändern.
                // Noch keine Navigation zur Kamera!
                setSelectedLanguage(language.code)
              }}
              className="qm-language-selection__radio"
            />

            {/* Für Arabisch benutzen wir die neue SVG-Flagge. */}
            <span className="qm-language-selection__flag" aria-hidden="true">
              {language.code === 'ar' ? (
                <img src={language.flag} alt="" width={48} height={32} />
              ) : (
                language.flag
              )}
            </span>

            {/* Sprachname in der eigenen Sprache und Schreibrichtung anzeigen. */}
            <span
              className="qm-language-selection__name"
              lang={language.code}
              dir={language.direction}
            >
              {getLanguageName(language)}
            </span>

            {/* Häkchen ausschließlich bei der ausgewählten Sprache. */}
            {selectedLanguage === language.code && (
              <span className="qm-language-selection__check" aria-hidden="true">
                ✓
              </span>
            )}
          </label>
        ))}
      </div>

      {/* Hinweis anzeigen, wenn keine Sprache gefunden wurde. */}
      {filteredLanguages.length === 0 && (
        <p className="qm-language-selection__empty" role="status">
          {previewT('languageSelection.noResults')}
        </p>
      )}

      {/* Weiter-Button bleibt beim Scrollen am unteren Bildschirmrand sichtbar. */}

      <div className="qm-language-selection__footer">
        <button
          type="button"
          className="qm-primary-button qm-language-selection__continue"
          disabled={!selectedLanguage}
          onClick={() => {
            void handleContinue()
          }}
          lang={selectedLanguage ?? 'en'}
          dir={previewDirection}
        >
          {previewT('languageSelection.continue')}
        </button>
      </div>
    </section>
  )
}
