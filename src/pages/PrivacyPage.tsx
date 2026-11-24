import { useTranslation } from 'react-i18next'
import QuickToolNavigation from '../components/navigation/QuickToolNavigation'
import './LegalPageNavigation.css'

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
    'cameraSensors',
    'legalBasis',
  ] as const

  return (
    <article className="qm-help qm-legal-page" aria-labelledby="qm-privacy-title">
      <h2 id="qm-privacy-title">{t('navigation.privacy')}</h2>

      <p>{t('privacyPage.intro')}</p>

      {/* Gibt alle Datenschutzabschnitte in der richtigen Reihenfolge aus. */}
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

      {/* Immer sichtbare Navigation zu den drei Qibla-Werkzeugen. */}
      <QuickToolNavigation />
    </article>
  )
}
