import { useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './QiblaDirectionHelp.css'

export default function QiblaDirectionHelp() {
  const { t, i18n } = useTranslation()

  // Ermöglicht das Öffnen und Schließen des Pop-ups.
  const dialogRef = useRef<HTMLDialogElement>(null)
  const dialogId = useId()
  const titleId = useId()

  return (
    <>
      {/* Öffnet denselben Dialogstil wie beim bisherigen Kompass. */}
      <div className="qm-direction-help">
        <button
          type="button"
          className="qm-map-info-button"
          aria-haspopup="dialog"
          aria-controls={dialogId}
          onClick={() => dialogRef.current?.showModal()}
        >
          <span aria-hidden="true">ⓘ</span>
          <span>{t('directionHelp.button')}</span>
        </button>
      </div>

      {/* Pop-up mit abgedunkeltem Hintergrund. */}
      <dialog
        id={dialogId}
        ref={dialogRef}
        className="qm-qibla-path-dialog qm-direction-help__dialog"
        aria-labelledby={titleId}
        dir={i18n.dir()}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close()
          }
        }}
      >
        <div className="qm-qibla-path-dialog-content">
          <button
            type="button"
            className="qm-qibla-path-dialog-close"
            aria-label={t('qiblaPathInfoClose')}
            onClick={() => dialogRef.current?.close()}
          >
            ×
          </button>

          <span className="qm-qibla-path-dialog-icon" aria-hidden="true">
            🧭
          </span>

          <h2 id={titleId}>{t('directionHelp.title')}</h2>

          <p>{t('directionHelp.calibration')}</p>
        </div>
      </dialog>
    </>
  )
}
