
import { Capacitor } from '@capacitor/core'
import { Haptics } from '@capacitor/haptics'

/*
 * In Android verwenden wir native Vibrationsimpulse.
 * Im Browser bleibt die bisherige Web-Vibration erhalten.
 */

const isAndroid = Capacitor.getPlatform() === 'android'

// Android verwendet etwas kürzere Impulse mit Pausen.
// Im Browser behalten wir das vorhandene Intervall.
export const QIBLA_VIBRATION_INTERVAL_MS = isAndroid ? 400 : 200

// Verhindert identische Warnungen bei jedem Impuls.
let hasLoggedVibrationError = false

/*
 * Einen Vibrationsimpuls auslösen.
 *
 * Android: Capacitor Haptics
 * Browser: navigator.vibrate()
 */
export function pulseQiblaVibration(): void {
  if (isAndroid) {
    void Haptics.vibrate({ duration: 120 }).catch((error: unknown) => {
      if (!hasLoggedVibrationError) {
        console.warn('Native Qibla vibration failed:', error)
        hasLoggedVibrationError = true
      }
    })

    return
  }

  // Bisheriges Browserverhalten beibehalten.
  navigator.vibrate?.(180)
}

/*
 * Die Web-Vibration kann sofort abgebrochen werden.
 *
 * Capacitor Haptics bietet keinen Stop-Befehl.
 * Auf Android endet der kurze Impuls automatisch.
 */
export function stopQiblaVibration(): void {
  if (!isAndroid) {
    navigator.vibrate?.(0)
  }
}
