import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './CameraPage.css'

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

  // Stoppt einen Kamerastream und gibt die Kamera wieder frei.
  function stopCamera() {
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
      </div>

      {/* Der gespeicherte Fehlerschlüssel wird in die aktuelle Sprache übersetzt. */}
      {error && (
        <p className="qm-camera__error" role="alert">
          {t(error)}
        </p>
      )}
    </section>
  )
}
