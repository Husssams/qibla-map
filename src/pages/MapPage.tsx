import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import QiblaMapView from '../components/map/QiblaMapView'
import { PlaceSearch } from '../components/search/PlaceSearch'
import { KAABA_COORDINATES } from '../constants/kaaba'
import { applyTheme, initialTheme, type Theme } from '../theme'
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

import '../App.css'

// Fallback, solange weder ein manueller noch ein GPS-Standort vorliegt.
const testLocation: Coordinates = {
  latitude: 33.439073,
  longitude: 36.078122,
}

function MapPage() {
  const { t, i18n } = useTranslation()

  // Suchtexte stammen aus dem bestehenden i18next-├£bersetzungssystem.
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

  // GPS-Daten werden nur f├╝r die aktuelle Browsersitzung gespeichert.
  const [detectedLocation, setDetectedLocation] = useState<UserLocation | null>(readSessionLocation)

  // Unterscheidet wiederhergestellte GPS-Daten von einer neuen Messung.
  const [gpsFromStorage, setGpsFromStorage] = useState(true)

  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  // Die geod├ñtische Linie ist optional und beim ersten Laden ausgeschaltet.
  // Die Einstellung bleibt unabh├ñngig von GPS, Standortsuche und Kartengr├Â├ƒe.
  const [isQiblaPathVisible, setIsQiblaPathVisible] = useState(false)

  // ├£ber die Referenz ├Âffnen und schlie├ƒen wir den nativen Dialog.
  // Ein zus├ñtzlicher React-State ist daf├╝r nicht erforderlich.
  const qiblaPathDialogRef = useRef<HTMLDialogElement | null>(null)

  // Ein ausdr├╝cklicher Auftrag, die Karte auf einen Ort zu zentrieren.
  const [focusTarget, setFocusTarget] = useState<Coordinates | null>(null)

  // Manuell gew├ñhlte Standorte bleiben nach einem Seitenneustart erhalten.
  const [manualLocation, setManualLocation] = useState<Coordinates | null>(readManualLocation)

  // Manuelle Auswahl hat Vorrang vor GPS und dem Teststandort.
  const activeLocation: Coordinates = manualLocation ?? detectedLocation ?? testLocation
  const qiblaBearing = calculateQiblaBearing(activeLocation)

  // Sperrt das Scrollen der Hintergrundseite w├ñhrend der vergr├Â├ƒerten Kartenansicht.
  useEffect(() => {
    if (!isMapExpanded) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMapExpanded])

  // Escape schlie├ƒt die gro├ƒe Karte und zentriert sie auf den aktuellen Marker.
  useEffect(() => {
    if (!isMapExpanded) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return

      // Das Info-Fenster hat Vorrang: Escape soll zun├ñchst nur den Dialog schlie├ƒen,
      // nicht gleichzeitig die vergr├Â├ƒerte Kartenansicht verlassen.
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

  function handleThemeToggle() {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'

    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  // ├£bernimmt einen manuell ausgew├ñhlten Standort aus der Karte oder Ortssuche.
  function handleManualLocationChange(location: Coordinates) {
    // Normalisiert den L├ñngengrad auf den Bereich von -180 bis 180 Grad.
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

  // Beim Schlie├ƒen der gro├ƒen Karte wird der Marker wieder zentriert.
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

      // Eine neue GPS-Messung ersetzt einen zuvor manuell gew├ñhlten Standort.
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
            Ô£ª
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
              <option value="ar">Ïº┘äÏ╣Ï▒Ï¿┘èÏ®</option>
            </select>
          </div>

          <button
            type="button"
            className="theme-toggle"
            onClick={handleThemeToggle}
            aria-label={themeButtonLabel}
            title={themeButtonLabel}
          >
            {theme === 'light' ? '­ƒîÖ' : 'ÔÿÇ´©Å'}
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
              {activeLocation.latitude.toFixed(6)}┬░, {activeLocation.longitude.toFixed(6)}┬░
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
              <bdi dir="ltr">{qiblaBearing.toFixed(1)}┬░</bdi>
            </p>
          )}

          <div className="qm-result-divider" />

          <div className="qm-kaaba-info">
            <span>{t('kaaba')}</span>
            <bdi dir="ltr">
              {KAABA_COORDINATES.latitude}┬░, {KAABA_COORDINATES.longitude}┬░
            </bdi>
          </div>
        </section>

        {/* Kartenbereich mit normalem Anzeigemodus und vergr├Â├ƒertem Auswahlmodus. */}
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
      Die Bedienelemente liegen mit ihrem h├Âheren z-index dar├╝ber. */}
          {!isMapExpanded && <div className="qm-map-scroll-guard" aria-hidden="true" />}

          {/* Die vergr├Â├ƒerte Karte kann unabh├ñngig vom Info-Dialog geschlossen werden. */}
          {isMapExpanded && (
            <button
              type="button"
              className="qm-map-close-button"
              onClick={handleCloseExpandedMap}
              aria-label={t('closeMap')}
              title={t('closeMap')}
            >
              ├ù
            </button>
          )}

          {/* Alle Kartenbedienelemente verwenden den bestehenden React-State.
      Die Einstellung bleibt beim Vergr├Â├ƒern der Karte erhalten. */}
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
          Die l├ñngere Erkl├ñrung soll nicht dauerhaft Kartenfl├ñche verdecken. */}
              {isQiblaPathVisible && qiblaBearing !== null && (
                <button
                  type="button"
                  className="qm-map-info-button"
                  aria-haspopup="dialog"
                  aria-controls="qm-qibla-path-dialog"
                  onClick={() => qiblaPathDialogRef.current?.showModal()}
                >
                  <span aria-hidden="true">Ôôÿ</span>
                  <span>{t('qiblaPathInfoButton')}</span>
                </button>
              )}

              {/* Die Standortauswahl ist in der vergr├Â├ƒerten Karte bereits aktiv.
          Deshalb wird der zus├ñtzliche Auswahlbutton dort ausgeblendet. */}
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

          {/* Der native Dialog erscheint ├╝ber der Karte statt als dauerhafter Hinweis.
      Escape und die Fokusverwaltung ├╝bernimmt weitgehend der Browser. */}
          <dialog
            id="qm-qibla-path-dialog"
            ref={qiblaPathDialogRef}
            className="qm-qibla-path-dialog"
            aria-labelledby="qm-qibla-path-dialog-title"
            dir={i18n.dir()}
            onClick={(event) => {
              // Ein Klick auf die abgedunkelte Fl├ñche schlie├ƒt den Dialog.
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
                ├ù
              </button>

              {/* Das Symbol unterstreicht den Bezug zur Erdoberfl├ñche. */}
              <span className="qm-qibla-path-dialog-icon" aria-hidden="true">
                ­ƒîì
              </span>

              <h2 id="qm-qibla-path-dialog-title">{t('qiblaPathInfoTitle')}</h2>

              <p>{t('qiblaPathExplanation')}</p>
            </div>
          </dialog>
        </div>
      </div>
    </main>
  )
}

export default MapPage
