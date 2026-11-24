import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'

import { applyTheme, initialTheme, type Theme } from '../../theme'

import '../../App.css'

import NavigationMenu from './NavigationMenu'
import type { MapViewport } from '../../types/mapViewport'

import { getSeasonalLogo } from '../../utils/branding/seasonalLogo'
import HeaderLanguageDropdown from './HeaderLanguageDropdown'

function AppLayout() {
  const { t } = useTranslation()

  // Auf der Startseite verwenden wir einen reduzierten Header.
  const { pathname } = useLocation()
  const isLanguageSelection = pathname === '/'

  const appLogo = getSeasonalLogo()

  // Das Theme gehört zum gemeinsamen Layout, damit es beim
  // Seitenwechsel nicht zurückgesetzt wird.
  const [theme, setTheme] = useState<Theme>(initialTheme)

  // Die Einstellung der Qibla-Linie bleibt beim Seitenwechsel erhalten.
  // Sie gehört deshalb zum gemeinsamen Layout statt zur MapPage.
  const [isQiblaPathVisible, setIsQiblaPathVisible] = useState(false)
  // Speichert den zuletzt sichtbaren Kartenausschnitt während der Navigation.
  // null bedeutet: Die Karte wurde noch nicht manuell verändert.
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null)
  // Steuert die automatische Darstellung des gesamten Qibla-Pfads.
  const [isQiblaPathFitEnabled, setIsQiblaPathFitEnabled] = useState(false)

  // Speichert die Kartenansicht vor der automatischen Anpassung.
  // Beim Ausschalten können wir genau zu dieser Ansicht zurückkehren.
  const [preFitViewport, setPreFitViewport] = useState<MapViewport | null>(null)

  const themeButtonLabel = theme === 'light' ? t('switchToDark') : t('switchToLight')

  function handleThemeToggle() {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'

    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  return (
    <main className="qm-page">
      <header className={`qm-header${isLanguageSelection ? ' qm-header--landing' : ''}`}>
        {/* Die Navigation gehört zum gemeinsamen Layout.
      Dadurch ist sie später auf allen Seiten verfügbar. */}
        {!isLanguageSelection && <NavigationMenu />}

        <div className="qm-brand">
          <img src={appLogo} alt="" className="qm-brand-icon" width={54} height={54} />

          <div className="qm-brand-text">
            <h1>{t('appTitle')}</h1>
            {!isLanguageSelection && <p>{t('subtitle')}</p>}
          </div>
        </div>

        <div className="qm-header-actions">
          {/* Auf der Sprachauswahl kein zusätzliches Sprach-Dropdown. */}
          {!isLanguageSelection && (
            <div className="qm-language">
              <span className="qm-language__label">{t('languageLabel')}</span>

              <HeaderLanguageDropdown />
            </div>
          )}

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
      <Outlet
        context={{
          theme,
          isQiblaPathVisible,
          setIsQiblaPathVisible,
          mapViewport,
          setMapViewport,
          isQiblaPathFitEnabled,
          setIsQiblaPathFitEnabled,
          preFitViewport,
          setPreFitViewport,
        }}
      />
    </main>
  )
}

export default AppLayout
