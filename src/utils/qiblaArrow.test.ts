import { describe, expect, it } from 'vitest'

import { calculateQiblaBearing } from './qiblaBearing'
import { createQiblaArrowHtml } from './qiblaArrow'

describe('createQiblaArrowHtml', () => {
  // Die CSS-Rotation muss dem geografischen Winkel im Uhrzeigersinn entsprechen.
  it.each([
    [0, 'north'],
    [90, 'east'],
    [180, 'south'],
    [270, 'west'],
  ])('rotates %i degrees towards %s', (bearing) => {
    const html = createQiblaArrowHtml(bearing)

    expect(html).toContain('class="qm-location-marker__arrow"')
    expect(html).toContain(`rotate(${bearing}deg)`)
    expect(html).toContain('translateX(-50%)')
  })

  // New York ist ein wichtiger Testfall, weil die Kaaba auf der flachen Karte südöstlich liegt.
  it('uses the geographic Qibla bearing for New York', () => {
    const bearing = calculateQiblaBearing({
      latitude: 40.7128,
      longitude: -74.006,
    })

    expect(bearing).toBeCloseTo(58.4, 1)
    expect(createQiblaArrowHtml(bearing)).toContain(`rotate(${bearing}deg)`)
  })

  // Am Zielpunkt darf kein Pfeil mit einer erfundenen Richtung erscheinen.
  it('does not render an arrow when the bearing is undefined', () => {
    expect(createQiblaArrowHtml(null)).toBe('')
  })
})
