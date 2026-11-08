import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import './HelpPage.css'

// Die Hilfeseite erklärt nur Funktionen, die bereits verfügbar sind.
export default function HelpPage() {
  const { t } = useTranslation()

  const steps = ['search', 'gps', 'map', 'path'] as const

  return (
    <section className="qm-help" aria-labelledby="qm-help-title">
      <h2 id="qm-help-title">{t('helpPage.title')}</h2>

      <p>{t('helpPage.intro')}</p>

      <ul className="qm-help__steps">
        {steps.map((step) => (
          <li key={step}>{t(`helpPage.${step}`)}</li>
        ))}
      </ul>

      {/* Link navigiert zur Karte, ohne die Browserseite neu zu laden. */}
      <Link to="/" className="qm-help__back">
        {t('helpPage.backToMap')}
      </Link>
    </section>
  )
}