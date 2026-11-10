import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import { applyTheme, initialTheme, type Theme } from '../../theme'

import '../../App.css'

import NavigationMenu from './NavigationMenu'

function AppLayout() {
  const { t, i18n } = useTranslation()

  // Das Theme gehört zum gemeinsamen Layout, damit es beim
  // Seitenwechsel nicht zurückgesetzt wird.
  const [theme, setTheme] = useState<Theme>(initialTheme)

  // Die Einstellung der Qibla-Linie bleibt beim Seitenwechsel erhalten.
  // Sie gehört deshalb zum gemeinsamen Layout statt zur MapPage.
  const [isQiblaPathVisible, setIsQiblaPathVisible] = useState(false)

  const themeButtonLabel = theme === 'light' ? t('switchToDark') : t('switchToLight')

  function handleThemeToggle() {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'

    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  return (
    <main className="qm-page">
      <header className="qm-header">
        {/* Die Navigation gehört zum gemeinsamen Layout.
      Dadurch ist sie später auf allen Seiten verfügbar. */}
        <NavigationMenu />

        <div className="qm-brand">
          <span className="qm-brand-icon" aria-hidden="true">
            ✦
          </span>

          <div className="qm-brand-text">
            <h1>{t('appTitle')}</h1>
            <p>{t('subtitle')}</p>
          </div>
        </div>

        <div className="qm-header-actions">
          <div className="qm-language">
            <label htmlFor="language-select">{t('languageLabel')}</label>

            <select
              id="language-select"
              value={i18n.language}
              onChange={(event) => {
                void i18n.changeLanguage(event.target.value)
              }}
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          <button
            type="button"
            className="theme-toggle"
            onClick={handleThemeToggle}
            aria-label={themeButtonLabel}
            title={themeButtonLabel}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* Outlet zeigt die aktuell ausgewählte Seite.
          Das Layout selbst bleibt beim Navigieren erhalten.
          Über context erhält die Kartenseite das gemeinsame Theme. */}
      <Outlet context={{ theme, isQiblaPathVisible, setIsQiblaPathVisible }} />
    </main>
  )
}

export default AppLayout
