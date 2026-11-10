import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import './NotFoundPage.css'

// Diese Seite erscheint, wenn keine unserer definierten Routen
// zur eingegebenen Adresse passt.
export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="qm-not-found" aria-labelledby="qm-not-found-title">
      <p className="qm-not-found__code">404</p>

      <h2 id="qm-not-found-title">{t('notFoundPage.title')}</h2>

      <p>{t('notFoundPage.description')}</p>

      {/* Link navigiert zur Startseite, ohne die App neu zu laden. */}
      <Link to="/" className="qm-not-found__link">
        {t('notFoundPage.backToMap')}
      </Link>
    </section>
  )
}
