import { describe, expect, it } from 'vitest'

import { KAABA_COORDINATES } from '../../constants/kaaba'
import type { Coordinates } from '../../types/geo'
import { getQiblaPathFitBounds } from './qiblaMapBounds'
import { calculateQiblaPath } from './qiblaPath'

describe('getQiblaPathFitBounds', () => {
  it('liefert an der Kaaba keine Pfadgrenzen', () => {
    expect(getQiblaPathFitBounds(KAABA_COORDINATES)).toBeNull()
  })

  it.each([
    ['München', { latitude: 48.1372, longitude: 11.5756 }],
    ['Honolulu', { latitude: 21.3099, longitude: -157.8581 }],
  ])('enthält alle darstellbaren WGS84-Pfadpunkte für %s', (_name, location) => {
    const bounds = getQiblaPathFitBounds(location)
    const path = calculateQiblaPath(location)

    if (bounds === null) {
      throw new Error('Für diesen Standort wurden keine Pfadgrenzen berechnet.')
    }

    const [[south, west], [north, east]] = bounds
    const mercatorLimit = 85.05112878

    for (const point of path) {
      const latitude = Math.max(-mercatorLimit, Math.min(mercatorLimit, point.latitude))

      expect(latitude).toBeGreaterThanOrEqual(south)
      expect(latitude).toBeLessThanOrEqual(north)

      expect(point.longitude).toBeGreaterThanOrEqual(west)
      expect(point.longitude).toBeLessThanOrEqual(east)
    }
  })

  it('erhält die fortlaufenden Längengrade bei Hawaii', () => {
    const hawaii: Coordinates = {
      latitude: 21.3099,
      longitude: -157.8581,
    }

    const bounds = getQiblaPathFitBounds(hawaii)

    if (bounds === null) {
      throw new Error('Für Hawaii wurden keine Pfadgrenzen berechnet.')
    }

    const [[, west], [, east]] = bounds

    // Die Geodäte verläuft über eine verschobene Weltkartenkopie.
    // Eine Normalisierung würde den zusammenhängenden Pfad zerreißen.
    expect(west).toBeLessThan(-180)
    expect(east).toBeLessThanOrEqual(0)
    expect(west).toBeLessThan(east)
  })
})
