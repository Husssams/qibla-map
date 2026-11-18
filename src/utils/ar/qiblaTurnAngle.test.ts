import { describe, expect, it } from 'vitest'

import { calculateQiblaTurnAngle } from './qiblaTurnAngle'

describe('calculateQiblaTurnAngle', () => {
  it('erkennt eine Drehung nach rechts', () => {
    expect(calculateQiblaTurnAngle(128, 90)).toBe(38)
  })

  it('erkennt eine Drehung nach links', () => {
    expect(calculateQiblaTurnAngle(128, 160)).toBe(-32)
  })

  it('erkennt eine rechnerische Übereinstimmung', () => {
    expect(calculateQiblaTurnAngle(128, 128)).toBe(0)
  })

  // Der Übergang über Norden muss korrekt funktionieren.
  it('berechnet den kurzen Weg von 350° nach 10°', () => {
    expect(calculateQiblaTurnAngle(10, 350)).toBe(20)
  })

  it('berechnet den kurzen Weg von 10° nach 350°', () => {
    expect(calculateQiblaTurnAngle(350, 10)).toBe(-20)
  })
})
