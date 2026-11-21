import { useTranslation } from 'react-i18next'
import { AppLink } from '../components/navigation/AppNavigationLinks'

import './HelpPage.css'
import QuickToolNavigation from '../components/navigation/QuickToolNavigation'

const sections = [
  {
    id: 'camera',
    icon: '📷',
    to: '/camera',
    actionKey: 'quickNavigation.goToCamera',
    steps: ['start', 'gps', 'hold', 'confirm'],
  },
  {
    id: 'compass',
    icon: '🧭',
    to: '/compass',
    actionKey: 'quickNavigation.goToCompass',
    steps: ['gps', 'hold', 'direction', 'accuracy'],
  },
  {
    id: 'map',
    icon: '🗺️',
    to: '/map',
    actionKey: 'quickNavigation.goToMap',
    steps: ['gps', 'direction', 'path', 'manual'],
  },
] as const

export default function HelpPage() {
  const { t } = useTranslation()

  return (
    <section className="qm-help qm-help--guide" aria-labelledby="qm-help-title">
      <h2 id="qm-help-title">{t('helpPage.title')}</h2>
      <p>{t('helpPage.intro')}</p>

      {/* Alle Bereiche gehören zur selben Gruppe.
          Dadurch bleibt immer nur eine Anleitung geöffnet. */}
      <div className="qm-help__accordion">
        {sections.map((section) => (
          <details
            key={section.id}
            name="qm-help-tools"
            className="qm-help__accordion-item"
            onToggle={(event) => {
              // Geöffnete Anleitung automatisch in den sichtbaren Bereich bringen.
              if (!event.currentTarget.open) return

              event.currentTarget.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              })
            }}
          >
            <summary>
              <span aria-hidden="true">{section.icon}</span>
              <span>{t(`helpPage.sections.${section.id}.title`)}</span>
            </summary>

            <ol className="qm-help__steps">
              {section.steps.map((step) => (
                <li key={step}>{t(`helpPage.sections.${section.id}.${step}`)}</li>
              ))}
            </ol>

            {/* Öffnet direkt das Werkzeug dieser Anleitung. */}
            <AppLink to={section.to} className="qm-help__tool-link">
              {t(section.actionKey)}
            </AppLink>
          </details>
        ))}
      </div>

      {/* Alle drei Werkzeuge direkt von der Hilfeseite öffnen. */}
      <QuickToolNavigation />
    </section>
  )
}
