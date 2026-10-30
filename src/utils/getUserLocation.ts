// Importiert unseren vorhandenen Koordinatentyp.
import type { Coordinates } from '../types/geo'

// Kombiniert die Koordinaten mit der geschätzten Standortgenauigkeit.
export type UserLocation = Coordinates & {
  // Geschätzte Genauigkeit in Metern.
  accuracy: number
}

// Fordert den aktuellen Standort des Benutzers an.
export function getUserLocation(): Promise<UserLocation> {
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

      // Konfiguriert die Standortermittlung.
      {
        // Begrenzt die Positionssuche auf 10 Sekunden.
        timeout: 10_000,
      },
    )
  })
}
