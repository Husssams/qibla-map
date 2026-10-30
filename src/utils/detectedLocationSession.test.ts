import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearSessionLocation,
  readSessionLocation,
  saveSessionLocation,
} from './detectedLocationSession'

// Simuliert den sessionStorage des Browsers.
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

describe('detectedLocationSession', () => {
  // Jeder Test beginnt mit einem leeren Sitzungsspeicher.
  beforeEach(() => {
    storedValues.clear()
    vi.stubGlobal('sessionStorage', fakeStorage)
  })

  // Stellt die ursprüngliche Testumgebung wieder her.
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('saves and restores a detected location', () => {
    const location = {
      latitude: 50.39843785339485,
      longitude: 8.816850185394287,
      accuracy: 25,
    }

    saveSessionLocation(location)

    expect(readSessionLocation()).toEqual(location)
  })

  it('removes the saved GPS location', () => {
    saveSessionLocation({
      latitude: 50.5,
      longitude: 8.5,
      accuracy: 20,
    })

    clearSessionLocation()

    expect(readSessionLocation()).toBeNull()
  })

  it('rejects an invalid GPS accuracy', () => {
    storedValues.set(
      'qibla-map-detected-location',
      JSON.stringify({
        latitude: 50.5,
        longitude: 8.5,
        accuracy: -10,
      }),
    )

    expect(readSessionLocation()).toBeNull()
  })

  it('handles damaged session data safely', () => {
    storedValues.set('qibla-map-detected-location', 'invalid JSON')

    expect(readSessionLocation()).toBeNull()
  })
})
