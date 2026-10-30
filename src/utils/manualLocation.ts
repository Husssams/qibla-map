import type { Coordinates } from '../types/geo'

// Unter diesem Schlüssel merken wir uns den manuell gewählten Standort.
const STORAGE_KEY = 'qibla-map-manual-location'

// Liest einen zuvor gespeicherten Standort aus dem Browser.
export function readManualLocation(): Coordinates | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (!saved) return null

    const location = JSON.parse(saved) as Partial<Coordinates>
    const { latitude, longitude } = location

    // Ungültige oder beschädigte gespeicherte Werte werden ignoriert.
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return null
    }

    return { latitude, longitude }
  } catch {
    // Die Anwendung funktioniert auch bei gesperrtem Browserspeicher weiter.
    return null
  }
}

// Speichert die manuelle Position lokal auf dem Gerät.
export function saveManualLocation(location: Coordinates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location))
  } catch {
    // Ein Speicherfehler darf die Standortauswahl nicht blockieren.
  }
}

// Entfernt die manuelle Position, wenn GPS erneut verwendet wird.
export function clearManualLocation() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Die automatische Standortermittlung bleibt trotzdem verwendbar.
  }
}
