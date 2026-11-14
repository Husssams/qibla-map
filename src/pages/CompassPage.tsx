import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useState } from 'react'

import './HelpPage.css'
import './CompassPage.css'
import { clearManualLocation, readManualLocation } from '../utils/location/manualLocation'
import { readSessionLocation, saveSessionLocation } from '../utils/location/detectedLocationSession'
import { calculateQiblaBearing } from '../utils/qibla/qiblaBearing'
import { getUserLocation } from '../utils/location/getUserLocation'
import DetectLocationButton from '../components/location/DetectLocationButton'

// Die Kompassseite wird in den nächsten Schritten erweitert.
export default function CompassPage() {
  const { t, i18n } = useTranslation()

  // Simulierte Blickrichtung des Smartphones für die Entwicklung am PC.
  const [simulatedHeading, setSimulatedHeading] = useState(0)

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

  // In der Entwicklung verwenden wir die simulierte Geräteausrichtung.
  const deviceHeading = import.meta.env.DEV ? simulatedHeading : 0

  // Die Nadel zeigt relativ zur Oberkante des Smartphones.
  const needleAngle = qiblaBearing === null ? null : (qiblaBearing - deviceHeading + 360) % 360

  // Berechnet den kürzesten Drehweg zur Qibla.
  // Positiv bedeutet rechts, negativ bedeutet links.
  const turnAngle =
    needleAngle === null ? null : needleAngle > 180 ? needleAngle - 360 : needleAngle

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
      setLocationError(error instanceof Error ? error.message : 'locationErrors.unexpected')
    } finally {
      // Der Button wird nach Erfolg oder Fehler wieder freigegeben.
      setIsLocating(false)
    }
  }

  return (
    <section className="qm-help" aria-labelledby="qm-compass-title">
      <h2 id="qm-compass-title">{t('navigation.compass')}</h2>

      {/* Gemeinsamer GPS-Button für Karte und Kompass. */}
      <div className="qm-compass__location">
        <DetectLocationButton onDetect={handleDetectLocation} isLoading={isLocating} />

        {locationError && (
          <p className="qm-alert" role="alert">
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
        {/* Die Nadel erscheint nur bei gültigem Qibla-Winkel. */}
        {qiblaBearing !== null && (
          <g className="qm-compass__needle">
            <path className="qm-compass__needle-front" d="M150 104 L168 154 L150 140 L132 154 Z" />
            <path className="qm-compass__needle-back" d="M132 154 L150 140 L168 154 L150 192 Z" />
            <circle className="qm-compass__needle-center" cx="150" cy="150" r="9" />
          </g>
        )}
      </svg>

      {/* Entwicklungshilfe: Simuliert die Drehung eines Smartphones. */}
      {import.meta.env.DEV && (
        <div className="qm-compass__simulator">
          <label htmlFor="qm-compass-heading">
            Smartphone-Richtung simulieren: {simulatedHeading}°
          </label>

          <input
            id="qm-compass-heading"
            type="range"
            min="0"
            max="359"
            value={simulatedHeading}
            onChange={(event) => setSimulatedHeading(Number(event.target.value))}
          />
        </div>
      )}

      {/* Richtungsanweisung während der Entwicklung am PC. */}
      {import.meta.env.DEV && (
        <p
          className="qm-compass__guidance"
          data-aligned={turnAngle !== null && Math.abs(turnAngle) <= 5}
        >
          {turnAngle === null ? (
            t('compassPage.selectLocation')
          ) : Math.abs(turnAngle) <= 5 ? (
            t('compassPage.aligned')
          ) : (
            <>
              {t(turnAngle > 0 ? 'compassPage.turnRight' : 'compassPage.turnLeft')}{' '}
              <bdi dir="ltr">{Math.round(Math.abs(turnAngle))}°</bdi>
            </>
          )}
        </p>
      )}

      <Link to="/" className="qm-help__back qm-compass__back">
        {t('helpPage.backToMap')}
      </Link>
    </section>
  )
}
