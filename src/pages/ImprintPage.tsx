import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import './HelpPage.css'

export default function ImprintPage() {
  const { t } = useTranslation()

  return (
    <article className="qm-help" aria-labelledby="qm-imprint-title">
      <h2 id="qm-imprint-title">{t('navigation.imprint')}</h2>

      {/* Angaben zum Entwickler */}
      <h3>{t('imprintPage.operatorTitle')}</h3>
      <p>{t('imprintPage.operatorName')}</p>

      {/* E-Mail-Kontakt */}
      <h3>{t('imprintPage.contactTitle')}</h3>
      <p>
        <a dir="ltr" href="mailto:hussam.sattout@hotmail.com">
          hussam.sattout@hotmail.com
        </a>
      </p>

      {/* Freiwillige Unterstützung */}
      <h3>{t('imprintPage.donationTitle')}</h3>
      <p>{t('imprintPage.donationText')}</p>

      <p>
        <a
          dir="ltr"
          href="https://paypal.me/hussamsattout"
          target="_blank"
          rel="noopener noreferrer"
        >
          paypal.me/hussamsattout
        </a>
      </p>

      {/* QR-Code liegt lokal im public-Ordner. */}
      <img
        src="/images/paypal-qr.png"
        alt={t('imprintPage.qrAlt')}
        width={220}
        height={220}
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          marginBlock: '20px',
          borderRadius: '12px',
        }}
      />

      <p>{t('imprintPage.paypalNotice')}</p>

      <Link to="/map" className="qm-help__back">
        {t('helpPage.backToMap')}
      </Link>
    </article>
  )
}
