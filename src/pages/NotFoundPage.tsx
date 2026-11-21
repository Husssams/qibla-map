import { useTranslation } from 'react-i18next'
// Wiederverwendbare Navigation zu Kamera, Kompass und Karte.
import QuickToolNavigation from '../components/navigation/QuickToolNavigation'

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

      {/* Direkte Navigation zu unseren drei Qibla-Werkzeugen.
      Die bestehende Komponente übernimmt Icons, Übersetzungen
      und das responsive Design. */}
      <QuickToolNavigation />
    </section>
  )
}
