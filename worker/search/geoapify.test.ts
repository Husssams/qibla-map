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
    // Prüft, ob arabische Suchbegriffe arabische Ergebnisnamen anfordern.
    expect(url.searchParams.get('lang')).toBe('ar')
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

  it('selects the best five results from ten candidates', async () => {
    // Die ersten sechs Treffer passen nicht gut zum Suchtext.
    const places = Array.from({ length: 6 }, (_, index) => ({
      formatted: `Other place ${index}`,
      name: `Other place ${index}`,
      lat: 50,
      lon: 10,
    }))

    // Der siebte Treffer ist die gesuchte Stadt.
    places.push({
      formatted: 'Berlin, Germany',
      name: 'Berlin',
      lat: 52.517,
      lon: 13.395,
    })

    const fakeFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: places })))

    vi.stubGlobal('fetch', fakeFetch)

    const results = await searchGeoapify('Berlin', 'test-key')

    // Der Treffer auf Platz sieben soll nach der Sortierung vorne stehen.
    expect(results[0].label).toBe('Berlin, Germany')

    // An React liefern wir trotzdem höchstens fünf Vorschläge.
    expect(results).toHaveLength(5)

    // Wir fordern zehn Kandidaten mit nur einem API-Aufruf an.
    const url = new URL(fakeFetch.mock.calls[0][0])
    expect(url.searchParams.get('limit')).toBe('10')
    expect(fakeFetch).toHaveBeenCalledTimes(1)
  })

  it('ranks the Aleppo Citadel above similarly named places', async () => {
    // Diese Beispieldaten orientieren sich an unserem echten Geoapify-Test.
    // Die Zitadelle steht zunächst hinter zwei weniger passenden Treffern.
    const places = [
      {
        formatted: 'Aleppo Burg قلعة حلب, Berlin, Germany',
        name: 'Aleppo Burg قلعة حلب',
        lat: 52.487944,
        lon: 13.4255738,
        rank: { confidence: 1, importance: 0.000089 },
      },
      {
        formatted: 'قلعة حلب, Duweir ash-Sheikh Sa’d, Syria',
        name: 'قلعة حلب',
        lat: 34.9089871,
        lon: 35.9307501,
        rank: { confidence: 1, importance: 0.000059 },
      },
      {
        formatted: 'قلعة حلب, Sahet Bizzeh district, حلب, سوريا',
        name: 'قلعة حلب',
        lat: 36.1995189,
        lon: 37.1629192,
        rank: { confidence: 1, importance: 0.458515 },
      },
    ]

    // Simuliert die API-Antwort, ohne Geoapify wirklich aufzurufen.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: places }))),
    )

    // Führt unsere echte Suchfunktion samt Relevanzsortierung aus.
    const results = await searchGeoapify('قلعة حلب', 'test-key')

    // Die Zitadelle muss trotz ihrer ursprünglichen dritten Position
    // durch die Namensübereinstimmung und hohe Bedeutung vorne stehen.
    expect(results[0].latitude).toBe(36.1995189)
    expect(results[0].longitude).toBe(37.1629192)
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
