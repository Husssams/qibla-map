
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { availableLanguages } from '../../i18n'

// Lokale Flaggen als Bild, andere Flaggen als Emoji anzeigen.
function LanguageFlag({ flag }: { flag: string }) {
  if (flag.startsWith('/')) {
    return <img className="qm-language-dropdown__flag" src={flag} alt="" aria-hidden="true" />
  }

  return (
    <span className="qm-language-dropdown__flag" aria-hidden="true">
      {flag}
    </span>
  )
}

export default function HeaderLanguageDropdown() {
  const { t, i18n } = useTranslation()
  const dropdownRef = useRef<HTMLDetailsElement>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Nur tatsächlich verfügbare Sprachen anzeigen.
  const selectedLanguage =
    availableLanguages.find((language) => language.code === i18n.language) ??
    availableLanguages[0]

  // Nach Sprachname oder Sprachcode suchen.
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase()

  const filteredLanguages = availableLanguages.filter(
    (language) =>
      language.name.toLocaleLowerCase().includes(normalizedSearch) ||
      language.code.toLocaleLowerCase().includes(normalizedSearch),
  )

  // Beim Tippen außerhalb schließen.
  useEffect(() => {
    function handleOutsideClick(event: PointerEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        dropdownRef.current.open = false
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
    }
  }, [])

  function selectLanguage(code: string) {
    // i18n übernimmt Sprachspeicherung und Schreibrichtung.
    void i18n.changeLanguage(code)

    // Dropdown nach der Auswahl schließen.
    if (dropdownRef.current) {
      dropdownRef.current.open = false
    }
  }

  return (
    <details
      ref={dropdownRef}
      className="qm-language-dropdown"
      onToggle={(event) => {
        // Bei jedem Öffnen die vollständige Liste anzeigen.
        if (event.currentTarget.open) {
          setSearchQuery('')
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.currentTarget.open = false
          event.currentTarget.querySelector('summary')?.focus()
        }
      }}
    >
      <summary aria-label={`${t('languageLabel')}: ${selectedLanguage.name}`}>
        <span className="qm-language-dropdown__selected">
          <LanguageFlag flag={selectedLanguage.flag} />
          <span
            className="qm-language-dropdown__name"
            lang={selectedLanguage.code}
            dir={selectedLanguage.direction}
          >
            {selectedLanguage.name}
          </span>
        </span>

        <span aria-hidden="true">⌄</span>
      </summary>

      <div className="qm-language-dropdown__panel">
        {/* Suchfeld bleibt beim Scrollen sichtbar. */}
        <div className="qm-language-dropdown__search-wrapper">
          <input
            type="search"
            className="qm-language-dropdown__search"
            aria-label={t('languageSelection.searchLabel')}
            placeholder={t('languageSelection.searchPlaceholder')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        {/* Nur die Sprachliste wird gescrollt. */}
        <ul className="qm-language-dropdown__list">
          {filteredLanguages.map((language) => {
            const isSelected = language.code === i18n.language

            return (
              <li key={language.code}>
                <button
                  type="button"
                  lang={language.code}
                  aria-pressed={isSelected}
                  onClick={() => selectLanguage(language.code)}
                >
                  <span className="qm-language-dropdown__option-main">
                    <LanguageFlag flag={language.flag} />

                    <span
                      className="qm-language-dropdown__name"
                      dir={language.direction}
                    >
                      {language.name}
                    </span>
                  </span>

                  {isSelected && (
                    <span className="qm-language-dropdown__selection-mark" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            )
          })}

          {filteredLanguages.length === 0 && (
            <li className="qm-language-dropdown__empty" role="status">
              {t('languageSelection.noResults')}
            </li>
          )}
        </ul>
      </div>
    </details>
  )
}
