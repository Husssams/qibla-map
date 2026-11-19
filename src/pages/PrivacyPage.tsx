import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import './HelpPage.css'

// Die Datenschutzseite verwendet ausschließlich unsere vorhandenen
// Übersetzungen. Dadurch funktioniert sie in allen drei Sprachen.
export default function PrivacyPage() {
  const { t } = useTranslation()

  // Alle Abschnitte verwenden denselben Aufbau.
  // Ihre Texte kommen aus der jeweils ausgewählten Sprache.
  const sections = [
    'location',
    'storage',
    'search',
    'tiles',
    'hosting',
    'operator',
    'paypal',
    'retention',
    'rights',
  ] as const

  return (
    <article className="qm-help" aria-labelledby="qm-privacy-title">
      <h2 id="qm-privacy-title">{t('navigation.privacy')}</h2>

      <p>{t('privacyPage.intro')}</p>

      {/* Gibt die fünf Datenschutzabschnitte in der richtigen Reihenfolge aus. */}
      {sections.map((section) => (
        <section key={section} aria-labelledby={`qm-privacy-${section}`}>
          <h3 id={`qm-privacy-${section}`}>{t(`privacyPage.${section}Title`)}</h3>

          <p>{t(`privacyPage.${section}Text`)}</p>
          {/* Kontaktangaben nur im Abschnitt "Verantwortlicher" anzeigen. */}
          {section === 'operator' && (
            <address>
              <p>{t('imprintPage.operatorName')}</p>

              <p>
                <a dir="ltr" href="mailto:hussam.sattout@hotmail.com">
                  hussam.sattout@hotmail.com
                </a>
              </p>
            </address>
          )}
        </section>
      ))}

      {/* Kennzeichnet die noch nicht rechtlich freigegebene Fassung. */}
      <p>{t('privacyPage.reviewNotice')}</p>

      <Link to="/map" className="qm-help__back">
        {t('helpPage.backToMap')}
      </Link>
    </article>
  )
}
