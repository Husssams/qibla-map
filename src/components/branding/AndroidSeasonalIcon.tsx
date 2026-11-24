
import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

import { isRamadan } from '../../utils/branding/seasonalLogo'
import { SeasonalLauncherIcon } from '../../utils/branding/seasonalLauncherIcon'

export default function AndroidSeasonalIcon() {
  useEffect(() => {
    // Browser verwenden weiterhin das normale Web-Branding.
    if (Capacitor.getPlatform() !== 'android') return

    let cancelled = false

    function updateIcon() {
      if (cancelled) return

      // Die vorhandene Ramadan-Berechnung wiederverwenden.
      void SeasonalLauncherIcon.setIcon({
        ramadan: isRamadan(),
      }).catch((error: unknown) => {
        console.error('Seasonal launcher icon update failed:', error)
      })
    }

    // Beim Öffnen der App prüfen.
    updateIcon()

    // Auch bei länger geöffneter App regelmäßig prüfen.
    const intervalId = window.setInterval(updateIcon, 60 * 60 * 1000)

    // Beim Zurückkehren aus dem Hintergrund erneut prüfen.
    const registration = CapacitorApp.addListener(
      'appStateChange',
      ({ isActive }) => {
        if (isActive) updateIcon()
      },
    )

    void registration.catch((error: unknown) => {
      console.error('Seasonal icon listener failed:', error)
    })

    return () => {
      cancelled = true
      window.clearInterval(intervalId)

      void registration
        .then((listener) => listener.remove())
        .catch((error: unknown) => {
          console.error('Seasonal icon listener cleanup failed:', error)
        })
    }
  }, [])

  return null
}
