import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchGeoapify } from './geoapify'

// Stellt nach jedem Test die echte fetch-Funktion wieder her.
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('searchGeoapify', () => {
  it('accepts Arabic place names and returns coordinates', async () => {
    // Simuliert die JSON-Antwort von Geoapify.
    const fakeFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [{ formatted: 'الجامع الأموي, دمشق', lat: 33.511, lon: 36.306 }],
        }),
      ),
    )

    // Ersetzt fetch für diesen Test durch unsere Simulation.
    vi.stubGlobal('fetch', fakeFetch)

    const results = await searchGeoapify('الجامع الأموي', 'test-key')

    expect(results).toEqual([
      {
        label: 'الجامع الأموي, دمشق',
        latitude: 33.511,
        longitude: 36.306,
      },
    ])

    // Prüft, ob arabischer Suchtext korrekt als URL-Parameter übergeben wird.
    const url = new URL(fakeFetch.mock.calls[0][0])
    expect(url.searchParams.get('text')).toBe('الجامع الأموي')
  })

  it('accepts German address results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [{ formatted: 'Hauptstraße 15, Berlin', lat: 52.5, lon: 13.4 }],
          }),
        ),
      ),
    )

    const results = await searchGeoapify('Hauptstraße 15, Berlin', 'test-key')

    expect(results[0].label).toBe('Hauptstraße 15, Berlin')
  })

  it('skips results with invalid coordinates', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [
              { formatted: 'Invalid place', lat: 120, lon: 13 },
              { formatted: 'Valid place', lat: 52.5, lon: 13.4 },
            ],
          }),
        ),
      ),
    )

    const results = await searchGeoapify('Berlin', 'test-key')

    expect(results).toHaveLength(1)
    expect(results[0].label).toBe('Valid place')
  })

  it('returns at most five suggestions', async () => {
    const places = Array.from({ length: 10 }, (_, index) => ({
      formatted: `Place ${index}`,
      lat: 50,
      lon: 10,
    }))

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: places }))),
    )

    const results = await searchGeoapify('Places', 'test-key')

    expect(results).toHaveLength(5)
  })

  it('rejects failed Geoapify requests', async () => {
    // Simuliert einen Fehler des externen API-Servers.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })))

    await expect(searchGeoapify('Berlin', 'test-key')).rejects.toThrow('Geoapify request failed')
  })

  it('rejects malformed API responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: 'invalid' }))),
    )

    await expect(searchGeoapify('Berlin', 'test-key')).rejects.toThrow('Invalid Geoapify response')
  })
})
