import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import QiblaMapView from './components/QiblaMapView'
import { PlaceSearch } from './components/PlaceSearch'
import { KAABA_COORDINATES } from './constants/kaaba'
import { applyTheme, initialTheme, type Theme } from './theme'
import type { Coordinates } from './types/geo'
import {
  clearSessionLocation,
  readSessionLocation,
  saveSessionLocation,
} from './utils/detectedLocationSession'
import { getUserLocation, type UserLocation } from './utils/getUserLocation'
import { clearManualLocation, readManualLocation, saveManualLocation } from './utils/manualLocation'
import { calculateQiblaBearing } from './utils/qiblaBearing'

import './App.css'

// Fallback, solange weder ein manueller noch ein GPS-Standort vorliegt.
const testLocation: Coordinates = {
  latitude: 33.439073,
  longitude: 36.078122,
}

function App() {
  const { t, i18n } = useTranslation()

  // Suchtexte stammen aus dem bestehenden i18next-Übersetzungssystem.
  const placeSearchTexts = {
    label: t('placeSearch.label'),
    placeholder: t('placeSearch.placeholder'),
    loading: t('placeSearch.loading'),
    noResults: t('placeSearch.noResults'),
    dailyLimitReached: t('placeSearch.dailyLimitReached'),
    tooManyRequests: t('placeSearch.tooManyRequests'),
    searchUnavailable: t('placeSearch.searchUnavailable'),
  }

  const [theme, setTheme] = useState<Theme>(initialTheme)
  const themeButtonLabel = theme === 'light' ? t('switchToDark') : t('switchToLight')

  // GPS-Daten werden nur für die aktuelle Browsersitzung gespeichert.
  const [detectedLocation, setDetectedLocation] = useState<UserLocation | null>(readSessionLocation)

  // Unterscheidet wiederhergestellte GPS-Daten von einer neuen Messung.
  const [gpsFromStorage, setGpsFromStorage] = useState(true)

  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isMapExpanded, setIsMapExpanded] = useState(false)

  // Ein ausdrücklicher Auftrag, die Karte auf einen Ort zu zentrieren.
  const [focusTarget, setFocusTarget] = useState<Coordinates | null>(null)

  // Manuell gewählte Standorte bleiben nach einem Seitenneustart erhalten.
  const [manualLocation, setManualLocation] = useState<Coordinates | null>(readManualLocation)

  // Manuelle Auswahl hat Vorrang vor GPS und dem Teststandort.
  const activeLocation: Coordinates = manualLocation ?? detectedLocation ?? testLocation
  const qiblaBearing = calculateQiblaBearing(activeLocation)

  // Sperrt das Scrollen der Hintergrundseite während der vergrößerten Kartenansicht.
  useEffect(() => {
    if (!isMapExpanded) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMapExpanded])

  // Escape schließt die große Karte und zentriert sie auf den aktuellen Marker.
  useEffect(() => {
    if (!isMapExpanded) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return

      setIsMapExpanded(false)
      setFocusTarget({
        latitude: activeLocation.latitude,
        longitude: activeLocation.longitude,
      })
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isMapExpanded, activeLocation.latitude, activeLocation.longitude])

  function handleThemeToggle() {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'

    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  // Übernimmt einen manuell ausgewählten Standort aus der Karte oder Ortssuche.
  function handleManualLocationChange(location: Coordinates) {
    // Normalisiert den Längengrad auf den Bereich von -180 bis 180 Grad.
    const normalizedLocation: Coordinates = {
      latitude: location.latitude,
      longitude: ((((location.longitude + 180) % 360) + 360) % 360) - 180,
    }

    setManualLocation(normalizedLocation)
    saveManualLocation(normalizedLocation)

    // Eine manuelle Auswahl ersetzt den zuvor aktiven GPS-Standort.
    setDetectedLocation(null)
    clearSessionLocation()

    setLocationError(null)
  }

  // Beim Schließen der großen Karte wird der Marker wieder zentriert.
  function handleCloseExpandedMap() {
    setIsMapExpanded(false)

    setFocusTarget({
      latitude: activeLocation.latitude,
      longitude: activeLocation.longitude,
    })
  }

  async function handleDetectLocation() {
    setLocationError(null)
    setIsLocating(true)

    try {
      const location = await getUserLocation()

      setDetectedLocation(location)
      saveSessionLocation(location)
      setGpsFromStorage(false)

      // Eine neue GPS-Messung ersetzt einen zuvor manuell gewählten Standort.
      setManualLocation(null)
      clearManualLocation()
    } catch (error) {
      console.error('Standortermittlung fehlgeschlagen:', error)

      if (error instanceof Error) {
        setLocationError(error.message)
      } else {
        setLocationError('locationErrors.unexpected')
      }
    } finally {
      setIsLocating(false)
    }
  }

  return (
    <main className="qm-page">
      {/* Kopfbereich mit Logo, Spracheinstellung und Theme-Umschaltung. */}
      <header className="qm-header">
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

      <div className="qm-layout">
        {/* Standortbereich mit Ortssuche, Koordinaten und GPS-Ermittlung. */}
        <section className="qm-card qm-location-card">
          <PlaceSearch
            texts={placeSearchTexts}
            onSelect={(place) => {
              // Suchauswahl aktualisiert den Standort und zentriert die Karte.
              handleManualLocationChange({
                latitude: place.latitude,
                longitude: place.longitude,
              })

              setFocusTarget({
                latitude: place.latitude,
                longitude: place.longitude,
              })
            }}
          />

          <h2 className="qm-section-caption">
            {manualLocation
              ? t('selectedLocation')
              : detectedLocation
                ? t(gpsFromStorage ? 'lastDetectedLocation' : 'reportedLocation')
                : t('testLocation')}
          </h2>

          <p className="qm-coordinate">
            <bdi dir="ltr">
              {activeLocation.latitude.toFixed(6)}°, {activeLocation.longitude.toFixed(6)}°
            </bdi>
          </p>

          <button
            type="button"
            className="qm-primary-button"
            onClick={handleDetectLocation}
            disabled={isLocating}
          >
            {isLocating ? t('locating') : t('detectLocation')}
          </button>

          {locationError && (
            <p className="qm-alert" role="alert">
              {t(locationError)}
            </p>
          )}

          {!manualLocation && detectedLocation && (
            <p className="qm-detail">
              {t('locationAccuracy', {
                meters: Math.round(detectedLocation.accuracy).toLocaleString(i18n.language),
              })}
            </p>
          )}

          {!manualLocation && detectedLocation && detectedLocation.accuracy > 1000 && (
            <p className="qm-alert" role="alert">
              {t('lowAccuracyWarning')}
            </p>
          )}
        </section>

        {/* Ergebnisbereich mit Qibla-Richtung und Kaaba-Koordinaten. */}
        <section className="qm-card qm-result-card">
          <h2 className="qm-section-caption">{t('qiblaDirection')}</h2>

          {/* Eine fehlende Qibla-Richtung wird als Hinweis statt als Absturz behandelt. */}
          {qiblaBearing === null ? (
            <p className="qm-detail" role="status">
              {t('qiblaTooClose')}
            </p>
          ) : (
            <p className="qm-bearing">
              <bdi dir="ltr">{qiblaBearing.toFixed(1)}°</bdi>
            </p>
          )}

          <div className="qm-result-divider" />

          <div className="qm-kaaba-info">
            <span>{t('kaaba')}</span>
            <bdi dir="ltr">
              {KAABA_COORDINATES.latitude}°, {KAABA_COORDINATES.longitude}°
            </bdi>
          </div>
        </section>

        {/* Kartenbereich mit normalem Anzeigemodus und vergrößertem Auswahlmodus. */}
        <div className={`qm-map-card${isMapExpanded ? ' qm-map-card--expanded' : ''}`}>
          <QiblaMapView
            location={activeLocation}
            qiblaBearing={qiblaBearing}
            theme={theme}
            isSelectingLocation={isMapExpanded}
            followLocation={manualLocation === null}
            focusTarget={focusTarget}
            onSelectLocation={handleManualLocationChange}
          />

          {!isMapExpanded ? (
            <>
              {/* Erlaubt auf Mobilgeräten das Scrollen über die inaktive Karte. */}
              <div className="qm-map-scroll-guard" aria-hidden="true" />

              <button
                type="button"
                className="qm-map-select-button"
                onClick={() => setIsMapExpanded(true)}
              >
                {t('selectOnMap')}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="qm-map-close-button"
              onClick={handleCloseExpandedMap}
              aria-label={t('closeMap')}
              title={t('closeMap')}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

export default App
