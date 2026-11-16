import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './CameraPage.css'

import { getUserLocation, type UserLocation } from '../utils/location/getUserLocation'
import { calculateQiblaBearing } from '../utils/qibla/qiblaBearing'

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

  const [status, setStatus] = useState<'idle' | 'starting' | 'active'>('idle')
  const [error, setError] = useState('')

  // Speichert ausschließlich den vom Smartphone ermittelten GPS-Standort.
  // Eine manuelle Kartenauswahl wird hier bewusst nicht verwendet.
  const [cameraLocation, setCameraLocation] = useState<UserLocation | null>(null)

  // Zeigt an, ob gerade eine GPS-Abfrage läuft.
  const [isLocating, setIsLocating] = useState(false)

  // Speichert einen übersetzbaren Fehler bei der Standortermittlung.
  const [locationError, setLocationError] = useState<string | null>(null)

  // Verhindert veraltete GPS-Ergebnisse nach dem Stoppen der Kamera.
  const locationRequestRef = useRef(0)

  // Berechnet die Qibla-Richtung aus dem echten GPS-Standort.
  // Ohne GPS-Standort gibt es bewusst keinen Qibla-Winkel.
  // Die Berechnung verwendet geografisch Nord, nicht magnetisch Nord.
  const qiblaBearing = cameraLocation ? calculateQiblaBearing(cameraLocation) : null

  // Speichert die zuletzt empfangenen Sensorwerte.
  const [orientation, setOrientation] = useState<OrientationSample | null>(null)

  // Bei normaler Hochformathaltung liegt Beta ungefähr bei +90°.
  // Wir erlauben zunächst 25° Abweichung in beide Richtungen.
  // Alpha und Gamma werden hier bewusst nicht begrenzt.
  const isCameraUpright = orientation !== null && Math.abs(orientation.beta - 90) <= 25

  // Meldet, wenn das Gerät längere Zeit keine gültigen Werte liefert.
  const [sensorNoData, setSensorNoData] = useState(false)

  // Stoppt einen Kamerastream und gibt die Kamera wieder frei.
  function stopCamera() {
    // Eine laufende GPS-Anfrage wird für diese Kamerasitzung ungültig.
    locationRequestRef.current += 1

    setCameraLocation(null)
    setLocationError(null)
    setIsLocating(false)
    // Die nächste Kamerasitzung soll keine alten Sensordaten übernehmen.
    setOrientation(null)
    setSensorNoData(false)

    requestIdRef.current += 1

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setStatus('idle')
    setError('')
  }

  // Die Kamera muss auch beim Wechsel zur Karte gestoppt werden.
  useEffect(() => {
    return () => {
      // Auch ausstehende GPS-Ergebnisse nach dem Seitenwechsel ignorieren.
      locationRequestRef.current += 1
      requestIdRef.current += 1
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
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

  async function startCamera() {
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
      }
    } catch (cameraError) {
      if (requestId !== requestIdRef.current) return

      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null

      if (videoRef.current) videoRef.current.srcObject = null

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
  }

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

  return (
    <section className={`qm-camera${status !== 'idle' ? ' qm-camera--fullscreen' : ''}`}>
      <h2>{t('navigation.arCamera')}</h2>

      <p className="qm-camera__description">{t('cameraPage.intro')}</p>

      {/* Die Vorschau erhält einen eigenen Container.
        So ist der Kamerabereich auch im ausgeschalteten Zustand sichtbar. */}
      <div className="qm-camera__preview">
        <video ref={videoRef} autoPlay playsInline muted className="qm-camera__video" />
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

        {/* Die aktuelle Position wird nur bei eingeschalteter Kamera abgefragt. */}
        {status === 'active' && (
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

      {/* Die Haltungserkennung wird nur bei aktiver Kamera angezeigt.
    Technische Sensorwerte bleiben auf die Entwicklungsumgebung beschränkt. */}
      {status === 'active' && (
        <div className="qm-camera__sensor">
          <p className="qm-camera__posture" role="status">
            {!orientation
              ? t(sensorNoData ? 'cameraPage.postureNoData' : 'cameraPage.postureWaiting')
              : t(isCameraUpright ? 'cameraPage.postureReady' : 'cameraPage.postureAdjust')}
          </p>

          {/* Nur für uns Entwickler: Rohwerte zur Überprüfung auf Android. */}
          {import.meta.env.DEV && orientation && (
            <div className="qm-camera__debug">
              <p>
                α: {orientation.alpha.toFixed(1)}° | β: {orientation.beta.toFixed(1)}° | γ:{' '}
                {orientation.gamma.toFixed(1)}°
              </p>

              <p>
                {t(
                  orientation.absolute ? 'cameraPage.sensorAbsolute' : 'cameraPage.sensorRelative',
                )}
              </p>

              <p>
                {t('cameraPage.screenAngle')}:{' '}
                {orientation.screenAngle === null ? '?' : `${orientation.screenAngle}°`}
              </p>
            </div>
          )}
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
