import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'

import './HelpPage.css'
import './CompassPage.css'
import { clearManualLocation, readManualLocation } from '../utils/location/manualLocation'
import { readSessionLocation, saveSessionLocation } from '../utils/location/detectedLocationSession'
import { calculateQiblaBearing } from '../utils/qibla/qiblaBearing'
import { getUserLocation } from '../utils/location/getUserLocation'
import DetectLocationButton from '../components/location/DetectLocationButton'
import QuickToolNavigation from '../components/navigation/QuickToolNavigation'
import { Capacitor } from '@capacitor/core'
import { isCompassLevel } from '../utils/sensors/sensorPosture'
import QiblaDirectionHelp from '../components/navigation/QiblaDirectionHelp'

// Die Kompassseite wird in den nächsten Schritten erweitert.
export default function CompassPage() {
  const { t, i18n } = useTranslation()

  // Gibt an, ob wir die Überwachung des Bewegungssensors gestartet haben.
  // Anfangs ist die Überwachung ausgeschaltet.
  const [sensorEnabled, setSensorEnabled] = useState(false)

  // Speichert die tatsächliche Ausrichtung des Smartphones.
  // null bedeutet, dass noch keine verwendbare Messung vorliegt.
  const [sensorHeading, setSensorHeading] = useState<number | null>(null)

  // Merkt sich, ob das Smartphone stark geneigt gehalten wird.
  // false bedeutet, dass bisher keine starke Neigung erkannt wurde.
  const [isPhoneTilted, setIsPhoneTilted] = useState(false)

  // Android startet die verfügbaren WebView-Sensoren automatisch.
  // Andere Browser behalten ihre notwendige Berechtigungsprüfung.
  const needsSensorPermission =
    Capacitor.getPlatform() !== 'android' &&
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (
      DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<'granted' | 'denied'>
      }
    ).requestPermission === 'function'

  // Bestimmt den anfänglichen Sensorstatus beim Öffnen der Kompassseite.
  // Die Funktion wird für den Initialwert des States verwendet.
  const [sensorMessage, setSensorMessage] = useState(() => {
    // Ohne sichere Verbindung oder Sensorunterstützung
    // können wir keine Gerätedrehung auslesen.
    if (!window.isSecureContext || !('DeviceOrientationEvent' in window)) {
      return 'compassPage.sensorUnavailable'
    }

    // Manche Browser verlangen zuerst eine Benutzerfreigabe.
    if (needsSensorPermission) {
      return 'compassPage.sensorPermission'
    }

    // Ansonsten warten wir auf die erste gültige Sensormessung.
    return 'compassPage.sensorWaiting'
  })

  // Startet die Sensorüberwachung automatisch beim Öffnen der Kompassseite.
  useEffect(() => {
    // Ohne HTTPS oder Sensorunterstützung starten wir keine Listener.
    // Der passende Hinweis wurde bereits im Anfangsstatus festgelegt.
    if (!window.isSecureContext || !('DeviceOrientationEvent' in window)) {
      return
    }

    // Browser mit Berechtigungspflicht warten auf den Benutzer.
    // Die Freigabe erfolgt über unseren vorhandenen Button.
    if (needsSensorPermission && !sensorEnabled) {
      return
    }

    // Merkt sich, ob mindestens eine gültige Sensormessung angekommen ist.
    // Anfangs haben wir noch keine verwendbaren Daten erhalten.
    let hasReceivedValidHeading = false

    // Diese Funktion empfängt die Orientierung des Smartphones.
    function handleOrientation(event: DeviceOrientationEvent) {
      // Relative Daten reichen für die Qibla nicht aus.
      // Auch fehlende oder ungültige Winkel werden ignoriert.
      if (!event.absolute || event.alpha === null || !Number.isFinite(event.alpha)) {
        return
      }

      // Ohne vollständige Neigungsdaten zeigen wir
      // keine vermeintlich genaue Kompassrichtung.
      if (
        event.beta === null ||
        event.gamma === null ||
        !Number.isFinite(event.beta) ||
        !Number.isFinite(event.gamma)
      ) {
        setIsPhoneTilted(true)
        setSensorHeading(null)
        return
      }

      // Eine vollständige absolute Sensormessung ist angekommen.
      hasReceivedValidHeading = true

      // Nur maximal 5° Gesamtabweichung von horizontal zulassen.
      const tilted = !isCompassLevel(event.beta, event.gamma)
      setIsPhoneTilted(tilted)

      if (tilted) {
        // Bei falscher Haltung die bisherige Richtung verwerfen.
        // Nach dem erneuten Waagerechthalten beginnt die
        // Glättung mit einer frischen Messung.
        setSensorHeading(null)
        return
      }

      // Nur bei gültiger Haltung eine Nordrichtung berechnen.
      const heading = (360 - event.alpha) % 360

      // Glättet die Sensordaten, damit die Kompassscheibe ruhiger reagiert.
      setSensorHeading((previousHeading) => {
        // Die erste Messung übernehmen wir direkt.
        if (previousHeading === null) {
          return heading
        }

        // Berechnet den kürzesten Winkel zwischen der letzten
        // angezeigten Richtung und der neuen Sensormessung.
        const difference = ((heading - previousHeading + 540) % 360) - 180

        // Übernimmt 20 Prozent der Winkeländerung.
        // Kleine Schwankungen wirken dadurch weniger stark.
        const smoothedHeading = previousHeading + difference * 0.2

        // Hält den Winkel im Bereich von 0 bis unter 360 Grad.
        return (smoothedHeading + 360) % 360
      })
    }

    // Wartet höchstens fünf Sekunden auf die erste gültige Sensormessung.
    const noDataTimeout = window.setTimeout(() => {
      // Wenn bis dahin keine Messung angekommen ist,
      // ersetzen wir die Wartemeldung durch einen hilfreichen Hinweis.
      if (!hasReceivedValidHeading) {
        setSensorMessage('compassPage.sensorNoData')
      }
    }, 5000)

    // Empfängt absolute Orientierung auf unterstützten Android-Browsern.
    window.addEventListener('deviceorientationabsolute', handleOrientation)

    // Manche Browser liefern absolute Daten über dieses Ereignis.
    // Die Prüfung von event.absolute bleibt deshalb notwendig.
    window.addEventListener('deviceorientation', handleOrientation)

    // Entfernt beide Listener beim Verlassen der Kompassseite.
    return () => {
      // Entfernt den Timer, wenn die Kompassseite verlassen wird.
      // So verhindern wir unnötige spätere Statusänderungen.
      window.clearTimeout(noDataTimeout)
      window.removeEventListener('deviceorientationabsolute', handleOrientation)
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [sensorEnabled, needsSensorPermission])

  // Der manuelle Standort kann nach einer GPS-Messung geändert werden.
  const [manualLocation, setManualLocation] = useState(readManualLocation)

  // Der ermittelte GPS-Standort aktualisiert die Kompassanzeige.
  const [detectedLocation, setDetectedLocation] = useState(readSessionLocation)

  // Ladezustand und Fehlermeldung der Standortermittlung.
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Ein manuell gewählter Standort hat Vorrang vor GPS.
  const activeLocation = manualLocation ?? detectedLocation

  // Ohne echten Standort zeigen wir keine scheinbar genaue Qibla-Richtung.
  const qiblaBearing = activeLocation ? calculateQiblaBearing(activeLocation) : null

  // Nur mit gültigen Sensordaten und ohne starke Neigung
  // verwenden wir die gemessene Richtung für den Kompass.
  const hasHeading = sensorHeading !== null && !isPhoneTilted

  // Ohne verlässlichen Winkel bleibt die Kompassscheibe neutral.
  const deviceHeading = hasHeading && sensorHeading !== null ? sensorHeading : 0

  // Berechnet die Kaaba-Position nur mit einem verfügbaren Gerätewinkel.
  // So zeigen wir in der fertigen App keine erfundene Ausrichtung an.
  const needleAngle =
    qiblaBearing === null || !hasHeading ? null : (qiblaBearing - deviceHeading + 360) % 360

  // Berechnet den kürzesten Drehweg zur Qibla.
  // Positiv bedeutet rechts, negativ bedeutet links.
  const turnAngle =
    needleAngle === null ? null : needleAngle > 180 ? needleAngle - 360 : needleAngle

  // Bestätigt die Qibla-Richtung innerhalb von 5°.
  const isQiblaAligned = turnAngle !== null && Math.abs(turnAngle) <= 5

  // Ermittelt den Standort direkt auf der Kompassseite.
  async function handleDetectLocation() {
    setLocationError(null)
    setIsLocating(true)

    try {
      // Ruft die vorhandene Browser-GPS-Funktion auf.
      const location = await getUserLocation()

      // Speichert die GPS-Position für die aktuelle Browsersitzung.
      saveSessionLocation(location)
      clearManualLocation()

      // Aktualisiert den Standort und damit die Qibla-Berechnung.
      setDetectedLocation(location)
      setManualLocation(null)
    } catch (error) {
      // Ermittelt den Übersetzungsschlüssel des GPS-Fehlers.
      const errorKey = error instanceof Error ? error.message : 'locationErrors.unexpected'

      // Wenn nur die erneute GPS-Abfrage zu lange dauert,
      // behalten wir die bereits ermittelte GPS-Position bei.
      if (
        errorKey === 'locationErrors.timeout' &&
        detectedLocation !== null &&
        manualLocation === null
      ) {
        setLocationError('locationErrors.previousLocationKept')
      } else {
        // Andere Fehler werden weiterhin normal angezeigt.
        setLocationError(errorKey)
      }
    } finally {
      // Der Button wird nach Erfolg oder Fehler wieder freigegeben.
      setIsLocating(false)
    }
  }

  // Startet die Sensorüberwachung nach einem Button-Klick.
  async function handleStartSensor() {
    // Prüft, ob die Webseite in einem sicheren Kontext läuft
    // und ob der Browser DeviceOrientationEvent unterstützt.
    if (!window.isSecureContext || !('DeviceOrientationEvent' in window)) {
      // Zeigt einen Hinweis, falls eine Voraussetzung fehlt.
      setSensorMessage('compassPage.sensorUnavailable')

      // Beendet die Funktion, da wir den Sensor nicht starten können.
      return
    }

    try {
      // Manche Browser bieten zusätzlich requestPermission() an.
      // Die Typ-Erweiterung macht diese optionale Methode für TypeScript bekannt.
      const orientationApi = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        // true fordert ausdrücklich auch absolute Orientierung an.
        requestPermission?: (absolute?: boolean) => Promise<'granted' | 'denied'>
      }

      // Prüft, ob der Browser eine ausdrückliche Sensorfreigabe verlangt.
      if (orientationApi.requestPermission) {
        // Fordert bei Bedarf auch Zugriff auf das Magnetometer an.
        const permission = await orientationApi.requestPermission(true)

        // Wenn die Berechtigung verweigert wurde, starten wir nichts.
        if (permission !== 'granted') {
          setSensorMessage('compassPage.sensorDenied')
          return
        }
      }

      // Informiert den Benutzer, dass wir auf Daten warten.
      setSensorMessage('compassPage.sensorWaiting')

      // Aktiviert unseren useEffect und damit die Sensor-Listener.
      setSensorEnabled(true)
    } catch {
      // Behandelt Fehler bei der Berechtigungsanfrage.
      setSensorMessage('compassPage.sensorStartError')
    }
  }

  return (
    <section className="qm-help qm-compass-page" aria-labelledby="qm-compass-title">
      <h2 id="qm-compass-title">{t('navigation.compass')}</h2>

      {/* Gemeinsamer GPS-Button für Karte und Kompass. */}
      <div className="qm-compass__location">
        <DetectLocationButton onDetect={handleDetectLocation} isLoading={isLocating} />

        {locationError && (
          <p
            // Ein fehlgeschlagener Aktualisierungsversuch ist kein
            // vollständiger Standortverlust, wenn noch GPS-Daten vorliegen.
            className={
              locationError === 'locationErrors.previousLocationKept' ? 'qm-detail' : 'qm-alert'
            }
            role={locationError === 'locationErrors.previousLocationKept' ? 'status' : 'alert'}
          >
            {t(locationError)}
          </p>
        )}
      </div>
      {/* Zeigt die vom Browser geschätzte GPS-Genauigkeit. */}
      {!manualLocation && detectedLocation && (
        <div className="qm-compass__accuracy">
          <p className="qm-detail">
            {t('locationAccuracy', {
              meters: Math.round(detectedLocation.accuracy).toLocaleString(i18n.language),
            })}
          </p>

          {/* Warnt bei einer besonders ungenauen Standortermittlung. */}
          {detectedLocation.accuracy > 1000 && (
            <p className="qm-alert" role="alert">
              {t('lowAccuracyWarning')}
            </p>
          )}
        </div>
      )}

      {/* Die Kompassscheibe wird später mit Sensordaten verbunden. */}
      <svg className="qm-compass__dial" viewBox="0 0 300 300" aria-hidden="true">
        {/* Äußerer Kreis und innerer Orientierungsring. */}
        <circle className="qm-compass__ring" cx="150" cy="150" r="118" />
        <circle className="qm-compass__inner-ring" cx="150" cy="150" r="97" />

        {/* Die Himmelsrichtungen bewegen sich entgegen der Handydrehung. */}
        <g transform={`rotate(${-deviceHeading} 150 150)`}>
          <g className="qm-compass__tick">
            <line x1="150" y1="33" x2="150" y2="45" />
            <line x1="267" y1="150" x2="255" y2="150" />
            <line x1="150" y1="267" x2="150" y2="255" />
            <line x1="33" y1="150" x2="45" y2="150" />
          </g>

          {/* Die Himmelsrichtungen werden übersetzt und bleiben aufrecht. */}
          <g className="qm-compass__direction">
            <text
              className="qm-compass__north"
              x="150"
              y="68"
              transform={`rotate(${deviceHeading} 150 68)`}
            >
              {t('compassPage.north')}
            </text>

            <text x="234" y="150" transform={`rotate(${deviceHeading} 234 150)`}>
              {t('compassPage.east')}
            </text>

            <text x="150" y="234" transform={`rotate(${deviceHeading} 150 234)`}>
              {t('compassPage.south')}
            </text>

            <text x="66" y="150" transform={`rotate(${deviceHeading} 66 150)`}>
              {t('compassPage.west')}
            </text>
          </g>
        </g>
        {/* Die Kaaba bewegt sich relativ zur Smartphone-Ausrichtung. */}
        {needleAngle !== null && (
          <g transform={`rotate(${needleAngle} 150 150)`}>
            <rect className="qm-compass__kaaba" x="140" y="80" width="20" height="20" rx="3" />
            <line className="qm-compass__kaaba-band" x1="141" y1="87" x2="159" y2="87" />
          </g>
        )}
        {/* Zeigt die Nadel nur bei verfügbarer Geräteausrichtung. */}
        {needleAngle !== null && (
          <g className="qm-compass__needle">
            <path className="qm-compass__needle-front" d="M150 104 L168 154 L150 140 L132 154 Z" />
            <path className="qm-compass__needle-back" d="M132 154 L150 140 L168 154 L150 192 Z" />
            <circle className="qm-compass__needle-center" cx="150" cy="150" r="9" />
          </g>
        )}
      </svg>

      {/* Zeigt bei falscher Haltung eine deutliche Warnung. */}
      {isPhoneTilted && (
        <div className="qm-compass__tilt-warning" role="alert">
          <div className="qm-compass__tilt-alert">
            <span className="qm-compass__tilt-alert-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path d="M12 5v10" />
                <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
              </svg>
            </span>

            <p>{t('compassPage.tiltWarning')}</p>
          </div>
        </div>
      )}

      {/* Zeigt die bestätigte Qibla-Richtung in der Bildschirmmitte. */}
      {!isPhoneTilted && isQiblaAligned && (
        <div className="qm-compass__tilt-warning" role="status" aria-live="polite">
          <div className="qm-compass__tilt-alert qm-compass__tilt-alert--success">
            <span
              className="qm-compass__tilt-alert-icon qm-compass__tilt-alert-icon--success"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12.5 9.5 17 19 7" />
              </svg>
            </span>

            <p>{t('compassPage.aligned')}</p>
          </div>
        </div>
      )}

      {/* Hinweise zu Messfehlern und Kompasskalibrierung. */}
      <QiblaDirectionHelp />

      {/* Zeigt unter dem Kompass nur Standort- und Drehanweisungen an. */}
      {(hasHeading || !activeLocation) && !isQiblaAligned && (
        <p className="qm-compass__guidance">
          {turnAngle === null ? (
            t('compassPage.selectLocation')
          ) : (
            <>
              {t(turnAngle > 0 ? 'compassPage.turnRight' : 'compassPage.turnLeft')}{' '}
              <bdi dir="ltr">{Math.round(Math.abs(turnAngle))}°</bdi>
            </>
          )}
        </p>
      )}

      {/* Zeigt den Sensorstatus und gegebenenfalls die notwendige Freigabe. */}
      <div className="qm-compass__location">
        {/* Manche Browser verlangen eine ausdrückliche Benutzerfreigabe.
      Nur in diesem Fall zeigen wir einen zusätzlichen Button. */}
        {needsSensorPermission && !sensorEnabled && (
          <button type="button" className="qm-primary-button" onClick={handleStartSensor}>
            {t('compassPage.enableSensor')}
          </button>
        )}

        {/* Zeigt einen verständlichen Status statt technischer Rohdaten.
      Die erfolgreiche Messung hat Vorrang vor älteren Statusmeldungen. */}
        <p className="qm-detail qm-compass__sensor-status" role="status">
          {sensorHeading !== null ? t('compassPage.sensorActive') : t(sensorMessage)}
        </p>
      </div>
      {/* Die Navigation ist unabhängig von der Kompassausrichtung
      und bleibt deshalb immer sichtbar. */}
      <QuickToolNavigation currentTool="compass" />
    </section>
  )
}
