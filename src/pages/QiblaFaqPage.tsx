import { useTranslation } from 'react-i18next'
import QuickToolNavigation from '../components/navigation/QuickToolNavigation'

import './QiblaFaqPage.css'

export default function QiblaFaqPage() {
  const { t } = useTranslation()

  // Die Fragen bleiben in allen Sprachen in derselben Reihenfolge.
  const questions = ['meaning', 'unity', 'worship', 'builder', 'location', 'calculation'] as const

  return (
    <article className="qm-faq-page" aria-labelledby="qm-faq-title">
      <h2 id="qm-faq-title">{t('navigation.qiblaFaq')}</h2>

      <p>{t('qiblaFaqPage.intro')}</p>

      <div className="qm-faq-page__questions">
        {questions.map((question) => (
          // Gleicher Name bedeutet: Immer nur eine Antwort ist geöffnet.
          <details
            name="qibla-faq"
            key={question}
            onToggle={(event) => {
              // Nur beim Öffnen scrollen, nicht beim Schließen.
              if (!event.currentTarget.open) return

              event.currentTarget.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              })
            }}
          >
            <summary>{t(`qiblaFaqPage.${question}Question`)}</summary>

            <p>{t(`qiblaFaqPage.${question}Answer`)}</p>
          </details>
        ))}
      </div>
      {/* Direkter Wechsel zu allen drei Qibla-Werkzeugen. */}
      <QuickToolNavigation />
    </article>
  )
}
