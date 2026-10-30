// Importiert die CSS-Datei für das Design.
import './App.css'
// Importiert unseren selbst definierten Datentyp.
import type { Coordinates } from './types/geo'
// Importiert die geografischen Koordinaten der Kaaba.
import { KAABA_COORDINATES } from './constants/kaaba'
// Importiert unsere Funktion zur Berechnung der Qibla-Richtung.
import { calculateQiblaBearing } from './utils/qiblaBearing'
// Importiert unsere neue Kartenkomponente.
import QiblaMapView from './components/QiblaMapView'
import { readManualLocation, saveManualLocation, clearManualLocation } from './utils/manualLocation'
import {
  readSessionLocation,
  saveSessionLocation,
  clearSessionLocation,
} from './utils/detectedLocationSession'
// Importiert unsere Funktion zur Standortermittlung.
import { getUserLocation, type UserLocation } from './utils/getUserLocation'
// Importiert den React Hook zum Speichern von Zustandswerten.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { applyTheme, initialTheme, type Theme } from './theme'

// Erstellt einen festen Teststandort.
const testLocation: Coordinates = {
  // Breitengrad des Teststandorts.
  latitude: 33.439073,

  // Längengrad des Teststandorts.
  longitude: 36.078122,
}

// Definiert unsere Hauptkomponente.
function App() {
  const { t, i18n } = useTranslation()
  // React merkt sich, welches Theme gerade aktiv ist.
  const [theme, setTheme] = useState<Theme>(initialTheme)

  const themeButtonLabel = theme === 'light' ? t('switchToDark') : t('switchToLight')
  // Lädt einen GPS-Standort aus der aktuellen Browsersitzung, falls vorhanden.
  const [detectedLocation, setDetectedLocation] = useState<UserLocation | null>(readSessionLocation)

  // Unterscheidet einen wiederhergestellten GPS-Standort von einer neuen Messung.
  const [gpsFromStorage, setGpsFromStorage] = useState(true)

  // Speichert eine Fehlermeldung, falls die Standortermittlung fehlschlägt.
  const [locationError, setLocationError] = useState<string | null>(null)

  // Speichert, ob gerade eine Standortermittlung läuft.
  const [isLocating, setIsLocating] = useState(false)

  // Steuert die interaktive Kartenansicht auf Smartphones.
  const [isMapExpanded, setIsMapExpanded] = useState(false)

  // Manuell gewählte Koordinaten bleiben nach einem Neuladen erhalten.
  const [manualLocation, setManualLocation] = useState<Coordinates | null>(readManualLocation)

  // Verhindert das Scrollen der Seite, solange die große Karte geöffnet ist.
  useEffect(() => {
    if (!isMapExpanded) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMapExpanded])

  // Mit Escape kann die vergrößerte Karte geschlossen werden.
  useEffect(() => {
    if (!isMapExpanded) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMapExpanded(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isMapExpanded])

  // Manuelle Position hat Vorrang vor GPS und dem Teststandort.
  const activeLocation: Coordinates = manualLocation ?? detectedLocation ?? testLocation

  // Berechnet die Qibla-Richtung für den aktuell verwendeten Standort.
  const qiblaBearing = calculateQiblaBearing(activeLocation)

  // Wir wechseln zwischen dem hellen und dunklen Design.
  function handleThemeToggle() {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'

    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  // Übernimmt den gewählten Kartenstandort sofort.
  function handleManualLocationChange(location: Coordinates) {
    // Normalisiert den Längengrad auf den üblichen Bereich von -180 bis 180 Grad.
    const normalizedLocation: Coordinates = {
      latitude: location.latitude,
      longitude: ((((location.longitude + 180) % 360) + 360) % 360) - 180,
    }

    // Übernimmt und speichert den manuell ausgewählten Standort.
    setManualLocation(normalizedLocation)
    saveManualLocation(normalizedLocation)

    // Eine frühere GPS-Messung ist jetzt nicht mehr aktiv.
    setDetectedLocation(null)
    clearSessionLocation()

    setLocationError(null)
  }

  // Wird ausgeführt, wenn der Benutzer den Standort-Button anklickt.
  async function handleDetectLocation() {
    // Entfernt eine alte Fehlermeldung vor einer neuen Standortanfrage.
    setLocationError(null)
    // Aktiviert den Ladezustand.
    setIsLocating(true)
    // Versucht, den Standort des Benutzers zu ermitteln.
    try {
      // Wartet auf die Antwort der Geolocation API.
      const location = await getUserLocation()

      // Speichert den ermittelten Standort im React State.
      setDetectedLocation(location)

      // Merkt sich den Standort für das Neuladen innerhalb der Sitzung.
      saveSessionLocation(location)

      // Dieser Standort stammt aus einer neuen GPS-Messung.
      setGpsFromStorage(false)
      // GPS ersetzt eine zuvor manuell gewählte Position.
      setManualLocation(null)
      clearManualLocation()
    } catch (error) {
      // Zeigt den technischen Fehler in der Entwicklerkonsole.
      console.error('Standortermittlung fehlgeschlagen:', error)

      // Übernimmt die passende Fehlermeldung aus getUserLocation.ts.
      if (error instanceof Error) {
        setLocationError(error.message)
      } else {
        // Behandelt den Fall, dass kein normales Error-Objekt vorliegt.
        setLocationError('locationErrors.unexpected')
      }
    } finally {
      // Wird nach Erfolg oder Fehler ausgeführt.
      // Beendet den Ladezustand.
      setIsLocating(false)
    }
  }

  // Gibt unsere neue responsive Benutzeroberfläche zurück.
  return (
    <main className="qm-page">
      {/* Kopfbereich mit Logo, Sprachauswahl und Theme-Button. */}
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

      {/* Die Seitenleiste und die Karte bilden unser Hauptlayout. */}
      <div className="qm-layout">
        {/* Standortbereich: Hier kommt später die Adresssuche hinzu. */}
        <section className="qm-card qm-location-card">
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

        {/* Ergebnisbereich für die berechnete Qibla-Richtung. */}
        <section className="qm-card qm-result-card">
          <h2 className="qm-section-caption">{t('qiblaDirection')}</h2>

          <p className="qm-bearing">
            <bdi dir="ltr">{qiblaBearing.toFixed(1)}°</bdi>
          </p>

          <div className="qm-result-divider" />

          <div className="qm-kaaba-info">
            <span>{t('kaaba')}</span>
            <bdi dir="ltr">
              {KAABA_COORDINATES.latitude}°, {KAABA_COORDINATES.longitude}°
            </bdi>
          </div>
        </section>

        {/* Die Karte bleibt unabhängig von der Sprache geografisch ausgerichtet. */}
        <div className={`qm-map-card${isMapExpanded ? ' qm-map-card--expanded' : ''}`}>
          <QiblaMapView
            location={activeLocation}
            theme={theme}
            isSelectingLocation={isMapExpanded}
            followLocation={manualLocation === null}
            onSelectLocation={handleManualLocationChange}
          />

          {!isMapExpanded ? (
            <>
              {/* Auf Smartphones kann über der inaktiven Karte weitergescrollt werden. */}
              <div className="qm-map-scroll-guard" aria-hidden="true" />

              {/* Ein einziger Button startet die interaktive Kartenansicht. */}
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
              onClick={() => setIsMapExpanded(false)}
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

// Macht die Komponente für andere Dateien verfügbar.
export default App
