
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { supportedLanguages } from '../../constants/supportedLanguages'

// Unterstützt den Sprachkatalog mit "name" oder "nativeName".
function getLanguageName(language: {
  code: string
  name?: string
  nativeName?: string
}) {
  return language.name ?? language.nativeName ?? language.code
}

export default function HeaderLanguageDropdown() {
  const { t, i18n } = useTranslation()
  const dropdownRef = useRef<HTMLDetailsElement>(null)

  const selectedLanguage =
    supportedLanguages.find(
      (language) => language.code === i18n.language,
    ) ?? supportedLanguages[0]

  // Beim Tippen außerhalb schließen.
  useEffect(() => {
    function handleOutsideClick(event: PointerEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        dropdownRef.current.open = false
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
    }
  }, [])

  function selectLanguage(code: string) {
    // i18n übernimmt die bestehende Sprachspeicherung und RTL.
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
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.currentTarget.open = false
          event.currentTarget.querySelector('summary')?.focus()
        }
      }}
    >
      <summary aria-label={t('languageLabel')}>
        <span dir="auto">{getLanguageName(selectedLanguage)}</span>
        <span aria-hidden="true">⌄</span>
      </summary>

      <ul className="qm-language-dropdown__list">
        {supportedLanguages.map((language) => {
          const isSelected = language.code === i18n.language

          return (
            <li key={language.code}>
              <button
                type="button"
                lang={language.code}
                aria-pressed={isSelected}
                onClick={() => selectLanguage(language.code)}
              >
                <span dir="auto">{getLanguageName(language)}</span>
                {isSelected && <span aria-hidden="true">✓</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
