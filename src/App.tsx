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
// Importiert unsere Funktion zur Standortermittlung.
import { getUserLocation, type UserLocation } from './utils/getUserLocation'
// Importiert den React Hook zum Speichern von Zustandswerten.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

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
  // Speichert den ermittelten Standort oder null, solange keiner vorliegt.
  const [detectedLocation, setDetectedLocation] = useState<UserLocation | null>(null)

  // Speichert eine Fehlermeldung, falls die Standortermittlung fehlschlägt.
  const [locationError, setLocationError] = useState<string | null>(null)

  // Speichert, ob gerade eine Standortermittlung läuft.
  const [isLocating, setIsLocating] = useState(false)

  // Verwendet den ermittelten Standort, falls einer vorhanden ist.
  const activeLocation: Coordinates = detectedLocation ?? testLocation

  // Berechnet die Qibla-Richtung für den aktuell verwendeten Standort.
  const qiblaBearing = calculateQiblaBearing(activeLocation)

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

  // Gibt die Benutzeroberfläche zurück.
  return (
    <main>
      {/* Zeigt den Namen unserer Anwendung. */}
      <h1>{t('appTitle')}</h1>

      <div>
        <label htmlFor="language-select">{t('languageLabel')}: </label>

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

      {/* Beschreibt die Aufgabe unserer Anwendung. */}
      <p>{t('subtitle')}</p>

      {/* Zeigt den gerade verwendeten Standort an. */}
      <p>
        {detectedLocation ? t('reportedLocation') : t('testLocation')}:{' '}
        <bdi dir="ltr">
          {activeLocation.latitude}°, {activeLocation.longitude}°
        </bdi>
      </p>

      {/* Zeigt die geografischen Koordinaten der Kaaba an. */}
      <p>
        {t('kaaba')}:{' '}
        <bdi dir="ltr">
          {KAABA_COORDINATES.latitude}°, {KAABA_COORDINATES.longitude}°
        </bdi>
      </p>
      {/* Zeigt den berechneten Qibla-Winkel an. */}
      <p>
        {t('qiblaDirection')}: <bdi dir="ltr">{qiblaBearing.toFixed(1)}°</bdi>
      </p>

      {/* Startet die Standortermittlung erst nach einem Klick. */}
      {/* Zeigt während der Standortermittlung einen Ladezustand an. */}
      <button type="button" onClick={handleDetectLocation} disabled={isLocating}>
        {isLocating ? t('locating') : t('detectLocation')}
      </button>

      {/* Zeigt einen Fehler an, falls die Standortermittlung fehlschlägt. */}
      {locationError && <p role="alert">{t(locationError)}</p>}

      {/* Zeigt Informationen an, sobald ein Standort ermittelt wurde. */}
      {detectedLocation && (
        <p>
          {t('locationAccuracy', {
            meters: Math.round(detectedLocation.accuracy).toLocaleString(i18n.language),
          })}
        </p>
      )}

      {/* Warnt den Benutzer, wenn die Standortgenauigkeit schlechter als 1 km ist. */}
      {detectedLocation && detectedLocation.accuracy > 1000 && (
        <p role="alert">{t('lowAccuracyWarning')}</p>
      )}
      {/* Übergibt den aktuell verwendeten Standort an die Karte. */}
      <QiblaMapView location={activeLocation} />
    </main>
  )
}

// Macht die Komponente für andere Dateien verfügbar.
export default App
