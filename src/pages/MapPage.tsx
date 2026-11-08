import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router'

import QiblaMapView from '../components/map/QiblaMapView'
import { PlaceSearch } from '../components/search/PlaceSearch'
import { KAABA_COORDINATES } from '../constants/kaaba'
import type { Theme } from '../theme'
import type { Coordinates } from '../types/geo'
import {
  clearSessionLocation,
  readSessionLocation,
  saveSessionLocation,
} from '../utils/location/detectedLocationSession'
import { getUserLocation, type UserLocation } from '../utils/location/getUserLocation'
import {
  clearManualLocation,
  readManualLocation,
  saveManualLocation,
} from '../utils/location/manualLocation'
import { calculateQiblaBearing } from '../utils/qibla/qiblaBearing'

// Fallback, solange weder ein manueller noch ein GPS-Standort vorliegt.
const testLocation: Coordinates = {
  latitude: 33.439073,
  longitude: 36.078122,
}

function MapPage() {
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

  // Das Theme wird im gemeinsamen Layout verwaltet.
  // Dadurch bleibt es auch beim Navigieren zwischen Seiten erhalten.
  const { theme } = useOutletContext<{ theme: Theme }>()

  // GPS-Daten werden nur für die aktuelle Browsersitzung gespeichert.
  const [detectedLocation, setDetectedLocation] = useState<UserLocation | null>(readSessionLocation)

  // Unterscheidet wiederhergestellte GPS-Daten von einer neuen Messung.
  const [gpsFromStorage, setGpsFromStorage] = useState(true)

  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  // Die geodätische Linie ist optional und beim ersten Laden ausgeschaltet.
  // Die Einstellung bleibt unabhängig von GPS, Standortsuche und Kartengröße.
  const [isQiblaPathVisible, setIsQiblaPathVisible] = useState(false)

  // Über die Referenz öffnen und schließen wir den nativen Dialog.
  // Ein zusätzlicher React-State ist dafür nicht erforderlich.
  const qiblaPathDialogRef = useRef<HTMLDialogElement | null>(null)

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

      // Das Info-Fenster hat Vorrang: Escape soll zunächst nur den Dialog schließen,
      // nicht gleichzeitig die vergrößerte Kartenansicht verlassen.
      if (qiblaPathDialogRef.current?.open) return

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
          isQiblaPathVisible={isQiblaPathVisible}
          theme={theme}
          isSelectingLocation={isMapExpanded}
          followLocation={manualLocation === null}
          focusTarget={focusTarget}
          onSelectLocation={handleManualLocationChange}
        />

        {/* Auf Smartphones verhindert der Scrollschutz versehentliche Kartenbewegungen.
      Die Bedienelemente liegen mit ihrem höheren z-index darüber. */}
        {!isMapExpanded && <div className="qm-map-scroll-guard" aria-hidden="true" />}

        {/* Die vergrößerte Karte kann unabhängig vom Info-Dialog geschlossen werden. */}
        {isMapExpanded && (
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

        {/* Alle Kartenbedienelemente verwenden den bestehenden React-State.
      Die Einstellung bleibt beim Vergrößern der Karte erhalten. */}
        <div className="qm-map-controls">
          <div className="qm-map-control-actions">
            <label className="qm-qibla-path-label">
              <input
                type="checkbox"
                checked={isQiblaPathVisible}
                onChange={(event) => setIsQiblaPathVisible(event.target.checked)}
              />
              <span>{t('showQiblaPath')}</span>
            </label>

            {/* Der Info-Button erscheint nur bei sichtbarer und definierter Linie.
          Die längere Erklärung soll nicht dauerhaft Kartenfläche verdecken. */}
            {isQiblaPathVisible && qiblaBearing !== null && (
              <button
                type="button"
                className="qm-map-info-button"
                aria-haspopup="dialog"
                aria-controls="qm-qibla-path-dialog"
                onClick={() => qiblaPathDialogRef.current?.showModal()}
              >
                <span aria-hidden="true">ⓘ</span>
                <span>{t('qiblaPathInfoButton')}</span>
              </button>
            )}

            {/* Die Standortauswahl ist in der vergrößerten Karte bereits aktiv.
          Deshalb wird der zusätzliche Auswahlbutton dort ausgeblendet. */}
            {!isMapExpanded && (
              <button
                type="button"
                className="qm-map-select-button"
                onClick={() => setIsMapExpanded(true)}
              >
                {t('selectOnMap')}
              </button>
            )}
          </div>
        </div>

        {/* Der native Dialog erscheint über der Karte statt als dauerhafter Hinweis.
      Escape und die Fokusverwaltung übernimmt weitgehend der Browser. */}
        <dialog
          id="qm-qibla-path-dialog"
          ref={qiblaPathDialogRef}
          className="qm-qibla-path-dialog"
          aria-labelledby="qm-qibla-path-dialog-title"
          dir={i18n.dir()}
          onClick={(event) => {
            // Ein Klick auf die abgedunkelte Fläche schließt den Dialog.
            // Klicks innerhalb des eigentlichen Inhalts bleiben ohne Wirkung.
            if (event.target === event.currentTarget) {
              event.currentTarget.close()
            }
          }}
        >
          <div className="qm-qibla-path-dialog-content">
            <button
              type="button"
              className="qm-qibla-path-dialog-close"
              onClick={() => qiblaPathDialogRef.current?.close()}
              aria-label={t('qiblaPathInfoClose')}
            >
              ×
            </button>

            {/* Das Symbol unterstreicht den Bezug zur Erdoberfläche. */}
            <span className="qm-qibla-path-dialog-icon" aria-hidden="true">
              🌍
            </span>

            <h2 id="qm-qibla-path-dialog-title">{t('qiblaPathInfoTitle')}</h2>

            <p>{t('qiblaPathExplanation')}</p>
          </div>
        </dialog>
      </div>
    </div>
  )
}

export default MapPage
