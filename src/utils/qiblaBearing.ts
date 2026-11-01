// Importiert die geografische Berechnungsbibliothek.
import { Geodesic } from 'geographiclib-geodesic'

// Importiert die Koordinaten der Kaaba.
import { KAABA_COORDINATES } from '../constants/kaaba'

// Importiert unseren Datentyp für Koordinaten.
import type { Coordinates } from '../types/geo'

// null bedeutet: Für diesen Standort ist keine zuverlässige Richtung definiert.
export function calculateQiblaBearing(location: Coordinates): number | null {
  // Prüft, ob der Breitengrad eine gültige Zahl ist.
  if (!Number.isFinite(location.latitude) || location.latitude < -90 || location.latitude > 90) {
    // Bricht die Berechnung bei einem ungültigen Breitengrad ab.
    throw new Error('Ungültiger Breitengrad.')
  }

  // Prüft, ob der Längengrad eine gültige Zahl ist.
  if (
    !Number.isFinite(location.longitude) ||
    location.longitude < -180 ||
    location.longitude > 180
  ) {
    // Bricht die Berechnung bei einem ungültigen Längengrad ab.
    throw new Error('Ungültiger Längengrad.')
  }
  // Berechnet den geodätischen Weg auf dem WGS84-Erdmodell.
  const result = Geodesic.WGS84.Inverse(
    location.latitude,
    location.longitude,
    KAABA_COORDINATES.latitude,
    KAABA_COORDINATES.longitude,
  )

  // Prüft, ob die Koordinaten exakt mit der Kaaba übereinstimmen.
  if (
    location.latitude === KAABA_COORDINATES.latitude &&
    location.longitude === KAABA_COORDINATES.longitude
  ) {
    return null
  }

  // Speichert die berechnete Entfernung in Metern.
  const distance = result.s12

  // Prüft, ob die Entfernung eine gültige Zahl ist.
  if (distance === undefined || !Number.isFinite(distance)) {
    // Meldet einen Fehler, wenn keine gültige Entfernung vorliegt.
    throw new Error('Die Entfernung zur Kaaba konnte nicht berechnet werden.')
  }

  // Innerhalb von 10 Metern ist die Richtung zur Kaaba nicht zuverlässig.
  if (distance < 10) {
    return null
  }

  // Liest den Anfangswinkel aus dem Ergebnis.
  const bearing = result.azi1

  // Prüft, ob die Bibliothek einen gültigen Winkel geliefert hat.
  if (bearing === undefined || !Number.isFinite(bearing)) {
    throw new Error('Die Qibla-Richtung konnte nicht berechnet werden.')
  }

  // Wandelt den Winkel in den Bereich von 0 bis unter 360 Grad um.
  return (bearing + 360) % 360
}
