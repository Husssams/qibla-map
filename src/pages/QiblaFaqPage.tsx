import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import './HelpPage.css'

export default function QiblaFaqPage() {
  const { t } = useTranslation()

  // Die Fragen bleiben in allen Sprachen in derselben Reihenfolge.
  const questions = ['meaning', 'unity', 'worship', 'builder', 'location', 'calculation'] as const

  return (
    <article className="qm-help" aria-labelledby="qm-faq-title">
      <h2 id="qm-faq-title">{t('navigation.qiblaFaq')}</h2>

      <p>{t('qiblaFaqPage.intro')}</p>

      <div className="qm-faq">
        {questions.map((question) => (
          // Gleicher Name bedeutet: Immer nur eine Antwort ist geöffnet.
          <details name="qibla-faq" key={question}>
            <summary>{t(`qiblaFaqPage.${question}Question`)}</summary>

            <p>{t(`qiblaFaqPage.${question}Answer`)}</p>
          </details>
        ))}
      </div>

      <Link to="/" className="qm-help__back">
        {t('helpPage.backToMap')}
      </Link>
    </article>
  )
}
