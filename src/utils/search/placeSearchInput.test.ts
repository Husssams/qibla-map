import { describe, expect, it } from 'vitest'
import { validatePlaceSearchInput } from './placeSearchInput'

describe('validatePlaceSearchInput', () => {
  it('accepts Arabic place names', () => {
    const result = validatePlaceSearchInput('  الجامع   الأموي  ')

    expect(result).toEqual({
      valid: true,
      query: 'الجامع الأموي',
    })
  })

  it('accepts German addresses', () => {
    const result = validatePlaceSearchInput('Hauptstraße 15, Berlin')

    expect(result.valid).toBe(true)
  })

  it('allows apostrophes in place names', () => {
    const result = validatePlaceSearchInput("O'Connell Street")

    expect(result.valid).toBe(true)
  })

  it('rejects queries that are too short', () => {
    expect(validatePlaceSearchInput('ab')).toEqual({
      valid: false,
      reason: 'tooShort',
    })
  })

  it('rejects queries that are too long', () => {
    expect(validatePlaceSearchInput('a'.repeat(121))).toEqual({
      valid: false,
      reason: 'tooLong',
    })
  })

  it('rejects control characters', () => {
    expect(validatePlaceSearchInput('Berlin\nHamburg')).toEqual({
      valid: false,
      reason: 'invalidInput',
    })
  })

  it('accepts French addresses', () => {
    expect(validatePlaceSearchInput('Rue de Rivoli, Paris')).toEqual({
      valid: true,
      query: 'Rue de Rivoli, Paris',
    })
  })

  it('accepts Japanese place names', () => {
    expect(validatePlaceSearchInput('東京都新宿区')).toEqual({
      valid: true,
      query: '東京都新宿区',
    })
  })
})
