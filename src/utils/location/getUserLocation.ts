// Importiert unseren vorhandenen Koordinatentyp.
import type { Coordinates } from '../../types/geo'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

// Kombiniert die Koordinaten mit der geschätzten Standortgenauigkeit.
export type UserLocation = Coordinates & {
  // Geschätzte Genauigkeit in Metern.
  accuracy: number
}

// Fordert den aktuellen Standort des Benutzers an.
export async function getUserLocation(): Promise<UserLocation> {
  // Unter Android verwenden wir die native Standortermittlung.
  if (Capacitor.getPlatform() === 'android') {
    try {
      // Berechtigung erst dann anfragen, wenn der Benutzer
      // die Standortfunktion tatsächlich verwendet.
      const permission = await Geolocation.requestPermissions()

      const isAllowed = permission.location === 'granted' || permission.coarseLocation === 'granted'

      if (!isAllowed) {
        throw new Error('locationErrors.permissionDenied')
      }

      // Position und Genauigkeit vom Smartphone abrufen.
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 30_000,
      })

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }
    } catch (error) {
      // Unsere bestehenden Übersetzungsschlüssel weiterverwenden.
      if (error instanceof Error && error.message === 'locationErrors.permissionDenied') {
        throw error
      }

      const code = (error as { code?: string } | null)?.code

      if (code === 'OS-PLUG-GLOC-0003') {
        throw new Error('locationErrors.permissionDenied', {
          cause: error,
        })
      }

      if (code === 'OS-PLUG-GLOC-0010') {
        throw new Error('locationErrors.timeout', {
          cause: error,
        })
      }

      throw new Error('locationErrors.unexpected', {
        cause: error,
      })
    }
  }

  // Darunter bleibt die bisherige Browser-Geolocation
  // mit navigator.geolocation vollständig erhalten.

  // Erstellt eine asynchrone Verarbeitung.
  return new Promise((resolve, reject) => {
    // Prüft, ob der Browser die Standortermittlung unterstützt.
    if (!navigator.geolocation) {
      reject(new Error('Standortermittlung wird nicht unterstützt.'))
      return
    }

    // Fordert den aktuellen Standort vom Browser an.
    navigator.geolocation.getCurrentPosition(
      // Wird ausgeführt, wenn die Standortermittlung erfolgreich ist.
      (position) => {
        // Zeigt die vom Browser geschätzte Standortgenauigkeit in Metern.
        console.log('Standortgenauigkeit (Meter):', position.coords.accuracy)
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          // Übernimmt die gemeldete Standortgenauigkeit.
          accuracy: position.coords.accuracy,
        })
      },

      // Wird ausgeführt, wenn die Standortermittlung fehlschlägt.
      (error) => {
        // Prüft, ob der Benutzer die Standortberechtigung verweigert hat.
        if (error.code === error.PERMISSION_DENIED) {
          // Gibt eine verständliche Fehlermeldung zurück.
          reject(new Error('locationErrors.permissionDenied'))
          return
        }

        // Prüft, ob die geografische Position nicht verfügbar ist.
        if (error.code === error.POSITION_UNAVAILABLE) {
          // Meldet, dass kein Standort bestimmt werden konnte.
          reject(new Error('Dein Standort ist momentan nicht verfügbar.'))
          return
        }

        // Prüft, ob die Standortermittlung zu lange gedauert hat.
        if (error.code === error.TIMEOUT) {
          // Meldet eine Zeitüberschreitung.
          reject(new Error('Die Standortermittlung hat zu lange gedauert.'))
          return
        }

        // Behandelt alle anderen, unerwarteten Fehler.
        reject(new Error('Ein unbekannter Standortfehler ist aufgetreten.'))
      },

      {
        // Wartet höchstens zehn Sekunden auf eine Position.
        timeout: 10_000,

        // Erlaubt die Wiederverwendung einer GPS-Messung,
        // wenn diese höchstens 30 Sekunden alt ist.
        // Ein erneuter Klick kurz nach der ersten Messung
        // kann dadurch deutlich schneller beantwortet werden.
        maximumAge: 30_000,
      },
    )
  })
}
