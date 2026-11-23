import { describe, expect, it } from 'vitest'

import { isCompassLevel, isCameraHeldUpright } from './sensorPosture'

describe('sensorPosture', () => {
  it('erlaubt den Kompass bei horizontaler Haltung', () => {
    // Exakt waagerecht ist immer gültig.
    expect(isCompassLevel(0, 0)).toBe(true)

    // 3° in beide Richtungen bleiben unter 5° Gesamtabweichung.
    expect(isCompassLevel(3, 3)).toBe(true)

    // 4° in beide Richtungen überschreiten zusammen die 5°-Grenze.
    expect(isCompassLevel(4, 4)).toBe(false)
  })

  it('sperrt den Kompass bei zu starker Neigung', () => {
    expect(isCompassLevel(9, 0)).toBe(false)
    expect(isCompassLevel(6, 6)).toBe(false)
    expect(isCompassLevel(0, -9)).toBe(false)
  })

  it('verwirft fehlende oder ungültige Sensordaten', () => {
    expect(isCompassLevel(null, 0)).toBe(false)
    expect(isCompassLevel(0, NaN)).toBe(false)
    expect(isCameraHeldUpright(null)).toBe(false)
  })

  it('erlaubt die Kamera bei aufrechter Haltung', () => {
    expect(isCameraHeldUpright(90)).toBe(true)
    expect(isCameraHeldUpright(85)).toBe(true)
    expect(isCameraHeldUpright(95)).toBe(true)
  })

  it('sperrt die Kamera bei zu starker Neigung', () => {
    expect(isCameraHeldUpright(80)).toBe(false)
    expect(isCameraHeldUpright(100)).toBe(false)
    expect(isCameraHeldUpright(0)).toBe(false)
  })
})
