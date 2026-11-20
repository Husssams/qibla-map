import { describe, expect, it } from 'vitest'

import { getSeasonalLogo, isRamadan } from './seasonalLogo'

describe('isRamadan', () => {
  it('erkennt einen Tag während des Ramadan', () => {
    const date = new Date('2026-03-01T12:00:00Z')

    expect(isRamadan(date)).toBe(true)
  })

  it('erkennt einen Tag außerhalb des Ramadan', () => {
    const date = new Date('2026-11-19T12:00:00Z')

    expect(isRamadan(date)).toBe(false)
  })
})

describe('getSeasonalLogo', () => {
  it('verwendet während des Ramadan das Ramadan-Logo', () => {
    const date = new Date('2026-03-01T12:00:00Z')

    expect(getSeasonalLogo(date)).toBe('/images/logoRamadan.png')
  })

  it('verwendet außerhalb des Ramadan das Standardlogo', () => {
    const date = new Date('2026-11-19T12:00:00Z')

    expect(getSeasonalLogo(date)).toBe('/images/logo.png')
  })
})
