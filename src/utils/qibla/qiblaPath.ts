
import { Geodesic } from 'geographiclib-geodesic'

import { KAABA_COORDINATES } from '../../constants/kaaba'
import type { Coordinates } from '../../types/geo'
import { calculateQiblaBearing } from './qiblaBearing'

// Eine geodätische Strecke wird durch Zwischenpunkte als Kurve auf der Karte sichtbar.
// 128 Abschnitte ermöglichen eine ausreichend feine Darstellung auch über große Entfernungen.
const PATH_SEGMENTS = 128

// Berechnet den kürzesten Weg vom ausgewählten Standort zur Kaaba auf dem WGS84-Erdellipsoid.
export function calculateQiblaPath(location: Coordinates): Coordinates[] {
  // Pfeil und Linie verwenden denselben geografischen Anfangswinkel.
  // Dadurch zeigt die Pfeilspitze in die Richtung, in der die Linie beginnt.
  const bearing = calculateQiblaBearing(location)

  // Innerhalb von 10 Metern zur Kaaba ist keine zuverlässige Qibla-Richtung definiert.
  // Ein leeres Array verhindert, dass dort eine irreführende Linie gezeichnet wird.
  if (bearing === null) {
    return []
  }

  // Inverse berechnet die geodätischen Eigenschaften zwischen zwei bekannten Punkten.
  // Punkt 1 ist unser Standort, Punkt 2 ist die Kaaba.
  // Anders als eine gerade Verbindung auf der Bildschirmkarte berücksichtigt
  // diese Berechnung die Erdkrümmung und die Abplattung des WGS84-Erdellipsoids.
  const inverse = Geodesic.WGS84.Inverse(
    location.latitude,
    location.longitude,
    KAABA_COORDINATES.latitude,
    KAABA_COORDINATES.longitude,
  )

  // s12 bezeichnet die geodätische Entfernung von Punkt 1 zu Punkt 2 in Metern.
  // Wir benötigen diese Gesamtlänge, um die Zwischenpunkte gleichmäßig
  // entlang der tatsächlichen Strecke über die Erdoberfläche zu verteilen.
  const distance = inverse.s12

  // Ohne eine endliche Entfernung könnten ungültige Zwischenpunkte entstehen.
  // Solche Koordinaten dürfen nicht an Leaflet weitergegeben werden.
  if (distance === undefined || !Number.isFinite(distance)) {
    throw new Error('Die Entfernung zur Kaaba konnte nicht berechnet werden.')
  }

  // Der erste Punkt entspricht exakt dem ausgewählten Standort.
  // Die weiteren Punkte werden anhand ihrer Entfernung vom Start berechnet.
  const points: Coordinates[] = [location]

  for (let index = 1; index <= PATH_SEGMENTS; index++) {
    // Der Teilabstand wächst in 128 gleichmäßigen Schritten.
    // Beim letzten Durchlauf entspricht er der gesamten Entfernung zur Kaaba.
    const partialDistance = (distance * index) / PATH_SEGMENTS

    // Direct berechnet einen neuen Punkt aus Startkoordinaten, Anfangswinkel
    // und zurückgelegter Entfernung entlang der WGS84-Geodäte.
    // Eine lineare Interpolation der Breiten- und Längengrade wäre dafür ungeeignet.
    const position = Geodesic.WGS84.Direct(
      location.latitude,
      location.longitude,
      bearing,
      partialDistance,
      // STANDARD fordert unter anderem die Zielkoordinaten lat2 und lon2 an.
      // LONG_UNROLL führt Längengrade über ±180° hinaus fort, damit beim
      // Überqueren der Datumsgrenze kein künstlicher Koordinatensprung entsteht.
      Geodesic.STANDARD | Geodesic.LONG_UNROLL,
    )

    // lat2 und lon2 sind Breitengrad und Längengrad des berechneten zweiten Punktes.
    // Die Ziffer 2 bezeichnet hier das Ergebnis von Direct, nicht zwingend die Kaaba.
    // Erst beim letzten Schleifendurchlauf erreichen wir das eigentliche Ziel.
    if (
      position.lat2 === undefined ||
      position.lon2 === undefined ||
      !Number.isFinite(position.lat2) ||
      !Number.isFinite(position.lon2)
    ) {
      // Fehlerhafte Zwischenpunkte würden die Linie geografisch verfälschen.
      throw new Error('Ein Punkt des Qibla-Pfads konnte nicht berechnet werden.')
    }

    points.push({
      latitude: position.lat2,
      longitude: position.lon2,
    })
  }

  // Das Ergebnis enthält 129 Punkte: den Standort und 128 Folgepunkte.
  // Die spätere Leaflet-Darstellung verbindet sie zu einer geodätischen Kurve.
  // Das Weltkarten-Wrapping an der Datumsgrenze berücksichtigen wir dort separat.
  return points
}
