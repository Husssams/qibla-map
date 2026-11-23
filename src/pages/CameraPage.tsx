import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './CameraPage.css'
import { AppLink } from '../components/navigation/AppNavigationLinks'

import { getUserLocation, type UserLocation } from '../utils/location/getUserLocation'
import { calculateQiblaBearing } from '../utils/qibla/qiblaBearing'
import { calculateCameraHeading } from '../utils/ar/cameraHeading'
import { calculateQiblaTurnAngle } from '../utils/ar/qiblaTurnAngle'
import { INITIAL_QIBLA_CONFIRMATION, updateQiblaConfirmation } from '../utils/ar/qiblaConfirmation'
import QuickToolNavigation from '../components/navigation/QuickToolNavigation'
import { isCameraHeldUpright } from '../utils/sensors/sensorPosture'
import {
  pulseQiblaVibration,
  stopQiblaVibration,
  QIBLA_VIBRATION_INTERVAL_MS,
} from '../utils/haptics/qiblaHaptics'

import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

// Rohdaten der Orientierungssensoren für unsere AR-Diagnose.
type OrientationSample = {
  alpha: number
  beta: number
  gamma: number
  absolute: boolean
  screenAngle: number | null
}

// Unsere erste Kameraseite. Die AR-Richtungsanzeige kommt später.
export default function CameraPage() {
  const { t } = useTranslation()

  // Referenz auf das Videoelement, in dem das Kamerabild erscheint.
  const videoRef = useRef<HTMLVideoElement>(null)

  // Hier merken wir uns den aktiven Kamerastream.
  const streamRef = useRef<MediaStream | null>(null)

  // Verhindert, dass eine alte Kameraanfrage nach dem Verlassen
  // der Seite noch ein Kamerabild aktiviert.
  const requestIdRef = useRef(0)

  // Verhindert veraltete GPS-Ergebnisse nach dem Stoppen der Kamera.
  const locationRequestRef = useRef(0)

  const [status, setStatus] = useState<'idle' | 'starting' | 'active'>('idle')
  const [error, setError] = useState('')

  // Speichert ausschließlich den vom Smartphone ermittelten GPS-Standort.
  // Eine manuelle Kartenauswahl wird hier bewusst nicht verwendet.
  const [cameraLocation, setCameraLocation] = useState<UserLocation | null>(null)

  // Zeigt an, ob gerade eine GPS-Abfrage läuft.
  const [isLocating, setIsLocating] = useState(false)

  // Speichert einen übersetzbaren Fehler bei der Standortermittlung.
  const [locationError, setLocationError] = useState<string | null>(null)

  // Speichert die zuletzt empfangenen Sensorwerte.
  const [orientation, setOrientation] = useState<OrientationSample | null>(null)

  // Merkt sich, ob die Kamera lange genug zur Qibla zeigt.
  const [confirmation, setConfirmation] = useState(INITIAL_QIBLA_CONFIRMATION)

  // Speichert ein vorübergehendes Standbild ausschließlich im Arbeitsspeicher.
  // null bedeutet, dass die Livekamera angezeigt werden soll.
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null)

  // Meldet, wenn das Gerät längere Zeit keine gültigen Werte liefert.
  const [sensorNoData, setSensorNoData] = useState(false)

  // Berechnet die Qibla-Richtung aus dem echten GPS-Standort.
  // Ohne GPS-Standort gibt es bewusst keinen Qibla-Winkel.
  // Die Berechnung verwendet geografisch Nord, nicht magnetisch Nord.
  const qiblaBearing = cameraLocation ? calculateQiblaBearing(cameraLocation) : null

  // Nur bei nahezu exakt aufrechter Hochformathaltung
  // darf die Kamera die Qibla-Richtung bestätigen.
  const isCameraUpright = orientation !== null && isCameraHeldUpright(orientation.beta)

  // Berechnet die horizontale Blickrichtung der Rückkamera.
  // Nur absolute Sensordaten liefern eine feste Nordreferenz.
  // Das Ergebnis ist noch nicht gegen geografisch Nord geprüft.
  const cameraHeading = orientation ? calculateCameraHeading(orientation) : null

  // Erst wenn GPS, Kamerablickrichtung und eine geeignete Haltung
  // vorhanden sind, berechnen wir den Unterschied zur Qibla.
  const turnAngle =
    qiblaBearing !== null && cameraHeading !== null && isCameraUpright
      ? calculateQiblaTurnAngle(qiblaBearing, cameraHeading)
      : null

  // Die bestätigte Kaaba bleibt sichtbar, bis wir mindestens
  // 20° von der Qibla wegdrehen.
  const showKaabaMarker =
    isCameraUpright && (confirmation.confirmed || (turnAngle !== null && Math.abs(turnAngle) <= 12))

  // Während der Bestätigung bleibt die Kaaba fest in der Mitte,
  // auch wenn der Sensor um wenige Grad schwankt.
  const kaabaOffsetPercent = confirmation.confirmed
    ? 0
    : turnAngle === null
      ? 0
      : (turnAngle / 5) * 30

  const isKaabaAligned =
    isCameraUpright && (confirmation.confirmed || (turnAngle !== null && Math.abs(turnAngle) <= 3))

  // Die Vibration ist nur während eines bestätigten Standbildes aktiv,
  // solange die aktuelle Kamerarichtung höchstens 2° von der Qibla abweicht.
  const shouldVibrate =
    status === 'active' &&
    frozenFrame !== null &&
    confirmation.confirmed &&
    isCameraUpright &&
    turnAngle !== null &&
    Math.abs(turnAngle) <= 2

  // Stoppt einen Kamerastream und gibt die Kamera wieder frei.
  const stopCamera = useCallback(() => {
    // Eine laufende GPS-Anfrage wird für diese Kamerasitzung ungültig.
    locationRequestRef.current += 1
    requestIdRef.current += 1

    setCameraLocation(null)
    setLocationError(null)
    setIsLocating(false)
    // Die nächste Kamerasitzung soll keine alten Sensordaten übernehmen.
    setOrientation(null)
    setSensorNoData(false)

    // Eine neue Kamerasitzung beginnt ohne alte Bestätigung oder Standbild.
    setConfirmation(INITIAL_QIBLA_CONFIRMATION)
    setFrozenFrame(null)
    // Beim manuellen Stoppen die Vibration sofort abbrechen.
    stopQiblaVibration()

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setStatus('idle')
    setError('')
  }, [])

  // Gibt die Kamera frei, wenn die Android-App in den Hintergrund geht.
  useEffect(() => {
    // Die Webversion behält ihr bisheriges Verhalten.
    if (Capacitor.getPlatform() !== 'android') {
      return
    }

    let cancelled = false

    // Android meldet, ob Qibla im Vordergrund aktiv ist.
    const registration = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (cancelled) return

      if (!isActive) {
        // Stoppt Kamera, Vibration und ungültige Sensordaten.
        stopCamera()
      }
    })

    void registration.catch((error: unknown) => {
      console.error('Android lifecycle listener failed:', error)
    })

    // Listener beim Verlassen der Kameraseite entfernen.
    return () => {
      cancelled = true

      void registration
        .then((listener) => listener.remove())
        .catch((error: unknown) => {
          console.error('Android lifecycle cleanup failed:', error)
        })
    }
  }, [stopCamera])

  const startCamera = useCallback(async () => {
    // Kamera-Zugriff funktioniert nur in unterstützten,
    // sicheren Browserumgebungen (HTTPS oder localhost).
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('cameraPage.unavailable')
      return
    }

    setStatus('starting')
    setError('')

    const requestId = ++requestIdRef.current

    try {
      // Wir wünschen uns die rückseitige Kamera.
      // "ideal" erlaubt eine andere Kamera, falls nötig.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      })

      // Eine inzwischen ungültige Anfrage sofort freigeben.
      if (requestId !== requestIdRef.current || !videoRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream
      videoRef.current.srcObject = stream

      await videoRef.current.play()

      if (requestId === requestIdRef.current) {
        setStatus('active')

        // Das alte Standbild erst entfernen, wenn die Kamera
        // tatsächlich wieder erfolgreich gestartet wurde.
        setFrozenFrame(null)
      }
    } catch (cameraError) {
      if (requestId !== requestIdRef.current) return

      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null

      if (videoRef.current) videoRef.current.srcObject = null

      // Bei einem Kamerafehler alte Bestätigungen entfernen.
      setConfirmation(INITIAL_QIBLA_CONFIRMATION)
      setFrozenFrame(null)
      setStatus('idle')

      const name = cameraError instanceof Error ? cameraError.name : ''

      // Browserfehler werden als Schlüssel gespeichert.
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setError('cameraPage.permissionDenied')
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setError('cameraPage.noCamera')
      } else {
        setError('cameraPage.startError')
      }
    }
  }, [])

  // Ermittelt die tatsächliche Geräteposition für die AR-Kamera.
  async function detectCameraLocation() {
    if (isLocating) return

    setIsLocating(true)
    setLocationError(null)

    const requestId = ++locationRequestRef.current

    try {
      const location = await getUserLocation()

      // Ein Ergebnis nach dem Stoppen der Kamera ignorieren.
      if (requestId !== locationRequestRef.current) return

      setCameraLocation(location)
    } catch (locationFailure) {
      if (requestId !== locationRequestRef.current) return

      // getUserLocation liefert bereits unsere Übersetzungsschlüssel.
      setLocationError(
        locationFailure instanceof Error ? locationFailure.message : 'locationErrors.unexpected',
      )
    } finally {
      if (requestId === locationRequestRef.current) {
        setIsLocating(false)
      }
    }
  }

  // Die Kamera muss auch beim Wechsel zur Karte gestoppt werden.
  useEffect(() => {
    return () => {
      // Auch ausstehende GPS-Ergebnisse nach dem Seitenwechsel ignorieren.
      locationRequestRef.current += 1
      requestIdRef.current += 1
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      // Auch beim Seitenwechsel keine Vibration zurücklassen.
      stopQiblaVibration()
    }
  }, [])

  // Während die Kamera im Vollbild läuft, darf die Webseite
  // im Hintergrund nicht nach oben oder unten scrollen.
  useEffect(() => {
    if (status === 'idle') return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Beim Stoppen oder Verlassen der Kameraseite
    // stellen wir das ursprüngliche Scrollverhalten wieder her.
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [status])

  // Liest die Geräteorientierung nur bei eingeschalteter Kamera.
  useEffect(() => {
    if (status !== 'active') return

    let hasReceivedData = false
    let hasAbsoluteData = false
    let lastUpdate = 0

    function handleOrientation(event: DeviceOrientationEvent) {
      const { alpha, beta, gamma } = event

      // Unvollständige Sensorwerte können wir nicht auswerten.
      if (alpha === null || beta === null || gamma === null) return

      // Sobald absolute Daten vorhanden sind, verwenden wir
      // keine relativen Messungen mehr als Ersatz.
      if (hasAbsoluteData && !event.absolute) return
      if (event.absolute) hasAbsoluteData = true

      hasReceivedData = true

      // React muss nicht bei jedem Sensorereignis neu rendern.
      // Etwa sechs Aktualisierungen pro Sekunde reichen zur Diagnose.
      const now = performance.now()
      if (now - lastUpdate < 150) return
      lastUpdate = now

      setOrientation({
        alpha,
        beta,
        gamma,
        absolute: event.absolute,
        screenAngle: screen.orientation?.angle ?? null,
      })

      setSensorNoData(false)
    }

    // Manche Android-Browser liefern ein separates Ereignis
    // für absolute Orientierung.
    window.addEventListener('deviceorientationabsolute', handleOrientation)
    window.addEventListener('deviceorientation', handleOrientation)

    // Eine fehlende Antwort soll nicht unendlich als Laden erscheinen.
    const timeoutId = window.setTimeout(() => {
      if (!hasReceivedData) setSensorNoData(true)
    }, 5000)

    // Nach dem Ausschalten werden beide Listener entfernt.
    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('deviceorientationabsolute', handleOrientation)
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [status])

  // Prüft ungefähr zehnmal pro Sekunde, ob die Kamera
  // innerhalb von ±2° zur Qibla ausgerichtet ist.
  //
  // Auch bei einem Standbild bleibt status === 'active',
  // damit die Orientierungssensoren weiterlaufen.
  useEffect(() => {
    if (status !== 'active') return

    const intervalId = window.setInterval(() => {
      setConfirmation((previous) => updateQiblaConfirmation(previous, turnAngle, isCameraUpright))
    }, 100)

    return () => window.clearInterval(intervalId)
  }, [status, turnAngle, isCameraUpright])

  // Friert die Kamera genau einmal ein, sobald die Ausrichtung
  // innerhalb von ±2° bestätigt wurde.
  useEffect(() => {
    if (status !== 'active' || !confirmation.confirmed || frozenFrame !== null) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      const video = videoRef.current

      // Ohne vollständiges Videobild darf die Kamera nicht gestoppt werden.
      if (!video || !streamRef.current || !video.videoWidth || !video.videoHeight) {
        setConfirmation(INITIAL_QIBLA_CONFIRMATION)
        return
      }

      const canvas = document.createElement('canvas')

      // Begrenzte Bildgröße hält den Speicherverbrauch auf Smartphones niedrig.
      const scale = Math.min(1, 960 / video.videoWidth)
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)

      const context = canvas.getContext('2d')

      if (!context) {
        setConfirmation(INITIAL_QIBLA_CONFIRMATION)
        return
      }

      try {
        // Kopiert ausschließlich den aktuellen Kameraframe.
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Das Standbild wird nur im React-Zustand gehalten.
        setFrozenFrame(canvas.toDataURL('image/jpeg', 0.8))

        // Gibt die Hardwarekamera frei. GPS und Sensoren bleiben aktiv.
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        video.srcObject = null
      } catch {
        // Bei einem Aufnahmefehler läuft die Kamera weiter.
        setConfirmation(INITIAL_QIBLA_CONFIRMATION)
      }
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [status, confirmation.confirmed, frozenFrame])

  // Sobald die Bestätigung wegen mindestens 20° Abweichung endet,
  // starten wir automatisch die Kamera erneut.
  useEffect(() => {
    if (status !== 'active' || confirmation.confirmed || frozenFrame === null) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      void startCamera()
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [status, confirmation.confirmed, frozenFrame, startCamera])

  // Wiederholt kurze Vibrationsabschnitte, solange die Kamera
  // innerhalb von ±2° zur Qibla zeigt.
  useEffect(() => {
    // Beim Verlassen des gültigen Bereichs sofort abbrechen.
    if (!shouldVibrate) {
      stopQiblaVibration()
      return
    }

    const vibrateOnce = () => {
      if (document.visibilityState === 'visible') {
        // Kurze Abschnitte statt einer langen 10-Sekunden-Vibration.
        pulseQiblaVibration()
      }
    }

    // Sofort beim Erreichen der Qibla beginnen.
    vibrateOnce()

    // Android erhält kurze, getrennte Vibrationsimpulse.
    // Der Browser behält sein bisheriges Intervall.
    const intervalId = window.setInterval(vibrateOnce, QIBLA_VIBRATION_INTERVAL_MS)

    const stopVibration = () => {
      stopQiblaVibration()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopVibration()
      } else {
        vibrateOnce()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', stopVibration)

    // Beim Wegdrehen oder Verlassen der Kamera alles stoppen.
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', stopVibration)
      stopVibration()
    }
  }, [shouldVibrate])

  return (
    <section className={`qm-camera${status !== 'idle' ? ' qm-camera--fullscreen' : ''}`}>
      <h2>{t('navigation.arCamera')}</h2>

      <p className="qm-camera__description">{t('cameraPage.intro')}</p>

      {/* Die Vorschau erhält einen eigenen Container.
        So ist der Kamerabereich auch im ausgeschalteten Zustand sichtbar. */}
      <div className="qm-camera__preview">
        <video ref={videoRef} autoPlay playsInline muted className="qm-camera__video" />

        {/* Das Standbild liegt über dem zuletzt angezeigten Videoframe.
        Die Kaaba bleibt als separates Overlay darüber sichtbar. */}
        {frozenFrame && (
          <img src={frozenFrame} alt="" aria-hidden="true" className="qm-camera__frozen-frame" />
        )}

        {/* Das Kaaba-Bild bleibt während der aktiven GPS-Kamerasitzung geladen.
        Seine Sichtbarkeit wird unabhängig davon gesteuert. */}
        {status === 'active' && cameraLocation !== null && (
          <div className="qm-camera__kaaba-overlay" aria-hidden="true">
            <div
              className={`qm-camera__kaaba-marker${
                isKaabaAligned ? ' qm-camera__kaaba-marker--aligned' : ''
              }`}
              style={{ left: `calc(50% + ${kaabaOffsetPercent}%)` }}

              // Bestimmt, ob die Kaaba sichtbar sein soll.
              // Außerhalb der Qibla-Richtung wird sie ausgeblendet.
              data-visible={showKaabaMarker ? 'true' : 'false'}
            >
              {/* Freigestelltes Kaaba-Bild als sensorbasierter AR-Richtungsmarker. */}
              <img
                src="/images/kaaba-ar.webp"
                alt=""
                className="qm-camera__kaaba-photo"
                draggable={false}
              />
            </div>
          </div>
        )}

        {/* Der Pfeil zeigt die benötigte Drehrichtung.
        Er erscheint nur während der Livekamera und bei mehr als 5° Abweichung.
        Während des Standbildes bleibt er ausgeblendet. */}
        {status === 'active' &&
          frozenFrame === null &&
          turnAngle !== null &&
          Math.abs(turnAngle) > 5 && (
            <div
              className={`qm-camera__turn-arrow ${
                turnAngle > 0 ? 'qm-camera__turn-arrow--right' : 'qm-camera__turn-arrow--left'
              }`}
              aria-hidden="true"
              dir="ltr"
            >
              {/* SVG statt Schriftzeichen, damit der Pfeil exakt mittig sitzt. */}
              <svg
                width="42"
                height="42"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {turnAngle > 0 ? (
                  // Pfeil nach rechts
                  <path d="M4 12h16m-7-7 7 7-7 7" />
                ) : (
                  // Pfeil nach links
                  <path d="M20 12H4m7-7-7 7 7 7" />
                )}
              </svg>
            </div>
          )}
      </div>

      {/* Der Button zeigt je nach Kamerastatus den passenden Text. */}
      <div className="qm-camera__controls">
        {status === 'active' ? (
          <button type="button" className="qm-camera__button" onClick={stopCamera}>
            {t('cameraPage.stop')}
          </button>
        ) : (
          <button
            type="button"
            className="qm-camera__button"
            disabled={status === 'starting'}
            onClick={() => void startCamera()}
          >
            {t(status === 'starting' ? 'cameraPage.starting' : 'cameraPage.start')}
          </button>
        )}

        {/* GPS nur anbieten, solange noch kein Standort ermittelt wurde.
        Nach einem Fehler bleibt der Button zum erneuten Versuch sichtbar. */}
        {status === 'active' && cameraLocation === null && (
          <button
            type="button"
            className="qm-camera__button"
            disabled={isLocating}
            onClick={() => void detectCameraLocation()}
          >
            {t(isLocating ? 'cameraPage.locating' : 'cameraPage.detectLocation')}
          </button>
        )}
      </div>

      {/* Navigation nur anzeigen, solange die Kamera ausgeschaltet ist.
    Im Kameravollbild bleiben die zusätzlichen Buttons verborgen. */}
      {status === 'idle' && <QuickToolNavigation currentTool="camera" />}

      {/* Zeigt GPS-Genauigkeit und geografische Qibla-Richtung.
    Ohne gültigen GPS-Standort wird kein Winkel angezeigt. */}
      {status === 'active' && (cameraLocation || locationError) && (
        <div className="qm-camera__location" role="status">
          {locationError ? (
            <p>{t(locationError)}</p>
          ) : cameraLocation ? (
            <>
              <p>
                {t('cameraPage.locationDetected', {
                  accuracy: Math.round(cameraLocation.accuracy),
                })}
              </p>

              {qiblaBearing === null ? (
                <p>{t('qiblaTooClose')}</p>
              ) : (
                <p className="qm-camera__bearing">
                  {t('cameraPage.bearingFromNorth')}:{' '}
                  <bdi dir="ltr">{Math.round(qiblaBearing)}°</bdi>
                </p>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Während des Standbildes keine wechselnden Sensorhinweise anzeigen. */}
      {status === 'active' && frozenFrame === null && (
        <div className="qm-camera__sensor">
          <p className="qm-camera__posture" role="status">
            {/* Zeigt erst die Haltung und anschließend die geschätzte
              Drehrichtung an. Bei fehlenden Daten bleibt die Warnung sichtbar. */}
            {!orientation
              ? t(sensorNoData ? 'cameraPage.postureNoData' : 'cameraPage.postureWaiting')
              : !isCameraUpright
                ? t('cameraPage.postureAdjust')
                : turnAngle === null
                  ? t('cameraPage.postureReady')
                  : Math.abs(turnAngle) <= 2
                    ? t('cameraPage.sensorAligned')
                    : t(turnAngle > 0 ? 'cameraPage.turnRight' : 'cameraPage.turnLeft', {
                        degrees: Math.round(Math.abs(turnAngle)),
                      })}
          </p>

          {/* Vorläufige Anzeige der Kamerablickrichtung.
          Erst nach Prüfung der Nordreferenz verwenden wir sie für AR. */}
          {isCameraUpright && cameraHeading !== null && (
            <p className="qm-camera__heading">
              {t('cameraPage.cameraHeading')}: <bdi dir="ltr">{cameraHeading.toFixed(1)}°</bdi>
            </p>
          )}
        </div>
      )}

      {/* Nach erfolgreicher Aufnahme ersetzt die Bestätigungskarte
          die bisherigen Links-/Rechts-Anweisungen. */}
      {frozenFrame !== null && confirmation.confirmed && (
        <div className="qm-camera__confirmation" role="status" aria-live="polite">
          <h3>{t('cameraPage.confirmationTitle')}</h3>

          <p>{t('cameraPage.confirmationIntro')}</p>

          <p>{t('cameraPage.confirmationWarning')}</p>

          {/* Führt zur vorhandenen Hauptkarte.
        Beim Seitenwechsel gibt der Kamera-Cleanup die Ressourcen frei. */}
          <AppLink to="/map" className="qm-camera__confirmation-link">
            {t('cameraPage.verifyOnMap')}
          </AppLink>
        </div>
      )}

      {/* Der gespeicherte Fehlerschlüssel wird in die aktuelle Sprache übersetzt. */}
      {error && (
        <p className="qm-camera__error" role="alert">
          {t(error)}
        </p>
      )}
    </section>
  )
}
