import type { UserLocation } from './getUserLocation'

// Schlüssel, unter dem wir den zuletzt ermittelten GPS-Standort speichern.
const STORAGE_KEY = 'qibla-map-detected-location'

// Liest den GPS-Standort aus der aktuellen Browsersitzung.
export function readSessionLocation(): UserLocation | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)

    if (!saved) return null

    // JSON.parse wandelt einen gespeicherten Text zurück in ein Objekt.
    const parsed: unknown = JSON.parse(saved)

    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }

    const location = parsed as Partial<UserLocation>

    // Prüft, ob die gespeicherten Koordinaten und die Genauigkeit gültig sind.
    if (
      typeof location.latitude !== 'number' ||
      typeof location.longitude !== 'number' ||
      typeof location.accuracy !== 'number' ||
      !Number.isFinite(location.latitude) ||
      !Number.isFinite(location.longitude) ||
      !Number.isFinite(location.accuracy) ||
      location.latitude < -90 ||
      location.latitude > 90 ||
      location.longitude < -180 ||
      location.longitude > 180 ||
      location.accuracy < 0
    ) {
      return null
    }

    return location as UserLocation
  } catch {
    // Ungültige Daten oder gesperrter Browserspeicher verhindern keinen App-Start.
    return null
  }
}

// Speichert einen erfolgreich ermittelten GPS-Standort.
export function saveSessionLocation(location: UserLocation): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(location))
  } catch {
    // Die App funktioniert auch ohne Browserspeicher.
  }
}

// Löscht die GPS-Position, wenn der Benutzer manuell einen Standort auswählt.
export function clearSessionLocation(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Die manuelle Standortauswahl funktioniert trotzdem.
  }
}
