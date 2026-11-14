import { useTranslation } from 'react-i18next'

// Die aufrufende Seite bestimmt, was beim Klick passieren soll.
type DetectLocationButtonProps = {
  onDetect: () => void
  isLoading: boolean
}

export default function DetectLocationButton({ onDetect, isLoading }: DetectLocationButtonProps) {
  const { t } = useTranslation()

  return (
    <button type="button" className="qm-primary-button" onClick={onDetect} disabled={isLoading}>
      {isLoading ? t('locating') : t('detectLocation')}
    </button>
  )
}
