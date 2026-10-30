import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearManualLocation, readManualLocation, saveManualLocation } from './manualLocation'

// Simuliert den Browserspeicher, damit die Tests ohne Browser laufen.
const storedValues = new Map<string, string>()

const fakeStorage = {
  getItem(key: string) {
    return storedValues.get(key) ?? null
  },

  setItem(key: string, value: string) {
    storedValues.set(key, value)
  },

  removeItem(key: string) {
    storedValues.delete(key)
  },
}

describe('manualLocation', () => {
  // Jeder Test beginnt mit einem leeren simulierten Browserspeicher.
  beforeEach(() => {
    storedValues.clear()
    vi.stubGlobal('localStorage', fakeStorage)
  })

  // Stellt nach jedem Test die ursprüngliche Umgebung wieder her.
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('saves and restores the exact coordinates', () => {
    const location = {
      latitude: 50.39843785339485,
      longitude: 8.816850185394287,
    }

    saveManualLocation(location)

    expect(readManualLocation()).toEqual(location)
  })

  it('removes a previously saved location', () => {
    saveManualLocation({ latitude: 50.5, longitude: 8.5 })

    clearManualLocation()

    expect(readManualLocation()).toBeNull()
  })

  it('rejects coordinates outside the valid range', () => {
    storedValues.set('qibla-map-manual-location', '{"latitude":95,"longitude":8}')

    expect(readManualLocation()).toBeNull()
  })

  it('handles damaged saved data safely', () => {
    storedValues.set('qibla-map-manual-location', 'invalid JSON')

    expect(readManualLocation()).toBeNull()
  })
})
