import { describe, expect, it } from 'vitest'

import { calculateCameraHeading } from './cameraHeading'

describe('calculateCameraHeading', () => {
  // Bei aufrechter Haltung und Alpha 0° zeigt die Rückkamera nach Norden.
  it('berechnet Norden', () => {
    const heading = calculateCameraHeading({
      alpha: 0,
      beta: 90,
      gamma: 0,
      absolute: true,
    })

    expect(heading).toBeCloseTo(0)
  })

  // Alpha läuft entgegengesetzt zur Kompassrichtung.
  it('berechnet Osten', () => {
    const heading = calculateCameraHeading({
      alpha: 270,
      beta: 90,
      gamma: 0,
      absolute: true,
    })

    expect(heading).toBeCloseTo(90)
  })

  it('berechnet Westen', () => {
    const heading = calculateCameraHeading({
      alpha: 90,
      beta: 90,
      gamma: 0,
      absolute: true,
    })

    expect(heading).toBeCloseTo(270)
  })

  // Auch Gamma beeinflusst die Kamerablickrichtung.
  it('berücksichtigt die seitliche Drehung', () => {
    const heading = calculateCameraHeading({
      alpha: 0,
      beta: 90,
      gamma: 90,
      absolute: true,
    })

    expect(heading).toBeCloseTo(270)
  })

  // Bei flacher Bildschirmhaltung blickt die Rückkamera zum Boden.
  it('liefert ohne horizontale Blickrichtung null', () => {
    expect(
      calculateCameraHeading({
        alpha: 0,
        beta: 0,
        gamma: 0,
        absolute: true,
      }),
    ).toBeNull()
  })

  // Ohne absolute Orientierung kann keine Nordrichtung bestimmt werden.
  it('verwirft relative Sensorwerte', () => {
    expect(
      calculateCameraHeading({
        alpha: 45,
        beta: 90,
        gamma: 0,
        absolute: false,
      }),
    ).toBeNull()
  })

  it('verwirft ungültige Zahlen', () => {
    expect(
      calculateCameraHeading({
        alpha: NaN,
        beta: 90,
        gamma: 0,
        absolute: true,
      }),
    ).toBeNull()
  })
})
