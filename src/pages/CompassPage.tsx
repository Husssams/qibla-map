import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import './HelpPage.css'
import './CompassPage.css'
import { readManualLocation } from '../utils/location/manualLocation'
import { readSessionLocation } from '../utils/location/detectedLocationSession'
import { calculateQiblaBearing } from '../utils/qibla/qiblaBearing'

// Die Kompassseite wird in den nächsten Schritten erweitert.
export default function CompassPage() {
  const { t } = useTranslation()
  // Liest den zuletzt ausgewählten Standort aus dem Browser.
  const manualLocation = readManualLocation()

  // Liest einen zuvor per GPS ermittelten Standort.
  const detectedLocation = readSessionLocation()

  // Ein manuell gewählter Standort hat Vorrang vor GPS.
  const activeLocation = manualLocation ?? detectedLocation

  // Ohne echten Standort zeigen wir keine scheinbar genaue Qibla-Richtung.
  const qiblaBearing = activeLocation ? calculateQiblaBearing(activeLocation) : null

  return (
    <section className="qm-help" aria-labelledby="qm-compass-title">
      <h2 id="qm-compass-title">{t('navigation.compass')}</h2>

      {/* Die Kompassscheibe wird später mit Sensordaten verbunden. */}
      <svg className="qm-compass__dial" viewBox="0 0 300 300" aria-hidden="true">
        {/* Äußerer Kreis und innerer Orientierungsring. */}
        <circle className="qm-compass__ring" cx="150" cy="150" r="118" />
        <circle className="qm-compass__inner-ring" cx="150" cy="150" r="97" />

        {/* Vier Markierungen an den Haupthimmelsrichtungen. */}
        <g className="qm-compass__tick">
          <line x1="150" y1="33" x2="150" y2="45" />
          <line x1="267" y1="150" x2="255" y2="150" />
          <line x1="150" y1="267" x2="150" y2="255" />
          <line x1="33" y1="150" x2="45" y2="150" />
        </g>

        {/* Himmelsrichtungen: Norden, Osten, Süden, Westen. */}
        <g className="qm-compass__direction">
          <text className="qm-compass__north" x="150" y="68">
            N
          </text>
          <text x="234" y="150">
            E
          </text>
          <text x="150" y="234">
            S
          </text>
          <text x="66" y="150">
            W
          </text>
        </g>
        {/* Die Nadel erscheint nur bei gültigem Qibla-Winkel. */}
        {qiblaBearing !== null && (
          <g className="qm-compass__needle" transform={`rotate(${qiblaBearing} 150 150)`}>
            <path className="qm-compass__needle-front" d="M150 95 L166 155 L150 142 L134 155 Z" />

            <path className="qm-compass__needle-back" d="M134 155 L150 142 L166 155 L150 205 Z" />

            <circle className="qm-compass__needle-center" cx="150" cy="150" r="9" />
          </g>
        )}
      </svg>

      <Link to="/" className="qm-help__back">
        {t('helpPage.backToMap')}
      </Link>
    </section>
  )
}
