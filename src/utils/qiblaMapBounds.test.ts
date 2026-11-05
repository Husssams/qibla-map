import { describe, expect, it } from 'vitest'

import { KAABA_COORDINATES } from '../constants/kaaba'
import type { Coordinates } from '../types/geo'
import { getQiblaMapBounds } from './qiblaMapBounds'
import { calculateQiblaPath } from './qiblaPath'

// Web Mercator stellt nur Breitengrade bis ungefähr ±85,0511° dar.
// Mit dieser Grenze vermeiden wir leere Bereiche außerhalb der Kartenkacheln.
const MERCATOR_LATITUDE_LIMIT = 85.05112878

// Testpunkt auf Hawaii, nahe der internationalen Datumsgrenze.
// Der kürzeste Weg zur Kaaba verläuft westwärts über den Pazifik.
const HAWAII: Coordinates = {
  latitude: 22,
  longitude: -159.7,
}

describe('getQiblaMapBounds', () => {
  it('uses the standard world view for New York', () => {
    const newYork: Coordinates = {
      latitude: 40.7128,
      longitude: -74.006,
    }

    // Von New York zur Kaaba ist kein verschobener Kartenausschnitt nötig.
    expect(getQiblaMapBounds(newYork)).toEqual([
      [-MERCATOR_LATITUDE_LIMIT, -180],
      [MERCATOR_LATITUDE_LIMIT, 180],
    ])
  })

  it('shifts the world view westward for Hawaii', () => {
    // Hawaii soll rechts und die Kaaba links dargestellt werden.
    // Dafür verwenden wir dieselbe Erde im Längengradbereich -360° bis 0°.
    expect(getQiblaMapBounds(HAWAII)).toEqual([
      [-MERCATOR_LATITUDE_LIMIT, -360],
      [MERCATOR_LATITUDE_LIMIT, 0],
    ])
  })

  it('keeps the complete Hawaii path within the shifted world view', () => {
    const path = calculateQiblaPath(HAWAII)

    // LONG_UNROLL liefert kontinuierliche Längengrade.
    // Alle Zwischenpunkte müssen in die verschobene Weltansicht passen,
    // damit die Linie nicht an der Datumsgrenze abgeschnitten wird.
    expect(path.length).toBeGreaterThan(1)

    for (const point of path) {
      expect(point.longitude).toBeGreaterThanOrEqual(-360)
      expect(point.longitude).toBeLessThanOrEqual(0)
    }

    // Der letzte Längengrad darf kleiner als -180° sein.
    // Er bezeichnet trotzdem dieselbe geografische Position der Kaaba.
    expect(path[path.length - 1].longitude).toBeLessThan(-180)
  })

  it('keeps the standard world view for Tokyo', () => {
    const tokyo: Coordinates = {
      latitude: 35.6762,
      longitude: 139.6503,
    }

    // Nicht jeder Standort im Pazifikraum benötigt eine verschobene Karte.
    // Wir wählen die Ansicht anhand des tatsächlichen geodätischen Verlaufs.
    expect(getQiblaMapBounds(tokyo)).toEqual([
      [-MERCATOR_LATITUDE_LIMIT, -180],
      [MERCATOR_LATITUDE_LIMIT, 180],
    ])
  })

  it('uses the standard world view directly at the Kaaba', () => {
    // Direkt an der Kaaba gibt es keine definierte Qibla-Richtung.
    // Die Funktion muss deshalb auch ohne berechenbaren Pfad funktionieren.
    expect(getQiblaMapBounds(KAABA_COORDINATES)).toEqual([
      [-MERCATOR_LATITUDE_LIMIT, -180],
      [MERCATOR_LATITUDE_LIMIT, 180],
    ])
  })
})
