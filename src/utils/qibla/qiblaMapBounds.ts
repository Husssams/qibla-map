import type { LatLngBoundsExpression } from 'leaflet'

import type { Coordinates } from '../../types/geo'
import { calculateQiblaPath } from './qiblaPath'

// Web Mercator kann die Pole nicht vollständig darstellen.
// Diese Grenze entspricht dem maximal darstellbaren Breitengrad.
const MERCATOR_LATITUDE_LIMIT = 85.05112878

// Wählt einen zusammenhängenden Weltkartenausschnitt, der den WGS84-Pfad enthält.
// So bleibt die Qibla-Linie auch beim Überqueren der Datumsgrenze sichtbar.
export function getQiblaMapBounds(location: Coordinates): LatLngBoundsExpression {
  const path = calculateQiblaPath(location)

  // Direkt an der Kaaba existiert kein Pfad.
  // Dort verwenden wir weiterhin die normale Weltansicht.
  if (path.length === 0) {
    return [
      [-MERCATOR_LATITUDE_LIMIT, -180],
      [MERCATOR_LATITUDE_LIMIT, 180],
    ]
  }

  // LONG_UNROLL liefert kontinuierliche Längengrade.
  // Deshalb können Werte unter -180° oder über 180° korrekt sein.
  const longitudes = path.map((point) => point.longitude)
  const westernmostLongitude = Math.min(...longitudes)
  const easternmostLongitude = Math.max(...longitudes)

  let westernBoundary: number

  if (westernmostLongitude >= -180 && easternmostLongitude <= 180) {
    // Normale Weltansicht, beispielsweise für New York oder Deutschland.
    westernBoundary = -180
  } else if (westernmostLongitude >= -360 && easternmostLongitude <= 0) {
    // Verschobene Weltansicht für Hawaii:
    // Die Kaaba liegt links und Hawaii rechts auf derselben Karte.
    westernBoundary = -360
  } else if (westernmostLongitude >= 0 && easternmostLongitude <= 360) {
    // Entsprechende Weltansicht für einen ostwärts fortgeführten Pfad.
    westernBoundary = 0
  } else {
    // Sonderfälle erhalten ein 360° breites Fenster um den gesamten Pfad.
    // Dadurch bleiben auch ungewöhnliche Geodäten zusammenhängend sichtbar.
    westernBoundary = (westernmostLongitude + easternmostLongitude) / 2 - 180
  }

  // Die horizontale Begrenzung umfasst eine vollständige Weltkartenbreite.
  // Vertikal verhindern die Mercator-Grenzen leere Flächen außerhalb der Karte.
  return [
    [-MERCATOR_LATITUDE_LIMIT, westernBoundary],
    [MERCATOR_LATITUDE_LIMIT, westernBoundary + 360],
  ]
}

// Berechnet den kleinsten rechteckigen Kartenausschnitt,
// der den gesamten WGS84-Qibla-Pfad umfasst.
//
// Anders als getQiblaMapBounds() liefern wir hier keine ganze
// Weltkartenbreite, sondern nur die Grenzen des tatsächlichen Pfads.
export function getQiblaPathFitBounds(
  location: Coordinates,
): [[number, number], [number, number]] | null {
  const path = calculateQiblaPath(location)

  // Direkt an der Kaaba existiert kein sinnvoller Qibla-Pfad.
  // Ohne mindestens zwei Punkte können wir keinen Pfad einpassen.
  if (path.length < 2) return null

  // Web Mercator kann Breitengrade nahe den Polen nicht darstellen.
  // Deshalb begrenzen wir die Werte auf den darstellbaren Bereich.
  const latitudes = path.map((point) =>
    Math.max(-MERCATOR_LATITUDE_LIMIT, Math.min(MERCATOR_LATITUDE_LIMIT, point.latitude)),
  )

  // Die Längengrade bleiben unverändert.
  // Das ist für Qibla-Pfade über die Datumsgrenze wichtig.
  const longitudes = path.map((point) => point.longitude)

  // Wir bestimmen die äußersten geografischen Punkte des Pfads.
  const south = Math.min(...latitudes)
  const north = Math.max(...latitudes)
  const west = Math.min(...longitudes)
  const east = Math.max(...longitudes)

  // Leaflet erwartet zwei Eckpunkte:
  // [Südwest-Ecke, Nordost-Ecke].
  return [
    [south, west],
    [north, east],
  ]
}

// Zwei Weltkartenbreiten, insgesamt 720 Grad Längengrad.
// Dadurch passen sowohl normale Kartenansichten als auch
// verschobene Weltkartenkopien für Wege über die Datumsgrenze.
const MAP_WEST = -360
const MAP_EAST = 360

// Der normale Kartenmodus bleibt innerhalb des darstellbaren
// Web-Mercator-Bereichs. Im Pfadmodus erlauben wir etwas
// zusätzlichen Platz, damit Polarstrecken eingepasst werden können.
const NORMAL_LATITUDE_LIMIT = 85.05112878
const FIT_LATITUDE_LIMIT = 89.9

// Liefert feste und endliche Grenzen für beide Kartenmodi.
// Wir berechnen sie nicht mehr aus dem sichtbaren Ausschnitt.
export function getMapInteractionBounds(fitEnabled: boolean): [[number, number], [number, number]] {
  const latitudeLimit = fitEnabled ? FIT_LATITUDE_LIMIT : NORMAL_LATITUDE_LIMIT

  return [
    [-latitudeLimit, MAP_WEST],
    [latitudeLimit, MAP_EAST],
  ]
}
