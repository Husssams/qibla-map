
import { describe, expect, it } from 'vitest'
import { Geodesic } from 'geographiclib-geodesic'

import { KAABA_COORDINATES } from '../constants/kaaba'
import type { Coordinates } from '../types/geo'
import { calculateQiblaPath } from './qiblaPath'

// New York ist ein wichtiger Testfall, weil der kürzeste Weg zur Kaaba
// zunächst nach Nordosten führt, obwohl Mekka auf der flachen Karte südöstlich liegt.
const NEW_YORK: Coordinates = {
  latitude: 40.7128,
  longitude: -74.006,
}

// LONG_UNROLL kann Längengrade außerhalb von -180° bis 180° liefern.
// Für den Vergleich mit den gespeicherten Kaaba-Koordinaten normalisieren wir sie.
function normalizeLongitude(longitude: number): number {
  return ((((longitude + 180) % 360) + 360) % 360) - 180
}

describe('calculateQiblaPath', () => {
  it('includes the starting location and 128 geodesic segments', () => {
    const path = calculateQiblaPath(NEW_YORK)

    // 128 Streckenabschnitte benötigen 129 Punkte einschließlich des Startpunkts.
    expect(path).toHaveLength(129)
    expect(path[0]).toEqual(NEW_YORK)
  })

  it('ends at the Kaaba coordinates', () => {
    const path = calculateQiblaPath(NEW_YORK)
    const destination = path[path.length - 1]

    // Der letzte berechnete Punkt muss das geografische Ziel erreichen.
    // Kleine Rundungsabweichungen sind bei Gleitkommazahlen normal.
    expect(destination.latitude).toBeCloseTo(KAABA_COORDINATES.latitude, 6)
    expect(destination.longitude).toBeCloseTo(KAABA_COORDINATES.longitude, 6)
  })

  it('places the midpoint halfway along the WGS84 geodesic', () => {
    const path = calculateQiblaPath(NEW_YORK)
    const midpoint = path[64]

    // s12 ist die Entfernung zwischen zwei Punkten entlang des
    // WGS84-Erdellipsoids in Metern, nicht die Entfernung auf der Bildschirmkarte.
    const totalDistance = Geodesic.WGS84.Inverse(
      NEW_YORK.latitude,
      NEW_YORK.longitude,
      KAABA_COORDINATES.latitude,
      KAABA_COORDINATES.longitude,
    ).s12

    const midpointDistance = Geodesic.WGS84.Inverse(
      NEW_YORK.latitude,
      NEW_YORK.longitude,
      midpoint.latitude,
      midpoint.longitude,
    ).s12

    if (totalDistance === undefined || midpointDistance === undefined) {
      throw new Error('Die geodätische Testentfernung ist nicht verfügbar.')
    }

    // Punkt 64 von 128 liegt bei der Hälfte der zurückgelegten Strecke.
    // Die Genauigkeit von zwei Dezimalstellen entspricht einer Toleranz von 0,005 Metern.
    expect(midpointDistance).toBeCloseTo(totalDistance / 2, 2)
  })

  it('starts northeast from New York', () => {
    const path = calculateQiblaPath(NEW_YORK)

    // Die Richtung des ersten Streckenabschnitts muss mit dem bekannten
    // WGS84-Qibla-Winkel von ungefähr 58,4° übereinstimmen.
    const firstSegment = Geodesic.WGS84.Inverse(
      path[0].latitude,
      path[0].longitude,
      path[1].latitude,
      path[1].longitude,
    )

    expect(firstSegment.azi1).toBeCloseTo(58.4, 1)
  })

  it('keeps longitudes continuous across the international date line', () => {
    // Von Honolulu zur Kaaba führt die kürzeste Strecke westwärts
    // über die internationale Datumsgrenze.
    const honolulu: Coordinates = {
      latitude: 21.3069,
      longitude: -157.8583,
    }

    const path = calculateQiblaPath(honolulu)

    // LONG_UNROLL führt westliche Längengrade unter -180° fort,
    // statt sie beim Überqueren der Datumsgrenze auf +180° springen zu lassen.
    expect(path.some((point) => point.longitude < -180)).toBe(true)

    for (let index = 1; index < path.length; index++) {
      const longitudeDifference = Math.abs(
        path[index].longitude - path[index - 1].longitude,
      )

      // Zwischen benachbarten Punkten darf kein künstlicher Sprung
      // um fast 360° entstehen.
      expect(longitudeDifference).toBeLessThan(180)
    }

    // Ein Längengrad wie -320° bezeichnet geografisch denselben Ort wie +40°.
    // Nach der Normalisierung muss die Linie weiterhin an der Kaaba enden.
    const destination = path[path.length - 1]

    expect(destination.latitude).toBeCloseTo(KAABA_COORDINATES.latitude, 6)
    expect(normalizeLongitude(destination.longitude)).toBeCloseTo(
      KAABA_COORDINATES.longitude,
      6,
    )
  })

  it('returns no path at or very near the Kaaba', () => {
    // Dieselbe 10-Meter-Grenze wie bei der Qibla-Berechnung verhindert
    // eine irreführende Richtungsstrecke unmittelbar am Ziel.
    expect(calculateQiblaPath(KAABA_COORDINATES)).toEqual([])

    const nearbyLocation: Coordinates = {
      latitude: KAABA_COORDINATES.latitude + 0.00001,
      longitude: KAABA_COORDINATES.longitude,
    }

    expect(calculateQiblaPath(nearbyLocation)).toEqual([])
  })

  it('rejects invalid geographic coordinates', () => {
    // Ungültige Startkoordinaten werden bereits von der bestehenden
    // Qibla-Berechnung abgefangen und dürfen nicht zu Kartenpunkten werden.
    expect(() =>
      calculateQiblaPath({
        latitude: 91,
        longitude: 0,
      }),
    ).toThrow('Ungültiger Breitengrad.')
  })
})
