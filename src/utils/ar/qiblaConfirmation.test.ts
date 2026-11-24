import { describe, expect, it } from 'vitest'

import { INITIAL_QIBLA_CONFIRMATION, updateQiblaConfirmation } from './qiblaConfirmation'

describe('updateQiblaConfirmation', () => {
  it('bestätigt innerhalb von 2°, aber nicht außerhalb', () => {
    expect(updateQiblaConfirmation(INITIAL_QIBLA_CONFIRMATION, 2, true).confirmed).toBe(true)

    expect(updateQiblaConfirmation(INITIAL_QIBLA_CONFIRMATION, 2.1, true).confirmed).toBe(false)
  })

  it('bestätigt nicht außerhalb des Toleranzbereichs', () => {
    const waiting = {
      confirmed: false,
    }

    expect(updateQiblaConfirmation(waiting, 5, true)).toEqual(INITIAL_QIBLA_CONFIRMATION)
  })

  it('bestätigt nicht bei ungeeigneter Kamerahaltung', () => {
    expect(updateQiblaConfirmation(INITIAL_QIBLA_CONFIRMATION, 0, false)).toEqual(
      INITIAL_QIBLA_CONFIRMATION,
    )
  })

  it('behält die Bestätigung bei kleinen Bewegungen', () => {
    const confirmed = {
      confirmed: true,
    }

    expect(updateQiblaConfirmation(confirmed, 8, true).confirmed).toBe(true)
  })

  it('hebt die Bestätigung erst ab 20° Abweichung auf', () => {
    const confirmed = {
      confirmed: true,
    }

    // Bei 19° bleibt die Bestätigung bestehen.
    expect(updateQiblaConfirmation(confirmed, 19, true).confirmed).toBe(true)

    // Ab 20° wird wieder zur Livekamera gewechselt.
    expect(updateQiblaConfirmation(confirmed, -20, true)).toEqual(INITIAL_QIBLA_CONFIRMATION)
  })

  it('bestätigt sofort beim Erreichen der Qibla', () => {
    const result = updateQiblaConfirmation(INITIAL_QIBLA_CONFIRMATION, 2, true)

    expect(result).toEqual({
      confirmed: true,
    })
  })


  it('verwirft eine Bestätigung bei falscher Kamerahaltung', () => {
    const confirmed = { confirmed: true }

    expect(
      updateQiblaConfirmation(confirmed, 0, false),
    ).toEqual(INITIAL_QIBLA_CONFIRMATION)
  })

  it('verwirft eine Bestätigung ohne gültige Richtung', () => {
    const confirmed = { confirmed: true }

    expect(
      updateQiblaConfirmation(confirmed, null, true),
    ).toEqual(INITIAL_QIBLA_CONFIRMATION)
  })

})
